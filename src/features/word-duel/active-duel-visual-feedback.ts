import type {
  ActiveDuelReactionId,
} from '@/game/word-duel-active/view-model';
import type {
  DuelWordsRealtimeRoomStatus,
  DuelWordsRealtimeRoomView,
} from '@/game/word-duel-active/realtime-projection';

export type ActiveDuelVisualFeedback =
  | {
      id: string;
      kind: 'next_round';
      roundNumber: number;
    }
  | {
      deliveryDelayMs?: number;
      id: string;
      kind: 'opponent_reaction';
      reaction: ActiveDuelReactionId;
    }
  | {
      id: string;
      kind: 'opponent_submitted';
      roundNumber: number;
    }
  | {
      id: string;
      kind: 'own_submitted';
      roundNumber: number;
    }
  | {
      id: string;
      kind: 'round_resolving';
      roundNumber: number;
    };

export type ActiveDuelVisualSnapshot = {
  opponentReaction: {
    deliveryDelayMs?: number;
    id: string;
    reaction: ActiveDuelReactionId;
  } | null;
  opponentSubmitted: boolean;
  roundNumber: number;
  status: DuelWordsRealtimeRoomStatus;
};

export function createActiveDuelVisualSnapshot(
  projection: DuelWordsRealtimeRoomView,
): ActiveDuelVisualSnapshot {
  const opponentReaction = [...projection.reactions]
    .filter((reaction) => (
      reaction.expiresAt > projection.room.serverNow
      && projection.own !== null
      && reaction.side !== projection.own.side
      && (reaction.roundNumber === undefined || reaction.roundNumber === projection.room.roundNumber)
    ))
    .sort((left, right) => (
      (right.createdAt ?? right.expiresAt) - (left.createdAt ?? left.expiresAt)
    ))[0];

  return {
    opponentReaction: opponentReaction
      ? {
          deliveryDelayMs: opponentReaction.createdAt === undefined
            ? undefined
            : Math.max(0, projection.room.serverNow - opponentReaction.createdAt),
          id: [
            opponentReaction.side,
            opponentReaction.reactionKey,
            opponentReaction.createdAt ?? opponentReaction.expiresAt,
          ].join(':'),
          reaction: realtimeReactionToVisualReaction(opponentReaction.reactionKey),
        }
      : null,
    opponentSubmitted: projection.opponent?.hasSubmittedCurrentRound === true,
    roundNumber: projection.room.roundNumber,
    status: projection.room.status,
  };
}

export function activeDuelVisualFeedbackFromProjection(
  previous: ActiveDuelVisualSnapshot | null,
  projection: DuelWordsRealtimeRoomView,
): {
  feedback: ActiveDuelVisualFeedback | null;
  snapshot: ActiveDuelVisualSnapshot;
} {
  const snapshot = createActiveDuelVisualSnapshot(projection);

  if (previous === null) {
    return { feedback: null, snapshot };
  }

  if (
    snapshot.opponentReaction !== null
    && snapshot.opponentReaction.id !== previous?.opponentReaction?.id
  ) {
    return {
      feedback: {
        id: `reaction:${snapshot.opponentReaction.id}`,
        kind: 'opponent_reaction',
        reaction: snapshot.opponentReaction.reaction,
        ...(snapshot.opponentReaction.deliveryDelayMs === undefined
          ? {}
          : { deliveryDelayMs: snapshot.opponentReaction.deliveryDelayMs }),
      },
      snapshot,
    };
  }

  if (snapshot.roundNumber > previous.roundNumber) {
    return {
      feedback: {
        id: `round:${snapshot.roundNumber}`,
        kind: 'next_round',
        roundNumber: snapshot.roundNumber,
      },
      snapshot,
    };
  }

  if (snapshot.status === 'round_resolving' && previous.status !== 'round_resolving') {
    return {
      feedback: {
        id: `resolving:${snapshot.roundNumber}`,
        kind: 'round_resolving',
        roundNumber: snapshot.roundNumber,
      },
      snapshot,
    };
  }

  if (snapshot.opponentSubmitted && !previous.opponentSubmitted) {
    return {
      feedback: {
        id: `opponent-submitted:${snapshot.roundNumber}`,
        kind: 'opponent_submitted',
        roundNumber: snapshot.roundNumber,
      },
      snapshot,
    };
  }

  return { feedback: null, snapshot };
}

export function createOwnSubmittedVisualFeedback(
  roundNumber: number,
  requestNumber: number,
): ActiveDuelVisualFeedback {
  return {
    id: `own-submitted:${roundNumber}:${requestNumber}`,
    kind: 'own_submitted',
    roundNumber,
  };
}

function realtimeReactionToVisualReaction(
  reaction: DuelWordsRealtimeRoomView['reactions'][number]['reactionKey'],
): ActiveDuelReactionId {
  if (reaction === 'good_duel') return 'gg';
  if (reaction === 'close_one') return 'close';
  if (reaction === 'almost_there') return 'almost';
  return reaction;
}
