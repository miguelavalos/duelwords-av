import {
  WORD_DUEL_MAX_ATTEMPTS,
  WORD_DUEL_WORD_LENGTH,
  type GameLanguage,
  type LetterFeedback,
} from '../word-duel-engine/types';

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
export type ActiveDuelOpponentRoundSummary =
  | {
      exactCount: number;
      roundNumber: number;
      state: 'scored';
      validCount: number;
    }
  | {
      roundNumber: number;
      state: 'timeout';
    };
export type ActiveDuelPresenceState = 'connected' | 'reconnecting' | 'disconnected';
export type ActiveDuelReactionId =
  | 'gg'
  | 'nice'
  | 'close'
  | 'almost'
  | 'your_turn'
  | 'tick_tock'
  | 'no_pressure'
  | 'wow';

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
  roundSummaries: ActiveDuelOpponentRoundSummary[];
  safeDisplayName: string;
};

export type ActiveDuelViewModel = {
  acceptsReactions: boolean;
  activeReaction: ActiveDuelReactionId | null;
  availableReactions: ActiveDuelReactionId[];
  gameLanguage: GameLanguage;
  maxAttempts: number;
  opponentAcceptsReactions: boolean;
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
  'no_pressure',
  'wow',
];

export const ACTIVE_DUEL_MOBILE_LAYOUT_ORDER = [
  'header',
  'timer',
  'opponentSummary',
  'ownBoard',
  'ownStatus',
  'reactions',
  'keyboard',
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
  initialLetters?: readonly string[];
  maxAttempts?: number;
  ownSide?: 'a' | 'b';
  remainingSeconds?: number;
  scenario?: DemoActiveDuelScenario;
  wordLength?: number;
}): ActiveDuelViewModel {
  const scenario = input.scenario ?? 'waiting_for_rival';
  const maxAttempts = input.maxAttempts ?? WORD_DUEL_MAX_ATTEMPTS;
  const wordLength = input.wordLength ?? WORD_DUEL_WORD_LENGTH;
  const revealedFeedback: LetterFeedback[] = ['exact', 'exact', 'absent', 'absent', 'absent'];
  const currentRoundRow =
    scenario === 'editing'
      ? rowFromLetters({
          feedback: null,
          letters: input.initialLetters ?? [],
          state: 'editing',
          wordLength,
        })
      : rowFromLetters({
          feedback: null,
          letters: ['A', 'R', 'O', 'S', 'E'],
          state: 'submitted_pending',
          wordLength,
        });
  const ownBoardRows: ActiveDuelBoardRow[] = [
    rowFromLetters({
      feedback: revealedFeedback,
      letters: ['C', 'I', 'V', 'I', 'C'],
      state: 'revealed',
      wordLength,
    }),
    currentRoundRow,
    ...Array.from({ length: maxAttempts - 2 }, () => emptyRow('empty', wordLength)),
  ];

  return {
    acceptsReactions: true,
    activeReaction: null,
    availableReactions: [...ACTIVE_DUEL_REACTION_IDS],
    gameLanguage: input.gameLanguage,
    maxAttempts,
    opponentAcceptsReactions: true,
    opponent: {
      attemptMarkers: Array.from({ length: maxAttempts }, (_, index) => (
        index === 0 ? 'failed' : index === 1 ? 'submitted' : 'waiting'
      )),
      presence: 'connected',
      roundState: 'submitted',
      roundSummaries: [
        { exactCount: 1, roundNumber: 1, state: 'scored', validCount: 3 },
      ],
      safeDisplayName: 'Rival',
    },
    ownBoardRows,
    ownKeyboardFeedback: keyboardFeedbackFromRows(ownBoardRows),
    ownRoundState: scenario === 'editing' ? 'rival_submitted' : 'waiting_for_rival',
    ownSide: input.ownSide ?? 'a',
    remainingSeconds: input.remainingSeconds ?? 37,
    roundNumber: 2,
    wordLength,
  };
}

export function createRuntimeActiveDuelViewModel(input: {
  gameLanguage: GameLanguage;
  maxAttempts?: number;
  ownSide: 'a' | 'b';
  remainingSeconds?: number;
  roundNumber: number;
  wordLength?: number;
}): ActiveDuelViewModel {
  const maxAttempts = input.maxAttempts ?? WORD_DUEL_MAX_ATTEMPTS;
  const wordLength = input.wordLength ?? WORD_DUEL_WORD_LENGTH;
  const roundNumber = clampRoundNumber(input.roundNumber, maxAttempts);
  const ownBoardRows = Array.from(
    { length: maxAttempts },
    (_, index) => emptyRow(index === roundNumber - 1 ? 'editing' : 'empty', wordLength),
  );

  return {
    acceptsReactions: true,
    activeReaction: null,
    availableReactions: [...ACTIVE_DUEL_REACTION_IDS],
    gameLanguage: input.gameLanguage,
    maxAttempts,
    opponentAcceptsReactions: true,
    opponent: {
      attemptMarkers: Array.from({ length: maxAttempts }, () => 'waiting'),
      presence: 'connected',
      roundState: 'waiting',
      roundSummaries: [],
      safeDisplayName: 'Rival',
    },
    ownBoardRows,
    ownKeyboardFeedback: keyboardFeedbackFromRows(ownBoardRows),
    ownRoundState: 'editing',
    ownSide: input.ownSide,
    remainingSeconds: input.remainingSeconds ?? 37,
    roundNumber,
    wordLength,
  };
}

