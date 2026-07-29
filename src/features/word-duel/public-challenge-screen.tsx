import { randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import type { GameLanguage } from '@/game/word-duel-engine';
import type { WordDuelActiveController } from '@/game/word-duel-active/controller';
import { startActiveDuelPresenceHeartbeat } from '@/game/word-duel-active/presence-heartbeat';
import type { DuelWordsRealtimeRoomView } from '@/game/word-duel-active/realtime-projection';
import type {
  DuelWordsApiActor,
  DuelWordsApiFinalResult,
  DuelWordsApiRematchProposal,
} from '@/game/word-duel-lobby/api-client';
import { DuelWordsApiError } from '@/game/word-duel-lobby/api-client';
import {
  createWordDuelLobbyControllerStateFromAcceptedRematchProposal,
  createWordDuelLobbyController,
  type WordDuelLobbyControllerState,
} from '@/game/word-duel-lobby/controller';
import type { WordDuelLobbyPlayer } from '@/game/word-duel-lobby/view-model';
import {
  createWordDuelDefaultGuestDisplayName,
  createWordDuelGuestActor,
  getOrCreateWordDuelGuestSessionId,
  normalizeWordDuelGuestDisplayName,
  normalizeWordDuelRoomCode,
  parseWordDuelInviteEntry,
  sanitizeWordDuelRoomCodePart,
  splitWordDuelRoomCode,
} from '@/game/word-duel-public/guest-entry';
import { createWordDuelResultViewModelFromLocalPayload } from '@/game/word-duel-result/view-model';
import { createWordDuelConnectedActiveRuntimeController } from '@/game/word-duel-runtime/connected-runtime';
import { useDuelWordsRuntimeClients } from '@/game/word-duel-runtime/use-runtime-clients';
import { experienceCopy } from '@/i18n/experience-copy';
import type { InterfaceLocale } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { AviArtwork, aviAssets } from '@/ui/brand';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

import { ActiveDuelScreen } from './active-duel-screen';
import { accountRoomDisplayName } from './account-room-name';
import { GameLanguagePicker } from './components/game-language-picker';
import { CONNECTED_GAME_LANGUAGES, connectedGameLanguage } from './connected-languages';
import { WordDuelBoard } from './components/word-duel-board';
import { createExclusiveActionGate } from './exclusive-action-gate';
import {
  canHostStartChallenge,
  joinChallengeAsReadyRecipient,
  shouldRearmActiveDuelOpening,
  shouldShowLobbyRefresh,
  shouldSubscribeToLobbyRealtime,
} from './public-challenge-flow';
import {
  createWordDuelResultLocalPayloadFromApiFinalResult,
  finalizeApiWordDuelResult,
} from './result-finalization';
import { publicDuelT } from './public-duel-copy';
import { canRequestRematch } from './rematch-state';

type PublicWordDuelChallengeScreenProps = {
  initialGameLanguage?: GameLanguage;
  initialInviteInput?: string;
  initialInterfaceLocale?: InterfaceLocale | null;
  initialRoomCode?: string;
};

type GuestActor = Extract<DuelWordsApiActor, { actorType: 'guest_session' }>;

export function PublicWordDuelChallengeScreen({
  initialGameLanguage,
  initialInviteInput = '',
  initialInterfaceLocale = null,
  initialRoomCode = '',
}: PublicWordDuelChallengeScreenProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = usePublicChallengeStyles();
  const account = useDuelWordsAccount();
  const [preferences] = useAppPreferences();
  const interfaceLocale = initialInterfaceLocale ?? preferences.interfaceLocale;
  const copy = (key: Parameters<typeof publicDuelT>[1], values?: Record<string, string | number>) =>
    publicDuelT(interfaceLocale, key, values);
  const experience = experienceCopy(interfaceLocale);
  const runtime = useDuelWordsRuntimeClients({ getAuthToken: account.getToken });
  const controller = useMemo(
    () => createWordDuelLobbyController({ mode: 'runtime', runtimeApiClient: runtime.appsApi }),
    [runtime.appsApi],
  );
  const guestActorRef = useRef<GuestActor | null>(null);
  const roomCodeFirstInputRef = useRef<TextInput>(null);
  const roomCodeSecondInputRef = useRef<TextInput>(null);
  const initialPreviewKeyRef = useRef<string | null>(null);
  const recordedFinalGameIdRef = useRef<string | null>(null);
  const activeOpeningStartedRef = useRef(false);
  const lobbyRealtimeRefreshInFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const [actionGate] = useState(createExclusiveActionGate);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(
    () => createWordDuelDefaultGuestDisplayName(randomUUID),
  );
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>(() =>
    connectedGameLanguage(initialGameLanguage ?? preferences.gameLanguage));
  const [inviteInput, setInviteInput] = useState(initialInviteInput);
  const [roomCodeFirst, setRoomCodeFirst] = useState(
    () => splitWordDuelRoomCode(initialRoomCode).first,
  );
  const [roomCodeSecond, setRoomCodeSecond] = useState(
    () => splitWordDuelRoomCode(initialRoomCode).second,
  );
  const [lobbyState, setLobbyState] = useState<WordDuelLobbyControllerState | null>(null);
  const [activeController, setActiveController] = useState<WordDuelActiveController | null>(null);
  const [finalResult, setFinalResult] = useState<DuelWordsApiFinalResult | null>(null);
  const [rematchProposal, setRematchProposal] = useState<DuelWordsApiRematchProposal | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const isBusy = busyAction !== null;
  const roomCode = `${roomCodeFirst}-${roomCodeSecond}`;
  const roomCodeComplete = roomCodeFirst.length === 4 && roomCodeSecond.length === 4;
  const accountDisplayName = account.user
    ? accountRoomDisplayName(account.user, copy('accountPlayerName'))
    : null;
  const configuredDisplayNameResult = normalizeWordDuelGuestDisplayName(preferences.playerDisplayName);
  const configuredDisplayName = configuredDisplayNameResult.ok ? configuredDisplayNameResult.value : null;
  const effectiveDisplayName = configuredDisplayName ?? accountDisplayName ?? displayName;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!finalResult || recordedFinalGameIdRef.current === finalResult.game.gameId) return;

    // The backend id is used only as a volatile deduplication key. It is never
    // passed to or persisted by the device activity store.
    recordedFinalGameIdRef.current = finalResult.game.gameId;
    void finalizeApiWordDuelResult(finalResult).catch(() => undefined);
  }, [finalResult]);

  useEffect(() => {
    const realtime = lobbyState?.realtime;
    if (
      !runtime.ok
      || !lobbyState
      || !realtime
      || !shouldSubscribeToLobbyRealtime(lobbyState.lobby.status)
    ) {
      return undefined;
    }

    let cancelled = false;
    const realtimeRequest = {
      realtimeSessionId: realtime.realtimeSessionId,
      roomToken: realtime.roomToken,
    };
    const unsubscribe = runtime.realtime.client.subscribeActiveRoomView(
      realtimeRequest,
      (view) => {
        if (
          cancelled
          || !view
          || lobbyRealtimeRefreshInFlightRef.current
          || !lobbyProjectionNeedsRefresh(lobbyState, view)
        ) {
          return;
        }

        lobbyRealtimeRefreshInFlightRef.current = true;
        void controller.refreshLobby({ nowMs: Date.now(), state: lobbyState })
          .then((nextState) => {
            if (!cancelled) {
              setLobbyState(nextState);
            }
          })
          .catch(() => undefined)
          .finally(() => {
            lobbyRealtimeRefreshInFlightRef.current = false;
          });
      },
    );
    const stopHeartbeat = startActiveDuelPresenceHeartbeat({
      sendHeartbeat: () => runtime.realtime.client.sendPresenceHeartbeat(realtimeRequest),
    });

    return () => {
      cancelled = true;
      stopHeartbeat();
      unsubscribe();
    };
  }, [controller, lobbyState, runtime]);

  useEffect(() => {
    if (!runtime.ok) {
      return;
    }

    const invite = initialInviteInput.trim();
    const code = initialRoomCode.trim();
    const previewKey = invite.length > 0
      ? `invite:${invite}`
      : code.length > 0
        ? `code:${code}`
        : null;

    if (previewKey === null || initialPreviewKeyRef.current === previewKey) {
      return;
    }

    initialPreviewKeyRef.current = previewKey;
    const parsedInvite = invite.length > 0 ? parseWordDuelInviteEntry(invite) : null;
    const parsedCode = code.length > 0 ? normalizeWordDuelRoomCode(code) : null;
    if (parsedInvite !== null && !parsedInvite.ok) {
      setStatusMessage(parsedInvite.reason === 'unsupported_host'
        ? copy('unsupportedInvite')
        : copy('validInviteRequired'));
      return;
    }
    if (parsedCode !== null && !parsedCode.ok) {
      setStatusMessage(copy('roomCodeInvalid'));
      return;
    }

    activeOpeningStartedRef.current = false;
    setActiveController(null);
    setFinalResult(null);
    setLobbyState(null);
    setRematchProposal(null);
    setInviteInput(invite);
    const codeParts = splitWordDuelRoomCode(code);
    setRoomCodeFirst(codeParts.first);
    setRoomCodeSecond(codeParts.second);
    setStatusMessage(null);
    setBusyAction(invite.length > 0 ? 'preview' : 'preview-code');

    let cancelled = false;
    void (async () => {
      try {
        const nextState = invite.length > 0
          ? await controller.previewInviteByToken({
              inviteToken: parsedInvite!.value,
              nowMs: Date.now(),
            })
          : await controller.previewInviteByRoomCode({
              nowMs: Date.now(),
              roomCode: parsedCode!.value,
            });
        if (cancelled || initialPreviewKeyRef.current !== previewKey) return;
        setLobbyState(nextState);
        setStatusMessage(copy('reviewBeforeJoin'));
      } catch (error) {
        if (cancelled || initialPreviewKeyRef.current !== previewKey) return;
        setStatusMessage(actionErrorMessage(error, copy));
      } finally {
        if (!cancelled && initialPreviewKeyRef.current === previewKey) {
          setBusyAction(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // copy is component-local; the preview key makes this effect idempotent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, initialInviteInput, initialRoomCode, runtime.ok]);

  useEffect(() => {
    const countdownEndsAt = lobbyState?.lobby.countdown?.endsAtMs;
    if (!countdownEndsAt || lobbyState?.lobby.status !== 'countdown' || isBusy) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      void runAction('start', async () => {
        const nextState = await controller.openFirstRoundIfDue({
          nowMs: Date.now(),
          state: lobbyState,
        });
        if (!mountedRef.current) return;
        setLobbyState(nextState);
        setStatusMessage(nextState.lobby.status === 'active_round' ? copy('roundReady') : copy('waitingRound'));
      });
    }, Math.max(0, countdownEndsAt - Date.now()) + 100);

    return () => clearTimeout(timeout);
    // runAction is component-local; including it would recreate this deadline timer every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, isBusy, lobbyState]);

  useEffect(() => {
    if (
      lobbyState?.lobby.status !== 'active_round'
      || activeController !== null
      || activeOpeningStartedRef.current
      || busyAction !== null
      || !runtime.ok
    ) {
      return;
    }

    activeOpeningStartedRef.current = true;
    let cancelled = false;
    void runAction('open-duel', async () => {
      const bundle = await createWordDuelConnectedActiveRuntimeController({
        lobbyState,
        realtimeNow: () => Date.now(),
        runtime,
      });
      if (cancelled) {
        return;
      }
      setLobbyState(bundle.lobbyState);
      if (!bundle.ok) {
        setStatusMessage(copy('couldNotOpenDuel'));
        return;
      }
      setActiveController(bundle.controller);
      setStatusMessage(null);
    }, { trackBusy: false });

    return () => {
      cancelled = true;
    };
    // Opening is an effect-driven handoff, so runAction must not update
    // busyAction and trigger this cleanup itself. The action gate still keeps
    // interactive lobby commands exclusive while the handoff is in flight.
    // runAction is component-local; the refs make initialization idempotent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeController, busyAction, lobbyState, runtime]);

  async function runAction(
    actionName: string,
    action: () => Promise<void>,
    { trackBusy = true }: { trackBusy?: boolean } = {},
  ) {
    if (!actionGate.tryStart(actionName)) {
      return;
    }

    if (mountedRef.current) {
      if (trackBusy) {
        setBusyAction(actionName);
      }
      setStatusMessage(null);
    }
    try {
      await action();
    } catch (error) {
      if (mountedRef.current) {
        setStatusMessage(actionErrorMessage(error, copy));
      }
    } finally {
      actionGate.finish(actionName);
      if (trackBusy && mountedRef.current) {
        setBusyAction(null);
      }
    }
  }

  function currentActor(): DuelWordsApiActor | null {
    const normalized = normalizeWordDuelGuestDisplayName(effectiveDisplayName);
    if (!normalized.ok) {
      setStatusMessage(displayNameErrorLabel(interfaceLocale, normalized.reason));
      return null;
    }

    if (account.user) {
      return {
        actorType: 'account_user',
        safeDisplayName: normalized.value,
      };
    }

    if (guestActorRef.current === null) {
      guestActorRef.current = createWordDuelGuestActor({
        displayName: normalized.value,
        guestSessionId: getOrCreateWordDuelGuestSessionId(randomUUID),
        randomUuid: randomUUID,
      });
    } else {
      guestActorRef.current = {
        ...guestActorRef.current,
        safeDisplayName: normalized.value,
      };
    }

    return guestActorRef.current;
  }

  function createInvite() {
    const host = currentActor();
    if (!host) {
      return;
    }

    void runAction('create', async () => {
      const nextState = await controller.createHostInvite({
        gameLanguage,
        host,
        nowMs: Date.now(),
      });
      if (!mountedRef.current) return;
      setLobbyState(nextState);
      setStatusMessage(copy('challengeCreated'));
    });
  }

  function previewInvite(value = inviteInput) {
    const parsed = parseWordDuelInviteEntry(value);
    if (!parsed.ok) {
      setStatusMessage(parsed.reason === 'unsupported_host'
        ? copy('unsupportedInvite')
        : copy('validInviteRequired'));
      return;
    }

    void runAction('preview', async () => {
      const nextState = await controller.previewInviteByToken({
        inviteToken: parsed.value,
        nowMs: Date.now(),
      });
      if (!mountedRef.current) return;
      setLobbyState(nextState);
      setStatusMessage(copy('reviewBeforeJoin'));
    });
  }

  function previewRoomCode(value = roomCode) {
    const normalized = normalizeWordDuelRoomCode(value);
    if (!normalized.ok) {
      setStatusMessage(copy('roomCodeInvalid'));
      return;
    }

    void runAction('preview-code', async () => {
      const nextState = await controller.previewInviteByRoomCode({
        nowMs: Date.now(),
        roomCode: normalized.value,
      });
      if (!mountedRef.current) return;
      setLobbyState(nextState);
      setStatusMessage(copy('reviewBeforeJoin'));
    });
  }

  function joinInvite() {
    if (!lobbyState) {
      return;
    }
    const player = currentActor();
    if (!player) {
      return;
    }

    void runAction('join', async () => {
      const nextState = await joinChallengeAsReadyRecipient({
        controller,
        nowMs: () => Date.now(),
        player,
        state: lobbyState,
      });
      if (!mountedRef.current) return;
      setLobbyState(nextState);
      setStatusMessage(copy('waitingForHost'));
    });
  }

  function refreshLobby() {
    if (!lobbyState) {
      return;
    }

    void runAction('refresh', async () => {
      const nextState = await controller.refreshLobby({ nowMs: Date.now(), state: lobbyState });
      if (!mountedRef.current) return;
      if (shouldRearmActiveDuelOpening({
        hasActiveController: activeController !== null,
        lobbyStatus: nextState.lobby.status,
      })) {
        activeOpeningStartedRef.current = false;
      }
      setLobbyState(nextState);
      setStatusMessage(copy('lobbyUpdated'));
    });
  }

  function startGame() {
    if (!lobbyState) {
      return;
    }

    void runAction('start-game', async () => {
      const nextState = await controller.markReady({ nowMs: Date.now(), state: lobbyState });
      if (!mountedRef.current) return;
      setLobbyState(nextState);
      setStatusMessage(nextState.lobby.status === 'countdown' ? copy('starting') : copy('waitingRound'));
    });
  }

  function shareInvite() {
    const lobby = lobbyState?.lobby;
    if (!lobby) {
      return;
    }

    void runAction('share', async () => {
      await Share.share({
        message: lobby.sharePayload,
        url: lobby.invitePreview.inviteUrl,
      });
      if (!mountedRef.current) return;
      setStatusMessage(copy('inviteShareOpened'));
    });
  }

  function resetJourney() {
    activeOpeningStartedRef.current = false;
    setActiveController(null);
    setFinalResult(null);
    setLobbyState(null);
    setRematchProposal(null);
    setInviteInput('');
    setRoomCodeFirst('');
    setRoomCodeSecond('');
    setStatusMessage(null);
  }

  function continueAcceptedRematch(proposal: DuelWordsApiRematchProposal): boolean {
    const actor = lobbyState?.session.actor;
    if (!actor || proposal.status !== 'accepted' || proposal.nextGame === null) {
      return false;
    }

    setLobbyState(createWordDuelLobbyControllerStateFromAcceptedRematchProposal({
      actor,
      nowMs: Date.now(),
      proposal,
    }));
    activeOpeningStartedRef.current = false;
    setActiveController(null);
    setFinalResult(null);
    setRematchProposal(null);
    setStatusMessage(copy('rematchAcceptedReady'));
    return true;
  }

  function createRematch() {
    if (!activeController || !finalResult) return;
    void runAction('rematch-create', async () => {
      const proposal = await activeController.createRematchProposal({ language: finalResult.game.language });
      if (!mountedRef.current) return;
      setRematchProposal(proposal);
      setStatusMessage(copy('rematchSent'));
    });
  }

  function refreshRematch() {
    if (!activeController) return;
    void runAction('rematch-refresh', async () => {
      const proposal = await activeController.getCurrentRematchProposal();
      if (!mountedRef.current) return;
      setRematchProposal(proposal);
      if (proposal && continueAcceptedRematch(proposal)) return;
      setStatusMessage(proposal ? copy('rematchUpdated') : copy('noRematch'));
    });
  }

  function respondToRematch(action: 'accept' | 'cancel' | 'decline') {
    if (!activeController || !rematchProposal) return;
    void runAction(`rematch-${action}`, async () => {
      const proposal = action === 'accept'
        ? await activeController.acceptRematchProposal({ proposalId: rematchProposal.proposalId })
        : action === 'decline'
          ? await activeController.declineRematchProposal({ proposalId: rematchProposal.proposalId })
          : await activeController.cancelRematchProposal({ proposalId: rematchProposal.proposalId });
      if (!mountedRef.current) return;
      setRematchProposal(proposal);
      if (continueAcceptedRematch(proposal)) return;
      setStatusMessage(copy('rematchStatus', { status: proposal.status }));
    });
  }

  if (activeController && finalResult === null) {
    return (
      <ActiveDuelScreen
        controller={activeController}
        interfaceLocale={interfaceLocale}
        onFinalResult={setFinalResult}
        onLeave={resetJourney}
      />
    );
  }

  if (activeController && finalResult) {
    return (
      <ConnectedResultPanel
        busy={isBusy}
        finalResult={finalResult}
        interfaceLocale={interfaceLocale}
        onClose={resetJourney}
        onCreateRematch={createRematch}
        onRefreshRematch={refreshRematch}
        onRespond={respondToRematch}
        proposal={rematchProposal}
        statusMessage={statusMessage}
      />
    );
  }

  return (
    <AppScreen bottomInset={spacing.xxl} contentGap={spacing.md}>
      <InteriorScreenHeader
        backLabel={copy('back')}
        detail={copy(account.user ? 'accountChallenge' : 'guestChallenge')}
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)/play');
        }}
        title={copy('wordDuel')}
      />
      <Text style={styles.subtitle}>{copy('challengeSubtitle')}</Text>

      {!runtime.ok ? <RuntimeUnavailable interfaceLocale={interfaceLocale} reason={runtime.reason} /> : null}

      <View style={styles.panel}>
        <Text nativeID="word-duel-display-name-label" style={styles.panelTitle}>{copy('roomName')}</Text>
        <TextInput
          accessibilityLabel={copy('displayNameLabel')}
          accessibilityLabelledBy="word-duel-display-name-label"
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isBusy && lobbyState === null && account.user === null && configuredDisplayName === null}
          maxLength={32}
          onChangeText={setDisplayName}
          placeholder={copy('displayNamePlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={effectiveDisplayName}
        />
        <Text style={styles.helper}>{configuredDisplayName ? 'Edit this DuelWords name in Settings.' : copy(account.user ? 'accountRoomNameHelp' : 'roomNameHelp')}</Text>
      </View>

      {lobbyState === null ? (
        <>
          <View style={styles.panel}>
            <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{copy('joinChallenge')}</Text>
            <Text nativeID="word-duel-room-code-label" style={styles.inputLabel}>{copy('roomCode')}</Text>
            <View accessibilityLabelledBy="word-duel-room-code-label" style={styles.roomCodeInputRow}>
              <TextInput
                accessibilityLabel={`${copy('roomCode')} 1`}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={runtime.ok && !isBusy}
                maxLength={4}
                onChangeText={(value) => {
                  const next = sanitizeWordDuelRoomCodePart(value);
                  setRoomCodeFirst(next);
                  if (next.length === 4) roomCodeSecondInputRef.current?.focus();
                }}
                onSubmitEditing={() => roomCodeSecondInputRef.current?.focus()}
                placeholder="AB3F"
                placeholderTextColor={colors.textMuted}
                ref={roomCodeFirstInputRef}
                returnKeyType="next"
                style={[styles.input, styles.roomCodeInput]}
                value={roomCodeFirst}
              />
              <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.roomCodeSeparator}>–</Text>
              <TextInput
                accessibilityLabel={`${copy('roomCode')} 2`}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={runtime.ok && !isBusy}
                maxLength={4}
                onChangeText={(value) => setRoomCodeSecond(sanitizeWordDuelRoomCodePart(value))}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && roomCodeSecond.length === 0) {
                    roomCodeFirstInputRef.current?.focus();
                  }
                }}
                onSubmitEditing={() => {
                  if (roomCodeComplete) previewRoomCode();
                }}
                placeholder="12C4"
                placeholderTextColor={colors.textMuted}
                ref={roomCodeSecondInputRef}
                returnKeyType="go"
                style={[styles.input, styles.roomCodeInput]}
                value={roomCodeSecond}
              />
            </View>
            <AppButton
              disabled={!runtime.ok || isBusy || !roomCodeComplete}
              onPress={() => previewRoomCode()}>
              {copy('findRoom')}
            </AppButton>
            <View style={styles.divider} />
            <Text nativeID="word-duel-invite-label" style={styles.inputLabel}>{copy('inviteLabel')}</Text>
            <TextInput
              accessibilityLabel={copy('inviteLabel')}
              accessibilityLabelledBy="word-duel-invite-label"
              autoCapitalize="none"
              autoCorrect={false}
              editable={runtime.ok && !isBusy}
              onChangeText={setInviteInput}
              placeholder={copy('invitePlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={inviteInput}
            />
            <AppButton disabled={!runtime.ok || isBusy || inviteInput.trim().length === 0} tone="secondary" onPress={() => previewInvite()}>
              {copy('reviewInvite')}
            </AppButton>
          </View>

          <View style={styles.panel}>
            <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{copy('createChallenge')}</Text>
            <GameLanguagePicker
              disabled={isBusy}
              dismissLabel={copy('close')}
              label={experience.gameLanguage}
              onChange={setGameLanguage}
              options={CONNECTED_GAME_LANGUAGES}
              value={gameLanguage}
            />
            <AppButton disabled={!runtime.ok || isBusy} onPress={createInvite}>
              {busyAction === 'create' ? copy('creating') : copy('createChallenge')}
            </AppButton>
          </View>
        </>
      ) : (
        <PublicLobbyPanel
          busy={isBusy}
          onJoin={joinInvite}
          onStart={startGame}
          onRefresh={refreshLobby}
          onReset={resetJourney}
          onShare={shareInvite}
          interfaceLocale={interfaceLocale}
          state={lobbyState}
        />
      )}

      {statusMessage ? (
        <View accessibilityLiveRegion="polite" style={styles.statusBox}>
          <Text selectable style={styles.statusText}>{statusMessage}</Text>
        </View>
      ) : null}
    </AppScreen>
  );
}

function lobbyProjectionNeedsRefresh(
  state: WordDuelLobbyControllerState,
  view: DuelWordsRealtimeRoomView,
): boolean {
  const own = state.lobby.players.find((player) => player.isViewer);
  const opponent = state.lobby.players.find((player) => !player.isViewer);
  const remoteStatus = view.room.status === 'round_resolving' ? 'active_round' : view.room.status;

  return remoteStatus !== state.lobby.status
    || (view.own?.isReady ?? false) !== (own?.state === 'ready')
    || (view.opponent?.isReady ?? false) !== (opponent?.state === 'ready')
    || (view.opponent !== null) !== (opponent !== undefined && opponent.state !== 'waiting');
}

function actionErrorMessage(
  error: unknown,
  copy: (key: Parameters<typeof publicDuelT>[1], values?: Record<string, string | number>) => string,
) {
  if (error instanceof DuelWordsApiError) {
    if (error.code === 'human_challenge_daily_limit_reached') return copy('challengeDailyLimitReached');
    if (error.code === 'game_full') return copy('challengeClosed');
    if (error.code === 'game_expired') return copy('challengeClosed');
    if (error.status >= 500 || error.status === 0) return copy('safeRealtimeUnavailable');
  }
  return copy('actionUnavailable');
}

function ConnectedResultPanel({
  busy,
  finalResult,
  interfaceLocale,
  onClose,
  onCreateRematch,
  onRefreshRematch,
  onRespond,
  proposal,
  statusMessage,
}: {
  busy: boolean;
  finalResult: DuelWordsApiFinalResult;
  interfaceLocale: InterfaceLocale;
  onClose: () => void;
  onCreateRematch: () => void;
  onRefreshRematch: () => void;
  onRespond: (action: 'accept' | 'cancel' | 'decline') => void;
  proposal: DuelWordsApiRematchProposal | null;
  statusMessage: string | null;
}) {
  const styles = usePublicChallengeStyles();
  const result = createWordDuelResultViewModelFromLocalPayload(
    createWordDuelResultLocalPayloadFromApiFinalResult(finalResult),
  );
  const copy = (key: Parameters<typeof publicDuelT>[1], values?: Record<string, string | number>) =>
    publicDuelT(interfaceLocale, key, values);
  const boardRows = (rows: typeof result.own.boardRows) => rows.map((row) => ({ ...row, state: 'scored' as const }));

  function shareResult() {
    void Share.share({ message: result.safeSharePreview.text });
  }

  return (
    <AppScreen bottomInset={spacing.xxl} contentGap={spacing.md}>
      <InteriorScreenHeader
        backLabel={copy('back')}
        detail={copy('target', { word: result.targetReveal.displayWord ?? '—' })}
        onBack={onClose}
        title={resultOutcomeLabel(interfaceLocale, result.outcome)}
      />

      <View style={styles.panel}>
        <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{result.own.safeDisplayName}</Text>
        <WordDuelBoard accessibilityLabel={copy('yourFinalBoard')} density="compact" rows={boardRows(result.own.boardRows)} tileSize={34} />
      </View>
      <View style={styles.panel}>
        <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{result.opponent.safeDisplayName}</Text>
        <WordDuelBoard accessibilityLabel={copy('rivalFinalBoard')} density="compact" rows={boardRows(result.opponent.boardRows)} tileSize={34} />
      </View>

      <View style={styles.panel}>
        <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{copy('playAgain')}</Text>
        <Text style={styles.helper}>{rematchLabel(interfaceLocale, proposal)}</Text>
        <View style={styles.actionRow}>
          {canRequestRematch(proposal) ? (
            <AppButton disabled={busy} onPress={onCreateRematch} style={styles.actionButton}>{copy('requestRematch')}</AppButton>
          ) : null}
          {proposal?.viewer.canAccept ? (
            <AppButton disabled={busy} onPress={() => onRespond('accept')} style={styles.actionButton}>{copy('accept')}</AppButton>
          ) : null}
          {proposal?.viewer.canDecline ? (
            <AppButton disabled={busy} tone="quiet" onPress={() => onRespond('decline')} style={styles.actionButton}>{copy('decline')}</AppButton>
          ) : null}
          {proposal?.viewer.canCancel ? (
            <AppButton disabled={busy} tone="quiet" onPress={() => onRespond('cancel')} style={styles.actionButton}>{copy('cancelRequest')}</AppButton>
          ) : null}
          <AppButton disabled={busy} tone="secondary" onPress={onRefreshRematch} style={styles.actionButton}>{copy('refresh')}</AppButton>
          <AppButton disabled={busy} tone="quiet" onPress={shareResult} style={styles.actionButton}>{copy('shareResult')}</AppButton>
        </View>
      </View>
      {statusMessage ? <View accessibilityLiveRegion="polite" style={styles.statusBox}><Text selectable style={styles.statusText}>{statusMessage}</Text></View> : null}
    </AppScreen>
  );
}

function PublicLobbyPanel({
  busy,
  interfaceLocale,
  onJoin,
  onStart,
  onRefresh,
  onReset,
  onShare,
  state,
}: {
  busy: boolean;
  interfaceLocale: InterfaceLocale;
  onJoin: () => void;
  onStart: () => void;
  onRefresh: () => void;
  onReset: () => void;
  onShare: () => void;
  state: WordDuelLobbyControllerState;
}) {
  const styles = usePublicChallengeStyles();
  const lobby = state.lobby;
  const copy = (key: Parameters<typeof publicDuelT>[1], values?: Record<string, string | number>) =>
    publicDuelT(interfaceLocale, key, values);

  return (
    <View style={styles.panel}>
      <View style={styles.lobbyHeader}>
        <View>
          <Text style={styles.kicker}>{lobbyStatusLabel(interfaceLocale, lobby.status)}</Text>
          <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{lobby.invitePreview.gameName}</Text>
        </View>
        <View style={styles.languagePill}>
          <Text style={styles.languageText}>{lobby.invitePreview.gameLanguage.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <Summary label={copy('letters')} value={String(lobby.invitePreview.wordLength)} />
        <Summary label={copy('attempts')} value={String(lobby.invitePreview.maxAttempts)} />
        <Summary label={copy('roomCode')} value={lobby.invitePreview.roomCode} selectable wide />
      </View>

      <View style={styles.playersBox}>
        {lobby.players.map((player) => <PlayerRow interfaceLocale={interfaceLocale} key={player.side} player={player} />)}
      </View>

      {lobby.status === 'invite_review' ? (
        <View style={styles.reviewBox}>
          <Text style={styles.reviewTitle}>{copy('joinChallengeQuestion')}</Text>
          <Text style={styles.helper}>{copy('joinHelp')}</Text>
        </View>
      ) : null}

      {lobby.status === 'countdown' ? (
        <View style={styles.countdownBox}>
          <Text style={styles.countdownValue}>{lobby.countdown?.remainingSeconds ?? 0}</Text>
          <Text style={styles.helper}>{copy('countdownHelp')}</Text>
        </View>
      ) : null}

      {lobby.status === 'active_round' ? (
        <View style={styles.reviewBox}>
          <Text style={styles.reviewTitle}>{copy('roundReadyTitle')}</Text>
          <Text style={styles.helper}>{copy('safeRealtimeRequired')}</Text>
        </View>
      ) : null}

      {lobby.viewerRole === 'recipient'
        && lobby.status === 'lobby'
        && lobby.readyBySide[lobby.viewerSide] ? (
          <View style={styles.reviewBox}>
            <Text style={styles.helper}>{copy('waitingForHost')}</Text>
          </View>
        ) : null}

      <View style={styles.actionRow}>
        {lobby.status === 'invite_review' ? (
          <AppButton disabled={busy || !lobby.canJoin} onPress={onJoin} style={styles.actionButton}>
            {copy('joinChallenge')}
          </AppButton>
        ) : null}
        {lobby.viewerRole === 'host' && (lobby.status === 'waiting_for_player' || lobby.status === 'lobby') ? (
          <AppButton disabled={busy} onPress={onShare} style={styles.actionButton}>
            {copy('shareInvite')}
          </AppButton>
        ) : null}
        {canHostStartChallenge(lobby) ? (
          <AppButton disabled={busy} onPress={onStart} style={styles.actionButton}>
            {copy('startGame')}
          </AppButton>
        ) : null}
        {shouldShowLobbyRefresh(lobby.status) ? (
          <AppButton disabled={busy} tone="secondary" onPress={onRefresh} style={styles.actionButton}>
            {copy('refreshLobby')}
          </AppButton>
        ) : null}
        <AppButton disabled={busy} tone="quiet" onPress={onReset} style={styles.actionButton}>
          {copy('back')}
        </AppButton>
      </View>
    </View>
  );
}

function PlayerRow({ interfaceLocale, player }: { interfaceLocale: InterfaceLocale; player: WordDuelLobbyPlayer }) {
  const styles = usePublicChallengeStyles();
  const copy = (key: Parameters<typeof publicDuelT>[1]) => publicDuelT(interfaceLocale, key);
  return (
    <View style={styles.playerRow}>
      <View style={styles.sideBadge}><Text style={styles.sideText}>{player.side.toUpperCase()}</Text></View>
      <View style={styles.playerText}>
        <Text style={styles.playerName}>{player.safeDisplayName}{player.isViewer ? ` · ${copy('you')}` : ''}</Text>
        <Text style={styles.helper}>{player.role === 'host' ? copy('host') : copy('rival')}</Text>
      </View>
      <Text style={styles.playerState}>{player.state === 'ready' ? copy('ready') : player.state === 'joined' ? copy('joined') : copy('waiting')}</Text>
    </View>
  );
}

function Summary({ label, selectable, value, wide }: { label: string; selectable?: boolean; value: string; wide?: boolean }) {
  const styles = usePublicChallengeStyles();
  return (
    <View style={[styles.summary, wide && styles.summaryWide]}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text selectable={selectable} numberOfLines={selectable ? undefined : 1} style={[styles.summaryValue, selectable && styles.roomCodeValue]}>{value}</Text>
    </View>
  );
}

function RuntimeUnavailable({ interfaceLocale, reason }: { interfaceLocale: InterfaceLocale; reason: string }) {
  const styles = usePublicChallengeStyles();
  const copy = (key: Parameters<typeof publicDuelT>[1]) => publicDuelT(interfaceLocale, key);
  return (
    <View style={styles.unavailableBox}>
      <View style={styles.unavailableRow}>
        <AviArtwork size={62} source={aviAssets.warning} />
        <View style={styles.unavailableCopy}>
          <Text aria-level={2} accessibilityRole="header" style={styles.unavailableTitle}>{copy('onlineUnavailable')}</Text>
          <Text style={styles.unavailableText}>{copy('runtimeDescription')}</Text>
        </View>
      </View>
      <Text style={styles.runtimeReason}>{runtimeReasonLabel(interfaceLocale, reason)}</Text>
    </View>
  );
}

function displayNameErrorLabel(locale: InterfaceLocale, reason: string): string {
  if (reason === 'too_long') {
    return publicDuelT(locale, 'roomNameTooLong');
  }
  if (reason === 'unsupported_character') {
    return publicDuelT(locale, 'roomNameUnsupported');
  }
  return publicDuelT(locale, 'roomNameInvalid');
}

function resultOutcomeLabel(locale: InterfaceLocale, outcome: string): string {
  if (outcome === 'win') return publicDuelT(locale, 'youWon');
  if (outcome === 'loss') return publicDuelT(locale, 'rivalWon');
  if (outcome === 'draw') return publicDuelT(locale, 'draw');
  return publicDuelT(locale, 'duelComplete');
}

function rematchLabel(locale: InterfaceLocale, proposal: DuelWordsApiRematchProposal | null): string {
  if (!proposal) return publicDuelT(locale, 'requestRematchHelp');
  if (proposal.status === 'sent' && proposal.viewer.role === 'recipient') return publicDuelT(locale, 'rivalRequestedRematch');
  if (proposal.status === 'sent') return publicDuelT(locale, 'waitingForAnswer');
  if (proposal.status === 'accepted') return publicDuelT(locale, 'rematchAcceptedOpening');
  if (proposal.status === 'declined') return publicDuelT(locale, 'rematchDeclined');
  if (proposal.status === 'cancelled') return publicDuelT(locale, 'rematchCancelled');
  return publicDuelT(locale, 'rematchExpired');
}

function runtimeReasonLabel(locale: InterfaceLocale, reason: string): string {
  if (reason === 'apps_api_disabled') {
    return publicDuelT(locale, 'apiDisabled');
  }
  if (reason === 'realtime_disabled') {
    return publicDuelT(locale, 'realtimeDisabled');
  }
  return publicDuelT(locale, 'safeRealtimeUnavailable');
}

function lobbyStatusLabel(locale: InterfaceLocale, status: string): string {
  if (status === 'invite_review') return publicDuelT(locale, 'inviteReview');
  if (status === 'waiting_for_player') return publicDuelT(locale, 'waitingForRival');
  if (status === 'lobby') return publicDuelT(locale, 'lobby');
  if (status === 'countdown') return publicDuelT(locale, 'starting');
  if (status === 'active_round') return publicDuelT(locale, 'activeDuel');
  return publicDuelT(locale, 'challengeClosed');
}

function usePublicChallengeStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
  kicker: { color: colors.accent, fontSize: typeScale.tiny, fontWeight: '900', textTransform: 'uppercase' },
  subtitle: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 21 },
  panel: { gap: spacing.md, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg },
  panelTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: '900' },
  helper: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19 },
  inputLabel: { color: colors.text, fontSize: typeScale.small, fontWeight: '800' },
  input: { minHeight: 48, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.background, color: colors.text, fontSize: typeScale.body, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  roomCodeInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  roomCodeInput: { flex: 1, textAlign: 'center', fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: 2 },
  roomCodeSeparator: { color: colors.textMuted, fontSize: typeScale.lead, fontWeight: '900' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  unavailableBox: { gap: spacing.sm, borderRadius: radii.md, backgroundColor: colors.pressureSoft, padding: spacing.lg },
  unavailableRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  unavailableCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  unavailableTitle: { color: colors.pressure, fontSize: typeScale.lead, fontWeight: '900' },
  unavailableText: { color: colors.text, fontSize: typeScale.small, lineHeight: 19 },
  runtimeReason: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '800', textTransform: 'uppercase' },
  lobbyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  languagePill: { borderRadius: radii.md, backgroundColor: colors.surfaceSoft, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  languageText: { color: colors.accent, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summary: { flex: 1, flexBasis: 90, minWidth: 0, gap: spacing.xs, borderRadius: radii.md, backgroundColor: colors.surfaceStrong, padding: spacing.md },
  summaryWide: { flexBasis: '100%' },
  metaLabel: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '800', textTransform: 'uppercase' },
  summaryValue: { color: colors.text, fontSize: typeScale.body, fontWeight: '900' },
  roomCodeValue: { fontVariant: ['tabular-nums'], letterSpacing: 1.2 },
  playersBox: { gap: spacing.sm },
  playerRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radii.md, backgroundColor: colors.background, padding: spacing.md },
  sideBadge: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.secondarySoft },
  sideText: { color: colors.secondary, fontWeight: '900' },
  playerText: { flex: 1, minWidth: 0 },
  playerName: { color: colors.text, fontSize: typeScale.body, fontWeight: '800' },
  playerState: { color: colors.textMuted, fontSize: typeScale.small, fontWeight: '800' },
  reviewBox: { gap: spacing.xs, borderRadius: radii.md, backgroundColor: colors.surfaceSoft, padding: spacing.md },
  reviewTitle: { color: colors.text, fontSize: typeScale.body, fontWeight: '900' },
  countdownBox: { alignItems: 'center', gap: spacing.sm, borderRadius: radii.md, backgroundColor: colors.secondarySoft, padding: spacing.lg },
  countdownValue: { color: colors.secondary, fontSize: 44, fontWeight: '900', fontVariant: ['tabular-nums'] },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionButton: { flexGrow: 1, flexBasis: 132 },
  statusBox: { borderRadius: radii.md, backgroundColor: colors.surfaceStrong, padding: spacing.md },
  statusText: { color: colors.text, fontSize: typeScale.small, lineHeight: 19 },
  }), [colors]);
}
