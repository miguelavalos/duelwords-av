import type { GameLanguage, GuessRow, LetterFeedback } from '../word-duel-engine';
import { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH } from '../word-duel-engine';
import { createIdleRematchProposal, type WordDuelRematchProposal } from './rematch-proposal';

export type WordDuelResultOutcome = 'win' | 'loss' | 'draw' | 'no_winner' | 'technical';
export type WordDuelResultReason =
  | 'solved'
  | 'attempts_exhausted'
  | 'round_timeout'
  | 'abandoned_after_start'
  | 'abandoned_inactive'
  | 'abandoned_no_winner'
  | 'technical_result'
  | 'cancelled_before_first_round';

export type WordDuelResultBoardCell = {
  feedback: LetterFeedback | null;
  letter: string | null;
};

export type WordDuelResultBoardRow = {
  cells: WordDuelResultBoardCell[];
};

export type WordDuelResultPlayerSummary = {
  attemptsUsed: number;
  boardRows: WordDuelResultBoardRow[];
  safeDisplayName: string;
  side: 'a' | 'b';
  solved: boolean;
  timedOut: boolean;
};

export type WordDuelResultSharePreview = {
  ctaLabel: string;
  text: string;
};

export type WordDuelResultAdSlot = {
  reserved: boolean;
  visible: boolean;
};

export type WordDuelResultLocalRowPayload = {
  feedback: string;
  word: string;
};

export type WordDuelResultLocalPlayerPayload = {
  rows: WordDuelResultLocalRowPayload[];
  safeDisplayName: string;
  side: 'a' | 'b';
  solved: boolean;
  timedOut: boolean;
};

export type WordDuelResultLocalPayload = {
  gameLanguage: GameLanguage;
  matchStarted: boolean;
  maxAttempts: number;
  opponent: WordDuelResultLocalPlayerPayload | null;
  outcome: WordDuelResultOutcome;
  own: WordDuelResultLocalPlayerPayload;
  resultReason: WordDuelResultReason;
  targetDisplayWord: string | null;
  version: 'word-duel-local-result-v1';
  wordLength: number;
};

export type WordDuelResultViewModel = {
  adSlot: WordDuelResultAdSlot;
  gameLabel: 'Word Duel';
  gameLanguage: GameLanguage;
  isFinalized: boolean;
  matchStarted: boolean;
  maxAttempts: number;
  opponent: WordDuelResultPlayerSummary;
  outcome: WordDuelResultOutcome;
  own: WordDuelResultPlayerSummary;
  rematch: WordDuelRematchProposal;
  resultReason: WordDuelResultReason;
  safeSharePreview: WordDuelResultSharePreview;
  targetReveal: {
    displayWord: string | null;
    visible: boolean;
  };
  wordLength: number;
};

export function createWordDuelResultLocalPayload(input: {
  gameLanguage: GameLanguage;
  matchStarted?: boolean;
  maxAttempts?: number;
  opponent?: {
    guesses: readonly GuessRow[];
    safeDisplayName?: string;
    side?: 'a' | 'b';
    solved: boolean;
    timedOut?: boolean;
  } | null;
  outcome: WordDuelResultOutcome;
  own: {
    guesses: readonly GuessRow[];
    safeDisplayName?: string;
    side?: 'a' | 'b';
    solved: boolean;
    timedOut?: boolean;
  };
  resultReason: WordDuelResultReason;
  targetDisplayWord: string | null;
  wordLength?: number;
}): WordDuelResultLocalPayload {
  return {
    gameLanguage: input.gameLanguage,
    matchStarted: input.matchStarted ?? true,
    maxAttempts: input.maxAttempts ?? WORD_DUEL_MAX_ATTEMPTS,
    opponent: input.opponent
      ? {
          rows: compactRowsFromGuesses(input.opponent.guesses),
          safeDisplayName: input.opponent.safeDisplayName ?? 'Rival',
          side: input.opponent.side ?? 'b',
          solved: input.opponent.solved,
          timedOut: input.opponent.timedOut ?? false,
        }
      : null,
    outcome: input.outcome,
    own: {
      rows: compactRowsFromGuesses(input.own.guesses),
      safeDisplayName: input.own.safeDisplayName ?? 'You',
      side: input.own.side ?? 'a',
      solved: input.own.solved,
      timedOut: input.own.timedOut ?? false,
    },
    resultReason: input.resultReason,
    targetDisplayWord: input.targetDisplayWord,
    version: 'word-duel-local-result-v1',
    wordLength: input.wordLength ?? WORD_DUEL_WORD_LENGTH,
  };
}

