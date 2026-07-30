import { randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Share, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

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
import {
  createWordDuelConnectedActiveRuntimeController,
  recoverWordDuelConnectedRealtimeSessionIfNeeded,
} from '@/game/word-duel-runtime/connected-runtime';
import { useDuelWordsRuntimeClients } from '@/game/word-duel-runtime/use-runtime-clients';
import { experienceCopy } from '@/i18n/experience-copy';
import { GAME_LANGUAGES, type InterfaceLocale } from '@/i18n/locales';
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
import { LobbyFeedbackOverlay } from './lobby-feedback-overlay';
import {
  lobbyVisualFeedbackFromViewModel,
  type LobbyVisualFeedback,
  type LobbyVisualSnapshot,
} from './lobby-visual-feedback';
import { WordDuelBoard } from './components/word-duel-board';
import { createExclusiveActionGate } from './exclusive-action-gate';
import {
  canHostStartChallenge,
  joinChallengeAsReadyRecipient,
  readyAcceptedRematchRecipient,
  shouldSubscribeToLobbyRealtime,
} from './public-challenge-flow';
import {
  createWordDuelResultLocalPayloadFromApiFinalResult,
  finalizeApiWordDuelResult,
} from './result-finalization';
import { publicDuelT } from './public-duel-copy';
import {
  canRequestRematch,
  rematchProposalRevisionKey,
  startRematchProposalPolling,
} from './rematch-state';

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
  const lobbyVisualSnapshotRef = useRef<LobbyVisualSnapshot | null>(null);
  const mountedRef = useRef(true);
  const [actionGate] = useState(createExclusiveActionGate);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<'create' | 'join'>('join');
  const [displayName, setDisplayName] = useState(
    () => createWordDuelDefaultGuestDisplayName(randomUUID),
  );
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>(() =>
    connectedGameLanguage(initialGameLanguage ?? preferences.gameLanguage));
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
  const [lobbyVisualFeedback, setLobbyVisualFeedback] = useState<LobbyVisualFeedback | null>(null);
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
    if (!lobbyState) {
      lobbyVisualSnapshotRef.current = null;
      setLobbyVisualFeedback(null);
      return;
    }

    const result = lobbyVisualFeedbackFromViewModel(
      lobbyVisualSnapshotRef.current,
      lobbyState.lobby,
    );
    lobbyVisualSnapshotRef.current = result.snapshot;
    if (result.feedback) setLobbyVisualFeedback(result.feedback);
  }, [lobbyState]);

  useEffect(() => {
    if (!finalResult || recordedFinalGameIdRef.current === finalResult.game.gameId) return;

    // The backend id is used only as a volatile deduplication key. It is never
    // passed to or persisted by the device activity store.
    recordedFinalGameIdRef.current = finalResult.game.gameId;
    void finalizeApiWordDuelResult(finalResult).catch(() => undefined);
  }, [finalResult]);

  useEffect(() => {
    if (!activeController || !finalResult) return undefined;

    return startRematchProposalPolling({
      load: () => activeController.getCurrentRematchProposal(),
      onProposal: (proposal) => {
        if (!mountedRef.current) return;
        setRematchProposal((current) => (
          rematchProposalRevisionKey(current) === rematchProposalRevisionKey(proposal)
            ? current
            : proposal
        ));
      },
    });
  }, [activeController, finalResult]);

  useEffect(() => {
    const actor = lobbyState?.session.actor;
    if (
      !actor
      || rematchProposal?.status !== 'accepted'
      || rematchProposal.nextGame === null
    ) {
      return;
    }

    const nextLobbyState = createWordDuelLobbyControllerStateFromAcceptedRematchProposal({
      actor,
      nowMs: Date.now(),
      proposal: rematchProposal,
    });
    let cancelled = false;

    void (async () => {
      const preparedLobbyState = await readyAcceptedRematchRecipient({
        controller,
        nowMs: () => Date.now(),
        state: nextLobbyState,
      });
      return recoverWordDuelConnectedRealtimeSessionIfNeeded({
        lobbyState: preparedLobbyState,
        runtime,
      });
    })().then((recovered) => {
      if (cancelled || !mountedRef.current) return;
      if (recovered.realtimeSessionSource === 'missing') {
        throw new Error('Accepted rematch realtime session is unavailable.');
      }
      activeOpeningStartedRef.current = false;
      setLobbyState(recovered.lobbyState);
      setActiveController(null);
      setFinalResult(null);
      setRematchProposal(null);
      setStatusMessage(publicDuelT(interfaceLocale, 'rematchAcceptedReady'));
    }).catch(() => {
      if (cancelled || !mountedRef.current) return;
      setStatusMessage(publicDuelT(interfaceLocale, 'actionUnavailable'));
    });

    return () => {
      cancelled = true;
    };
  }, [controller, interfaceLocale, lobbyState?.session.actor, rematchProposal, runtime]);

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
    const inviteUrl = lobby?.invitePreview.inviteUrl;
    if (!lobby || !lobby.canShareInvite || !inviteUrl) {
      return;
    }

    void runAction('share', async () => {
      await Share.share({
        message: lobby.sharePayload,
        url: inviteUrl,
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
    setEntryMode('join');
    setRoomCodeFirst('');
    setRoomCodeSecond('');
    setStatusMessage(null);
    setLobbyVisualFeedback(null);
  }

  const dismissLobbyVisualFeedback = useCallback((eventId: string) => {
    setLobbyVisualFeedback((current) => current?.id === eventId ? null : current);
  }, []);

  function createRematch() {
    if (!activeController || !finalResult) return;
    void runAction('rematch-create', async () => {
      const proposal = await activeController.createRematchProposal({ language: finalResult.game.language });
      if (!mountedRef.current) return;
      setRematchProposal(proposal);
      setStatusMessage(copy('rematchSent'));
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
      setStatusMessage(copy('rematchStatus', { status: proposal.status }));
    });
  }

  if (activeController && finalResult === null) {
    return (
      <View style={styles.screenFrame}>
        <ActiveDuelScreen
          controller={activeController}
          interfaceLocale={interfaceLocale}
          onFinalResult={setFinalResult}
          onLeave={resetJourney}
        />
        <LobbyFeedbackOverlay
          event={lobbyVisualFeedback}
          interfaceLocale={interfaceLocale}
          onDismiss={dismissLobbyVisualFeedback}
        />
      </View>
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
        onRespond={respondToRematch}
        proposal={rematchProposal}
        statusMessage={statusMessage}
      />
    );
  }

  return (
    <View style={styles.screenFrame}>
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
      {lobbyState === null ? <Text style={styles.subtitle}>{copy('challengeSubtitle')}</Text> : null}

      {!runtime.ok ? <RuntimeUnavailable interfaceLocale={interfaceLocale} reason={runtime.reason} /> : null}

      {lobbyState === null ? <View style={styles.compactPanel}>
        <Text nativeID="word-duel-display-name-label" style={styles.inputLabel}>{copy('roomName')}</Text>
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
        {!configuredDisplayName ? (
          <Text style={styles.helper}>{copy(account.user ? 'accountRoomNameHelp' : 'roomNameHelp')}</Text>
        ) : null}
      </View> : null}

      {lobbyState === null ? (
        <>
          <View accessibilityRole="tablist" style={styles.entryModeRow}>
            <AppButton
              onPress={() => setEntryMode('join')}
              style={styles.entryModeButton}
              tone={entryMode === 'join' ? 'primary' : 'secondary'}>
              {copy('joinChallenge')}
            </AppButton>
            <AppButton
              onPress={() => setEntryMode('create')}
              style={styles.entryModeButton}
              tone={entryMode === 'create' ? 'primary' : 'secondary'}>
              {copy('createChallenge')}
            </AppButton>
          </View>

          {entryMode === 'join' ? (
            <View style={styles.panel}>
              <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{copy('joinChallenge')}</Text>
              <Text style={styles.helper}>{copy('joinCodeHelp')}</Text>
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
            </View>
          ) : (
            <View style={styles.panel}>
              <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{copy('createChallenge')}</Text>
              <Text style={styles.helper}>{copy('createChallengeHelp')}</Text>
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
          )}
        </>
      ) : (
        <PublicLobbyPanel
          busy={isBusy}
          onJoin={joinInvite}
          onStart={startGame}
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
      <LobbyFeedbackOverlay
        event={lobbyVisualFeedback}
        interfaceLocale={interfaceLocale}
        onDismiss={dismissLobbyVisualFeedback}
      />
    </View>
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
  onRespond,
  proposal,
  statusMessage,
}: {
  busy: boolean;
  finalResult: DuelWordsApiFinalResult;
  interfaceLocale: InterfaceLocale;
  onClose: () => void;
  onCreateRematch: () => void;
  onRespond: (action: 'accept' | 'cancel' | 'decline') => void;
  proposal: DuelWordsApiRematchProposal | null;
  statusMessage: string | null;
}) {
  const styles = usePublicChallengeStyles();
  const { width } = useWindowDimensions();
  const usesWideResultLayout = width >= 768;
  const result = createWordDuelResultViewModelFromLocalPayload(
    createWordDuelResultLocalPayloadFromApiFinalResult(finalResult),
  );
  const copy = (key: Parameters<typeof publicDuelT>[1], values?: Record<string, string | number>) =>
    publicDuelT(interfaceLocale, key, values);
  const boardRows = (rows: typeof result.own.boardRows) => rows.map((row) => ({ ...row, state: 'scored' as const }));
  const ownIsWinner = result.outcome === 'win';
  const rivalIsWinner = result.outcome === 'loss';

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

      <View style={styles.resultOverview}>
        <View style={[styles.resultPlayerCard, ownIsWinner && styles.resultPlayerCardWinner]}>
          <Text style={[styles.resultRole, ownIsWinner && styles.resultWinnerText]}>{copy('you')}</Text>
          <Text numberOfLines={1} style={[styles.resultPlayerName, ownIsWinner && styles.resultWinnerText]}>{result.own.safeDisplayName}</Text>
          <Text style={[styles.resultAttempts, ownIsWinner && styles.resultWinnerText]}>{result.own.attemptsUsed}/{result.maxAttempts} {copy('attempts')}</Text>
        </View>
        <Text accessibilityElementsHidden style={styles.resultVersus}>vs</Text>
        <View style={[styles.resultPlayerCard, rivalIsWinner && styles.resultPlayerCardWinner]}>
          <Text style={[styles.resultRole, rivalIsWinner && styles.resultWinnerText]}>{copy('rival')}</Text>
          <Text numberOfLines={1} style={[styles.resultPlayerName, rivalIsWinner && styles.resultWinnerText]}>{result.opponent.safeDisplayName}</Text>
          <Text style={[styles.resultAttempts, rivalIsWinner && styles.resultWinnerText]}>{result.opponent.attemptsUsed}/{result.maxAttempts} {copy('attempts')}</Text>
        </View>
      </View>

      <ConnectedRematchActions
        busy={busy}
        interfaceLocale={interfaceLocale}
        onCreateRematch={onCreateRematch}
        onRespond={onRespond}
        onShare={shareResult}
        proposal={proposal}
      />

      <View style={[styles.resultBoards, usesWideResultLayout && styles.resultBoardsWide]}>
        <View style={[styles.resultBoardPanel, usesWideResultLayout && styles.resultBoardPanelWide]}>
          <View style={styles.resultBoardHeader}>
            <View>
              <Text style={styles.resultRole}>{copy('you')}</Text>
              <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{result.own.safeDisplayName}</Text>
            </View>
            <Text style={styles.resultAttempts}>{result.own.attemptsUsed}/{result.maxAttempts} {copy('attempts')}</Text>
          </View>
          <WordDuelBoard accessibilityLabel={copy('yourFinalBoard')} density="compact" rows={boardRows(result.own.boardRows)} tileSize={usesWideResultLayout ? 48 : 34} />
        </View>
        <View style={[styles.resultBoardPanel, usesWideResultLayout && styles.resultBoardPanelWide]}>
          <View style={styles.resultBoardHeader}>
            <View>
              <Text style={styles.resultRole}>{copy('rival')}</Text>
              <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{result.opponent.safeDisplayName}</Text>
            </View>
            <Text style={styles.resultAttempts}>{result.opponent.attemptsUsed}/{result.maxAttempts} {copy('attempts')}</Text>
          </View>
          <WordDuelBoard accessibilityLabel={copy('rivalFinalBoard')} density="compact" rows={boardRows(result.opponent.boardRows)} tileSize={usesWideResultLayout ? 48 : 34} />
        </View>
      </View>
      {statusMessage ? <View accessibilityLiveRegion="polite" style={styles.statusBox}><Text selectable style={styles.statusText}>{statusMessage}</Text></View> : null}
    </AppScreen>
  );
}

function ConnectedRematchActions({
  busy,
  interfaceLocale,
  onCreateRematch,
  onRespond,
  onShare,
  proposal,
}: {
  busy: boolean;
  interfaceLocale: InterfaceLocale;
  onCreateRematch: () => void;
  onRespond: (action: 'accept' | 'cancel' | 'decline') => void;
  onShare: () => void;
  proposal: DuelWordsApiRematchProposal | null;
}) {
  const styles = usePublicChallengeStyles();
  const copy = (key: Parameters<typeof publicDuelT>[1]) => publicDuelT(interfaceLocale, key);

  return (
    <View accessibilityLiveRegion="polite" style={styles.rematchActionPanel}>
      <View style={styles.rematchActionHeader}>
        <View style={styles.rematchActionText}>
          <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{copy('playAgain')}</Text>
          <Text style={styles.helper}>{rematchLabel(interfaceLocale, proposal)}</Text>
        </View>
        <AppButton disabled={busy} tone="quiet" onPress={onShare} style={styles.shareResultButton}>{copy('shareResult')}</AppButton>
      </View>
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
      </View>
    </View>
  );
}

function PublicLobbyPanel({
  busy,
  interfaceLocale,
  onJoin,
  onStart,
  onReset,
  onShare,
  state,
}: {
  busy: boolean;
  interfaceLocale: InterfaceLocale;
  onJoin: () => void;
  onStart: () => void;
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
      <View style={[
        styles.lobbyHeader,
        lobby.status === 'countdown' && styles.lobbyHeaderCountdown,
        lobby.status === 'active_round' && styles.lobbyHeaderActive,
      ]}>
        <Text style={styles.lobbyPhaseGlyph}>{lobbyPhaseGlyph(lobby.status)}</Text>
        <View style={styles.lobbyHeaderCopy}>
          <Text style={styles.kicker}>{lobbyStatusLabel(interfaceLocale, lobby.status)}</Text>
          <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{lobby.invitePreview.gameName}</Text>
        </View>
        <View style={styles.languagePill}>
          <Text style={styles.languageText}>{gameLanguageLabel(lobby.invitePreview.gameLanguage)}</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <Summary label={copy('letters')} value={String(lobby.invitePreview.wordLength)} />
        <Summary label={copy('attempts')} value={String(lobby.invitePreview.maxAttempts)} />
        {lobby.invitePreview.roomCode !== null ? (
          <Summary label={copy('roomCode')} value={lobby.invitePreview.roomCode} selectable wide />
        ) : null}
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
        {lobby.canShareInvite ? (
          <AppButton disabled={busy} onPress={onShare} style={styles.actionButton}>
            {copy('shareInvite')}
          </AppButton>
        ) : null}
        {canHostStartChallenge(lobby) ? (
          <AppButton disabled={busy} onPress={onStart} style={styles.actionButton}>
            {copy('startGame')}
          </AppButton>
        ) : null}
        {lobby.viewerRole === 'recipient' && lobby.status === 'lobby' && lobby.canPressReady ? (
          <AppButton disabled={busy} onPress={onStart} style={styles.actionButton}>
            {copy('ready')}
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
  const stateLabel = player.state === 'ready'
    ? copy('ready')
    : player.state === 'joined'
      ? copy('joined')
      : copy('waiting');
  return (
    <View style={[
      styles.playerRow,
      player.state === 'joined' && styles.playerRowJoined,
      player.state === 'ready' && styles.playerRowReady,
    ]}>
      <View style={[
        styles.playerStateGlyph,
        player.state === 'joined' && styles.playerStateGlyphJoined,
        player.state === 'ready' && styles.playerStateGlyphReady,
      ]}>
        <Text style={styles.playerStateGlyphText}>
          {player.state === 'ready' ? '✓' : player.state === 'joined' ? '●' : '…'}
        </Text>
      </View>
      <View style={styles.playerText}>
        <Text style={styles.playerName}>{player.safeDisplayName}{player.isViewer ? ` · ${copy('you')}` : ''}</Text>
        <Text style={styles.helper}>{player.role === 'host' ? copy('host') : copy('rival')}</Text>
      </View>
      <View style={[
        styles.playerStateChip,
        player.state === 'joined' && styles.playerStateChipJoined,
        player.state === 'ready' && styles.playerStateChipReady,
      ]}>
        <Text style={[
          styles.playerState,
          player.state !== 'waiting' && styles.playerStateActive,
        ]}>{stateLabel}</Text>
      </View>
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

function gameLanguageLabel(language: GameLanguage): string {
  return GAME_LANGUAGES.find((candidate) => candidate.code === language)?.label ?? language.toUpperCase();
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

function lobbyPhaseGlyph(status: string): string {
  if (status === 'waiting_for_player') return '⌁';
  if (status === 'lobby') return '◎';
  if (status === 'countdown') return '3';
  if (status === 'active_round') return '⚔️';
  if (status === 'invite_review') return '?';
  return '×';
}

function usePublicChallengeStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
  screenFrame: { flex: 1, backgroundColor: colors.background },
  kicker: { color: colors.accent, fontSize: typeScale.tiny, fontWeight: '900', textTransform: 'uppercase' },
  subtitle: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 21 },
  panel: { gap: spacing.md, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg },
  resultOverview: { minHeight: 92, flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surfaceSoft, padding: spacing.md },
  resultPlayerCard: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 2, borderRadius: radii.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  resultPlayerCardWinner: { borderWidth: 2, borderColor: colors.accentPressed, backgroundColor: colors.accent },
  resultWinnerText: { color: colors.onAccent },
  resultRole: { color: colors.accent, fontSize: typeScale.tiny, fontWeight: '900', textTransform: 'uppercase' },
  resultPlayerName: { color: colors.text, fontSize: typeScale.lead, fontWeight: '900' },
  resultAttempts: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '800', textTransform: 'uppercase' },
  resultVersus: { alignSelf: 'center', color: colors.textMuted, fontSize: typeScale.small, fontWeight: '900', textTransform: 'uppercase' },
  resultBoards: { gap: spacing.md },
  resultBoardsWide: { flexDirection: 'row', alignItems: 'stretch' },
  resultBoardPanel: { gap: spacing.sm, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
  resultBoardPanelWide: { flex: 1, minWidth: 0 },
  resultBoardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rematchActionPanel: { gap: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.secondary, backgroundColor: colors.secondarySoft, padding: spacing.md },
  rematchActionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rematchActionText: { flex: 1, minWidth: 0, gap: 2 },
  shareResultButton: { minWidth: 100, minHeight: 38 },
  compactPanel: { gap: spacing.sm, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
  entryModeRow: { flexDirection: 'row', gap: spacing.sm },
  entryModeButton: { flex: 1, minWidth: 0, paddingHorizontal: spacing.sm },
  panelTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: '900' },
  helper: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19 },
  inputLabel: { color: colors.text, fontSize: typeScale.small, fontWeight: '800' },
  input: { minHeight: 48, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.background, color: colors.text, fontSize: typeScale.body, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  roomCodeInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  roomCodeInput: { flex: 1, textAlign: 'center', fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: 2 },
  roomCodeSeparator: { color: colors.textMuted, fontSize: typeScale.lead, fontWeight: '900' },
  unavailableBox: { gap: spacing.sm, borderRadius: radii.md, backgroundColor: colors.pressureSoft, padding: spacing.lg },
  unavailableRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  unavailableCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  unavailableTitle: { color: colors.pressure, fontSize: typeScale.lead, fontWeight: '900' },
  unavailableText: { color: colors.text, fontSize: typeScale.small, lineHeight: 19 },
  runtimeReason: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '800', textTransform: 'uppercase' },
  lobbyHeader: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 2, borderColor: colors.secondary, borderRadius: radii.lg, backgroundColor: colors.secondarySoft, padding: spacing.md, boxShadow: '0 8px 18px rgba(0, 0, 0, 0.14)' },
  lobbyHeaderCountdown: { borderWidth: 3, borderColor: colors.pressure, backgroundColor: colors.pressureSoft },
  lobbyHeaderActive: { borderWidth: 3, borderColor: colors.accent, backgroundColor: colors.surfaceStrong },
  lobbyHeaderCopy: { flex: 1, minWidth: 0 },
  lobbyPhaseGlyph: { width: 52, color: colors.secondary, fontSize: 38, fontWeight: '900', textAlign: 'center' },
  languagePill: { borderRadius: radii.md, backgroundColor: colors.surfaceSoft, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  languageText: { color: colors.accent, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summary: { flex: 1, flexBasis: 90, minWidth: 0, gap: spacing.xs, borderRadius: radii.md, backgroundColor: colors.surfaceStrong, padding: spacing.md },
  summaryWide: { flexBasis: '100%' },
  metaLabel: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '800', textTransform: 'uppercase' },
  summaryValue: { color: colors.text, fontSize: typeScale.body, fontWeight: '900' },
  roomCodeValue: { fontVariant: ['tabular-nums'], letterSpacing: 1.2 },
  playersBox: { gap: spacing.sm },
  playerRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.background, padding: spacing.md },
  playerRowJoined: { borderWidth: 2, borderColor: colors.secondary, backgroundColor: colors.secondarySoft },
  playerRowReady: { borderWidth: 3, borderColor: colors.accent, backgroundColor: colors.surfaceStrong },
  playerText: { flex: 1, minWidth: 0 },
  playerName: { color: colors.text, fontSize: typeScale.body, fontWeight: '800' },
  playerState: { color: colors.text, fontSize: typeScale.small, fontWeight: '900', textTransform: 'uppercase' },
  playerStateActive: { color: colors.onAccent },
  playerStateChip: { minWidth: 78, alignItems: 'center', borderRadius: radii.lg, backgroundColor: colors.surfaceSoft, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  playerStateChipJoined: { backgroundColor: colors.secondary },
  playerStateChipReady: { backgroundColor: colors.accent },
  playerStateGlyph: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radii.lg, backgroundColor: colors.surfaceSoft },
  playerStateGlyphJoined: { backgroundColor: colors.secondary },
  playerStateGlyphReady: { backgroundColor: colors.accent },
  playerStateGlyphText: { color: colors.onAccent, fontSize: typeScale.lead, fontWeight: '900' },
  reviewBox: { gap: spacing.xs, borderRadius: radii.md, backgroundColor: colors.surfaceSoft, padding: spacing.md },
  reviewTitle: { color: colors.text, fontSize: typeScale.body, fontWeight: '900' },
  countdownBox: { alignItems: 'center', gap: spacing.sm, borderWidth: 3, borderColor: colors.pressure, borderRadius: radii.lg, backgroundColor: colors.pressureSoft, padding: spacing.xl, boxShadow: '0 12px 26px rgba(0, 0, 0, 0.20)' },
  countdownValue: { color: colors.pressure, fontSize: 82, lineHeight: 90, fontWeight: '900', fontVariant: ['tabular-nums'] },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionButton: { flexGrow: 1, flexBasis: 132 },
  statusBox: { borderRadius: radii.md, backgroundColor: colors.surfaceStrong, padding: spacing.md },
  statusText: { color: colors.text, fontSize: typeScale.small, lineHeight: 19 },
  }), [colors]);
}
