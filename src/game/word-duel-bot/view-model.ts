import {
  getLocalDictionary,
  getPracticeTarget,
  LOCAL_WORD_FIXTURES,
  type WordEntry,
} from '../dictionaries/local-fixtures';
import {
  applyGuess,
  createLocalGame,
  normalizeGuess,
  scoreGuess,
  WORD_DUEL_MAX_ATTEMPTS,
  WORD_DUEL_WORD_LENGTH,
  type DictionaryProfile,
  type GameLanguage,
  type GuessRejection,
  type GuessRow,
  type LetterFeedback,
  type LocalWordDuelState,
} from '../word-duel-engine';
import {
  DEFAULT_AVI_DIFFICULTY,
  aviDifficultyClueMemory,
  aviDifficultyMinimumSolveRound,
  type AviDifficulty,
} from './difficulty';

export type AviBotProfile = AviDifficulty;
export type AviBotDuelStatus = 'active' | 'won' | 'lost' | 'draw' | 'no_winner' | 'technical_error_bot';
export type AviBotRoundPhase = 'editing' | 'waiting_for_avi' | 'finalized';
export type AviBotOpponentAttemptState = 'waiting' | 'thinking' | 'scored' | 'technical_error';
export type AviBotOpponentRoundState = 'waiting' | 'thinking' | 'clues_ready' | 'technical_error';
export type AviBotReactionId = 'nice' | 'your_turn' | 'tick_tock' | 'no_pressure' | 'gg';
export type AviBotOwnRowState = 'revealed' | 'submitted_pending' | 'editing' | 'empty';

export type AviBotSolverPriorGuess = {
  feedback: LetterFeedback[];
  normalizedWord: string;
};

export type AviBotSolverInput = {
  botProfile: AviBotProfile;
  botProfileVersion: 'difficulty-v1';
  dictionary: DictionaryProfile;
  gameSeed: number;
  language: GameLanguage;
  openingPoolVersion: 'local-openers-v1';
  priorGuesses: readonly AviBotSolverPriorGuess[];
  roundNumber: number;
  solverVersion: 'deterministic-local-v1';
  wordLength: number;
};

export type AviBotPendingRound = {
  botDelayMs: number;
  botDueAtMs: number;
  botRow: GuessRow;
  botScheduledActionId: string;
  humanRow: GuessRow;
  playerSubmittedAtMs: number;
  roundNumber: number;
};

export type AviBotDuelSession = {
  botProfile: AviBotProfile;
  botProfileVersion: 'difficulty-v1';
  botState: LocalWordDuelState;
  createdAtMs: number;
  dictionaryVersion: 'local-fixture-preview';
  finishedAtMs: number | null;
  gameLanguage: GameLanguage;
  gameSeed: number;
  humanState: LocalWordDuelState;
  isLocalPreviewOnly: true;
  mode: 'bot_duel';
  normalizationVersion: 'word-duel-normalize-v1';
  openingPoolVersion: 'local-openers-v1';
  pendingRound: AviBotPendingRound | null;
  phase: AviBotRoundPhase;
  reactions: readonly AviBotReactionId[];
  requiresInvite: false;
  requiresReady: false;
  roundNumber: number;
  roundOpenedAtMs: number;
  roundTimeoutMs: 60000;
  ruleVersion: 'word-duel-v1';
  solverKind: 'deterministic_dictionary';
  solverVersion: 'deterministic-local-v1';
  status: AviBotDuelStatus;
  target: WordEntry;
  usesGenerativeAi: false;
};

export type AviBotBoardCell = {
  feedback: LetterFeedback | null;
  letter: string | null;
};

export type AviBotBoardRow = {
  cells: AviBotBoardCell[];
  state: AviBotOwnRowState;
};

export type AviBotOpponentAttemptSummary = {
  attemptNumber: number;
  exactCount: number | null;
  state: AviBotOpponentAttemptState;
  validCount: number | null;
};