export function createWordDuelResultViewModelFromLocalPayload(
  payload: WordDuelResultLocalPayload,
): WordDuelResultViewModel {
  const isFinalized = true;
  const rematch = createIdleRematchProposal({
    gameLanguage: payload.gameLanguage,
    viewerRole: 'owner',
    viewerSide: payload.own.side,
  });
  const viewModelWithoutShare: Omit<WordDuelResultViewModel, 'safeSharePreview'> = {
    adSlot: {
      reserved: true,
      visible: true,
    },
    gameLabel: 'Word Duel',
    gameLanguage: payload.gameLanguage,
    isFinalized,
    matchStarted: payload.matchStarted,
    maxAttempts: payload.maxAttempts,
    opponent: playerSummaryFromLocalPayload(
      payload.opponent ?? {
        rows: [],
        safeDisplayName: 'Solo',
        side: 'b',
        solved: false,
        timedOut: false,
      },
      payload.wordLength,
      payload.maxAttempts,
    ),
    outcome: payload.outcome,
    own: playerSummaryFromLocalPayload(payload.own, payload.wordLength, payload.maxAttempts),
    rematch,
    resultReason: payload.resultReason,
    targetReveal: {
      displayWord: shouldRevealTarget({
        isFinalized,
        matchStarted: payload.matchStarted,
        resultReason: payload.resultReason,
      }) ? payload.targetDisplayWord?.toUpperCase() ?? null : null,
      visible: shouldRevealTarget({
        isFinalized,
        matchStarted: payload.matchStarted,
        resultReason: payload.resultReason,
      }),
    },
    wordLength: payload.wordLength,
  };

  return {
    ...viewModelWithoutShare,
    safeSharePreview: createSafeResultSharePreview(viewModelWithoutShare),
  };
}

export function parseWordDuelResultLocalPayload(value: string | null | undefined): WordDuelResultLocalPayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isWordDuelResultLocalPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function serializeWordDuelResultLocalPayload(payload: WordDuelResultLocalPayload): string {
  return JSON.stringify(payload);
}

