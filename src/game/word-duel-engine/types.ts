export const WORD_DUEL_WORD_LENGTH = 5;
export const WORD_DUEL_MAX_ATTEMPTS = 6;

export type GameLanguage = 'en' | 'es';

export type LetterFeedback = 'exact' | 'present' | 'absent';

export type GameStatus = 'playing' | 'won' | 'lost';

export type GuessRejection =
  | 'not_enough_letters'
  | 'too_many_letters'
  | 'invalid_word'
  | 'game_over';

export type GuessRow = {
  input: string;
  normalizedWord: string;
  letters: string[];
  feedback: LetterFeedback[];
};

export type DictionaryProfile = {
  language: GameLanguage;
  validGuesses: readonly string[];
  targetWords: readonly string[];
};

export type LocalWordDuelState = {
  language: GameLanguage;
  targetWord: string;
  status: GameStatus;
  guesses: GuessRow[];
  maxAttempts: number;
  wordLength: number;
};

export type AcceptedGuessResult = {
  accepted: true;
  state: LocalWordDuelState;
  row: GuessRow;
};

export type RejectedGuessResult = {
  accepted: false;
  state: LocalWordDuelState;
  rejection: GuessRejection;
  normalizedWord: string;
};

export type ApplyGuessResult = AcceptedGuessResult | RejectedGuessResult;

export type LocalPracticeSummary = {
  status: GameStatus;
  language: GameLanguage;
  wordLength: number;
  maxAttempts: number;
  attemptsUsed: number;
  isLocalPracticeOnly: true;
};
