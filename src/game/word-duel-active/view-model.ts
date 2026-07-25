import type { GameLanguage, LetterFeedback } from '../word-duel-engine';
import { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH } from '../word-duel-engine';

export type ActiveDuelOwnRowState = 'revealed' | 'submitted_pending' | 'editing' | 'empty' | 'timeout';
export type ActiveDuelOwnRoundState =
  | 'editing'
  | 'submitting'
  | 'submitted'
  | 'waiting_for_rival'
  | 'rival_submitted'
  | 'resolving'
  | 'timed_out';
export type ActiveDuelOpponentMarkerState = 'waiting' | 'submitted' | 'solved' | 'timeout' | 'failed';
export type ActiveDuelPresenceState = 'connected' | 'reconnecting' | 'disconnected';
export type ActiveDuelReactionId =
  | 'gg'
  | 'nice'
  | 'close'
  | 'almost'
  | 'your_turn'
  | 'tick_tock';

export type ActiveDuelBoardCell = {
  feedback: LetterFeedback | null;
  letter: string | null;
};

export type ActiveDuelBoardRow = {
  cells: ActiveDuelBoardCell[];
  state: ActiveDuelOwnRowState;
};

export type ActiveDuelOpponentSummary = {
  attemptMarkers: ActiveDuelOpponentMarkerState[];
  presence: ActiveDuelPresenceState;
  roundState: ActiveDuelOpponentMarkerState;
  safeDisplayName: string;
};

export type ActiveDuelAdSlot = {
  reserved: boolean;
  visible: boolean;
};

export type ActiveDuelViewModel = {
  activeReaction: ActiveDuelReactionId | null;
  adSlot: ActiveDuelAdSlot;
  availableReactions: ActiveDuelReactionId[];
  gameLanguage: GameLanguage;
  maxAttempts: number;
  mutedReactions: boolean;
  opponent: ActiveDuelOpponentSummary;
  ownBoardRows: ActiveDuelBoardRow[];
  ownKeyboardFeedback: Record<string, LetterFeedback>;
  ownRoundState: ActiveDuelOwnRoundState;
  ownSide: 'a' | 'b';
  remainingSeconds: number;
  roundNumber: number;
  wordLength: number;
};

type DemoActiveDuelScenario = 'editing' | 'waiting_for_rival';

export const ACTIVE_DUEL_REACTION_IDS: readonly ActiveDuelReactionId[] = [
  'gg',
  'nice',
  'close',
  'almost',
  'your_turn',
  'tick_tock',
];

export const ACTIVE_DUEL_MOBILE_LAYOUT_ORDER = [
  'header',
  'timer',
  'opponentSummary',
  'ownBoard',
  'ownStatus',
  'reactions',
  'keyboard',
  'adSlot',
] as const;

export const ACTIVE_DUEL_KEY_ROWS: Record<GameLanguage, readonly string[][]> = {
  en: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ],
  es: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ],
  ca: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ],
  fr: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ],
  de: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ],
};

