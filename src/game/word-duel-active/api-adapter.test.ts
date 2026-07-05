import { describe, expect, it } from 'vitest';

import {
  buildRoundScopedDuelWordsPath,
  createMockActiveDuelClient,
  DuelWordsClientError,
  type DuelWordsActorIdentity,
} from './api-adapter';

const DEMO_ACTOR: DuelWordsActorIdentity = {
  actorType: 'guest_session',
  guestSessionId: 'test-session',
};

describe('active duel API adapter contract', () => {
  it('builds the approved round-scoped command routes', () => {
    expect(
      buildRoundScopedDuelWordsPath({
        action: 'submit',
        gameId: 'game 1',
        roundNumber: 2,
      }),
    ).toBe('/v1/apps/duelwords/games/game%201/rounds/2/submit');
    expect(
      buildRoundScopedDuelWordsPath({
        action: 'timeout',
        gameId: 'game-1',
        roundNumber: 2,
      }),
    ).toBe('/v1/apps/duelwords/games/game-1/rounds/2/timeout');
    expect(
      buildRoundScopedDuelWordsPath({
        action: 'open-next-if-due',
        gameId: 'game-1',
        roundNumber: 2,
      }),
    ).toBe('/v1/apps/duelwords/games/game-1/rounds/2/open-next-if-due');
  });

  it('submits through the local mock client idempotently without target or rival data', async () => {
    const client = createMockActiveDuelClient({
      gameId: 'game-1',
      now: () => new Date('2026-07-05T08:00:00.000Z'),
      playerId: 'player-a',
    });

    const first = await client.submitGuess({
      actor: DEMO_ACTOR,
      clientRequestId: 'request-1',
      gameId: 'game-1',
      guess: 'adore',
      playerId: 'player-a',
      roundNumber: 2,
    });
    const retry = await client.submitGuess({
      actor: DEMO_ACTOR,
      clientRequestId: 'request-1',
      gameId: 'game-1',
      guess: 'adore',
      playerId: 'player-a',
      roundNumber: 2,
    });

    expect(retry).toBe(first);
    expect(first.requestPath).toBe('/v1/apps/duelwords/games/game-1/rounds/2/submit');
    expect(first.submission).toEqual({
      acceptedAt: '2026-07-05T08:00:00.000Z',
      clientRequestId: 'request-1',
      letterCount: 5,
      playerId: 'player-a',
      roundNumber: 2,
    });
    expect(first.viewModel.ownRoundState).toBe('waiting_for_rival');
    expect(first.viewModel.ownBoardRows[1]?.state).toBe('submitted_pending');

    const serialized = JSON.stringify(first).toLowerCase();
    for (const forbidden of ['target', 'opponentguess', 'opponent_guess', 'display_word', 'feedback_json']) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it('rejects stale, future, and malformed round commands locally', async () => {
    const client = createMockActiveDuelClient({ gameId: 'game-1' });

    await expect(
      client.submitGuess({
        actor: DEMO_ACTOR,
        clientRequestId: 'stale',
        gameId: 'game-1',
        guess: 'adore',
        playerId: 'player-a',
        roundNumber: 1,
      }),
    ).rejects.toMatchObject({ code: 'invalid_round' });

    await expect(
      client.timeoutRound({
        actor: DEMO_ACTOR,
        gameId: 'game-1',
        playerId: 'player-a',
        roundNumber: 3,
      }),
    ).rejects.toMatchObject({ code: 'invalid_round' });

    expect(() =>
      buildRoundScopedDuelWordsPath({
        action: 'submit',
        gameId: 'game-1',
        roundNumber: 0,
      }),
    ).toThrow(DuelWordsClientError);
  });

  it('opens the next round through the same adapter boundary', async () => {
    const client = createMockActiveDuelClient({ gameId: 'game-1' });
    await client.timeoutRound({
      actor: DEMO_ACTOR,
      gameId: 'game-1',
      playerId: 'player-a',
      roundNumber: 2,
    });

    const next = await client.openNextRoundIfDue({
      gameId: 'game-1',
      roundNumber: 2,
    });

    expect(next.requestPath).toBe('/v1/apps/duelwords/games/game-1/rounds/2/open-next-if-due');
    expect(next.advanced).toBe(true);
    expect(next.viewModel.roundNumber).toBe(3);
    expect(next.viewModel.ownBoardRows[2]?.state).toBe('editing');
  });
});
