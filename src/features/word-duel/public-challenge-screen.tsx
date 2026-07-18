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
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { colors, radii, spacing, typeScale } from '@/ui/theme';

import { ActiveDuelScreen } from './active-duel-screen';
import { WordDuelBoard } from './components/word-duel-board';
import { createWordDuelResultLocalPayloadFromApiFinalResult } from './result-finalization';

type PublicWordDuelChallengeScreenProps = {
  initialGameLanguage?: GameLanguage;
  initialInviteInput?: string;
  initialRoomCode?: string;
};

type GuestActor = Extract<DuelWordsApiActor, { actorType: 'guest_session' }>;

export function PublicWordDuelChallengeScreen({
  initialGameLanguage = 'en',
  initialInviteInput = '',
  initialRoomCode = '',
}: PublicWordDuelChallengeScreenProps) {
  const router = useRouter();
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
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>(initialGameLanguage);
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
        setStatusMessage(nextState.lobby.status === 'active_round' ? 'Round 1 is ready.' : 'Waiting for round 1.');
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
        setStatusMessage('The live duel could not open safely. Refresh the lobby and try again.');
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
      setStatusMessage('That action is not available right now. Try again.');
    } finally {
      setBusyAction(null);
    }
  }

  function currentGuestActor(): GuestActor | null {
    const normalized = normalizeWordDuelGuestDisplayName(displayName);
    if (!normalized.ok) {
      setStatusMessage(displayNameErrorLabel(normalized.reason));
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
      setStatusMessage('Challenge created. Share it with your rival.');
    });
  }

  function previewInvite(value = inviteInput) {
    const parsed = parseWordDuelInviteEntry(value);
    if (!parsed.ok) {
      setStatusMessage(parsed.reason === 'unsupported_host'
        ? 'Use a DuelWords AV invite link.'
        : 'Enter a valid invite link or token.');
      return;
    }

    void runAction('preview', async () => {
      const nextState = await controller.previewInviteByToken({
        inviteToken: parsed.value,
        nowMs: Date.now(),
      });
      setLobbyState(nextState);
      setStatusMessage('Review the challenge before joining.');
    });
  }

  function previewRoomCode(value = roomCode) {
    const normalized = normalizeWordDuelRoomCode(value);
    if (!normalized.ok) {
      setStatusMessage('Enter the eight-character room code.');
      return;
    }

    void runAction('preview-code', async () => {
      const nextState = await controller.previewInviteByRoomCode({
        nowMs: Date.now(),
        roomCode: normalized.value,
      });
      setLobbyState(nextState);
      setStatusMessage('Review the challenge before joining.');
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
      setStatusMessage('You joined the challenge.');
    });
  }

  function refreshLobby() {
    if (!lobbyState) {
      return;
    }

    void runAction('refresh', async () => {
      const nextState = await controller.refreshLobby({ nowMs: Date.now(), state: lobbyState });
      setLobbyState(nextState);
      setStatusMessage('Lobby updated.');
    });
  }

  function markReady() {
    if (!lobbyState) {
      return;
    }

    void runAction('ready', async () => {
      const nextState = await controller.markReady({ nowMs: Date.now(), state: lobbyState });
      setLobbyState(nextState);
      setStatusMessage(nextState.lobby.status === 'countdown' ? 'Both players are ready.' : 'Ready is locked.');
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
      setStatusMessage('Invite share opened.');
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
    setStatusMessage('Rematch accepted. Get ready for the next duel.');
    return true;
  }

  function createRematch() {
    if (!activeController || !finalResult) return;
    void runAction('rematch-create', async () => {
      const proposal = await activeController.createRematchProposal({ language: finalResult.game.language });
      setRematchProposal(proposal);
      setStatusMessage('Rematch sent. Your rival can accept it from their result screen.');
    });
  }

  function refreshRematch() {
    if (!activeController) return;
    void runAction('rematch-refresh', async () => {
      const proposal = await activeController.getCurrentRematchProposal();
      setRematchProposal(proposal);
      if (proposal && continueAcceptedRematch(proposal)) return;
      setStatusMessage(proposal ? 'Rematch status updated.' : 'No rematch request yet.');
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
      setStatusMessage(`Rematch ${proposal.status}.`);
    });
  }

  if (activeController && finalResult === null) {
    return (
      <ActiveDuelScreen
        controller={activeController}
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
          <Text style={styles.kicker}>Guest challenge</Text>
          <Text accessibilityRole="header" style={styles.title}>Word Duel</Text>
          <Text style={styles.subtitle}>Create a live challenge or review an invite before joining.</Text>
        </View>
        <AppButton tone="quiet" onPress={() => router.back()} style={styles.closeButton}>
          Close
        </AppButton>
      </View>

      {!runtime.ok ? <RuntimeUnavailable reason={runtime.reason} /> : null}

      <View style={styles.panel}>
        <Text accessibilityRole="header" nativeID="word-duel-display-name-label" style={styles.panelTitle}>Your room name</Text>
        <TextInput
          accessibilityLabel="Room display name"
          accessibilityLabelledBy="word-duel-display-name-label"
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isBusy && lobbyState === null}
          maxLength={32}
          onChangeText={setDisplayName}
          placeholder="How your rival will see you"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={displayName}
        />
        <Text style={styles.helper}>Used only for this challenge. No account is required.</Text>
      </View>

      {lobbyState === null ? (
        <>
          <View style={styles.panel}>
            <Text accessibilityRole="header" style={styles.panelTitle}>Create a challenge</Text>
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
              {busyAction === 'create' ? 'Creating…' : 'Create challenge'}
            </AppButton>
          </View>

          <View style={styles.panel}>
            <Text accessibilityRole="header" style={styles.panelTitle}>Join a challenge</Text>
            <Text nativeID="word-duel-invite-label" style={styles.inputLabel}>Invite link or token</Text>
            <TextInput
              accessibilityLabel="Invite link or token"
              accessibilityLabelledBy="word-duel-invite-label"
              autoCapitalize="none"
              autoCorrect={false}
              editable={runtime.ok && !isBusy}
              onChangeText={setInviteInput}
              placeholder="Paste invite link"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={inviteInput}
            />
            <AppButton disabled={!runtime.ok || isBusy || inviteInput.trim().length === 0} onPress={() => previewInvite()}>
              Review invite
            </AppButton>
            <View style={styles.divider} />
            <Text nativeID="word-duel-room-code-label" style={styles.inputLabel}>Room code</Text>
            <TextInput
              accessibilityLabel="Room code"
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
              Find room
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
  onClose,
  onCreateRematch,
  onRefreshRematch,
  onRespond,
  proposal,
  statusMessage,
}: {
  busy: boolean;
  finalResult: DuelWordsApiFinalResult;
  onClose: () => void;
  onCreateRematch: () => void;
  onRefreshRematch: () => void;
  onRespond: (action: 'accept' | 'cancel' | 'decline') => void;
  proposal: DuelWordsApiRematchProposal | null;
  statusMessage: string | null;
}) {
  const result = createWordDuelResultViewModelFromLocalPayload(
    createWordDuelResultLocalPayloadFromApiFinalResult(finalResult),
  );
  const boardRows = (rows: typeof result.own.boardRows) => rows.map((row) => ({ ...row, state: 'scored' as const }));

  function shareResult() {
    void Share.share({ message: result.safeSharePreview.text });
  }

  return (
    <AppScreen bottomInset={spacing.xxl} contentGap={spacing.md}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Final result</Text>
          <Text accessibilityRole="header" style={styles.title}>{resultOutcomeLabel(result.outcome)}</Text>
          <Text style={styles.subtitle}>Target: {result.targetReveal.displayWord ?? '—'}</Text>
        </View>
        <AppButton tone="quiet" onPress={onClose} style={styles.closeButton}>Close</AppButton>
      </View>

      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.panelTitle}>{result.own.safeDisplayName}</Text>
        <WordDuelBoard accessibilityLabel="Your final board" density="compact" rows={boardRows(result.own.boardRows)} tileSize={34} />
      </View>
      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.panelTitle}>{result.opponent.safeDisplayName}</Text>
        <WordDuelBoard accessibilityLabel="Rival final board" density="compact" rows={boardRows(result.opponent.boardRows)} tileSize={34} />
      </View>

      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.panelTitle}>Play again</Text>
        <Text style={styles.helper}>{rematchLabel(proposal)}</Text>
        <View style={styles.actionRow}>
          {!proposal ? (
            <AppButton disabled={busy} onPress={onCreateRematch} style={styles.actionButton}>Request rematch</AppButton>
          ) : null}
          {proposal?.viewer.canAccept ? (
            <AppButton disabled={busy} onPress={() => onRespond('accept')} style={styles.actionButton}>Accept</AppButton>
          ) : null}
          {proposal?.viewer.canDecline ? (
            <AppButton disabled={busy} tone="quiet" onPress={() => onRespond('decline')} style={styles.actionButton}>Decline</AppButton>
          ) : null}
          {proposal?.viewer.canCancel ? (
            <AppButton disabled={busy} tone="quiet" onPress={() => onRespond('cancel')} style={styles.actionButton}>Cancel request</AppButton>
          ) : null}
          <AppButton disabled={busy} tone="secondary" onPress={onRefreshRematch} style={styles.actionButton}>Refresh</AppButton>
          <AppButton disabled={busy} tone="quiet" onPress={shareResult} style={styles.actionButton}>Share result</AppButton>
        </View>
      </View>
      {statusMessage ? <View accessibilityLiveRegion="polite" style={styles.statusBox}><Text selectable style={styles.statusText}>{statusMessage}</Text></View> : null}
    </AppScreen>
  );
}