export function isActiveDuelInputOpen(roundState: ActiveDuelOwnRoundState): boolean {
  return roundState === 'editing' || roundState === 'rival_submitted';
}

export function shouldReportActiveDuelTimeoutFailure(
  viewModel: ActiveDuelViewModel,
  attemptedRoundNumber: number,
): boolean {
  return viewModel.roundNumber === attemptedRoundNumber
    && isActiveDuelInputOpen(viewModel.ownRoundState);
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
      wordLength: viewModel.wordLength,
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
  roundNumber = viewModel.roundNumber,
): ActiveDuelViewModel {
  const currentRowIndex = roundNumber - 1;
  const currentRow = viewModel.ownBoardRows[currentRowIndex];
  if (
    currentRowIndex < 0
    || currentRowIndex >= viewModel.ownBoardRows.length
    || roundNumber > viewModel.roundNumber
    || currentRow?.state === 'revealed'
    || currentRow?.state === 'timeout'
  ) {
    return viewModel;
  }
  const nextRows = replaceRoundRow(
    viewModel,
    rowFromLetters({
      feedback: null,
      letters: clampLetters(letters, viewModel.wordLength),
      state: 'submitted_pending',
      wordLength: viewModel.wordLength,
    }),
    currentRowIndex,
  );

  return {
    ...viewModel,
    ownBoardRows: nextRows,
    ownKeyboardFeedback: keyboardFeedbackFromRows(nextRows),
    ownRoundState: roundNumber === viewModel.roundNumber
      ? 'waiting_for_rival'
      : viewModel.ownRoundState,
  };
}

export function markActiveDuelTimedOut(
  viewModel: ActiveDuelViewModel,
  roundNumber = viewModel.roundNumber,
): ActiveDuelViewModel {
  const rowIndex = roundNumber - 1;
  if (rowIndex < 0 || rowIndex >= viewModel.ownBoardRows.length) {
    return viewModel;
  }
  const currentRow = viewModel.ownBoardRows[rowIndex];
  if (currentRow?.state === 'revealed' || currentRow?.state === 'timeout') {
    return viewModel;
  }
  const nextRows = replaceRoundRow(viewModel, emptyRow('timeout', viewModel.wordLength), rowIndex);

  return {
    ...viewModel,
    ownBoardRows: nextRows,
    ownRoundState: roundNumber === viewModel.roundNumber ? 'timed_out' : viewModel.ownRoundState,
  };
}

export function reconcileActiveDuelResolvedOwnRow(
  viewModel: ActiveDuelViewModel,
  resolvedViewModel: ActiveDuelViewModel,
  roundNumber: number,
): ActiveDuelViewModel {
  const rowIndex = roundNumber - 1;
  const resolvedRow = resolvedViewModel.ownBoardRows[rowIndex];
  if (
    rowIndex < 0
    || rowIndex >= viewModel.ownBoardRows.length
    || (resolvedRow?.state !== 'revealed' && resolvedRow?.state !== 'timeout')
  ) {
    return viewModel;
  }

  const nextRows = replaceRoundRow(viewModel, resolvedRow, rowIndex);
  return {
    ...viewModel,
    ownBoardRows: nextRows,
    ownKeyboardFeedback: keyboardFeedbackFromRows(nextRows),
  };
}

export function openActiveDuelNextLocalRound(viewModel: ActiveDuelViewModel): ActiveDuelViewModel {
  return synchronizeActiveDuelRound(viewModel, viewModel.roundNumber + 1);
}

export function synchronizeActiveDuelRound(
  viewModel: ActiveDuelViewModel,
  authoritativeRoundNumber: number,
): ActiveDuelViewModel {
  const nextRoundNumber = Math.min(
    Math.max(1, Math.trunc(authoritativeRoundNumber)),
    viewModel.maxAttempts,
  );
  if (nextRoundNumber <= viewModel.roundNumber) {
    return viewModel;
  }
  const nextRowIndex = nextRoundNumber - 1;
  const nextRows = replaceRoundRow(viewModel, emptyRow('editing', viewModel.wordLength), nextRowIndex);

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
      wordLength: viewModel.wordLength,
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
  wordLength?: number;
}): ActiveDuelBoardRow {
  return {
    state: input.state,
    cells: Array.from({ length: input.wordLength ?? WORD_DUEL_WORD_LENGTH }, (_, index) => ({
      feedback: input.feedback?.[index] ?? null,
      letter: input.letters[index] ?? null,
    })),
  };
}

function emptyRow(
  state: ActiveDuelOwnRowState = 'empty',
  wordLength = WORD_DUEL_WORD_LENGTH,
): ActiveDuelBoardRow {
  return rowFromLetters({
    feedback: null,
    letters: [],
    state,
    wordLength,
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

function clampRoundNumber(value: number, maxAttempts = WORD_DUEL_MAX_ATTEMPTS): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(maxAttempts, Math.max(1, Math.trunc(value)));
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
