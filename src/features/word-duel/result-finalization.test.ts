import { describe, expect, it } from 'vitest';

import {
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
});
