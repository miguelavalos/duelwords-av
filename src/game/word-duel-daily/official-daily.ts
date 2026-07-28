import { getLocalDictionary } from '../dictionaries/local-fixtures';
import { applyGuess } from '../word-duel-engine/engine';
import { normalizeGuess } from '../word-duel-engine/normalize';
import {
  WORD_DUEL_MAX_ATTEMPTS,
  WORD_DUEL_WORD_LENGTH,
  type GameLanguage,
  type GuessRejection,
  type GuessRow,
  type LocalWordDuelState,
} from '../word-duel-engine/types';
import type {
  DuelWordsApiClient,
  DuelWordsApiDailyTarget,
} from '../word-duel-lobby/api-client';
import type { DuelWordsActorIdentity } from '../word-duel-active/api-adapter';
import { recordDuelWordsActivity } from '../activity/device-activity-store';

const STORAGE_KEY = 'duelwords-av:official-daily:v1';
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const validWordsByLanguage = new Map<GameLanguage, ReadonlySet<string>>();

export type OfficialDailyStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type OfficialDailySession = {
  dailyDate: string;
  dictionaryVersion: string;
  finishedAt: string | null;
  language: GameLanguage;
  policyVersion: 'duelwords-daily-v1';
  ruleVersion: 'duelwords-feedback-v1';
  startedAt: string;
  state: LocalWordDuelState;
  targetDisplayWord: string;
  timeZone: string;
  version: 1;
};

export type OfficialDailyStats = {
  bestAttempts: number | null;
  completed: number;
  currentStreak: number;
  failed: number;
  lastCompletedDate: string | null;
  solved: number;
};

type OfficialDailyStore = {
  sessions: Record<string, OfficialDailySession>;
  stats: Partial<Record<GameLanguage, OfficialDailyStats>>;
  version: 1;
};

export type OfficialDailyGuessResult =
  | { accepted: true; row: GuessRow; session: OfficialDailySession }
  | { accepted: false; normalizedWord: string; rejection: GuessRejection; session: OfficialDailySession };

type DailyTargetApi = Pick<DuelWordsApiClient, 'getDailyTarget'>;

export type OfficialDailyLoadResult = {
  session: OfficialDailySession;
  source: 'cache' | 'network';
};

export class OfficialDailyError extends Error {
  constructor(readonly code: 'daily_date_mismatch' | 'invalid_target' | 'invalid_target_metadata') {
    super(code);
    this.name = 'OfficialDailyError';
  }
}

export class OfficialDailyLoader {
  private readonly inFlight = new Map<string, Promise<OfficialDailyLoadResult>>();

  constructor(
    private readonly api: DailyTargetApi,
    private readonly storage: OfficialDailyStorage | null = deviceStorage(),
  ) {}

  load(input: {
    actor: DuelWordsActorIdentity;
    language: GameLanguage;
    now?: Date;
    signal?: AbortSignal;
    timeZone: string;
  }): Promise<OfficialDailyLoadResult> {
    const now = input.now ?? new Date();
    const dailyDate = localDateForTimeZone(now, input.timeZone);
    const cached = readOfficialDailySession({
      dailyDate,
      language: input.language,
      storage: this.storage,
      timeZone: input.timeZone,
    });
    if (cached) {
      return Promise.resolve({ session: cached, source: 'cache' });
    }

    const key = `${sessionKey(dailyDate, input.timeZone, input.language)}|${dailyActorKey(input.actor)}`;
    const pending = this.inFlight.get(key);
    if (pending) {
      return pending;
    }

    const request = this.fetchAndPersist({ ...input, dailyDate, now })
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, request);
    return request;
  }

  private async fetchAndPersist(input: {
    actor: DuelWordsActorIdentity;
    dailyDate: string;
    language: GameLanguage;
    now: Date;
    signal?: AbortSignal;
    timeZone: string;
  }): Promise<OfficialDailyLoadResult> {
    const target = await this.api.getDailyTarget({
      actor: input.actor,
      language: input.language,
      signal: input.signal,
      timeZone: input.timeZone,
    });
    if (target.language !== input.language || target.timeZone !== input.timeZone) {
      throw new OfficialDailyError('invalid_target_metadata');
    }
    const session = createOfficialDailySession(target, input.dailyDate, input.now);
    persistOfficialDailySession(session, this.storage);
    return { session, source: 'network' };
  }
}

