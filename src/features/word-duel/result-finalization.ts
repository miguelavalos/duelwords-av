import { createWordDuelResultLocalPayload } from '../../game/word-duel-result/view-model';
import { createActiveDuelFinalResultLocalPayload } from '../../game/word-duel-active/result-snapshot';
import type { ActiveDuelViewModel } from '../../game/word-duel-active/view-model';
import {
  recordDuelWordsResultFinalizationError,
} from '../../diagnostics/runtime';
import type {
  DuelWordsDiagnosticsEvent,
  DuelWordsDiagnosticsRouteGroup,
} from '../../diagnostics/sentry-facade';
import {
  type WordDuelResultFinalizationHandoff,
  type WordDuelResultFinalizationRepository,
} from '../../game/word-duel-result/result-finalization-repository';
import type { WordDuelResultMode } from '../../game/word-duel-result/result-repository';
import { wordDuelResultRepositories } from './result-repositories';

type WordDuelResultFinalizationInput = Parameters<typeof createWordDuelResultLocalPayload>[0];

export type { WordDuelResultFinalizationHandoff };

export function finalizeWordDuelResult(
  input: WordDuelResultFinalizationInput,
  options: {
    finalizationRepository?: WordDuelResultFinalizationRepository;
    mode: WordDuelResultMode;
  },
): Promise<WordDuelResultFinalizationHandoff> {
  const finalizationRepository = options.finalizationRepository ?? wordDuelResultRepositories.finalizationRepository;
  const localPayload = createWordDuelResultLocalPayload(input);

  return Promise.resolve(finalizationRepository.finalizeResult({
    localPayload,
    mode: options.mode,
  }));
}

export function finalizeActiveWordDuelResult(
  viewModel: ActiveDuelViewModel,
  options: {
    finalizationRepository?: WordDuelResultFinalizationRepository;
    mode: WordDuelResultMode;
  },
): Promise<WordDuelResultFinalizationHandoff> {
  const finalizationRepository = options.finalizationRepository ?? wordDuelResultRepositories.finalizationRepository;
  const localPayload = createActiveDuelFinalResultLocalPayload(viewModel);

  return Promise.resolve(finalizationRepository.finalizeResult({
    localPayload,
    mode: options.mode,
  }));
}

export function reportWordDuelResultFinalizationError(input: {
  error: unknown;
  gameLanguage: string;
  mode: WordDuelResultMode;
  routeGroup: DuelWordsDiagnosticsRouteGroup;
}): DuelWordsDiagnosticsEvent {
  return recordDuelWordsResultFinalizationError({
    error: input.error,
    gameLanguage: input.gameLanguage,
    mode: diagnosticsModeFromWordDuelMode(input.mode),
    routeGroup: input.routeGroup,
  });
}

function diagnosticsModeFromWordDuelMode(mode: WordDuelResultMode) {
  if (mode === 'bot_duel' || mode === 'human_duel') {
    return mode;
  }

  if (mode === 'daily_preview') {
    return 'daily';
  }

  return 'solo';
}
