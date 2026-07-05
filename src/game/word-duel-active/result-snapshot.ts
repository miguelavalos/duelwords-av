import {
  normalizeGuess,
  scoreGuess,
  WORD_DUEL_MAX_ATTEMPTS,
  WORD_DUEL_WORD_LENGTH,
  type GameLanguage,
  type GuessRow,
  type LetterFeedback,
} from '../word-duel-engine';
import { createWordDuelResultLocalPayload, type WordDuelResultLocalPayload } from '../word-duel-result/view-model';
import type { ActiveDuelBoardRow, ActiveDuelViewModel } from './view-model';

const FINAL_TARGET_BY_LANGUAGE: Record<GameLanguage, string> = {
  en: 'cider',
  es: 'cinta',
};

const OPPONENT_RESULT_WORDS: Record<GameLanguage, readonly string[]> = {
  en: ['slate', 'pride', 'sound', 'cider'],
  es: ['perla', 'salto', 'brisa', 'cinta'],
};

export function createActiveDuelFinalResultLocalPayload(
  viewModel: ActiveDuelViewModel,
): WordDuelResultLocalPayload {
  const targetWord = FINAL_TARGET_BY_LANGUAGE[viewModel.gameLanguage];
  const targetNormalized = normalizeGuess(targetWord, viewModel.gameLanguage);
  const ownGuesses = createOwnFinalGuesses(viewModel, targetWord, targetNormalized);
  const ownSolved = ownGuesses.some((guess) => guess.normalizedWord === targetNormalized);
  const opponentGuesses = createOpponentFinalGuesses({
    gameLanguage: viewModel.gameLanguage,
    ownAttempts: ownGuesses.length,
    targetWord,
  });

  return createWordDuelResultLocalPayload({
    gameLanguage: viewModel.gameLanguage,
    opponent: {
      guesses: opponentGuesses,
      safeDisplayName: viewModel.opponent.safeDisplayName,
      side: viewModel.ownSide === 'a' ? 'b' : 'a',
      solved: opponentGuesses.some((guess) => guess.normalizedWord === targetNormalized),
    },
    outcome: 'win',
    own: {
      guesses: ownGuesses,
      side: viewModel.ownSide,
      solved: ownSolved,
    },
    resultReason: 'solved',
    targetDisplayWord: targetWord,
  });
}

function createOwnFinalGuesses(
  viewModel: ActiveDuelViewModel,
  targetWord: string,
  targetNormalized: string,
): GuessRow[] {
  const guesses = viewModel.ownBoardRows
    .map((row) => guessRowFromActiveRow(row, viewModel.gameLanguage, targetWord))
    .filter((guess): guess is GuessRow => Boolean(guess))
    .slice(0, WORD_DUEL_MAX_ATTEMPTS);

  if (guesses.some((guess) => guess.normalizedWord === targetNormalized)) {
    return guesses;
  }

  const targetGuess = guessRowFromWord(targetWord, viewModel.gameLanguage, targetWord);
  if (guesses.length < WORD_DUEL_MAX_ATTEMPTS) {
    return [...guesses, targetGuess];
  }

  return [...guesses.slice(0, WORD_DUEL_MAX_ATTEMPTS - 1), targetGuess];
}

function createOpponentFinalGuesses(input: {
  gameLanguage: GameLanguage;
  ownAttempts: number;
  targetWord: string;
}): GuessRow[] {
  const targetNormalized = normalizeGuess(input.targetWord, input.gameLanguage);
  const opponentAttemptCount = Math.min(WORD_DUEL_MAX_ATTEMPTS, input.ownAttempts + 1);
  const candidates = OPPONENT_RESULT_WORDS[input.gameLanguage].filter(
    (word) => normalizeGuess(word, input.gameLanguage) !== targetNormalized,
  );
  const guesses = candidates
    .slice(0, Math.max(0, opponentAttemptCount - 1))
    .map((word) => guessRowFromWord(word, input.gameLanguage, input.targetWord));

  if (opponentAttemptCount < WORD_DUEL_MAX_ATTEMPTS || input.ownAttempts < WORD_DUEL_MAX_ATTEMPTS) {
    guesses.push(guessRowFromWord(input.targetWord, input.gameLanguage, input.targetWord));
  }

  return guesses.slice(0, WORD_DUEL_MAX_ATTEMPTS);
}

function guessRowFromActiveRow(
  row: ActiveDuelBoardRow,
  gameLanguage: GameLanguage,
  targetWord: string,
): GuessRow | null {
  const letters = row.cells.map((cell) => cell.letter).filter((letter): letter is string => Boolean(letter));
  if (letters.length !== WORD_DUEL_WORD_LENGTH) {
    return null;
  }

  const normalizedWord = normalizeGuess(letters.join(''), gameLanguage);
  if (Array.from(normalizedWord).length !== WORD_DUEL_WORD_LENGTH) {
    return null;
  }

  const feedback = rowHasCompleteFeedback(row)
    ? row.cells.map((cell) => cell.feedback as LetterFeedback)
    : scoreGuess(normalizedWord, normalizeGuess(targetWord, gameLanguage));

  return {
    feedback,
    input: letters.join(''),
    letters: Array.from(normalizedWord),
    normalizedWord,
  };
}

function guessRowFromWord(word: string, gameLanguage: GameLanguage, targetWord: string): GuessRow {
  const normalizedWord = normalizeGuess(word, gameLanguage);

  return {
    feedback: scoreGuess(normalizedWord, normalizeGuess(targetWord, gameLanguage)),
    input: word,
    letters: Array.from(normalizedWord),
    normalizedWord,
  };
}

function rowHasCompleteFeedback(row: ActiveDuelBoardRow): boolean {
  return row.cells.every((cell) => Boolean(cell.letter) && Boolean(cell.feedback));
}
