import type { GuessRow, LetterFeedback, LocalWordDuelState } from '../../../game/word-duel-engine';
import { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH } from '../../../game/word-duel-engine';

import type { WordDuelBoardRow, WordDuelBoardRowState } from './word-duel-board';

export function createRowsFromLocalWordDuelState(
  state: LocalWordDuelState,
  input: string,
): WordDuelBoardRow[] {
  const scoredRows: WordDuelBoardRow[] = state.guesses.map((guess) => rowFromGuess(guess, 'scored'));
  const currentRow: WordDuelBoardRow[] =
    state.status === 'playing'
      ? [rowFromLetters(Array.from(input), 'current')]
      : [];
  const emptyRows = createEmptyRows(WORD_DUEL_MAX_ATTEMPTS - scoredRows.length - currentRow.length);

  return [...scoredRows, ...currentRow, ...emptyRows];
}

export function createKeyboardFeedbackFromGuesses(guesses: readonly GuessRow[]): Map<string, LetterFeedback> {
  const feedbackByKey = new Map<string, LetterFeedback>();

  for (const guess of guesses) {
    guess.letters.forEach((letter, index) => {
      const current = feedbackByKey.get(letter);
      const next = guess.feedback[index];
      if (!current || feedbackRank(next) > feedbackRank(current)) {
        feedbackByKey.set(letter, next);
      }
    });
  }

  return feedbackByKey;
}

export function rowsFromGuessRows(
  guesses: readonly GuessRow[],
  state: WordDuelBoardRowState,
): WordDuelBoardRow[] {
  return guesses.map((guess) => rowFromGuess(guess, state));
}

export function rowFromGuess(guess: GuessRow, state: WordDuelBoardRowState): WordDuelBoardRow {
  return {
    state,
    cells: Array.from({ length: WORD_DUEL_WORD_LENGTH }, (_, index) => ({
      feedback: guess.feedback[index] ?? null,
      letter: guess.letters[index]?.toUpperCase() ?? null,
    })),
  };
}

export function rowFromLetters(
  letters: readonly string[],
  state: WordDuelBoardRowState,
): WordDuelBoardRow {
  return {
    state,
    cells: Array.from({ length: WORD_DUEL_WORD_LENGTH }, (_, index) => ({
      feedback: null,
      letter: letters[index]?.toUpperCase() ?? null,
    })),
  };
}

export function createEmptyRows(count: number): WordDuelBoardRow[] {
  return Array.from({ length: Math.max(0, count) }, () => rowFromLetters([], 'empty'));
}

export function fillEditingRow(
  rows: readonly WordDuelBoardRow[],
  input: string,
): WordDuelBoardRow[] {
  const letters = Array.from(input);

  return rows.map((row) => {
    if (row.state !== 'editing' && row.state !== 'current') {
      return row;
    }

    return {
      ...row,
      cells: row.cells.map((cell, index) => ({
        ...cell,
        letter: letters[index]?.toUpperCase() ?? null,
      })),
    };
  });
}

function feedbackRank(feedback: LetterFeedback): number {
  if (feedback === 'exact') {
    return 3;
  }
  if (feedback === 'present') {
    return 2;
  }
  return 1;
}
