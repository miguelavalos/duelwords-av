import { describe, expect, it } from 'vitest';

import {
  localWordDuelResultRepository,
  readLocalWordDuelResultRecord,
} from './local-result-repository';

describe('local word duel result repository', () => {
  it('reads local mock result records by result id', () => {
    const record = readLocalWordDuelResultRecord('local-human-win');

    expect(record?.resultId).toBe('local-human-win');
    expect(record?.storage).toBe('local_mock');
    expect(record?.mode).toBe('human_duel');
    expect(record?.localPayload.gameLanguage).toBe('en');
    expect(record?.localPayload.outcome).toBe('win');
    expect(record?.localPayload.targetDisplayWord).toBe('cider');
  });

  it('normalizes result ids and returns null for missing records', () => {
    expect(readLocalWordDuelResultRecord(' local-bot-loss ')?.resultId).toBe('local-bot-loss');
    expect(readLocalWordDuelResultRecord('missing-result')).toBeNull();
    expect(readLocalWordDuelResultRecord('')).toBeNull();
    expect(readLocalWordDuelResultRecord(undefined)).toBeNull();
  });

  it('exposes the local records through the result repository contract', () => {
    expect(localWordDuelResultRepository.readResult('local-human-win')?.resultId).toBe('local-human-win');
    expect(localWordDuelResultRepository.readResult('missing-result')).toBeNull();
  });
});
