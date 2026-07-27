import type { GameLanguage } from '../word-duel-engine';
import type {
  WordDuelResultMode,
  WordDuelResultRepository,
  WordDuelResultStorage,
} from './result-repository';
import {
  createDemoWordDuelResultViewModel,
  createWordDuelResultViewModelFromLocalPayload,
  type WordDuelResultLocalPayload,
  type WordDuelResultOutcome,
  type WordDuelResultReason,
  type WordDuelResultViewModel,
} from './view-model';

export type { WordDuelResultMode } from './result-repository';

export type WordDuelResultSource =
  | {
      kind: 'local_payload';
      localPayload: WordDuelResultLocalPayload;
      mode: WordDuelResultMode;
      viewModel: WordDuelResultViewModel;
    }
  | {
      kind: 'persisted_result';
      mode: WordDuelResultMode;
      resultId: string;
      storage: WordDuelResultStorage;
      viewModel: WordDuelResultViewModel;
    }
  | {
      gameLanguage: GameLanguage;
      kind: 'route_demo';
      mode: WordDuelResultMode;
      outcome: WordDuelResultOutcome;
      resultReason: WordDuelResultReason;
      viewModel: WordDuelResultViewModel;
    };

export function createWordDuelResultSource(input: {
  gameLanguage: GameLanguage;
  localPayload?: WordDuelResultLocalPayload | null;
  mode: WordDuelResultMode;
  outcome: WordDuelResultOutcome;
  resultId?: string | null;
  resultRepository?: WordDuelResultRepository;
  resultReason: WordDuelResultReason;
}): WordDuelResultSource {
  const persistedResult = resolvePersistedResult(input.resultId, input.resultRepository);
  if (persistedResult) {
    return persistedResult;
  }

  if (input.localPayload) {
    return {
      kind: 'local_payload',
      localPayload: input.localPayload,
      mode: input.mode,
      viewModel: createWordDuelResultViewModelFromLocalPayload(input.localPayload),
    };
  }

  return {
    gameLanguage: input.gameLanguage,
    kind: 'route_demo',
    mode: input.mode,
    outcome: input.outcome,
    resultReason: input.resultReason,
    viewModel: createDemoWordDuelResultViewModel({
      gameLanguage: input.gameLanguage,
      outcome: input.outcome,
      resultReason: input.resultReason,
    }),
  };
}

export function createDefaultWordDuelResultSource(): WordDuelResultSource {
  return createWordDuelResultSource({
    gameLanguage: 'en',
    mode: 'human_duel',
    outcome: 'win',
    resultReason: 'solved',
  });
}

function resolvePersistedResult(
  resultId: string | null | undefined,
  resultRepository: WordDuelResultRepository | undefined,
): WordDuelResultSource | null {
  const record = resultRepository?.readResult(resultId) ?? null;
  if (!record) {
    return null;
  }

  return {
    kind: 'persisted_result',
    mode: record.mode,
    resultId: record.resultId,
    storage: record.storage,
    viewModel: createWordDuelResultViewModelFromLocalPayload(record.localPayload),
  };
}
