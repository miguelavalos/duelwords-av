import type { WordDuelResultMode, WordDuelResultStorage } from './result-repository';
import type { WordDuelResultLocalPayload } from './view-model';

export type WordDuelResultFinalizationInput = {
  localPayload: WordDuelResultLocalPayload;
  mode: WordDuelResultMode;
};

export type WordDuelResultFinalizationHandoff = {
  localResult?: WordDuelResultLocalPayload;
  resultId?: string;
  storage: WordDuelResultStorage;
};

export type WordDuelResultFinalizationRepository = {
  finalizeResult(
    input: WordDuelResultFinalizationInput,
  ): Promise<WordDuelResultFinalizationHandoff> | WordDuelResultFinalizationHandoff;
};

export const localWordDuelResultFinalizationRepository: WordDuelResultFinalizationRepository = {
  finalizeResult: (input) => ({
    localResult: input.localPayload,
    storage: 'local_mock',
  }),
};
