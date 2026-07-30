import { normalizeGuess } from '../word-duel-engine/normalize';
import {
  WORD_DUEL_MAX_ATTEMPTS,
  WORD_DUEL_WORD_LENGTH,
  type GameLanguage,
} from '../word-duel-engine/types';
import {
  createDemoActiveDuelViewModel,
  isActiveDuelInputOpen,
  markActiveDuelGuessSubmitted,
  markActiveDuelTimedOut,
  openActiveDuelNextLocalRound,
  type ActiveDuelViewModel,
} from './view-model';

export type DuelWordsRoundAction = 'submit' | 'timeout' | 'open-next-if-due';

export type DuelWordsActorIdentity =
  | {
      actorType: 'guest_session';
      guestSessionId: string;
    }
  | {
      actorType: 'account_user';
    };

export type DuelWordsPlayerRequest = {
  actor: DuelWordsActorIdentity;
  gameId: string;
  playerId: string;
};

export type DuelWordsSubmitGuessRequest = DuelWordsPlayerRequest & {
  clientRequestId: string;
  guess: string;
  roundNumber: number;
};

export type DuelWordsTimeoutRoundRequest = DuelWordsPlayerRequest & {
  roundNumber: number;
};

export type DuelWordsOpenNextRoundRequest = {
  gameId: string;
  roundNumber: number;
};

export type DuelWordsSafeActiveGame = {
  currentRound: number;
  gameId: string;
  language: GameLanguage;
  maxAttempts: number;
  mode: 'human_duel' | 'bot_duel';
  players: {
    isSelf: boolean;
    playerId: string;
    side: 'a' | 'b';
    status: 'active' | 'submitted' | 'timed_out';
  }[];
  remainingSeconds: number;
  status: 'active' | 'resolving' | 'finished';
  wordLength: number;
};

export type DuelWordsSubmitGuessResult = {
  game: DuelWordsSafeActiveGame;
  requestPath: string;
  submission: {
    acceptedAt: string;
    clientRequestId: string;
    letterCount: number;
    playerId: string;
    roundNumber: number;
  };
  viewModel: ActiveDuelViewModel;
};

export type DuelWordsTimeoutRoundResult = {
  game: DuelWordsSafeActiveGame;
  requestPath: string;
  timeout: {
    consumedAt: string;
    playerId: string;
    roundNumber: number;
  };
  viewModel: ActiveDuelViewModel;
};

export type DuelWordsOpenNextRoundResult = {
  advanced: boolean;
  game: DuelWordsSafeActiveGame;
  requestPath: string;
  viewModel: ActiveDuelViewModel;
};

export type DuelWordsActiveDuelClient = {
  getViewModel(): ActiveDuelViewModel;
  openNextRoundIfDue(input: DuelWordsOpenNextRoundRequest): Promise<DuelWordsOpenNextRoundResult>;
  submitGuess(input: DuelWordsSubmitGuessRequest): Promise<DuelWordsSubmitGuessResult>;
  timeoutRound(input: DuelWordsTimeoutRoundRequest): Promise<DuelWordsTimeoutRoundResult>;
};

export type DuelWordsClientErrorCode =
  | 'invalid_guess_length'
  | 'invalid_round'
  | 'round_locked'
  | 'wrong_game';

export class DuelWordsClientError extends Error {
  readonly code: DuelWordsClientErrorCode;

  constructor(code: DuelWordsClientErrorCode, message: string) {
    super(message);
    this.name = 'DuelWordsClientError';
    this.code = code;
  }
}

export function buildRoundScopedDuelWordsPath(input: {
  action: DuelWordsRoundAction;
  gameId: string;
  roundNumber: number;
}): string {
  assertPositiveRound(input.roundNumber);

  return `/v1/apps/duelwords/games/${encodeURIComponent(input.gameId)}/rounds/${input.roundNumber}/${input.action}`;
}