function dailyActorKey(actor: DuelWordsActorIdentity): string {
  return actor.actorType === 'account_user' ? 'account' : actor.guestSessionId;
}

export function createOfficialDailySession(
  target: DuelWordsApiDailyTarget,
  expectedDailyDate: string,
  now: Date,
): OfficialDailySession {
  if (target.dailyDate !== expectedDailyDate) {
    throw new OfficialDailyError('daily_date_mismatch');
  }
  if (
    target.wordLength !== WORD_DUEL_WORD_LENGTH
    || target.policyVersion !== 'duelwords-daily-v1'
    || target.ruleVersion !== 'duelwords-feedback-v1'
  ) {
    throw new OfficialDailyError('invalid_target_metadata');
  }

  const normalizedTarget = normalizeGuess(target.targetWord, target.language);
  if (
    Array.from(normalizedTarget).length !== WORD_DUEL_WORD_LENGTH
    || !validWords(target.language).has(normalizedTarget)
  ) {
    throw new OfficialDailyError('invalid_target');
  }

  return {
    dailyDate: target.dailyDate,
    dictionaryVersion: target.dictionaryVersion,
    finishedAt: null,
    language: target.language,
    policyVersion: target.policyVersion,
    ruleVersion: target.ruleVersion,
    startedAt: now.toISOString(),
    state: {
      guesses: [],
      language: target.language,
      maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
      status: 'playing',
      targetWord: normalizedTarget,
      wordLength: WORD_DUEL_WORD_LENGTH,
    },
    targetDisplayWord: target.targetWord,
    timeZone: target.timeZone,
    version: 1,
  };
}

export function readOfficialDailySession(input: {
  dailyDate: string;
  language: GameLanguage;
  storage?: OfficialDailyStorage | null;
  timeZone: string;
}): OfficialDailySession | null {
  const store = readStore(input.storage === undefined ? deviceStorage() : input.storage);
  return store.sessions[sessionKey(input.dailyDate, input.timeZone, input.language)] ?? null;
}

export function readOfficialDailySessionsForDate(input: {
  dailyDate: string;
  storage?: OfficialDailyStorage | null;
  timeZone: string;
}): readonly OfficialDailySession[] {
  const store = readStore(input.storage === undefined ? deviceStorage() : input.storage);
  return Object.values(store.sessions)
    .filter((session) => session.dailyDate === input.dailyDate && session.timeZone === input.timeZone)
    .sort((left, right) => Date.parse(left.startedAt) - Date.parse(right.startedAt));
}

export function persistOfficialDailySession(
  session: OfficialDailySession,
  storage: OfficialDailyStorage | null = deviceStorage(),
): boolean {
  if (!storage) return false;
  const store = readStore(storage);
  store.sessions[sessionKey(session.dailyDate, session.timeZone, session.language)] = session;
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
  return true;
}

export function applyOfficialDailyGuess(input: {
  input: string;
  now: Date;
  session: OfficialDailySession;
  storage?: OfficialDailyStorage | null;
}): OfficialDailyGuessResult {
  const result = applyGuess(
    input.session.state,
    input.input,
    getLocalDictionary(input.session.language),
  );
  if (!result.accepted) {
    return {
      accepted: false,
      normalizedWord: result.normalizedWord,
      rejection: result.rejection,
      session: input.session,
    };
  }

  const next: OfficialDailySession = {
    ...input.session,
    finishedAt: result.state.status === 'playing' ? null : input.now.toISOString(),
    state: result.state,
  };
  persistOfficialDailyProgress(
    input.session,
    next,
    input.storage === undefined ? deviceStorage() : input.storage,
  );
  return { accepted: true, row: result.row, session: next };
}

