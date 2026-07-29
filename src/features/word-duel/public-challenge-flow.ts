import type { DuelWordsApiActor } from '@/game/word-duel-lobby/api-client';
import type {
  WordDuelLobbyController,
  WordDuelLobbyControllerState,
} from '@/game/word-duel-lobby/controller';
import type {
  WordDuelLobbyStatus,
  WordDuelLobbyViewModel,
} from '@/game/word-duel-lobby/view-model';

export async function joinChallengeAsReadyRecipient(input: {
  controller: Pick<WordDuelLobbyController, 'joinInvite' | 'markReady'>;
  nowMs: () => number;
  player?: DuelWordsApiActor;
  safeDisplayName?: string;
  state: WordDuelLobbyControllerState;
}): Promise<WordDuelLobbyControllerState> {
  const joined = await input.controller.joinInvite({
    nowMs: input.nowMs(),
    player: input.player,
    safeDisplayName: input.safeDisplayName,
    state: input.state,
  });
  if (joined.lobby.viewerRole !== 'recipient' || !joined.lobby.canPressReady) {
    return joined;
  }

  return input.controller.markReady({
    nowMs: input.nowMs(),
    state: joined,
  });
}

export async function readyAcceptedRematchRecipient(input: {
  controller: Pick<WordDuelLobbyController, 'markReady'>;
  nowMs: () => number;
  state: WordDuelLobbyControllerState;
}): Promise<WordDuelLobbyControllerState> {
  if (input.state.lobby.viewerRole !== 'recipient' || !input.state.lobby.canPressReady) {
    return input.state;
  }

  return input.controller.markReady({
    nowMs: input.nowMs(),
    state: input.state,
  });
}

export function canHostStartChallenge(
  lobby: Pick<WordDuelLobbyViewModel, 'canPressReady' | 'viewerRole'>,
): boolean {
  return lobby.viewerRole === 'host' && lobby.canPressReady;
}

export function shouldRearmActiveDuelOpening({
  hasActiveController,
  lobbyStatus,
}: {
  hasActiveController: boolean;
  lobbyStatus: WordDuelLobbyStatus;
}): boolean {
  return lobbyStatus === 'active_round' && !hasActiveController;
}

export function shouldShowLobbyRefresh(status: WordDuelLobbyStatus): boolean {
  return status === 'waiting_for_player'
    || status === 'lobby'
    || status === 'countdown'
    || status === 'active_round';
}

export function shouldSubscribeToLobbyRealtime(status: WordDuelLobbyStatus): boolean {
  return status === 'waiting_for_player'
    || status === 'lobby'
    || status === 'countdown';
}