export type AviBotSafeOpponentSummary = {
  attemptSummaries: AviBotOpponentAttemptSummary[];
  kind: 'bot';
  profileLabel: string;
  roundState: AviBotOpponentRoundState;
  safeDisplayName: 'Avi';
};

export type AviBotSafeRealtimeProjection = {
  attemptSummaries: AviBotOpponentAttemptSummary[];
  mode: 'bot_duel';
  opponentKind: 'bot';
  opponentName: 'Avi';
  opponentProfile: AviBotProfile;
  opponentStatus: AviBotOpponentRoundState;
  roundNumber: number;
};

export type AviBotDuelSharePreview = {
  ctaLabel: 'Challenge me';
  text: string;
};

export type AviBotDuelViewModel = {
  availableReactions: readonly AviBotReactionId[];
  gameLanguage: GameLanguage;
  aviDifficulty: AviDifficulty;
  isInputOpen: boolean;
  isLocalPreviewOnly: true;
  maxAttempts: number;
  mode: 'bot_duel';
  opponent: AviBotSafeOpponentSummary;
  ownBoardRows: AviBotBoardRow[];
  ownKeyboardFeedback: Record<string, LetterFeedback>;
  phase: AviBotRoundPhase;
  remainingSeconds: number;
  roundNumber: number;
  safeSharePreview: AviBotDuelSharePreview | null;
  status: AviBotDuelStatus;
  targetReveal: {
    displayWord: string | null;
    visible: boolean;
  };
  wordLength: number;
};

export type AviBotDuelGuessResult =
  | {
      accepted: true;
      session: AviBotDuelSession;
    }
  | {
      accepted: false;
      normalizedWord: string;
      rejection: GuessRejection;
      session: AviBotDuelSession;
    };

const AVI_BOT_REACTIONS: readonly AviBotReactionId[] = [
  'nice',
  'your_turn',
  'tick_tock',
  'no_pressure',
  'gg',
];

const OPENING_POOLS: Record<GameLanguage, readonly string[]> = {
  en: ['crane', 'flame', 'civic', 'sling', 'brave'],
  es: ['perla', 'nieve', 'canto', 'silla', 'cañon'],
  ca: ['tambe', 'sobre', 'entre', 'sense', 'nomes'],
  fr: ['comme', 'cette', 'entre', 'etait', 'aussi'],
  de: ['wurde', 'einer', 'durch', 'nicht', 'einem'],
};

export function createAviBotDuelSession({
  aviDifficulty = DEFAULT_AVI_DIFFICULTY,
  gameLanguage = 'en',
  gameSeed = 0,
  nowMs,
}: {
  aviDifficulty?: AviDifficulty;
  gameLanguage?: GameLanguage;
  gameSeed?: number;
  nowMs: number;
}): AviBotDuelSession {
  const target = getPracticeTarget(gameLanguage, gameSeed);
  const dictionary = getLocalDictionary(gameLanguage);
  const baseState = {
    dictionary,
    language: gameLanguage,
    target: target.displayWord,
  };

  return {
    botProfile: aviDifficulty,
    botProfileVersion: 'difficulty-v1',
    botState: createLocalGame(baseState),
    createdAtMs: nowMs,
    dictionaryVersion: 'local-fixture-preview',
    finishedAtMs: null,
    gameLanguage,
    gameSeed,
    humanState: createLocalGame(baseState),
    isLocalPreviewOnly: true,
    mode: 'bot_duel',
    normalizationVersion: 'word-duel-normalize-v1',
    openingPoolVersion: 'local-openers-v1',
    pendingRound: null,
    phase: 'editing',
    reactions: AVI_BOT_REACTIONS,
    requiresInvite: false,
    requiresReady: false,
    roundNumber: 1,
    roundOpenedAtMs: nowMs,
    roundTimeoutMs: 60_000,
    ruleVersion: 'word-duel-v1',
    solverKind: 'deterministic_dictionary',
    solverVersion: 'deterministic-local-v1',
    status: 'active',
    target,
    usesGenerativeAi: false,
  };
}