export function readOfficialDailyStats(
  language: GameLanguage,
  storage: OfficialDailyStorage | null = deviceStorage(),
): OfficialDailyStats {
  return readStore(storage).stats[language] ?? emptyStats();
}

export function createSafeOfficialDailyShare(session: OfficialDailySession): string {
  const attempts = session.state.status === 'won'
    ? `${session.state.guesses.length}/${WORD_DUEL_MAX_ATTEMPTS}`
    : `X/${WORD_DUEL_MAX_ATTEMPTS}`;
  return `DuelWords AV · Daily · ${session.language.toUpperCase()} · ${attempts} · ${session.dailyDate}`;
}

export function localDateForTimeZone(now: Date, timeZone: string): string {
  let formatter = dateFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      month: '2-digit',
      timeZone,
      year: 'numeric',
    });
    dateFormatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function readStore(storage: OfficialDailyStorage | null): OfficialDailyStore {
  if (!storage) return emptyStore();
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as Partial<OfficialDailyStore> | null;
    if (parsed?.version !== 1 || !parsed.sessions || typeof parsed.sessions !== 'object') {
      return emptyStore();
    }

    const sessions = Object.fromEntries(
      Object.entries(parsed.sessions).filter((entry): entry is [string, OfficialDailySession] =>
        isOfficialDailySession(entry[1])),
    );
    const stats = parsed.stats && typeof parsed.stats === 'object'
      ? Object.fromEntries(Object.entries(parsed.stats).filter((entry) => isStats(entry[1])))
      : {};
    return { sessions, stats, version: 1 };
  } catch {
    return emptyStore();
  }
}

function isOfficialDailySession(value: unknown): value is OfficialDailySession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<OfficialDailySession>;
  if (!(session.version === 1
    && typeof session.dailyDate === 'string'
    && typeof session.timeZone === 'string'
    && isLanguage(session.language)
    && typeof session.targetDisplayWord === 'string'
    && typeof session.dictionaryVersion === 'string'
    && session.policyVersion === 'duelwords-daily-v1'
    && session.ruleVersion === 'duelwords-feedback-v1'
    && typeof session.startedAt === 'string'
    && (session.finishedAt === null || typeof session.finishedAt === 'string')
    && isLocalState(session.state, session.language))) {
    return false;
  }

  return normalizeGuess(session.targetDisplayWord, session.language) === session.state.targetWord;
}

function isLocalState(value: unknown, language: GameLanguage): value is LocalWordDuelState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<LocalWordDuelState>;
  if (!(state.language === language
    && state.wordLength === WORD_DUEL_WORD_LENGTH
    && state.maxAttempts === WORD_DUEL_MAX_ATTEMPTS
    && (state.status === 'playing' || state.status === 'won' || state.status === 'lost')
    && typeof state.targetWord === 'string'
    && Array.isArray(state.guesses)
    && state.guesses.length <= WORD_DUEL_MAX_ATTEMPTS)) {
    return false;
  }

  const allowedWords = validWords(language);
  if (!allowedWords.has(state.targetWord)) return false;
  if (!state.guesses.every((guess) => {
    if (!guess || typeof guess !== 'object') return false;
    return typeof guess.input === 'string'
      && typeof guess.normalizedWord === 'string'
      && allowedWords.has(guess.normalizedWord)
      && Array.isArray(guess.letters)
      && guess.letters.length === WORD_DUEL_WORD_LENGTH
      && Array.isArray(guess.feedback)
      && guess.feedback.length === WORD_DUEL_WORD_LENGTH
      && guess.feedback.every((item) => item === 'absent' || item === 'exact' || item === 'present');
  })) return false;

  const solved = state.guesses.some((guess) => guess.normalizedWord === state.targetWord);
  if (state.status === 'won') return solved && state.guesses.at(-1)?.normalizedWord === state.targetWord;
  if (state.status === 'lost') return !solved && state.guesses.length === WORD_DUEL_MAX_ATTEMPTS;
  return !solved && state.guesses.length < WORD_DUEL_MAX_ATTEMPTS;
}

