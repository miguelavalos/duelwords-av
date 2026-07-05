import { describe, expect, it } from 'vitest';

import {
  localWordDuelResultFinalizationRepository,
} from './result-finalization-repository';
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
});