export function createDemoActiveDuelViewModel(input: {
  gameLanguage: GameLanguage;
  includeAdSlot?: boolean;
  initialLetters?: readonly string[];
  ownSide?: 'a' | 'b';
  remainingSeconds?: number;
  scenario?: DemoActiveDuelScenario;
}): ActiveDuelViewModel {
  const scenario = input.scenario ?? 'waiting_for_rival';
  const revealedFeedback: LetterFeedback[] = ['exact', 'exact', 'absent', 'absent', 'absent'];
  const currentRoundRow =
    scenario === 'editing'
      ? rowFromLetters({
          feedback: null,
          letters: input.initialLetters ?? [],
          state: 'editing',
        })
      : rowFromLetters({
          feedback: null,
          letters: ['A', 'R', 'O', 'S', 'E'],
          state: 'submitted_pending',
        });
  const ownBoardRows: ActiveDuelBoardRow[] = [
    rowFromLetters({
      feedback: revealedFeedback,
      letters: ['C', 'I', 'V', 'I', 'C'],
      state: 'revealed',
    }),
    currentRoundRow,
    ...Array.from({ length: WORD_DUEL_MAX_ATTEMPTS - 2 }, () => emptyRow()),
  ];

  return {
    activeReaction: null,
    adSlot: {
      reserved: input.includeAdSlot ?? true,
      visible: input.includeAdSlot ?? true,
    },
    availableReactions: [...ACTIVE_DUEL_REACTION_IDS],
    gameLanguage: input.gameLanguage,
    maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
    mutedReactions: false,
    opponent: {
      attemptMarkers: ['failed', 'submitted', 'waiting', 'waiting', 'waiting', 'waiting'],
      presence: 'connected',
      roundState: 'submitted',
      safeDisplayName: 'Rival',
    },
    ownBoardRows,
    ownKeyboardFeedback: keyboardFeedbackFromRows(ownBoardRows),
    ownRoundState: scenario === 'editing' ? 'rival_submitted' : 'waiting_for_rival',
    ownSide: input.ownSide ?? 'a',
    remainingSeconds: input.remainingSeconds ?? 37,
    roundNumber: 2,
    wordLength: WORD_DUEL_WORD_LENGTH,
  };
}

export function createRuntimeActiveDuelViewModel(input: {
  gameLanguage: GameLanguage;
  includeAdSlot?: boolean;
  ownSide: 'a' | 'b';
  remainingSeconds?: number;
  roundNumber: number;
}): ActiveDuelViewModel {
  const roundNumber = clampRoundNumber(input.roundNumber);
  const ownBoardRows = Array.from(
    { length: WORD_DUEL_MAX_ATTEMPTS },
    (_, index) => emptyRow(index === roundNumber - 1 ? 'editing' : 'empty'),
  );

  return {
    activeReaction: null,
    adSlot: {
      reserved: input.includeAdSlot ?? true,
      visible: input.includeAdSlot ?? true,
    },
    availableReactions: [...ACTIVE_DUEL_REACTION_IDS],
    gameLanguage: input.gameLanguage,
    maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
    mutedReactions: false,
    opponent: {
      attemptMarkers: Array.from({ length: WORD_DUEL_MAX_ATTEMPTS }, () => 'waiting'),
      presence: 'connected',
      roundState: 'waiting',
      safeDisplayName: 'Rival',
    },
    ownBoardRows,
    ownKeyboardFeedback: keyboardFeedbackFromRows(ownBoardRows),
    ownRoundState: 'editing',
    ownSide: input.ownSide,
    remainingSeconds: input.remainingSeconds ?? 37,
    roundNumber,
    wordLength: WORD_DUEL_WORD_LENGTH,
  };
}

export function isActiveDuelInputOpen(roundState: ActiveDuelOwnRoundState): boolean {
  return roundState === 'editing' || roundState === 'rival_submitted';
}

export function updateActiveDuelEditingLetters(
  viewModel: ActiveDuelViewModel,
  letters: readonly string[],
): ActiveDuelViewModel {
  const currentRowIndex = viewModel.roundNumber - 1;
  const nextRows = replaceRoundRow(
    viewModel,
    rowFromLetters({
      feedback: null,
      letters: clampLetters(letters, viewModel.wordLength),
      state: 'editing',
    }),
    currentRowIndex,
  );

  return {
    ...viewModel,
    ownBoardRows: nextRows,
    ownRoundState: isActiveDuelInputOpen(viewModel.ownRoundState) ? viewModel.ownRoundState : 'editing',
    ownKeyboardFeedback: keyboardFeedbackFromRows(nextRows),
  };
}

export function markActiveDuelGuessSubmitted(
  viewModel: ActiveDuelViewModel,
  letters: readonly string[],
): ActiveDuelViewModel {
  const currentRowIndex = viewModel.roundNumber - 1;
  const nextRows = replaceRoundRow(
    viewModel,
    rowFromLetters({
      feedback: null,
      letters: clampLetters(letters, viewModel.wordLength),
      state: 'submitted_pending',
    }),
    currentRowIndex,
  );

  return {
    ...viewModel,
    ownBoardRows: nextRows,
    ownKeyboardFeedback: keyboardFeedbackFromRows(nextRows),
    ownRoundState: 'waiting_for_rival',
  };
}

