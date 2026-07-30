import { describe, expect, test } from 'vitest';

import type {
  DuelWordsRealtimeRoomView,
} from '@/game/word-duel-active/realtime-projection';

import {
  activeDuelVisualFeedbackFromProjection,
  createActiveDuelVisualSnapshot,
  createOwnSubmittedVisualFeedback,
} from './active-duel-visual-feedback';

describe('active duel visual feedback', () => {
  test('does not animate the initial room projection', () => {
    expect(activeDuelVisualFeedbackFromProjection(null, room()).feedback).toBeNull();
  });

  test('announces an opponent submission without exposing their word', () => {
    const previous = createActiveDuelVisualSnapshot(room());
    const current = room({
      opponentSubmitted: true,
    });

    expect(activeDuelVisualFeedbackFromProjection(previous, current).feedback).toEqual({
      id: 'opponent-submitted:2',
      kind: 'opponent_submitted',
      roundNumber: 2,
    });
    expect(JSON.stringify(
      activeDuelVisualFeedbackFromProjection(previous, current).feedback,
    ).toLowerCase()).not.toContain('guess');
  });

  test('prioritizes the synchronized resolving transition when both submissions lock', () => {
    const previous = createActiveDuelVisualSnapshot(room());
    const current = room({
      opponentSubmitted: true,
      status: 'round_resolving',
    });

    expect(activeDuelVisualFeedbackFromProjection(previous, current).feedback).toEqual({
      id: 'resolving:2',
      kind: 'round_resolving',
      roundNumber: 2,
    });
  });

  test('announces a newly projected round once', () => {
    const previous = createActiveDuelVisualSnapshot(room({
      status: 'round_resolving',
    }));
    const next = room({ roundNumber: 3 });
    const result = activeDuelVisualFeedbackFromProjection(previous, next);

    expect(result.feedback).toEqual({
      id: 'round:3',
      kind: 'next_round',
      roundNumber: 3,
    });
    expect(activeDuelVisualFeedbackFromProjection(result.snapshot, next).feedback).toBeNull();
  });

  test('turns only a fresh rival reaction into a sticker event', () => {
    const previous = createActiveDuelVisualSnapshot(room());
    const withReaction = room({
      reactions: [{
        expiresAt: 20_000,
        reactionKey: 'tick_tock',
        side: 'b',
      }],
    });
    const result = activeDuelVisualFeedbackFromProjection(previous, withReaction);

    expect(result.feedback).toEqual({
      id: 'reaction:b:tick_tock:20000',
      kind: 'opponent_reaction',
      reaction: 'tick_tock',
    });
    expect(activeDuelVisualFeedbackFromProjection(result.snapshot, withReaction).feedback).toBeNull();
  });

  test('ignores own and expired reactions', () => {
    const previous = createActiveDuelVisualSnapshot(room());

    expect(activeDuelVisualFeedbackFromProjection(previous, room({
      reactions: [{
        expiresAt: 20_000,
        reactionKey: 'good_duel',
        side: 'a',
      }],
    })).feedback).toBeNull();
    expect(activeDuelVisualFeedbackFromProjection(previous, room({
      reactions: [{
        expiresAt: 9_999,
        reactionKey: 'almost_there',
        side: 'b',
      }],
    })).feedback).toBeNull();
  });

  test('creates a unique immediate confirmation for an own submission', () => {
    expect(createOwnSubmittedVisualFeedback(4, 7)).toEqual({
      id: 'own-submitted:4:7',
      kind: 'own_submitted',
      roundNumber: 4,
    });
  });
});

function room(input: {
  opponentSubmitted?: boolean;
  reactions?: DuelWordsRealtimeRoomView['reactions'];
  roundNumber?: number;
  status?: DuelWordsRealtimeRoomView['room']['status'];
} = {}): DuelWordsRealtimeRoomView {
  const roundNumber = input.roundNumber ?? 2;
  return {
    room: {
      language: 'en',
      maxAttempts: 6,
      mode: 'human_duel',
      roundDeadlineAt: 50_000,
      roundNumber,
      serverNow: 10_000,
      status: input.status ?? 'active_round',
      wordLength: 5,
    },
    own: {
      attemptCount: roundNumber - 1,
      hasSubmittedCurrentRound: false,
      isReady: true,
      safeDisplayName: 'You',
      side: 'a',
      status: 'ready',
      timeoutCount: 0,
    },
    opponent: {
      attemptCount: input.opponentSubmitted ? roundNumber : roundNumber - 1,
      hasSubmittedCurrentRound: input.opponentSubmitted ?? false,
      isReady: true,
      presenceState: 'online',
      safeDisplayName: 'Rival',
      side: 'b',
      status: input.opponentSubmitted ? 'submitted' : 'ready',
      timeoutCount: 0,
    },
    reactions: input.reactions ?? [],
  };
}
