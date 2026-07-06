import { describe, expect, it } from 'vitest';

import {
  createWordDuelResultLocalPayloadFromApiFinalResult,
  finalizeActiveWordDuelResult,
  finalizeWordDuelResult,
  reportWordDuelResultFinalizationError,
} from './result-finalization';
import { createDemoActiveDuelViewModel } from '../../game/word-duel-active/view-model';

describe('word duel result finalization adapter', () => {
  it('creates a local result handoff while persistence is unavailable', async () => {
    const handoff = await finalizeWordDuelResult({
      gameLanguage: 'en',
      outcome: 'win',
      own: {
        guesses: [
          {
            feedback: ['exact', 'exact', 'exact', 'exact', 'exact'],
            input: 'cider',
            letters: ['c', 'i', 'd', 'e', 'r'],
            normalizedWord: 'cider',
          },
        ],
        solved: true,
      },
      resultReason: 'solved',
      targetDisplayWord: 'cider',
    }, { mode: 'solo_practice' });

    expect(handoff.resultId).toBeUndefined();
    expect(handoff.storage).toBe('local_mock');
    expect(handoff.localResult?.targetDisplayWord).toBe('cider');
    expect(handoff.localResult?.own.rows).toEqual([
      {
        feedback: 'eeeee',
        word: 'CIDER',
      },
    ]);
  });

  it('uses an injected finalization repository when persistence is available', async () => {
    const handoff = await finalizeWordDuelResult(
      {
        gameLanguage: 'es',
        outcome: 'loss',
        own: {
          guesses: [],
          solved: false,
        },
        resultReason: 'attempts_exhausted',
        targetDisplayWord: 'perla',
      },
      {
        finalizationRepository: {
          finalizeResult: (input) => ({
            resultId: `persisted-${input.mode}`,
            storage: 'convex',
          }),
        },
        mode: 'bot_duel',
      },
    );

    expect(handoff).toEqual({
      resultId: 'persisted-bot_duel',
      storage: 'convex',
    });
  });

  it('creates active duel local result handoffs through the same contract', async () => {
    const handoff = await finalizeActiveWordDuelResult(
      createDemoActiveDuelViewModel({
        gameLanguage: 'es',
        scenario: 'editing',
      }),
      { mode: 'human_duel' },
    );

    expect(handoff.resultId).toBeUndefined();
    expect(handoff.storage).toBe('local_mock');
    expect(handoff.localResult?.gameLanguage).toBe('es');
    expect(handoff.localResult?.targetDisplayWord).toBe('cinta');
    expect(handoff.localResult?.opponent?.safeDisplayName).toBe('Rival');
  });

  it('reports finalization errors with diagnostics-safe mode mapping', () => {
    const event = reportWordDuelResultFinalizationError({
      error: new Error('target CINTA guess PERLA payload secret'),
      gameLanguage: 'es',
      mode: 'daily_preview',
      routeGroup: 'play',
    });
    const payload = JSON.stringify(event).toLowerCase();

    expect(event.tags).toMatchObject({
      game_language: 'es',
      mode: 'daily',
      route_group: 'play',
      safe_error_category: 'result-finalization-failed',
    });
    expect(payload).not.toContain('cinta');
    expect(payload).not.toContain('perla');
    expect(payload).not.toContain('secret');
    expect(payload).not.toContain('payload');
  });

  it('converts API final results into the existing local result route payload', () => {
    const payload = createWordDuelResultLocalPayloadFromApiFinalResult({
      game: {
        countdownEndsAt: null,
        currentRound: 1,
        gameId: 'game-1',
        language: 'en',
        maxAttempts: 6,
        mode: 'human_duel',
        players: [],
        roomToken: 'dwr_room_1',
        roundDeadlineAt: null,
        status: 'finalized',
        wordLength: 5,
      },
      opponent: {
        attemptsUsed: 1,
        guesses: [
          {
            displayWord: 'arose',
            feedback: {
              isCorrect: false,
              states: ['absent', 'present', 'absent', 'absent', 'correct'],
              version: 'duelwords-feedback-v1',
              wordLength: 5,
            },
            roundNumber: 1,
            status: 'accepted',
            submittedAt: '2026-07-05T10:00:50.000Z',
          },
        ],
        safeDisplayName: 'Rival',
        side: 'b',
        solved: false,
      },
      own: {
        attemptsUsed: 2,
        guesses: [
          {
            displayWord: 'civic',
            feedback: {
              isCorrect: false,
              states: ['correct', 'correct', 'absent', 'absent', 'absent'],
              version: 'duelwords-feedback-v1',
              wordLength: 5,
            },
            roundNumber: 1,
            status: 'accepted',
            submittedAt: '2026-07-05T10:00:45.000Z',
          },
          {
            roundNumber: 2,
            status: 'timeout',
          },
        ],
        safeDisplayName: 'You',
        side: 'a',
        solved: false,
      },
      result: {
        finalizedAt: '2026-07-05T10:01:50.000Z',
        resultReason: 'solved_same_round_draw',
        targetDisplayWord: 'cigar',
        winnerSide: 'draw',
      },
      viewer: {
        outcome: 'draw',
        playerId: 'player-a',
        side: 'a',
      },
    });

    expect(payload).toMatchObject({
      gameLanguage: 'en',
      outcome: 'draw',
      resultReason: 'solved',
      targetDisplayWord: 'cigar',
      version: 'word-duel-local-result-v1',
    });
    expect(payload.own.rows).toEqual([
      {
        feedback: 'eeaaa',
        word: 'CIVIC',
      },
    ]);
    expect(payload.own.timedOut).toBe(true);
    expect(payload.opponent?.rows).toEqual([
      {
        feedback: 'apaae',
        word: 'AROSE',
      },
    ]);
  });
});
