import { randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import type { GameLanguage } from '@/game/word-duel-engine';
import type { WordDuelActiveController } from '@/game/word-duel-active/controller';
import type {
  DuelWordsApiActor,
  DuelWordsApiFinalResult,
  DuelWordsApiRematchProposal,
} from '@/game/word-duel-lobby/api-client';
import {
  createWordDuelLobbyControllerStateFromAcceptedRematchProposal,
  createWordDuelLobbyController,
  type WordDuelLobbyControllerState,
} from '@/game/word-duel-lobby/controller';
import type { WordDuelLobbyPlayer } from '@/game/word-duel-lobby/view-model';
import {
  createWordDuelGuestActor,
  normalizeWordDuelGuestDisplayName,
  normalizeWordDuelRoomCode,
  parseWordDuelInviteEntry,
} from '@/game/word-duel-public/guest-entry';
import { createWordDuelResultViewModelFromLocalPayload } from '@/game/word-duel-result/view-model';
import { createWordDuelConnectedActiveRuntimeController } from '@/game/word-duel-runtime/connected-runtime';
import { useDuelWordsRuntimeClients } from '@/game/word-duel-runtime/use-runtime-clients';
import type { InterfaceLocale } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

import { ActiveDuelScreen } from './active-duel-screen';
import { WordDuelBoard } from './components/word-duel-board';
import { createWordDuelResultLocalPayloadFromApiFinalResult } from './result-finalization';
import { publicDuelT } from './public-duel-copy';

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
  const [preferences] = useAppPreferences();
  const interfaceLocale = initialInterfaceLocale ?? preferences.interfaceLocale;
  const copy = (key: Parameters<typeof publicDuelT>[1], values?: Record<string, string | number>) =>
    publicDuelT(interfaceLocale, key, values);
  const runtime = useDuelWordsRuntimeClients();
  const controller = useMemo(
    () => createWordDuelLobbyController({ mode: 'runtime', runtimeApiClient: runtime.appsApi }),
    [runtime.appsApi],
  );
  const guestActorRef = useRef<GuestActor | null>(null);
  const initialPreviewStartedRef = useRef(false);
  const activeOpeningStartedRef = useRef(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>(
    initialGameLanguage ?? preferences.gameLanguage,
  );
  const [inviteInput, setInviteInput] = useState(initialInviteInput);
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [lobbyState, setLobbyState] = useState<WordDuelLobbyControllerState | null>(null);
  const [activeController, setActiveController] = useState<WordDuelActiveController | null>(null);
  const [finalResult, setFinalResult] = useState<DuelWordsApiFinalResult | null>(null);
  const [rematchProposal, setRematchProposal] = useState<DuelWordsApiRematchProposal | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const isBusy = busyAction !== null;

  useEffect(() => {
    if (initialPreviewStartedRef.current || !runtime.ok) {
      return;
    }

    if (initialInviteInput.trim().length > 0) {
      initialPreviewStartedRef.current = true;
      previewInvite(initialInviteInput);
      return;
    }

    if (initialRoomCode.trim().length > 0) {
      initialPreviewStartedRef.current = true;
      previewRoomCode(initialRoomCode);
    }
    // Deep-link preview is deliberately attempted once per mounted route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInviteInput, initialRoomCode, runtime.ok]);

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
    });

    return () => {
      cancelled = true;
    };
    // runAction is component-local; the refs make this initialization idempotent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeController, lobbyState, runtime]);

  async function runAction(actionName: string, action: () => Promise<void>) {
    if (busyAction !== null) {
      return;
    }

    setBusyAction(actionName);
    setStatusMessage(null);
    try {
      await action();
    } catch {
      setStatusMessage(copy('actionUnavailable'));
    } finally {
      setBusyAction(null);
    }
  }

  function currentGuestActor(): GuestActor | null {
    const normalized = normalizeWordDuelGuestDisplayName(displayName);
    if (!normalized.ok) {
      setStatusMessage(displayNameErrorLabel(interfaceLocale, normalized.reason));
      return null;
    }

    if (guestActorRef.current === null) {
      guestActorRef.current = createWordDuelGuestActor({
        displayName: normalized.value,
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
    const host = currentGuestActor();
    if (!host) {
      return;
    }

    void runAction('create', async () => {
      const nextState = await controller.createHostInvite({
        gameLanguage,
        host,
        nowMs: Date.now(),
      });
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
      setLobbyState(nextState);
      setStatusMessage(copy('reviewBeforeJoin'));
    });
  }

  function joinInvite() {
    if (!lobbyState) {
      return;
    }
    const player = currentGuestActor();
    if (!player) {
      return;
    }

    void runAction('join', async () => {
      const nextState = await controller.joinInvite({
        nowMs: Date.now(),
        player,
        state: lobbyState,
      });
      setLobbyState(nextState);
      setStatusMessage(copy('joinedChallenge'));
    });
  }

  function refreshLobby() {
    if (!lobbyState) {
      return;
    }

    void runAction('refresh', async () => {
      const nextState = await controller.refreshLobby({ nowMs: Date.now(), state: lobbyState });
      setLobbyState(nextState);
      setStatusMessage(copy('lobbyUpdated'));
    });
  }

  function markReady() {
    if (!lobbyState) {
      return;
    }

    void runAction('ready', async () => {
      const nextState = await controller.markReady({ nowMs: Date.now(), state: lobbyState });
      setLobbyState(nextState);
      setStatusMessage(nextState.lobby.status === 'countdown' ? copy('bothReady') : copy('readyLocked'));
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
    setRoomCode('');
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
      setRematchProposal(proposal);
      setStatusMessage(copy('rematchSent'));
    });
  }

  function refreshRematch() {
    if (!activeController) return;
    void runAction('rematch-refresh', async () => {
      const proposal = await activeController.getCurrentRematchProposal();
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
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>{copy('guestChallenge')}</Text>
          <Text aria-level={1} accessibilityRole="header" style={styles.title}>Word Duel</Text>
          <Text style={styles.subtitle}>{copy('challengeSubtitle')}</Text>
        </View>
        <AppButton
          tone="quiet"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/play')}
          style={styles.closeButton}>
          {copy('close')}
        </AppButton>
      </View>

      {!runtime.ok ? <RuntimeUnavailable interfaceLocale={interfaceLocale} reason={runtime.reason} /> : null}

      <View style={styles.panel}>
        <Text nativeID="word-duel-display-name-label" style={styles.panelTitle}>{copy('roomName')}</Text>
        <TextInput
          accessibilityLabel={copy('displayNameLabel')}
          accessibilityLabelledBy="word-duel-display-name-label"
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isBusy && lobbyState === null}
          maxLength={32}
          onChangeText={setDisplayName}
          placeholder={copy('displayNamePlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={displayName}
        />
        <Text style={styles.helper}>{copy('roomNameHelp')}</Text>
      </View>

      {lobbyState === null ? (
        <>
          <View style={styles.panel}>
            <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{copy('createChallenge')}</Text>
            <View style={styles.segmented}>
              {(['en', 'es'] as const).map((language) => {
                const selected = language === gameLanguage;
                return (
                  <Pressable
                    key={language}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    disabled={isBusy}
                    onPress={() => setGameLanguage(language)}
                    style={[styles.segment, selected && styles.segmentSelected]}>
                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                      {language === 'en' ? 'English' : 'Español'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <AppButton disabled={!runtime.ok || isBusy} onPress={createInvite}>
              {busyAction === 'create' ? copy('creating') : copy('createChallenge')}
            </AppButton>
          </View>

          <View style={styles.panel}>
            <Text aria-level={2} accessibilityRole="header" style={styles.panelTitle}>{copy('joinChallenge')}</Text>
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
            <AppButton disabled={!runtime.ok || isBusy || inviteInput.trim().length === 0} onPress={() => previewInvite()}>
              {copy('reviewInvite')}
            </AppButton>
            <View style={styles.divider} />
            <Text nativeID="word-duel-room-code-label" style={styles.inputLabel}>{copy('roomCode')}</Text>
            <TextInput
              accessibilityLabel={copy('roomCode')}
              accessibilityLabelledBy="word-duel-room-code-label"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={runtime.ok && !isBusy}
              maxLength={9}
              onChangeText={setRoomCode}
              placeholder="ABCD-1234"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={roomCode}
            />
            <AppButton
              disabled={!runtime.ok || isBusy || roomCode.trim().length === 0}
              tone="secondary"
              onPress={() => previewRoomCode()}>
              {copy('findRoom')}
            </AppButton>
          </View>
        </>
      ) : (
        <PublicLobbyPanel
          busy={isBusy}
          onJoin={joinInvite}
          onReady={markReady}
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
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>{copy('finalResult')}</Text>
          <Text aria-level={1} accessibilityRole="header" style={styles.title}>{resultOutcomeLabel(interfaceLocale, result.outcome)}</Text>
          <Text style={styles.subtitle}>{copy('target', { word: result.targetReveal.displayWord ?? '—' })}</Text>
        </View>
        <AppButton tone="quiet" onPress={onClose} style={styles.closeButton}>{copy('close')}</AppButton>
      </View>

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
          {!proposal ? (
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
  onReady,
  onRefresh,
  onReset,
  onShare,
  state,
}: {
  busy: boolean;
  interfaceLocale: InterfaceLocale;
  onJoin: () => void;
  onReady: () => void;
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
        <Summary label={copy('code')} value={lobby.invitePreview.roomCode} selectable />
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
        {lobby.canPressReady ? (
          <AppButton disabled={busy} onPress={onReady} style={styles.actionButton}>
            {copy('ready')}
          </AppButton>
        ) : null}
        {lobby.status !== 'invite_review' && lobby.status !== 'active_round' ? (
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

function Summary({ label, selectable, value }: { label: string; selectable?: boolean; value: string }) {
  const styles = usePublicChallengeStyles();
  return (
    <View style={styles.summary}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text selectable={selectable} numberOfLines={1} style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function RuntimeUnavailable({ interfaceLocale, reason }: { interfaceLocale: InterfaceLocale; reason: string }) {
  const styles = usePublicChallengeStyles();
  const copy = (key: Parameters<typeof publicDuelT>[1]) => publicDuelT(interfaceLocale, key);
  return (
    <View style={styles.unavailableBox}>
      <Text aria-level={2} accessibilityRole="header" style={styles.unavailableTitle}>{copy('onlineUnavailable')}</Text>
      <Text style={styles.unavailableText}>
        {copy('runtimeDescription')}
      </Text>
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
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerText: { flex: 1, gap: spacing.xs },
  kicker: { color: colors.accent, fontSize: typeScale.tiny, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: typeScale.title, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 21 },
  closeButton: { minWidth: 76 },
  panel: { gap: spacing.md, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg },
  panelTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: '900' },
  helper: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19 },
  inputLabel: { color: colors.text, fontSize: typeScale.small, fontWeight: '800' },
  input: { minHeight: 48, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.background, color: colors.text, fontSize: typeScale.body, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  segmented: { flexDirection: 'row', borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  segmentSelected: { backgroundColor: colors.accent },
  segmentText: { color: colors.textMuted, fontWeight: '800' },
  segmentTextSelected: { color: colors.onAccent },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  unavailableBox: { gap: spacing.sm, borderRadius: radii.md, backgroundColor: colors.pressureSoft, padding: spacing.lg },
  unavailableTitle: { color: colors.pressure, fontSize: typeScale.lead, fontWeight: '900' },
  unavailableText: { color: colors.text, fontSize: typeScale.small, lineHeight: 19 },
  runtimeReason: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '800', textTransform: 'uppercase' },
  lobbyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  languagePill: { borderRadius: radii.md, backgroundColor: colors.surfaceSoft, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  languageText: { color: colors.accent, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summary: { flex: 1, flexBasis: 90, minWidth: 0, gap: spacing.xs, borderRadius: radii.md, backgroundColor: colors.surfaceStrong, padding: spacing.md },
  metaLabel: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '800', textTransform: 'uppercase' },
  summaryValue: { color: colors.text, fontSize: typeScale.body, fontWeight: '900' },
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