export function createMockActiveDuelClient(input: {
  gameId?: string;
  gameLanguage?: GameLanguage;
  initialViewModel?: ActiveDuelViewModel;
  now?: () => Date;
  playerId?: string;
  remainingSeconds?: number;
} = {}): DuelWordsActiveDuelClient {
  const gameId = input.gameId ?? 'local-active-demo';
  const playerId = input.playerId ?? 'local-player-a';
  const now = input.now ?? (() => new Date());
  const acceptedSubmissions = new Map<string, DuelWordsSubmitGuessResult>();
  let viewModel =
    input.initialViewModel ??
    createDemoActiveDuelViewModel({
      gameLanguage: input.gameLanguage ?? 'en',
      remainingSeconds: input.remainingSeconds ?? 37,
      scenario: 'editing',
    });

  function assertGameMatches(requestGameId: string) {
    if (requestGameId !== gameId) {
      throw new DuelWordsClientError('wrong_game', 'The local mock client only owns one demo game.');
    }
  }

  function assertCurrentRound(roundNumber: number) {
    assertPositiveRound(roundNumber);
    if (roundNumber !== viewModel.roundNumber) {
      throw new DuelWordsClientError('invalid_round', 'Round command must target the current round.');
    }
  }

  function safeGame(status: DuelWordsSafeActiveGame['status']): DuelWordsSafeActiveGame {
    const selfStatus =
      viewModel.ownRoundState === 'timed_out'
        ? 'timed_out'
        : viewModel.ownRoundState === 'waiting_for_rival'
          ? 'submitted'
          : 'active';

    return {
      currentRound: viewModel.roundNumber,
      gameId,
      language: viewModel.gameLanguage,
      maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
      mode: 'human_duel',
      players: [
        {
          isSelf: true,
          playerId,
          side: viewModel.ownSide,
          status: selfStatus,
        },
        {
          isSelf: false,
          playerId: 'rival',
          side: viewModel.ownSide === 'a' ? 'b' : 'a',
          status: viewModel.opponent.roundState === 'timeout' ? 'timed_out' : 'submitted',
        },
      ],
      remainingSeconds: viewModel.remainingSeconds,
      status,
      wordLength: WORD_DUEL_WORD_LENGTH,
    };
  }

  return {
    getViewModel() {
      return viewModel;
    },

    async submitGuess(request) {
      assertGameMatches(request.gameId);

      const acceptedRetry = acceptedSubmissions.get(request.clientRequestId);
      if (acceptedRetry) {
        return acceptedRetry;
      }

      assertCurrentRound(request.roundNumber);

      if (!isActiveDuelInputOpen(viewModel.ownRoundState)) {
        throw new DuelWordsClientError('round_locked', 'This round is not accepting local input.');
      }

      const normalizedGuess = normalizeGuess(request.guess, viewModel.gameLanguage);
      const letters = Array.from(normalizedGuess).map((letter) => letter.toUpperCase());
      if (letters.length !== viewModel.wordLength) {
        throw new DuelWordsClientError('invalid_guess_length', 'Local mock guesses must match the word length.');
      }

      viewModel = markActiveDuelGuessSubmitted(viewModel, letters, request.roundNumber);

      const result: DuelWordsSubmitGuessResult = {
        game: safeGame('active'),
        requestPath: buildRoundScopedDuelWordsPath({
          action: 'submit',
          gameId: request.gameId,
          roundNumber: request.roundNumber,
        }),
        submission: {
          acceptedAt: now().toISOString(),
          clientRequestId: request.clientRequestId,
          letterCount: letters.length,
          playerId: request.playerId,
          roundNumber: request.roundNumber,
        },
        viewModel,
      };
      acceptedSubmissions.set(request.clientRequestId, result);

      return result;
    },

    async timeoutRound(request) {
      assertGameMatches(request.gameId);
      assertCurrentRound(request.roundNumber);

      viewModel = markActiveDuelTimedOut(viewModel, request.roundNumber);

      return {
        game: safeGame('resolving'),
        requestPath: buildRoundScopedDuelWordsPath({
          action: 'timeout',
          gameId: request.gameId,
          roundNumber: request.roundNumber,
        }),
        timeout: {
          consumedAt: now().toISOString(),
          playerId: request.playerId,
          roundNumber: request.roundNumber,
        },
        viewModel,
      };
    },

    async openNextRoundIfDue(request) {
      assertGameMatches(request.gameId);
      assertCurrentRound(request.roundNumber);

      const previousRoundNumber = viewModel.roundNumber;
      viewModel = openActiveDuelNextLocalRound(viewModel);

      return {
        advanced: viewModel.roundNumber !== previousRoundNumber,
        game: safeGame('active'),
        requestPath: buildRoundScopedDuelWordsPath({
          action: 'open-next-if-due',
          gameId: request.gameId,
          roundNumber: request.roundNumber,
        }),
        viewModel,
      };
    },
  };
}

function assertPositiveRound(roundNumber: number) {
  if (!Number.isInteger(roundNumber) || roundNumber < 1) {
    throw new DuelWordsClientError('invalid_round', 'Round number must be a positive integer.');
  }
}
