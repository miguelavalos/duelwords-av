import type {
  WordDuelLobbyPlayerState,
  WordDuelLobbyStatus,
  WordDuelLobbyViewModel,
} from '@/game/word-duel-lobby/view-model';

export type LobbyVisualFeedback =
  | {
      id: string;
      kind: 'countdown_started';
      seconds: number;
    }
  | {
      id: string;
      kind: 'duel_started';
      roundNumber: number;
    }
  | {
      id: string;
      kind: 'rival_joined';
      rivalName: string;
    }
  | {
      id: string;
      kind: 'rival_ready';
      rivalName: string;
    };

export type LobbyVisualSnapshot = {
  activeRoundNumber: number | null;
  countdownEndsAtMs: number | null;
  rival: {
    name: string;
    side: string;
    state: WordDuelLobbyPlayerState;
  } | null;
  status: WordDuelLobbyStatus;
};

export function lobbyVisualFeedbackDurationMs(event: LobbyVisualFeedback): number {
  if (event.kind === 'countdown_started') {
    return Math.max(3_200, event.seconds * 1_000);
  }
  if (event.kind === 'duel_started') {
    return 2_200;
  }
  return 3_600;
}

export function createLobbyVisualSnapshot(
  lobby: WordDuelLobbyViewModel,
): LobbyVisualSnapshot {
  const rival = lobby.players.find((player) => player.side !== lobby.viewerSide) ?? null;
  return {
    activeRoundNumber: lobby.activeRound?.roundNumber ?? null,
    countdownEndsAtMs: lobby.countdown?.endsAtMs ?? null,
    rival: rival
      ? {
          name: rival.safeDisplayName,
          side: rival.side,
          state: rival.state,
        }
      : null,
    status: lobby.status,
  };
}

export function lobbyVisualFeedbackFromViewModel(
  previous: LobbyVisualSnapshot | null,
  lobby: WordDuelLobbyViewModel,
): {
  feedback: LobbyVisualFeedback | null;
  snapshot: LobbyVisualSnapshot;
} {
  const snapshot = createLobbyVisualSnapshot(lobby);

  if (previous === null) {
    return { feedback: null, snapshot };
  }

  if (
    snapshot.status === 'active_round'
    && previous.status !== 'active_round'
    && snapshot.activeRoundNumber !== null
  ) {
    return {
      feedback: {
        id: `duel-started:${snapshot.activeRoundNumber}`,
        kind: 'duel_started',
        roundNumber: snapshot.activeRoundNumber,
      },
      snapshot,
    };
  }

  if (
    snapshot.status === 'countdown'
    && previous.status !== 'countdown'
    && snapshot.countdownEndsAtMs !== null
  ) {
    return {
      feedback: {
        id: `countdown:${snapshot.countdownEndsAtMs}`,
        kind: 'countdown_started',
        seconds: lobby.countdown?.remainingSeconds ?? 3,
      },
      snapshot,
    };
  }

  if (
    snapshot.rival !== null
    && snapshot.rival.state === 'joined'
    && previous.rival?.state === 'waiting'
  ) {
    return {
      feedback: {
        id: `rival-joined:${snapshot.rival.side}:${snapshot.rival.name}`,
        kind: 'rival_joined',
        rivalName: snapshot.rival.name,
      },
      snapshot,
    };
  }

  if (
    snapshot.rival !== null
    && snapshot.rival.state === 'ready'
    && previous.rival?.state !== 'ready'
  ) {
    return {
      feedback: {
        id: `rival-ready:${snapshot.rival.side}`,
        kind: 'rival_ready',
        rivalName: snapshot.rival.name,
      },
      snapshot,
    };
  }

  return { feedback: null, snapshot };
}