export function submitAviBotDuelGuess({
  input,
  nowMs,
  session,
}: {
  input: string;
  nowMs: number;
  session: AviBotDuelSession;
}): AviBotDuelGuessResult {
  if (session.status !== 'active' || session.phase !== 'editing') {
    return {
      accepted: false,
      normalizedWord: normalizeGuess(input, session.gameLanguage),
      rejection: 'game_over',
      session,
    };
  }

  const humanResult = applyGuess(session.humanState, input, getLocalDictionary(session.gameLanguage));
  if (!humanResult.accepted) {
    return {
      accepted: false,
      normalizedWord: humanResult.normalizedWord,
      rejection: humanResult.rejection,
      session,
    };
  }

  const botPlan = createAviBotRoundPlan(session, nowMs);
  const botResult = applyGuess(session.botState, botPlan.normalizedWord, getLocalDictionary(session.gameLanguage));

  if (!botResult.accepted) {
    return {
      accepted: true,
      session: {
        ...session,
        finishedAtMs: nowMs,
        phase: 'finalized',
        status: 'technical_error_bot',
      },
    };
  }

  return {
    accepted: true,
    session: {
      ...session,
      pendingRound: {
        botDelayMs: botPlan.delayMs,
        botDueAtMs: botPlan.dueAtMs,
        botRow: botResult.row,
        botScheduledActionId: botPlan.scheduledActionId,
        humanRow: humanResult.row,
        playerSubmittedAtMs: nowMs,
        roundNumber: session.roundNumber,
      },
      phase: 'waiting_for_avi',
    },
  };
}

export function resolveAviBotRound({
  nowMs,
  session,
}: {
  nowMs: number;
  session: AviBotDuelSession;
}): AviBotDuelSession {
  if (session.status !== 'active' || session.phase !== 'waiting_for_avi' || !session.pendingRound) {
    return session;
  }

  const humanState = appendGuessRow(session.humanState, session.pendingRound.humanRow);
  const botState = appendGuessRow(session.botState, session.pendingRound.botRow);
  const humanSolved = humanState.status === 'won';
  const botSolved = botState.status === 'won';
  const attemptsExhausted = humanState.guesses.length >= WORD_DUEL_MAX_ATTEMPTS;
  const nextStatus = resultStatus({ attemptsExhausted, botSolved, humanSolved });
  const isFinal = nextStatus !== 'active';

  return {
    ...session,
    botState,
    finishedAtMs: isFinal ? nowMs : null,
    humanState,
    pendingRound: null,
    phase: isFinal ? 'finalized' : 'editing',
    roundNumber: isFinal ? session.roundNumber : session.roundNumber + 1,
    roundOpenedAtMs: isFinal ? session.roundOpenedAtMs : nowMs,
    status: nextStatus,
  };
}

export function createAviBotDuelViewModel(session: AviBotDuelSession): AviBotDuelViewModel {
  const isFinal = session.status !== 'active';

  return {
    availableReactions: session.reactions,
    aviDifficulty: session.botProfile,
    gameLanguage: session.gameLanguage,
    isInputOpen: session.status === 'active' && session.phase === 'editing',
    isLocalPreviewOnly: true,
    maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
    mode: 'bot_duel',
    opponent: createAviBotSafeOpponentSummary(session),
    ownBoardRows: createOwnBoardRows(session),
    ownKeyboardFeedback: createKeyboardFeedback(session.humanState),
    phase: session.phase,
    remainingSeconds: isFinal ? 0 : remainingSeconds(session),
    roundNumber: session.roundNumber,
    safeSharePreview: isFinal ? createAviBotSafeSharePreview(session) : null,
    status: session.status,
    targetReveal: {
      displayWord: isFinal ? session.target.displayWord.toUpperCase() : null,
      visible: isFinal,
    },
    wordLength: WORD_DUEL_WORD_LENGTH,
  };
}

