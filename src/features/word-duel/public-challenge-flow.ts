import type { WordDuelLobbyStatus } from '@/game/word-duel-lobby/view-model';

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
