import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { GameLanguage } from '@/game/word-duel-engine';
import { GAME_LANGUAGES, t } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { createWordDuelConnectedActiveRuntimeController } from '@/game/word-duel-runtime/connected-runtime';
import { useDuelWordsRuntimeClients } from '@/game/word-duel-runtime/use-runtime-clients';
import {
  createWordDuelLobbyController,
  createWordDuelLobbyControllerStateFromAcceptedRematchProposal,
  type WordDuelLobbyControllerState,
} from '@/game/word-duel-lobby/controller';
import { DuelWordsApiError, type DuelWordsApiRematchProposal } from '@/game/word-duel-lobby/api-client';
import type { WordDuelLobbyPlayer } from '@/game/word-duel-lobby/view-model';
import type { WordDuelActiveController } from '@/game/word-duel-active/controller';
import { startActiveDuelPresenceHeartbeat } from '@/game/word-duel-active/presence-heartbeat';
import type { ActiveDuelReactionId, ActiveDuelViewModel } from '@/game/word-duel-active/view-model';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

import { createWordDuelResultLocalPayloadFromApiFinalResult } from './result-finalization';
import { buildWordDuelResultHandoffHref } from './word-duel-route-params';

const REACTIONS: ActiveDuelReactionId[] = ['nice', 'tick_tock', 'almost', 'gg'];