export function createAviBotSafeRealtimeProjection(session: AviBotDuelSession): AviBotSafeRealtimeProjection {
  const opponent = createAviBotSafeOpponentSummary(session);

  return {
    attemptSummaries: opponent.attemptSummaries,
    mode: 'bot_duel',
    opponentKind: 'bot',
    opponentName: 'Avi',
    opponentProfile: session.botProfile,
    opponentStatus: opponent.roundState,
    roundNumber: session.roundNumber,
  };
}

export function createAviBotSafeSharePreview(session: AviBotDuelSession): AviBotDuelSharePreview {
  const languageLabel = session.gameLanguage === 'es' ? 'Spanish' : 'English';
  const attempts =
    session.status === 'no_winner' || session.status === 'technical_error_bot'
      ? `X/${WORD_DUEL_MAX_ATTEMPTS}`
      : `${session.humanState.guesses.length}/${WORD_DUEL_MAX_ATTEMPTS}`;
  const outcome = shareOutcomeLabel(session.status);

  return {
    ctaLabel: 'Challenge me',
    text: `DuelWords AV - Play Avi\n${outcome} - ${languageLabel} - ${attempts}\nChallenge me: <link>`,
  };
}

export function selectAviBotGuess(input: AviBotSolverInput): string {
  if (input.priorGuesses.length === 0) {
    return openingGuess(input.language, input.gameSeed);
  }

  const rememberedGuesses = input.priorGuesses.slice(-aviDifficultyClueMemory(input.botProfile));
  const candidates = LOCAL_WORD_FIXTURES[input.language]
    .filter((entry) => entry.isTarget)
    .filter((entry) => candidateMatchesPriorFeedback(entry.normalizedWord, rememberedGuesses))
    .filter((entry) => !input.priorGuesses.some((guess) => guess.normalizedWord === entry.normalizedWord))
    .sort((left, right) => right.frequencyScore - left.frequencyScore || left.normalizedWord.localeCompare(right.normalizedWord));

  if (candidates.length > 0) {
    return candidates[Math.abs(input.gameSeed + input.roundNumber) % candidates.length].normalizedWord;
  }

  const fallback = input.dictionary.validGuesses.find(
    (guess) => !input.priorGuesses.some((priorGuess) => priorGuess.normalizedWord === guess),
  );

  return fallback ?? openingGuess(input.language, input.gameSeed + input.roundNumber);
}

export function createAviBotDelayMs(input: {
  difficulty?: AviDifficulty;
  gameSeed: number;
  language: GameLanguage;
  roundNumber: number;
}): number {
  const difficulty = input.difficulty ?? DEFAULT_AVI_DIFFICULTY;
  const jitter = stableHash(`${input.gameSeed}:${input.language}:${input.roundNumber}:${difficulty}`) % 5_001;

  if (difficulty === 'friendly') return 5_000 + jitter;
  if (difficulty === 'balanced') return 3_000 + jitter;
  return 2_000 + jitter;
}

export function normalizeAviBotInput(input: string, language: GameLanguage): string {
  return normalizeGuess(input, language);
}

