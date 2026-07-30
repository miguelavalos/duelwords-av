export { applyGuess, createLocalGame, createLocalPracticeSummary, isValidGuess, scoreGuess } from './engine';
export { isAllowedLetter, normalizeGuess } from './normalize';
export type {
  ApplyGuessResult,
  DictionaryProfile,
  GameLanguage,
  GameStatus,
  GuessRejection,
  GuessRow,
  LetterFeedback,
  LocalPracticeSummary,
  LocalWordDuelState,
} from './types';
export { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH, WORD_DUEL_WORD_LENGTHS } from './types';
export type { DuelWordLength } from './types';