export function ConnectedRuntimeScreen() {
  const router = useRouter();
  const [{ interfaceLocale }] = useAppPreferences();
  const { colors } = useAppTheme();
  const styles = useConnectedStyles();
  const runtime = useDuelWordsRuntimeClients();
  const lobbyController = useMemo(
    () => createWordDuelLobbyController({
      mode: 'runtime',
      runtimeApiClient: runtime.appsApi,
    }),
    [runtime.appsApi],
  );
  const host = useMemo(() => createGuestActor('Host'), []);
  const player = useMemo(() => createGuestActor('Rival'), []);
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>('en');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState('');
  const [lobbyState, setLobbyState] = useState<WordDuelLobbyControllerState | null>(null);
  const [activeController, setActiveController] = useState<WordDuelActiveController | null>(null);
  const [activeModel, setActiveModel] = useState<ActiveDuelViewModel | null>(null);
  const [guess, setGuess] = useState('');
  const [rematchProposal, setRematchProposal] = useState<DuelWordsApiRematchProposal | null>(null);
  const [rematchProposalIdInput, setRematchProposalIdInput] = useState('');
  const [statusDetail, setStatusDetail] = useState(runtime.ok ? 'Ready' : runtimeStatusLabel(runtime.reason));
  const reactionRequestNumber = useRef(0);
  const submitRequestNumber = useRef(0);

  useEffect(() => {
    if (!runtime.ok) {
      setStatusDetail(runtimeStatusLabel(runtime.reason));
      setActiveController(null);
      setActiveModel(null);
      setRematchProposal(null);
      setRematchProposalIdInput('');
    }
  }, [runtime.ok, runtime.reason]);

  useEffect(() => {
    if (!activeController) {
      return undefined;
    }

    const unsubscribe = activeController.subscribeActiveRoomView(() => {
      setActiveModel(activeController.getViewModel());
    });
    const stopHeartbeat = startActiveDuelPresenceHeartbeat({
      sendHeartbeat: async () => {
        const result = await activeController.sendPresenceHeartbeat();
        setActiveModel(activeController.getViewModel());
        setStatusDetail(result.ok ? 'Online' : 'Realtime unavailable');
        return result;
      },
    });

    return () => {
      stopHeartbeat();
      unsubscribe();
    };
  }, [activeController]);

  function runAction(actionName: string, action: () => Promise<void>) {
    setBusyAction(actionName);
    return action()
      .catch((error: unknown) => {
        setStatusDetail(error instanceof Error ? error.message : 'Action unavailable');
      })
      .finally(() => {
        setBusyAction(null);
      });
  }

  function createInvite() {
    void runAction('create', async () => {
      const nextState = await lobbyController.createHostInvite({
        gameLanguage,
        host,
        nowMs: Date.now(),
      });
      setLobbyState(nextState);
      setActiveController(null);
      setActiveModel(null);
      setRematchProposal(null);
      setRematchProposalIdInput('');
      setStatusDetail('Invite created');
    });
  }

  function refreshLobby() {
    if (!lobbyState) {
      return;
    }

    void runAction('refresh', async () => {
      const nextState = await lobbyController.refreshLobby({
        nowMs: Date.now(),
        state: lobbyState,
      });
      setLobbyState(nextState);
      setStatusDetail('Lobby refreshed');
    });
  }

  function joinInvite() {
    const token = inviteTokenFromInternalInput(inviteToken);
    if (!token) {
      return;
    }

    void runAction('join', async () => {
      const nextState = await lobbyController.joinInviteByToken({
        inviteToken: token,
        nowMs: Date.now(),
        player,
      });
      setLobbyState(nextState);
      setActiveController(null);
      setActiveModel(null);
      setRematchProposal(null);
      setRematchProposalIdInput('');
      setInviteToken('');
      setStatusDetail('Invite joined');
    });
  }

  function markReady() {
    if (!lobbyState) {
      return;
    }

    void runAction('ready', async () => {
      const nextState = await lobbyController.markReady({
        nowMs: Date.now(),
        state: lobbyState,
      });
      setLobbyState(nextState);
      setStatusDetail('Ready locked');
    });
  }

  function openFirstRound() {
    if (!lobbyState) {
      return;
    }

    void runAction('start', async () => {
      const nextState = await lobbyController.openFirstRoundIfDue({
        nowMs: Date.now(),
        state: lobbyState,
      });
      setLobbyState(nextState);
      setStatusDetail('Round checked');
    });
  }

  function openActiveRuntime() {
    if (!lobbyState) {
      return;
    }

    void runAction('active', async () => {
      const bundle = await createWordDuelConnectedActiveRuntimeController({
        lobbyState,
        realtimeNow: () => Date.now(),
        runtime,
      });
      setLobbyState(bundle.lobbyState);

      if (!bundle.ok) {
        setStatusDetail(`Active unavailable: ${bundle.reason}`);
        return;
      }

      setActiveController(bundle.controller);
      setActiveModel(bundle.controller.getViewModel());
      setRematchProposal(null);
      setRematchProposalIdInput('');
      setStatusDetail(bundle.realtimeSessionSource === 'recovered' ? 'Realtime session recovered' : 'Active connected');
    });
  }

  function submitGuess() {
    if (!activeController || !activeModel) {
      return;
    }

    submitRequestNumber.current += 1;
    void runAction('submit', async () => {
      const result = await activeController.submitGuess({
        clientRequestId: `connected-submit-${activeModel.roundNumber}-${submitRequestNumber.current}`,
        guess,
        roundNumber: activeModel.roundNumber,
      });
      setGuess('');
      setActiveModel(result.viewModel);
      setStatusDetail('Submitted');
    });
  }

  function sendHeartbeat() {
    if (!activeController) {
      return;
    }

    void runAction('heartbeat', async () => {
      const result = await activeController.sendPresenceHeartbeat();
      setActiveModel(activeController.getViewModel());
      setStatusDetail(result.ok ? 'Online' : 'Realtime unavailable');
    });
  }

  function timeoutRound() {
    if (!activeController || !activeModel) {
      return;
    }

    void runAction('timeout', async () => {
      const result = await activeController.timeoutRound({
        roundNumber: activeModel.roundNumber,
      });
      setActiveModel(result.viewModel);
      setStatusDetail('Timed out');
    });
  }

  function refreshSnapshot() {
    if (!activeController || !activeModel) {
      return;
    }

    void runAction('snapshot', async () => {
      const result = await activeController.refreshOwnRoundSnapshot({
        roundNumber: activeModel.roundNumber,
      });
      setActiveModel(result.viewModel);
      setStatusDetail(result.feedbackAvailable ? 'Feedback ready' : 'Waiting');
    });
  }

  function openNextRound() {
    if (!activeController || !activeModel) {
      return;
    }

    void runAction('next', async () => {
      const result = await activeController.openNextRoundIfDue({
        roundNumber: activeModel.roundNumber,
      });
      setActiveModel(result.viewModel);
      setStatusDetail(result.advanced ? 'Next round' : 'Still resolving');
    });
  }

  function sendReaction(reaction: ActiveDuelReactionId) {
    if (!activeController) {
      return;
    }

    reactionRequestNumber.current += 1;
    void runAction(`reaction-${reaction}`, async () => {
      const result = await activeController.sendReaction({
        clientRequestId: `connected-reaction-${reactionRequestNumber.current}`,
        reaction,
      });
      setActiveModel(activeController.getViewModel());
      setStatusDetail(result.ok ? `Reaction sent: ${reactionLabel(reaction)}` : 'Reaction unavailable');
    });
  }

  function createRematchProposal() {
    if (!activeController || !activeModel) {
      return;
    }

    void runAction('rematch-create', async () => {
      const proposal = await activeController.createRematchProposal({
        language: activeModel.gameLanguage,
      });
      setRematchProposal(proposal);
      setRematchProposalIdInput(proposal.proposalId);
      setStatusDetail('Rematch sent');
    });
  }

  function continueAcceptedRematchProposal(proposal: DuelWordsApiRematchProposal, status: string): boolean {
    if (!proposal.nextGame || !lobbyState?.session.actor) {
      return false;
    }

    const nextLobbyState = createWordDuelLobbyControllerStateFromAcceptedRematchProposal({
      actor: lobbyState.session.actor,
      nowMs: Date.now(),
      proposal,
    });
    setLobbyState(nextLobbyState);
    setActiveController(null);
    setActiveModel(null);
    setGuess('');
    setStatusDetail(status);
    return true;
  }

  function refreshRematchProposal() {
    if (!activeController) {
      return;
    }

    void runAction('rematch-current', async () => {
      const proposal = await activeController.getCurrentRematchProposal();
      setRematchProposal(proposal);
      setRematchProposalIdInput(proposal?.proposalId ?? '');
      if (!proposal) {
        setStatusDetail('No rematch');
        return;
      }
      if (continueAcceptedRematchProposal(proposal, 'Rematch found: next lobby')) {
        return;
      }

      setStatusDetail('Rematch found');
    });
  }

  function acceptRematchProposal() {
    if (!activeController) {
      return;
    }

    const proposalId = rematchProposalId(rematchProposalIdInput, rematchProposal);
    if (!proposalId) {
      return;
    }

    void runAction('rematch-accept', async () => {
      const proposal = await activeController.acceptRematchProposal({ proposalId });
      setRematchProposal(proposal);
      setRematchProposalIdInput(proposal.proposalId);
      if (continueAcceptedRematchProposal(proposal, 'Rematch accepted: next lobby')) {
        return;
      }

      setStatusDetail(proposal.nextGame ? 'Rematch accepted' : 'Rematch updated');
    });
  }

  function declineRematchProposal() {
    if (!activeController) {
      return;
    }

    const proposalId = rematchProposalId(rematchProposalIdInput, rematchProposal);
    if (!proposalId) {
      return;
    }

    void runAction('rematch-decline', async () => {
      const proposal = await activeController.declineRematchProposal({ proposalId });
      setRematchProposal(proposal);
      setRematchProposalIdInput(proposal.proposalId);
      setStatusDetail('Rematch declined');
    });
  }

  function cancelRematchProposal() {
    if (!activeController) {
      return;
    }

    const proposalId = rematchProposalId(rematchProposalIdInput, rematchProposal);
    if (!proposalId) {
      return;
    }

    void runAction('rematch-cancel', async () => {
      const proposal = await activeController.cancelRematchProposal({ proposalId });
      setRematchProposal(proposal);
      setRematchProposalIdInput(proposal.proposalId);
      setStatusDetail('Rematch cancelled');
    });
  }

  function openFinalResult() {
    if (!activeController) {
      return;
    }

    void runAction('final-result', async () => {
      try {
        const finalResult = await activeController.getFinalResult();
        const localResult = createWordDuelResultLocalPayloadFromApiFinalResult(finalResult);
        router.push(buildWordDuelResultHandoffHref({
          gameLanguage: finalResult.game.language,
          localResult,
          mode: 'human_duel',
          outcome: localResult.outcome,
          reason: localResult.resultReason,
        }));
      } catch (error) {
        if (error instanceof DuelWordsApiError && error.code === 'game_not_finalized') {
          setStatusDetail('Result not finalized');
          return;
        }
        throw error;
      }
    });
  }

  const isBusy = busyAction !== null;

  return (
    <AppScreen bottomInset={spacing.md} contentGap={spacing.md}>
      <InteriorScreenHeader backLabel={t(interfaceLocale, 'back')} detail="Internal" onBack={() => router.back()} title="Connected runtime" />

      <View style={[styles.statusBand, runtime.ok ? styles.statusReady : styles.statusDisabled]}>
        <View>
          <Text style={styles.metaLabel}>Runtime</Text>
          <Text style={styles.statusTitle}>{runtime.ok ? 'Ready' : 'Disabled'}</Text>
        </View>
        <Text style={styles.statusDetail}>{statusDetail}</Text>
      </View>

      <View style={styles.segmented}>
        {GAME_LANGUAGES.map(({ code: language }) => {
          const selected = language === gameLanguage;
          return (
            <Pressable
              key={language}
              accessibilityRole="button"
              disabled={lobbyState !== null || isBusy}
              onPress={() => setGameLanguage(language)}
              style={[styles.segment, selected && styles.segmentSelected]}>
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {language.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.controls}>
        <AppButton disabled={!runtime.ok || isBusy} onPress={createInvite}>
          Create invite
        </AppButton>
        <View style={styles.joinRow}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={runtime.ok && !isBusy}
            onChangeText={setInviteToken}
            placeholder="Invite URL or token"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={[styles.input, styles.joinInput]}
            value={inviteToken}
          />
          <AppButton
            disabled={!runtime.ok || inviteToken.trim().length === 0 || isBusy}
            tone="secondary"
            onPress={joinInvite}
            style={styles.joinButton}>
            Join
          </AppButton>
        </View>
        <View style={styles.controlRow}>
          <AppButton disabled={!lobbyState || isBusy} tone="quiet" onPress={refreshLobby} style={styles.controlButton}>
            Refresh
          </AppButton>
          <AppButton
            disabled={!lobbyState || !lobbyState.lobby.canPressReady || isBusy}
            tone="secondary"
            onPress={markReady}
            style={styles.controlButton}>
            Ready
          </AppButton>
          <AppButton disabled={!lobbyState || isBusy} tone="quiet" onPress={openFirstRound} style={styles.controlButton}>
            Start
          </AppButton>
        </View>
      </View>

      {lobbyState ? <LobbyStatePanel state={lobbyState} /> : null}

      <AppButton
        disabled={!lobbyState?.lobby.canOpenActiveDuel || !runtime.ok || isBusy}
        onPress={openActiveRuntime}>
        Open active runtime
      </AppButton>

      {activeModel ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Active round {activeModel.roundNumber}</Text>
          <View style={styles.summaryGrid}>
            <SummaryPill label="Own" value={activeModel.ownRoundState} />
            <SummaryPill label="Rival" value={activeModel.opponent.roundState} />
            <SummaryPill label="Presence" value={activeModel.opponent.presence} />
            <SummaryPill
              label="Reaction"
              value={activeModel.activeReaction ? `Seen: ${reactionLabel(activeModel.activeReaction)}` : 'none'}
            />
          </View>
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isBusy}
            maxLength={activeModel.wordLength}
            onChangeText={setGuess}
            placeholder={`${activeModel.wordLength} letters`}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={guess}
          />
          <View style={styles.controlRow}>
            <AppButton
              disabled={guess.length !== activeModel.wordLength || isBusy}
              onPress={submitGuess}
              style={styles.controlButton}>
              Submit
            </AppButton>
            <AppButton disabled={isBusy} tone="quiet" onPress={sendHeartbeat} style={styles.controlButton}>
              Heartbeat
            </AppButton>
            <AppButton disabled={isBusy} tone="quiet" onPress={refreshSnapshot} style={styles.controlButton}>
              Snapshot
            </AppButton>
          </View>
          <View style={styles.controlRow}>
            <AppButton disabled={isBusy} tone="quiet" onPress={timeoutRound} style={styles.controlButton}>
              Timeout
            </AppButton>
            <AppButton disabled={isBusy} tone="secondary" onPress={openNextRound} style={styles.controlButton}>
              Next
            </AppButton>
            <AppButton disabled={isBusy} tone="secondary" onPress={openFinalResult} style={styles.controlButton}>
              Result
            </AppButton>
          </View>
          <View style={styles.rematchBox}>
            <View>
              <Text style={styles.metaLabel}>Rematch API</Text>
              <Text style={styles.panelTitle}>{rematchProposal ? rematchStatusLabel(rematchProposal) : 'No proposal'}</Text>
            </View>
            <View style={styles.summaryGrid}>
              <SummaryPill label="Role" value={rematchProposal?.viewer.role ?? 'none'} />
              <SummaryPill
                label="Timer"
                value={rematchProposal?.remainingSeconds === null || rematchProposal === null
                  ? 'none'
                  : `${rematchProposal.remainingSeconds}s`}
              />
              <SummaryPill label="Next" value={rematchProposal?.nextGame?.status ?? 'none'} />
            </View>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isBusy}
              onChangeText={setRematchProposalIdInput}
              placeholder="Proposal ID"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={rematchProposalIdInput}
            />
            <View style={styles.controlRow}>
              <AppButton disabled={isBusy} tone="secondary" onPress={refreshRematchProposal} style={styles.controlButton}>
                Refresh
              </AppButton>
              <AppButton disabled={isBusy} onPress={createRematchProposal} style={styles.controlButton}>
                Rematch
              </AppButton>
              <AppButton
                disabled={rematchProposalId(rematchProposalIdInput, rematchProposal).length === 0 || isBusy}
                tone="secondary"
                onPress={acceptRematchProposal}
                style={styles.controlButton}>
                Accept
              </AppButton>
            </View>
            <View style={styles.controlRow}>
              <AppButton
                disabled={rematchProposalId(rematchProposalIdInput, rematchProposal).length === 0 || isBusy}
                tone="quiet"
                onPress={declineRematchProposal}
                style={styles.controlButton}>
                Decline
              </AppButton>
              <AppButton
                disabled={rematchProposalId(rematchProposalIdInput, rematchProposal).length === 0 || isBusy}
                tone="quiet"
                onPress={cancelRematchProposal}
                style={styles.controlButton}>
                Cancel
              </AppButton>
            </View>
          </View>
          <View style={styles.reactionRow}>
            {REACTIONS.map((reaction) => (
              <Pressable
                key={reaction}
                accessibilityRole="button"
                disabled={isBusy}
                onPress={() => sendReaction(reaction)}
                style={({ pressed }) => [
                  styles.reactionButton,
                  pressed && styles.pressed,
                  isBusy && styles.disabled,
                ]}>
                <Text style={styles.reactionText}>{reactionLabel(reaction)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </AppScreen>
  );
}

function LobbyStatePanel({ state }: { state: WordDuelLobbyControllerState }) {
  const styles = useConnectedStyles();
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Lobby</Text>
      <View style={styles.summaryGrid}>
        <SummaryPill label="Status" value={state.lobby.status} />
        <SummaryPill label="Room" value={state.lobby.invitePreview.roomCode ?? 'Rematch'} />
        <SummaryPill label="Players" value={`${joinedPlayerCount(state.lobby.players)}/2`} />
      </View>
      <View style={styles.inviteBlock}>
        <Text style={styles.metaLabel}>Invite URL</Text>
        <Text selectable numberOfLines={1} style={styles.inviteUrl}>
          {state.lobby.invitePreview.inviteUrl}
        </Text>
      </View>
      {state.lobby.players.map((player) => (
        <View key={player.side} style={styles.playerRow}>
          <Text style={styles.playerSide}>{player.side.toUpperCase()}</Text>
          <Text style={styles.playerName}>{player.safeDisplayName}</Text>
          <Text style={styles.playerState}>{player.state}</Text>
        </View>
      ))}
    </View>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  const styles = useConnectedStyles();
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.metaValue}>
        {value}
      </Text>
    </View>
  );
}

function createGuestActor(safeDisplayName: string) {
  return {
    actorType: 'guest_session',
    guestSessionId: `guest-${runtimeId()}`,
    safeDisplayName,
  } as const;
}

function runtimeId(): string {
  const cryptoApi = globalThis.crypto as { randomUUID?: () => string } | undefined;
  return cryptoApi?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function inviteTokenFromInternalInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1] ?? trimmed;
  } catch {
    return trimmed;
  }
}

function joinedPlayerCount(players: WordDuelLobbyPlayer[]): number {
  return players.filter((player) => player.state !== 'waiting').length;
}

function rematchProposalId(input: string, proposal: DuelWordsApiRematchProposal | null): string {
  return input.trim() || proposal?.proposalId || '';
}

function rematchStatusLabel(proposal: DuelWordsApiRematchProposal): string {
  if (proposal.status === 'accepted' && proposal.nextGame) {
    return 'Accepted';
  }
  if (proposal.status === 'cancelled') {
    return 'Cancelled';
  }
  if (proposal.status === 'declined') {
    return 'Declined';
  }
  if (proposal.status === 'expired') {
    return 'Expired';
  }
  return proposal.viewer.role === 'owner' ? 'Waiting' : 'Request';
}

function runtimeStatusLabel(reason: string | null): string {
  if (reason === null) {
    return 'Ready';
  }
  if (reason === 'apps_api_disabled') {
    return 'Apps API disabled';
  }
  if (reason === 'realtime_disabled') {
    return 'Realtime disabled';
  }
  if (reason === 'convex_client_factory_missing') {
    return 'Convex factory missing';
  }
  if (reason === 'convex_client_factory_failed') {
    return 'Convex factory failed';
  }
  return 'Realtime pending';
}

function reactionLabel(reaction: ActiveDuelReactionId): string {
  if (reaction === 'tick_tock') {
    return 'Time';
  }
  if (reaction === 'almost') {
    return 'Almost';
  }
  if (reaction === 'gg') {
    return 'GG';
  }
  return 'Nice';
}

function useConnectedStyles() {
  const { colors } = useAppTheme();
  return StyleSheet.create({
  header: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    color: colors.accent,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '900',
  },
  doneButton: {
    minWidth: 84,
  },
  statusBand: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  statusReady: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.accent,
  },
  statusDisabled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statusTitle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '900',
  },
  statusDetail: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typeScale.small,
    fontWeight: '800',
    textAlign: 'right',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    fontWeight: '900',
  },
  segmentTextSelected: {
    color: colors.onAccent,
  },
  controls: {
    gap: spacing.sm,
  },
  joinRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  joinInput: {
    flex: 1,
  },
  joinButton: {
    minWidth: 92,
  },
  controlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  controlButton: {
    flexGrow: 1,
    flexBasis: 112,
  },
  panel: {
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  panelTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryPill: {
    flex: 1,
    flexBasis: 118,
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
  },
  inviteBlock: {
    gap: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
    padding: spacing.md,
  },
  inviteUrl: {
    color: colors.secondary,
    fontSize: typeScale.small,
    fontWeight: '800',
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
  },
  playerRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playerSide: {
    width: 32,
    color: colors.accent,
    fontSize: typeScale.small,
    fontWeight: '900',
  },
  playerName: {
    flex: 1,
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '900',
  },
  playerState: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    fontWeight: '800',
  },
  input: {
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
    letterSpacing: 0,
    paddingHorizontal: spacing.md,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rematchBox: {
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
    padding: spacing.md,
  },
  reactionButton: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  reactionText: {
    color: colors.text,
    fontSize: typeScale.tiny,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.45,
  },
  });
}
