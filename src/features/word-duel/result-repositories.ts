import { localWordDuelResultRepository } from '../../game/word-duel-result/local-result-repository';
import {
  localWordDuelResultFinalizationRepository,
  type WordDuelResultFinalizationRepository,
} from '../../game/word-duel-result/result-finalization-repository';
import type { WordDuelResultRepository } from '../../game/word-duel-result/result-repository';

export type WordDuelResultRepositories = {
  finalizationRepository: WordDuelResultFinalizationRepository;
  resultRepository: WordDuelResultRepository;
};

export const wordDuelResultRepositories: WordDuelResultRepositories = {
  finalizationRepository: localWordDuelResultFinalizationRepository,
  resultRepository: localWordDuelResultRepository,
};