function createAviBotRoundPlan(
  session: AviBotDuelSession,
  nowMs: number,
): {
  delayMs: number;
  dueAtMs: number;
  normalizedWord: string;
  scheduledActionId: string;
} {
  const delayMs = createAviBotDelayMs({
    difficulty: session.botProfile,
    gameSeed: session.gameSeed,
    language: session.gameLanguage,
    roundNumber: session.roundNumber,
  });
  const solverInput: AviBotSolverInput = {
    botProfile: session.botProfile,
    botProfileVersion: session.botProfileVersion,
    dictionary: getLocalDictionary(session.gameLanguage),
    gameSeed: session.gameSeed,
    language: session.gameLanguage,
    openingPoolVersion: session.openingPoolVersion,
    priorGuesses: session.botState.guesses.map((guess) => ({
      feedback: guess.feedback,
      normalizedWord: guess.normalizedWord,
    })),
    roundNumber: session.roundNumber,
    solverVersion: session.solverVersion,
    wordLength: WORD_DUEL_WORD_LENGTH,
  };
  const selectedGuess = selectAviBotGuess(solverInput);
  const normalizedWord =
    (session.roundNumber < aviDifficultyMinimumSolveRound(session.botProfile)
      && selectedGuess === session.target.normalizedWord)
      ? nextOpeningGuessAwayFromTarget(session.gameLanguage, session.gameSeed, session.target.normalizedWord)
      : selectedGuess;

  return {
    delayMs,
    dueAtMs: Math.min(nowMs + delayMs, session.roundOpenedAtMs + session.roundTimeoutMs - 1),
    normalizedWord,
    scheduledActionId: `avi-${session.gameSeed}-${session.roundNumber}-${delayMs}`,
  };
}

function appendGuessRow(state: LocalWordDuelState, row: GuessRow): LocalWordDuelState {
  const guesses = [...state.guesses, row];
  const didWin = row.normalizedWord === state.targetWord;
  const didLose = !didWin && guesses.length >= state.maxAttempts;

  return {
    ...state,
    guesses,
    status: didWin ? 'won' : didLose ? 'lost' : 'playing',
  };
}

function createAviBotSafeOpponentSummary(session: AviBotDuelSession): AviBotSafeOpponentSummary {
  const attemptSummaries: AviBotOpponentAttemptSummary[] = Array.from(
    { length: WORD_DUEL_MAX_ATTEMPTS },
    (_, index) => {
      const guess = session.botState.guesses[index];
      if (!guess) {
        return emptyOpponentAttempt(index + 1, 'waiting');
      }

      return {
        attemptNumber: index + 1,
        exactCount: guess.feedback.filter((item) => item === 'exact').length,
        state: 'scored',
        validCount: guess.feedback.filter((item) => item === 'exact' || item === 'present').length,
      };
    },
  );

  if (session.status === 'technical_error_bot') {
    attemptSummaries[Math.max(0, session.roundNumber - 1)] = emptyOpponentAttempt(
      session.roundNumber,
      'technical_error',
    );
  } else if (session.pendingRound) {
    attemptSummaries[session.pendingRound.roundNumber - 1] = emptyOpponentAttempt(
      session.pendingRound.roundNumber,
      'thinking',
    );
  }

  return {
    attemptSummaries,
    kind: 'bot',
    profileLabel: `Avi ${capitalizeDifficulty(session.botProfile)}`,
    roundState: opponentRoundState(session),
    safeDisplayName: 'Avi',
  };
}

function emptyOpponentAttempt(
  attemptNumber: number,
  state: Exclude<AviBotOpponentAttemptState, 'scored'>,
): AviBotOpponentAttemptSummary {
  return {
    attemptNumber,
    exactCount: null,
    state,
    validCount: null,
  };
}

function opponentRoundState(session: AviBotDuelSession): AviBotOpponentRoundState {
  if (session.status === 'technical_error_bot') {
    return 'technical_error';
  }
  if (session.phase === 'waiting_for_avi') {
    return 'thinking';
  }

  return session.botState.guesses.length > 0 ? 'clues_ready' : 'waiting';
}

function createOwnBoardRows(session: AviBotDuelSession): AviBotBoardRow[] {
  const revealedRows: AviBotBoardRow[] = session.humanState.guesses.map((guess) => rowFromGuess(guess, 'revealed'));
  const pendingRows: AviBotBoardRow[] = session.pendingRound
    ? [rowFromGuess({ ...session.pendingRound.humanRow, feedback: [] }, 'submitted_pending')]
    : [];
  const editingRows: AviBotBoardRow[] =
    session.status === 'active' && session.phase === 'editing'
      ? [emptyRow('editing')]
      : [];
  const emptyCount = WORD_DUEL_MAX_ATTEMPTS - revealedRows.length - pendingRows.length - editingRows.length;
  const emptyRows = Array.from({ length: Math.max(0, emptyCount) }, () => emptyRow('empty'));

  return [...revealedRows, ...pendingRows, ...editingRows, ...emptyRows];
}