export function createDemoWordDuelResultViewModel(input: {
  gameLanguage?: GameLanguage;
  includeAdSlot?: boolean;
  isFinalized?: boolean;
  matchStarted?: boolean;
  outcome?: WordDuelResultOutcome;
  rematch?: WordDuelRematchProposal;
  resultReason?: WordDuelResultReason;
} = {}): WordDuelResultViewModel {
  const outcome = input.outcome ?? 'win';
  const resultReason = input.resultReason ?? 'solved';
  const gameLanguage: GameLanguage = input.gameLanguage ?? 'en';
  const isFinalized = input.isFinalized ?? true;
  const matchStarted = input.matchStarted ?? true;
  const own: WordDuelResultPlayerSummary = {
    attemptsUsed: 4,
    boardRows: [
      rowFromLetters(['C', 'I', 'V', 'I', 'C'], ['exact', 'exact', 'absent', 'absent', 'absent']),
      rowFromLetters(['A', 'D', 'O', 'R', 'E'], ['absent', 'absent', 'present', 'absent', 'exact']),
      rowFromLetters(['M', 'E', 'R', 'I', 'T'], ['absent', 'exact', 'present', 'exact', 'absent']),
      rowFromLetters(['F', 'I', 'E', 'L', 'D'], ['exact', 'exact', 'exact', 'exact', 'exact']),
      emptyRow(),
      emptyRow(),
    ],
    safeDisplayName: 'You',
    side: 'a',
    solved: outcome === 'win' || outcome === 'draw',
    timedOut: false,
  };
  const opponent: WordDuelResultPlayerSummary = {
    attemptsUsed: 5,
    boardRows: [
      rowFromLetters(['C', 'R', 'A', 'N', 'E'], ['absent', 'absent', 'present', 'absent', 'exact']),
      rowFromLetters(['S', 'L', 'A', 'T', 'E'], ['absent', 'present', 'present', 'absent', 'exact']),
      rowFromLetters(['B', 'R', 'I', 'D', 'E'], ['absent', 'absent', 'present', 'absent', 'exact']),
      rowFromLetters(['P', 'I', 'E', 'C', 'E'], ['absent', 'exact', 'exact', 'absent', 'absent']),
      rowFromLetters(['F', 'I', 'E', 'L', 'D'], ['exact', 'exact', 'exact', 'exact', 'exact']),
      emptyRow(),
    ],
    safeDisplayName: 'Rival',
    side: 'b',
    solved: outcome === 'win' || outcome === 'loss' || outcome === 'draw',
    timedOut: false,
  };
  const viewModelWithoutShare: Omit<WordDuelResultViewModel, 'safeSharePreview'> = {
    adSlot: {
      reserved: input.includeAdSlot ?? true,
      visible: input.includeAdSlot ?? true,
    },
    gameLabel: 'Word Duel',
    gameLanguage,
    isFinalized,
    matchStarted,
    maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
    opponent,
    outcome,
    own,
    rematch: input.rematch ?? createIdleRematchProposal({ gameLanguage, viewerRole: 'owner', viewerSide: 'a' }),
    resultReason,
    targetReveal: {
      displayWord: shouldRevealTarget({ isFinalized, matchStarted, resultReason }) ? 'FIELD' : null,
      visible: shouldRevealTarget({ isFinalized, matchStarted, resultReason }),
    },
    wordLength: WORD_DUEL_WORD_LENGTH,
  };
  const viewModel: WordDuelResultViewModel = {
    ...viewModelWithoutShare,
    safeSharePreview: createSafeResultSharePreview(viewModelWithoutShare),
  };

  return viewModel;
}

export function createSafeResultSharePreview(
  result: Omit<WordDuelResultViewModel, 'safeSharePreview'>,
): WordDuelResultSharePreview {
  const languageLabel = result.gameLanguage === 'es' ? 'Spanish' : 'English';
  const attempts = `${result.own.attemptsUsed}/${result.maxAttempts}`;
  const outcome = shareOutcomeLabel(result.outcome, result.opponent.safeDisplayName);

  return {
    ctaLabel: 'Challenge me',
    text: `DuelWords AV · Word Duel\n${outcome} · ${languageLabel} · ${attempts}\nChallenge me: <link>`,
  };
}

export function shouldRevealTarget(input: {
  isFinalized: boolean;
  matchStarted: boolean;
  resultReason: WordDuelResultReason;
}): boolean {
  return input.isFinalized && input.matchStarted && input.resultReason !== 'cancelled_before_first_round';
}

function rowFromLetters(letters: readonly string[], feedback: readonly LetterFeedback[]): WordDuelResultBoardRow {
  return {
    cells: Array.from({ length: WORD_DUEL_WORD_LENGTH }, (_, index) => ({
      feedback: feedback[index] ?? null,
      letter: letters[index] ?? null,
    })),
  };
}

function compactRowsFromGuesses(guesses: readonly GuessRow[]): WordDuelResultLocalRowPayload[] {
  return guesses.map((guess) => ({
    feedback: guess.feedback.map(feedbackToCode).join(''),
    word: guess.letters.join('').toUpperCase(),
  }));
}

function playerSummaryFromLocalPayload(
  player: WordDuelResultLocalPlayerPayload,
  wordLength: number,
  maxAttempts: number,
): WordDuelResultPlayerSummary {
  const revealedRows = player.rows.map((row) => boardRowFromLocalPayload(row, wordLength));
  const emptyRows = Array.from({ length: Math.max(0, maxAttempts - revealedRows.length) }, () => emptyRowForLength(wordLength));

  return {
    attemptsUsed: revealedRows.length,
    boardRows: [...revealedRows, ...emptyRows],
    safeDisplayName: player.safeDisplayName,
    side: player.side,
    solved: player.solved,
    timedOut: player.timedOut,
  };
}