function PublicLobbyPanel({
  busy,
  onJoin,
  onReady,
  onRefresh,
  onReset,
  onShare,
  state,
}: {
  busy: boolean;
  onJoin: () => void;
  onReady: () => void;
  onRefresh: () => void;
  onReset: () => void;
  onShare: () => void;
  state: WordDuelLobbyControllerState;
}) {
  const lobby = state.lobby;

  return (
    <View style={styles.panel}>
      <View style={styles.lobbyHeader}>
        <View>
          <Text style={styles.kicker}>{lobbyStatusLabel(lobby.status)}</Text>
          <Text accessibilityRole="header" style={styles.panelTitle}>{lobby.invitePreview.gameName}</Text>
        </View>
        <View style={styles.languagePill}>
          <Text style={styles.languageText}>{lobby.invitePreview.gameLanguage.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <Summary label="Letters" value={String(lobby.invitePreview.wordLength)} />
        <Summary label="Attempts" value={String(lobby.invitePreview.maxAttempts)} />
        <Summary label="Code" value={lobby.invitePreview.roomCode} selectable />
      </View>

      <View style={styles.playersBox}>
        {lobby.players.map((player) => <PlayerRow key={player.side} player={player} />)}
      </View>

      {lobby.status === 'invite_review' ? (
        <View style={styles.reviewBox}>
          <Text style={styles.reviewTitle}>Join this challenge?</Text>
          <Text style={styles.helper}>Joining takes the open rival seat. The game starts only after both players press Ready.</Text>
        </View>
      ) : null}

      {lobby.status === 'countdown' ? (
        <View style={styles.countdownBox}>
          <Text style={styles.countdownValue}>{lobby.countdown?.remainingSeconds ?? 0}</Text>
          <Text style={styles.helper}>Round 1 opens when the countdown finishes.</Text>
        </View>
      ) : null}

      {lobby.status === 'active_round' ? (
        <View style={styles.reviewBox}>
          <Text style={styles.reviewTitle}>Round 1 is ready</Text>
          <Text style={styles.helper}>The connected duel screen is the next product handoff.</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        {lobby.status === 'invite_review' ? (
          <AppButton disabled={busy || !lobby.canJoin} onPress={onJoin} style={styles.actionButton}>
            Join challenge
          </AppButton>
        ) : null}
        {lobby.viewerRole === 'host' && (lobby.status === 'waiting_for_player' || lobby.status === 'lobby') ? (
          <AppButton disabled={busy} onPress={onShare} style={styles.actionButton}>
            Share invite
          </AppButton>
        ) : null}
        {lobby.canPressReady ? (
          <AppButton disabled={busy} onPress={onReady} style={styles.actionButton}>
            Ready
          </AppButton>
        ) : null}
        {lobby.status !== 'invite_review' && lobby.status !== 'active_round' ? (
          <AppButton disabled={busy} tone="secondary" onPress={onRefresh} style={styles.actionButton}>
            Refresh lobby
          </AppButton>
        ) : null}
        <AppButton disabled={busy} tone="quiet" onPress={onReset} style={styles.actionButton}>
          Back
        </AppButton>
      </View>
    </View>
  );
}

function PlayerRow({ player }: { player: WordDuelLobbyPlayer }) {
  return (
    <View style={styles.playerRow}>
      <View style={styles.sideBadge}><Text style={styles.sideText}>{player.side.toUpperCase()}</Text></View>
      <View style={styles.playerText}>
        <Text style={styles.playerName}>{player.safeDisplayName}{player.isViewer ? ' · You' : ''}</Text>
        <Text style={styles.helper}>{player.role === 'host' ? 'Host' : 'Rival'}</Text>
      </View>
      <Text style={styles.playerState}>{player.state === 'ready' ? 'Ready' : player.state === 'joined' ? 'Joined' : 'Waiting'}</Text>
    </View>
  );
}

function Summary({ label, selectable, value }: { label: string; selectable?: boolean; value: string }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text selectable={selectable} numberOfLines={1} style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function RuntimeUnavailable({ reason }: { reason: string }) {
  return (
    <View style={styles.unavailableBox}>
      <Text accessibilityRole="header" style={styles.unavailableTitle}>Online challenges are unavailable in this build</Text>
      <Text style={styles.unavailableText}>
        DuelWords stays offline unless both the Apps AV API and safe realtime configuration are enabled.
      </Text>
      <Text style={styles.runtimeReason}>{runtimeReasonLabel(reason)}</Text>
    </View>
  );
}

function displayNameErrorLabel(reason: string): string {
  if (reason === 'too_long') {
    return 'Use a room name with 32 characters or fewer.';
  }
  if (reason === 'unsupported_character') {
    return 'Remove unsupported characters from your room name.';
  }
  return 'Enter the name your rival will see.';
}

function resultOutcomeLabel(outcome: string): string {
  if (outcome === 'win') return 'You won';
  if (outcome === 'loss') return 'Rival won';
  if (outcome === 'draw') return 'Draw';
  return 'Duel complete';
}

function rematchLabel(proposal: DuelWordsApiRematchProposal | null): string {
  if (!proposal) return 'Request a new duel with the same rival.';
  if (proposal.status === 'sent' && proposal.viewer.role === 'recipient') return 'Your rival requested a rematch.';
  if (proposal.status === 'sent') return 'Waiting for your rival to answer.';
  if (proposal.status === 'accepted') return 'Rematch accepted. Opening the next lobby…';
  if (proposal.status === 'declined') return 'The rematch was declined.';
  if (proposal.status === 'cancelled') return 'The rematch request was cancelled.';
  return 'The rematch request expired.';
}

function runtimeReasonLabel(reason: string): string {
  if (reason === 'apps_api_disabled') {
    return 'Apps AV API disabled';
  }
  if (reason === 'realtime_disabled') {
    return 'Realtime disabled';
  }
  return 'Safe realtime is not ready';
}

function lobbyStatusLabel(status: string): string {
  if (status === 'invite_review') return 'Invite review';
  if (status === 'waiting_for_player') return 'Waiting for rival';
  if (status === 'lobby') return 'Lobby';
  if (status === 'countdown') return 'Starting';
  if (status === 'active_round') return 'Active duel';
  return 'Challenge closed';
}

const styles = StyleSheet.create({
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
});
