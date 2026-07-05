import { describe, expect, it } from 'vitest';

import { wordDuelResultRepositories } from './result-repositories';
import { createWordDuelResultLocalPayload } from '../../game/word-duel-result/view-model';

describe('word duel result repository composition', () => {
  it('wires local result read and finalization repositories for the current app build', async () => {
    const persistedRecord = wordDuelResultRepositories.resultRepository.readResult('local-human-win');
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
    const finalizationHandoff = await Promise.resolve(
      wordDuelResultRepositories.finalizationRepository.finalizeResult({
        localPayload,
        mode: 'solo_practice',
      }),
    );

    expect(persistedRecord?.storage).toBe('local_mock');
    expect(persistedRecord?.resultId).toBe('local-human-win');
    expect(finalizationHandoff).toEqual({
      localResult: localPayload,
      storage: 'local_mock',
    });
  });
});