export function markActiveDuelTimedOut(viewModel: ActiveDuelViewModel): ActiveDuelViewModel {
  const currentRowIndex = viewModel.roundNumber - 1;
  const nextRows = replaceRoundRow(viewModel, emptyRow('timeout'), currentRowIndex);

  return {
    ...viewModel,
    ownBoardRows: nextRows,
    ownRoundState: 'timed_out',
  };
}

export function openActiveDuelNextLocalRound(viewModel: ActiveDuelViewModel): ActiveDuelViewModel {
  const nextRoundNumber = Math.min(viewModel.roundNumber + 1, viewModel.maxAttempts);
  const nextRowIndex = nextRoundNumber - 1;
  const nextRows = replaceRoundRow(viewModel, emptyRow('editing'), nextRowIndex);

  return {
    ...viewModel,
    activeReaction: null,
    ownBoardRows: nextRows,
    ownRoundState: 'editing',
    roundNumber: nextRoundNumber,
  };
}

export function revealActiveDuelOwnRoundFeedback(
  viewModel: ActiveDuelViewModel,
  input: {
    feedback: readonly LetterFeedback[];
    letters: readonly string[];
    roundNumber: number;
  },
): ActiveDuelViewModel {
  const rowIndex = input.roundNumber - 1;
  if (rowIndex < 0 || rowIndex >= viewModel.ownBoardRows.length) {
    return viewModel;
  }

  const nextRows = replaceRoundRow(
    viewModel,
    rowFromLetters({
      feedback: input.feedback.slice(0, viewModel.wordLength),
      letters: clampLetters(input.letters, viewModel.wordLength),
      state: 'revealed',
    }),
    rowIndex,
  );

  return {
    ...viewModel,
    ownBoardRows: nextRows,
    ownKeyboardFeedback: keyboardFeedbackFromRows(nextRows),
    ownRoundState: input.roundNumber === viewModel.roundNumber ? 'resolving' : viewModel.ownRoundState,
  };
}

function rowFromLetters(input: {
  feedback: LetterFeedback[] | null;
  letters: readonly string[];
  state: ActiveDuelOwnRowState;
}): ActiveDuelBoardRow {
  return {
    state: input.state,
    cells: Array.from({ length: WORD_DUEL_WORD_LENGTH }, (_, index) => ({
      feedback: input.feedback?.[index] ?? null,
      letter: input.letters[index] ?? null,
    })),
  };
}

function emptyRow(state: ActiveDuelOwnRowState = 'empty'): ActiveDuelBoardRow {
  return rowFromLetters({
    feedback: null,
    letters: [],
    state,
  });
}

function replaceRoundRow(
  viewModel: ActiveDuelViewModel,
  row: ActiveDuelBoardRow,
  rowIndex: number,
): ActiveDuelBoardRow[] {
  return viewModel.ownBoardRows.map((existingRow, index) => (index === rowIndex ? row : existingRow));
}

function clampLetters(letters: readonly string[], wordLength: number): string[] {
  return letters.slice(0, wordLength).map((letter) => letter.toUpperCase());
}

function clampRoundNumber(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(WORD_DUEL_MAX_ATTEMPTS, Math.max(1, Math.trunc(value)));
}

function keyboardFeedbackFromRows(rows: ActiveDuelBoardRow[]): Record<string, LetterFeedback> {
  const feedbackByKey: Record<string, LetterFeedback> = {};

  for (const row of rows) {
    if (row.state !== 'revealed') {
      continue;
    }

    row.cells.forEach((cell) => {
      if (!cell.letter || !cell.feedback) {
        return;
      }
      const key = cell.letter.toLowerCase();
      const current = feedbackByKey[key];
      if (!current || feedbackRank(cell.feedback) > feedbackRank(current)) {
        feedbackByKey[key] = cell.feedback;
      }
    });
  }

  return feedbackByKey;
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