function boardRowFromLocalPayload(row: WordDuelResultLocalRowPayload, wordLength: number): WordDuelResultBoardRow {
  const letters = Array.from(row.word.toUpperCase());
  const feedbackCodes = Array.from(row.feedback);

  return {
    cells: Array.from({ length: wordLength }, (_, index) => ({
      feedback: feedbackFromCode(feedbackCodes[index]),
      letter: letters[index] ?? null,
    })),
  };
}

function emptyRow(): WordDuelResultBoardRow {
  return {
    cells: Array.from({ length: WORD_DUEL_WORD_LENGTH }, () => ({
      feedback: null,
      letter: null,
    })),
  };
}

function emptyRowForLength(wordLength: number): WordDuelResultBoardRow {
  return {
    cells: Array.from({ length: wordLength }, () => ({
      feedback: null,
      letter: null,
    })),
  };
}

function shareOutcomeLabel(outcome: WordDuelResultOutcome, opponentName: string): string {
  const hasOpponent = opponentName && opponentName !== 'Solo';

  if (outcome === 'win') {
    return hasOpponent ? `Won vs ${opponentName}` : 'Won';
  }
  if (outcome === 'loss') {
    return hasOpponent ? `Lost vs ${opponentName}` : 'Lost';
  }
  if (outcome === 'draw') {
    return hasOpponent ? `Draw vs ${opponentName}` : 'Draw';
  }
  if (outcome === 'technical') {
    return 'Result saved';
  }
  return 'No winner';
}

function feedbackToCode(feedback: LetterFeedback): string {
  if (feedback === 'exact') {
    return 'e';
  }
  if (feedback === 'present') {
    return 'p';
  }
  return 'a';
}

function feedbackFromCode(code: string | undefined): LetterFeedback | null {
  if (code === 'e') {
    return 'exact';
  }
  if (code === 'p') {
    return 'present';
  }
  if (code === 'a') {
    return 'absent';
  }
  return null;
}

function isWordDuelResultLocalPayload(value: unknown): value is WordDuelResultLocalPayload {
  if (!isRecord(value)) {
    return false;
  }

  return value.version === 'word-duel-local-result-v1'
    && (value.gameLanguage === 'en' || value.gameLanguage === 'es')
    && typeof value.matchStarted === 'boolean'
    && typeof value.maxAttempts === 'number'
    && typeof value.wordLength === 'number'
    && isOutcome(value.outcome)
    && isResultReason(value.resultReason)
    && (typeof value.targetDisplayWord === 'string' || value.targetDisplayWord === null)
    && isLocalPlayerPayload(value.own)
    && (value.opponent === null || isLocalPlayerPayload(value.opponent));
}

function isLocalPlayerPayload(value: unknown): value is WordDuelResultLocalPlayerPayload {
  return isRecord(value)
    && Array.isArray(value.rows)
    && value.rows.every(isLocalRowPayload)
    && typeof value.safeDisplayName === 'string'
    && (value.side === 'a' || value.side === 'b')
    && typeof value.solved === 'boolean'
    && typeof value.timedOut === 'boolean';
}

function isLocalRowPayload(value: unknown): value is WordDuelResultLocalRowPayload {
  return isRecord(value)
    && typeof value.feedback === 'string'
    && typeof value.word === 'string';
}

function isOutcome(value: unknown): value is WordDuelResultOutcome {
  return value === 'draw'
    || value === 'loss'
    || value === 'no_winner'
    || value === 'technical'
    || value === 'win';
}

function isResultReason(value: unknown): value is WordDuelResultReason {
  return value === 'abandoned_after_start'
    || value === 'abandoned_inactive'
    || value === 'abandoned_no_winner'
    || value === 'attempts_exhausted'
    || value === 'cancelled_before_first_round'
    || value === 'round_timeout'
    || value === 'solved'
    || value === 'technical_result';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
