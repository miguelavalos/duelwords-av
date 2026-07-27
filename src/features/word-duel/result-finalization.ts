import type { GuessRow, LetterFeedback } from '../../game/word-duel-engine/types';
import { normalizeGuess } from '../../game/word-duel-engine/normalize';
import {
  createWordDuelResultLocalPayload,
  type WordDuelResultLocalPayload,
  type WordDuelResultReason,
} from '../../game/word-duel-result/view-model';
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
import type {
  DuelWordsApiFeedbackState,
  DuelWordsApiFinalResult,
  DuelWordsApiFinalResultParticipant,
} from '../../game/word-duel-lobby/api-client';
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

export function createWordDuelResultLocalPayloadFromApiFinalResult(
  finalResult: DuelWordsApiFinalResult,
): WordDuelResultLocalPayload {
  return createWordDuelResultLocalPayload({
    gameLanguage: finalResult.game.language,
    matchStarted: true,
    maxAttempts: finalResult.game.maxAttempts,
    opponent: participantInputFromApiFinalResult(finalResult.opponent, finalResult),
    outcome: finalResult.viewer.outcome,
    own: participantInputFromApiFinalResult(finalResult.own, finalResult),
    resultReason: resultReasonFromApi(finalResult.result.resultReason),
    targetDisplayWord: finalResult.result.targetDisplayWord,
    wordLength: finalResult.game.wordLength,
  });
}

export function finalizeApiWordDuelResult(
  finalResult: DuelWordsApiFinalResult,
  options: {
    finalizationRepository?: WordDuelResultFinalizationRepository;
  } = {},
): Promise<WordDuelResultFinalizationHandoff> {
  const finalizationRepository = options.finalizationRepository ?? wordDuelResultRepositories.finalizationRepository;
  return Promise.resolve(finalizationRepository.finalizeResult({
    localPayload: createWordDuelResultLocalPayloadFromApiFinalResult(finalResult),
    mode: 'human_duel',
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

function participantInputFromApiFinalResult(
  participant: DuelWordsApiFinalResultParticipant,
  finalResult: DuelWordsApiFinalResult,
) {
  const guesses: GuessRow[] = [];
  for (const guess of participant.guesses) {
    if (guess.status !== 'accepted') continue;

    const normalizedWord = normalizeGuess(guess.displayWord, finalResult.game.language);
    guesses.push({
      feedback: guess.feedback.states.map(feedbackFromApi),
      input: guess.displayWord,
      letters: Array.from(normalizedWord),
      normalizedWord,
    });
  }

  return {
    guesses,
    safeDisplayName: participant.safeDisplayName,
    side: participant.side,
    solved: participant.solved,
    timedOut: participant.guesses.some((guess) => guess.status === 'timeout'),
  };
}

function feedbackFromApi(feedback: DuelWordsApiFeedbackState): LetterFeedback {
  if (feedback === 'correct') {
    return 'exact';
  }
  return feedback;
}

function resultReasonFromApi(reason: string): WordDuelResultReason {
  if (
    reason === 'abandoned_after_start'
    || reason === 'abandoned_inactive'
    || reason === 'abandoned_no_winner'
    || reason === 'attempts_exhausted'
    || reason === 'cancelled_before_first_round'
    || reason === 'round_timeout'
    || reason === 'solved'
    || reason === 'technical_result'
  ) {
    return reason;
  }

  if (reason === 'solved_same_round_draw' || reason === 'solved_same_round_fastest') {
    return 'solved';
  }

  return 'technical_result';
}
