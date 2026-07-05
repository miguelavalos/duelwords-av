import { normalizeGuess } from './normalize';
import type {
  ApplyGuessResult,
  DictionaryProfile,
  GameLanguage,
  GuessRow,
  LetterFeedback,
  LocalPracticeSummary,
  LocalWordDuelState,
} from './types';
import { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH } from './types';

export function createLocalGame({
  dictionary,
  language,
  target,
}: {
  dictionary: DictionaryProfile;
  language: GameLanguage;
  target: string;
}): LocalWordDuelState {
  const normalizedTarget = normalizeGuess(target, language);

  if (!dictionary.targetWords.includes(normalizedTarget)) {
    throw new Error(`Target word is not in the ${language} local target fixture.`);
  }

  return {
    language,
    targetWord: normalizedTarget,
    status: 'playing',
    guesses: [],
    maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
    wordLength: WORD_DUEL_WORD_LENGTH,
  };
}

export function applyGuess(
  state: LocalWordDuelState,
  input: string,
  dictionary: DictionaryProfile,
): ApplyGuessResult {
  const normalizedWord = normalizeGuess(input, state.language);

  if (state.status !== 'playing') {
    return { accepted: false, state, rejection: 'game_over', normalizedWord };
  }

  if (Array.from(normalizedWord).length < state.wordLength) {
    return { accepted: false, state, rejection: 'not_enough_letters', normalizedWord };
  }

  if (Array.from(normalizedWord).length > state.wordLength) {
    return { accepted: false, state, rejection: 'too_many_letters', normalizedWord };
  }

  if (!isValidGuess(normalizedWord, dictionary)) {
    return { accepted: false, state, rejection: 'invalid_word', normalizedWord };
  }

  const feedback = scoreGuess(normalizedWord, state.targetWord);
  const row: GuessRow = {
    input,
    normalizedWord,
    letters: Array.from(normalizedWord),
    feedback,
  };
  const guesses = [...state.guesses, row];
  const didWin = normalizedWord === state.targetWord;
  const didLose = !didWin && guesses.length >= state.maxAttempts;

  return {
    accepted: true,
    row,
    state: {
      ...state,
      guesses,
      status: didWin ? 'won' : didLose ? 'lost' : 'playing',
    },
  };
}

export function isValidGuess(normalizedWord: string, dictionary: DictionaryProfile): boolean {
  return dictionary.validGuesses.includes(normalizedWord);
}

export function scoreGuess(guess: string, target: string): LetterFeedback[] {
  const guessLetters = Array.from(guess);
  const targetLetters = Array.from(target);
  const feedback: LetterFeedback[] = Array.from({ length: guessLetters.length }, () => 'absent');
  const remainingTargetCounts = new Map<string, number>();

  for (let index = 0; index < targetLetters.length; index += 1) {
    if (guessLetters[index] === targetLetters[index]) {
      feedback[index] = 'exact';
    } else {
      const targetLetter = targetLetters[index];
      remainingTargetCounts.set(targetLetter, (remainingTargetCounts.get(targetLetter) ?? 0) + 1);
    }
  }

  for (let index = 0; index < guessLetters.length; index += 1) {
    if (feedback[index] === 'exact') {
      continue;
    }

    const guessLetter = guessLetters[index];
    const remaining = remainingTargetCounts.get(guessLetter) ?? 0;
    if (remaining > 0) {
      feedback[index] = 'present';
      remainingTargetCounts.set(guessLetter, remaining - 1);
    }
  }

  return feedback;
}

export function createLocalPracticeSummary(state: LocalWordDuelState): LocalPracticeSummary {
  return {
    status: state.status,
    language: state.language,
    wordLength: state.wordLength,
    maxAttempts: state.maxAttempts,
    attemptsUsed: state.guesses.length,
    isLocalPracticeOnly: true,
  };
}