function isLanguage(value: unknown): value is GameLanguage {
  return value === 'en' || value === 'es' || value === 'ca' || value === 'fr' || value === 'de';
}

function validWords(language: GameLanguage): ReadonlySet<string> {
  const cached = validWordsByLanguage.get(language);
  if (cached) return cached;
  const words = new Set(getLocalDictionary(language).validGuesses);
  validWordsByLanguage.set(language, words);
  return words;
}

function sessionKey(dailyDate: string, timeZone: string, language: GameLanguage): string {
  return `${dailyDate}|${timeZone}|${language}`;
}

function emptyStore(): OfficialDailyStore {
  return { sessions: {}, stats: {}, version: 1 };
}

function persistOfficialDailyProgress(
  previous: OfficialDailySession,
  next: OfficialDailySession,
  storage: OfficialDailyStorage | null,
): boolean {
  if (!storage) return false;
  const store = readStore(storage);
  const key = sessionKey(next.dailyDate, next.timeZone, next.language);
  const stored = store.sessions[key];
  store.sessions[key] = next;

  if (
    previous.state.status === 'playing'
    && next.state.status !== 'playing'
    && stored?.state.status === 'playing'
  ) {
    store.stats[next.language] = completedStats(
      store.stats[next.language] ?? emptyStats(),
      next,
    );
    recordDuelWordsActivity({
      attemptsUsed: next.state.guesses.length,
      completedAt: next.finishedAt ?? undefined,
      language: next.language,
      mode: 'daily',
      outcome: next.state.status === 'won' ? 'win' : 'no_winner',
    }, storage);
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(store));
  return true;
}

function completedStats(current: OfficialDailyStats, session: OfficialDailySession): OfficialDailyStats {
  const solved = session.state.status === 'won';
  const dayGap = current.lastCompletedDate
    ? calendarDayOrdinal(session.dailyDate) - calendarDayOrdinal(current.lastCompletedDate)
    : null;
  const currentStreak = dayGap === 0
    ? current.currentStreak
    : dayGap === 1
      ? current.currentStreak + 1
      : 1;
  const attempts = session.state.guesses.length;

  return {
    bestAttempts: solved
      ? Math.min(current.bestAttempts ?? attempts, attempts)
      : current.bestAttempts,
    completed: current.completed + 1,
    currentStreak,
    failed: current.failed + (solved ? 0 : 1),
    lastCompletedDate: session.dailyDate,
    solved: current.solved + (solved ? 1 : 0),
  };
}

function calendarDayOrdinal(dailyDate: string): number {
  return Math.floor(Date.parse(`${dailyDate}T00:00:00.000Z`) / 86_400_000);
}

function emptyStats(): OfficialDailyStats {
  return {
    bestAttempts: null,
    completed: 0,
    currentStreak: 0,
    failed: 0,
    lastCompletedDate: null,
    solved: 0,
  };
}

function isStats(value: unknown): value is OfficialDailyStats {
  if (!value || typeof value !== 'object') return false;
  const stats = value as Partial<OfficialDailyStats>;
  return (stats.bestAttempts === null || Number.isInteger(stats.bestAttempts))
    && Number.isInteger(stats.completed)
    && Number.isInteger(stats.currentStreak)
    && Number.isInteger(stats.failed)
    && (stats.lastCompletedDate === null || typeof stats.lastCompletedDate === 'string')
    && Number.isInteger(stats.solved);
}

function deviceStorage(): OfficialDailyStorage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}
