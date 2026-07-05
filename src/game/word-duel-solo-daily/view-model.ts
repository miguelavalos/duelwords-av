import { getLocalDictionary, getPracticeTarget, type WordEntry } from '../dictionaries/local-fixtures';
import {
  applyGuess,
  createLocalGame,
  normalizeGuess,
  WORD_DUEL_MAX_ATTEMPTS,
  WORD_DUEL_WORD_LENGTH,
  type GameLanguage,
  type GuessRejection,
  type GuessRow,
  type LocalWordDuelState,
} from '../word-duel-engine';

export type WordDuelSoloDailyMode = 'solo_practice' | 'daily_preview';

export type WordDuelSoloDailySession = {
  mode: WordDuelSoloDailyMode;
  state: LocalWordDuelState;
  target: WordEntry;
  startedAtMs: number;
  finishedAtMs: number | null;
  dailyDate: string | null;
  timezone: string | null;
  isLocalPreviewOnly: true;
  official: false;
  dictionaryVersion: 'local-fixture-preview';
  ruleVersion: 'word-duel-v1';
};

export type WordDuelSoloDailyViewModel = {
  adSlot: {
    reserved: true;
    visible: boolean;
  };
  attemptsUsed: number;
  canRecordOfficialResult: false;
  dailyDate: string | null;
  gameLanguage: GameLanguage;
  isLocalPreviewOnly: true;
  maxAttempts: number;
  mode: WordDuelSoloDailyMode;
  modeLabel: string;
  official: false;
  safeSharePreview: WordDuelSoloDailySharePreview | null;
  status: LocalWordDuelState['status'];
  targetReveal: {
    displayWord: string | null;
    visible: boolean;
  };
  timezone: string | null;
  wordLength: number;
};

export type WordDuelSoloDailySharePreview = {
  ctaLabel: 'Challenge me';
  text: string;
};

export type WordDuelSoloDailyGuessResult =
  | {
      accepted: true;
      row: GuessRow;
      session: WordDuelSoloDailySession;
    }
  | {
      accepted: false;
      normalizedWord: string;
      rejection: GuessRejection;
      session: WordDuelSoloDailySession;
    };

export function createSoloDailySession({
  dailyDate,
  gameLanguage = 'en',
  mode,
  nowMs,
  seed = 0,
  timezone,
}: {
  dailyDate?: string;
  gameLanguage?: GameLanguage;
  mode: WordDuelSoloDailyMode;
  nowMs: number;
  seed?: number;
  timezone?: string;
}): WordDuelSoloDailySession {
  const resolvedDailyDate = mode === 'daily_preview' ? dailyDate ?? createLocalDateKey(nowMs) : null;
  const resolvedTimezone = mode === 'daily_preview' ? timezone ?? 'local' : null;
  const targetSeed =
    mode === 'daily_preview'
      ? stableHash(`${resolvedDailyDate}:${resolvedTimezone}:${gameLanguage}:${WORD_DUEL_WORD_LENGTH}`)
      : seed;
  const target = getPracticeTarget(gameLanguage, targetSeed);
  const state = createLocalGame({
    dictionary: getLocalDictionary(gameLanguage),
    language: gameLanguage,
    target: target.displayWord,
  });

  return {
    mode,
    state,
    target,
    startedAtMs: nowMs,
    finishedAtMs: null,
    dailyDate: resolvedDailyDate,
    timezone: resolvedTimezone,
    isLocalPreviewOnly: true,
    official: false,
    dictionaryVersion: 'local-fixture-preview',
    ruleVersion: 'word-duel-v1',
  };
}

export function applySoloDailyGuess({
  input,
  nowMs,
  session,
}: {
  input: string;
  nowMs: number;
  session: WordDuelSoloDailySession;
}): WordDuelSoloDailyGuessResult {
  const result = applyGuess(session.state, input, getLocalDictionary(session.state.language));

  if (!result.accepted) {
    return {
      accepted: false,
      normalizedWord: result.normalizedWord,
      rejection: result.rejection,
      session,
    };
  }

  const nextSession: WordDuelSoloDailySession = {
    ...session,
    state: result.state,
    finishedAtMs: result.state.status === 'playing' ? null : nowMs,
  };

  return {
    accepted: true,
    row: result.row,
    session: nextSession,
  };
}

export function createSoloDailyViewModel(
  session: WordDuelSoloDailySession,
): WordDuelSoloDailyViewModel {
  const isFinal = session.state.status !== 'playing';

  return {
    adSlot: {
      reserved: true,
      visible: isFinal,
    },
    attemptsUsed: session.state.guesses.length,
    canRecordOfficialResult: false,
    dailyDate: session.dailyDate,
    gameLanguage: session.state.language,
    isLocalPreviewOnly: true,
    maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
    mode: session.mode,
    modeLabel: modeLabel(session.mode),
    official: false,
    safeSharePreview: isFinal ? createSafeSoloDailySharePreview(session) : null,
    status: session.state.status,
    targetReveal: {
      displayWord: isFinal ? session.target.displayWord.toUpperCase() : null,
      visible: isFinal,
    },
    timezone: session.timezone,
    wordLength: WORD_DUEL_WORD_LENGTH,
  };
}

export function createSafeSoloDailySharePreview(
  session: WordDuelSoloDailySession,
): WordDuelSoloDailySharePreview {
  const languageLabel = session.state.language === 'es' ? 'Spanish' : 'English';
  const attempts =
    session.state.status === 'won'
      ? `${session.state.guesses.length}/${WORD_DUEL_MAX_ATTEMPTS}`
      : `X/${WORD_DUEL_MAX_ATTEMPTS}`;
  const mode = modeLabel(session.mode);

  return {
    ctaLabel: 'Challenge me',
    text: `DuelWords AV - Word Duel\n${mode} - ${languageLabel} - ${attempts}\nChallenge me: <link>`,
  };
}

export function createLocalDateKey(nowMs: number): string {
  const date = new Date(nowMs);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function normalizeSoloDailyInput(input: string, language: GameLanguage): string {
  return normalizeGuess(input, language);
}

function modeLabel(mode: WordDuelSoloDailyMode): string {
  return mode === 'daily_preview' ? 'Daily preview' : 'Solo practice';
}

function stableHash(value: string): number {
  return Array.from(value).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 17);
}
