import { describe, expect, it } from 'vitest';

import {
  readDuelWordsActivity,
  recordDuelWordsActivity,
  type DuelWordsActivityStorage,
} from './device-activity-store';

function memoryStorage(): DuelWordsActivityStorage & { value(): string } {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    value: () => values.get('duelwords-av:activity:v1') ?? '',
  };
}

describe('device activity store', () => {
  it('persists only a spoiler-safe completed summary', () => {
    const storage = memoryStorage();

    expect(recordDuelWordsActivity({
      attemptsUsed: 4,
      completedAt: '2026-07-27T10:00:00.000Z',
      language: 'es',
      mode: 'human_duel',
      opponentDisplayName: '  Rival   AV  ',
      outcome: 'win',
    }, storage)).toBe(true);

    expect(readDuelWordsActivity(storage)).toEqual([{
      attemptsUsed: 4,
      completedAt: '2026-07-27T10:00:00.000Z',
      language: 'es',
      mode: 'human_duel',
      opponentDisplayName: 'Rival AV',
      outcome: 'win',
      version: 1,
    }]);
    expect(storage.value()).not.toMatch(/target|guess|feedback|gameId|playerId|token|email|subject/i);
  });

  it('drops malformed records and keeps only the newest 1,000 summaries', () => {
    const storage = memoryStorage();
    for (let index = 0; index < 1_005; index += 1) {
      recordDuelWordsActivity({
        attemptsUsed: index % 6,
        completedAt: new Date(Date.UTC(2026, 6, 27, 0, index)).toISOString(),
        language: 'en',
        mode: 'practice',
        outcome: 'win',
      }, storage);
    }

    const records = readDuelWordsActivity(storage);
    expect(records).toHaveLength(1_000);
    expect(records[0]?.completedAt).toBe('2026-07-27T16:44:00.000Z');

    storage.setItem('duelwords-av:activity:v1', JSON.stringify({
      records: [{ targetWord: 'CIDER', version: 1 }],
      version: 1,
    }));
    expect(readDuelWordsActivity(storage)).toEqual([]);
  });

  it('never lets unavailable device storage interrupt a completed game', () => {
    expect(recordDuelWordsActivity({
      attemptsUsed: 6,
      language: 'fr',
      mode: 'practice',
      outcome: 'no_winner',
    }, {
      getItem: () => null,
      setItem: () => { throw new Error('storage unavailable'); },
    })).toBe(false);
  });
});