function rowFromGuess(guess: GuessRow, state: AviBotOwnRowState): AviBotBoardRow {
  return {
    state,
    cells: Array.from({ length: WORD_DUEL_WORD_LENGTH }, (_, index) => ({
      feedback: guess.feedback[index] ?? null,
      letter: guess.letters[index]?.toUpperCase() ?? null,
    })),
  };
}

function emptyRow(state: AviBotOwnRowState): AviBotBoardRow {
  return {
    state,
    cells: Array.from({ length: WORD_DUEL_WORD_LENGTH }, () => ({
      feedback: null,
      letter: null,
    })),
  };
}

function createKeyboardFeedback(state: LocalWordDuelState): Record<string, LetterFeedback> {
  const feedbackByKey: Record<string, LetterFeedback> = {};

  for (const guess of state.guesses) {
    guess.letters.forEach((letter, index) => {
      const current = feedbackByKey[letter];
      const next = guess.feedback[index];
      if (!current || feedbackRank(next) > feedbackRank(current)) {
        feedbackByKey[letter] = next;
      }
    });
  }

  return feedbackByKey;
}

function resultStatus(input: {
  attemptsExhausted: boolean;
  botSolved: boolean;
  humanSolved: boolean;
}): AviBotDuelStatus {
  if (input.humanSolved && input.botSolved) {
    return 'draw';
  }
  if (input.humanSolved) {
    return 'won';
  }
  if (input.botSolved) {
    return 'lost';
  }
  if (input.attemptsExhausted) {
    return 'no_winner';
  }
  return 'active';
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

function remainingSeconds(session: AviBotDuelSession): number {
  if (session.phase === 'waiting_for_avi' && session.pendingRound) {
    return Math.max(0, Math.ceil((session.pendingRound.botDueAtMs - session.pendingRound.playerSubmittedAtMs) / 1_000));
  }

  return Math.ceil(session.roundTimeoutMs / 1_000);
}

function openingGuess(language: GameLanguage, seed: number): string {
  const pool = OPENING_POOLS[language];

  return pool[Math.abs(seed) % pool.length];
}

function nextOpeningGuessAwayFromTarget(language: GameLanguage, seed: number, target: string): string {
  const pool = OPENING_POOLS[language];

  for (let offset = 1; offset <= pool.length; offset += 1) {
    const guess = pool[Math.abs(seed + offset) % pool.length];
    if (guess !== target) {
      return guess;
    }
  }

  return getLocalDictionary(language).validGuesses.find((guess) => guess !== target) ?? openingGuess(language, seed);
}

function candidateMatchesPriorFeedback(
  candidate: string,
  priorGuesses: readonly AviBotSolverPriorGuess[],
): boolean {
  return priorGuesses.every((guess) => sameFeedback(scoreGuess(guess.normalizedWord, candidate), guess.feedback));
}

function sameFeedback(left: readonly LetterFeedback[], right: readonly LetterFeedback[]): boolean {
  return left.length === right.length && left.every((feedback, index) => feedback === right[index]);
}

function shareOutcomeLabel(status: AviBotDuelStatus): string {
  if (status === 'won') {
    return 'Won vs Avi';
  }
  if (status === 'lost') {
    return 'Lost vs Avi';
  }
  if (status === 'draw') {
    return 'Draw vs Avi';
  }
  if (status === 'technical_error_bot') {
    return 'Result unavailable';
  }
  return 'No winner vs Avi';
}

function capitalizeDifficulty(difficulty: AviDifficulty): string {
  return `${difficulty.slice(0, 1).toUpperCase()}${difficulty.slice(1)}`;
}

function stableHash(value: string): number {
  return Array.from(value).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 17);
}
