import { describe, expect, it } from 'vitest';

import {
  createLocalWordDuelResultFinalizationRepository,
  localWordDuelResultFinalizationRepository,
} from './result-finalization-repository';
import { readDuelWordsActivity, type DuelWordsActivityStorage } from '../activity/device-activity-store';
import { createWordDuelResultLocalPayload } from './view-model';

describe('word duel result finalization repository contract', () => {
  it('returns local payload handoffs for the local implementation', async () => {
    const localPayload = createWordDuelResultLocalPayload({
      gameLanguage: 'en',
      outcome: 'win',
      own: {
        guesses: [],
        solved: false,
      },
      resultReason: 'attempts_exhausted',
      targetDisplayWord: 'cider',
    });

    const handoff = await Promise.resolve(localWordDuelResultFinalizationRepository.finalizeResult({
      localPayload,
      mode: 'solo_practice',
    }));

    expect(handoff).toEqual({
      localResult: localPayload,
      storage: 'local_mock',
    });
  });

  it('records a minimal device summary without persisting result words or rows', async () => {
    const values = new Map<string, string>();
    const storage: DuelWordsActivityStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };
    const localPayload = createWordDuelResultLocalPayload({
      gameLanguage: 'ca',
      opponent: {
        guesses: [],
        safeDisplayName: 'Rival segur',
        solved: false,
      },
      outcome: 'win',
      own: {
        guesses: [],
        solved: true,
      },
      resultReason: 'solved',
      targetDisplayWord: 'cinta',
    });

    await Promise.resolve(createLocalWordDuelResultFinalizationRepository(storage).finalizeResult({
      localPayload,
      mode: 'human_duel',
    }));

    expect(readDuelWordsActivity(storage)).toMatchObject([{
      attemptsUsed: 0,
      language: 'ca',
      mode: 'human_duel',
      opponentDisplayName: 'Rival segur',
      outcome: 'win',
    }]);
    const persisted = values.get('duelwords-av:activity:v1') ?? '';
    expect(persisted).not.toMatch(/cinta|target|rows|feedback/i);
  });
});
