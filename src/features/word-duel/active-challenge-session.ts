import { useSyncExternalStore } from 'react';

import type { WordDuelLobbyControllerState } from '@/game/word-duel-lobby/controller';

let activeChallengeSession: WordDuelLobbyControllerState | null = null;
const listeners = new Set<() => void>();

export function isActiveChallengeSessionProtected(
  state: WordDuelLobbyControllerState | null,
): state is WordDuelLobbyControllerState {
  if (
    state === null
    || state.session.actor === null
    || state.session.gameId === null
    || state.session.playerId === null
  ) {
    return false;
  }

  return state.lobby.status === 'waiting_for_player'
    || state.lobby.status === 'lobby'
    || state.lobby.status === 'countdown'
    || state.lobby.status === 'active_round';
}

export function rememberActiveChallengeSession(state: WordDuelLobbyControllerState | null): void {
  const nextSession = isActiveChallengeSessionProtected(state)
    ? { ...state, realtime: null }
    : null;

  if (activeChallengeSession === nextSession) return;
  activeChallengeSession = nextSession;
  emitChange();
}

export function clearActiveChallengeSession(): void {
  if (activeChallengeSession === null) return;
  activeChallengeSession = null;
  emitChange();
}

export function readActiveChallengeSession(): WordDuelLobbyControllerState | null {
  return activeChallengeSession;
}

export function subscribeActiveChallengeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useActiveChallengeSession(): WordDuelLobbyControllerState | null {
  return useSyncExternalStore(
    subscribeActiveChallengeSession,
    readActiveChallengeSession,
    () => null,
  );
}

function emitChange(): void {
  for (const listener of listeners) listener();
}
