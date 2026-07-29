import {
  buildRoundScopedDuelWordsPath,
  createMockActiveDuelClient,
  type DuelWordsActorIdentity,
  type DuelWordsOpenNextRoundResult,
  type DuelWordsSubmitGuessResult,
  type DuelWordsTimeoutRoundResult,
} from './api-adapter';
import type { WordDuelActiveHandoff } from './handoff';
import type {
  DuelWordsApiClient,
  DuelWordsApiFeedbackState,
  DuelWordsApiFinalResult,
  DuelWordsApiOwnRoundSnapshot,
  DuelWordsApiPresenceReconciliation,
  DuelWordsApiRematchProposal,
  DuelWordsApiSafeGame,
} from '../word-duel-lobby/api-client';
import type { GameLanguage, LetterFeedback } from '../word-duel-engine';
import { normalizeGuess } from '../word-duel-engine';
import { createDuelWordsRealtimeProjectionClient } from './realtime-client';
import {
  activeDuelReactionToRealtimeKey,
  applyRealtimeProjectionToActiveDuelViewModel,
  type DuelWordsRealtimeProjectionClient,
  type DuelWordsRealtimeMutationResult,
  type DuelWordsRealtimeRoomView,
  type DuelWordsRealtimeSubscription,
} from './realtime-projection';
import {
  toDuelWordsRealtimeSessionRequest,
  type DuelWordsBackendRealtimeSession,
} from './realtime-session';
import {
  createDemoActiveDuelViewModel,
  type ActiveDuelReactionId,
  type ActiveDuelViewModel,
  markActiveDuelGuessSubmitted,
  markActiveDuelTimedOut,
  synchronizeActiveDuelRound,
  revealActiveDuelOwnRoundFeedback,
} from './view-model';

const LOCAL_ACTIVE_DEMO_GAME_ID = 'local-active-demo';
const LOCAL_ACTIVE_DEMO_PLAYER_ID = 'local-player-a';
const LOCAL_ACTIVE_DEMO_ROOM_TOKEN = 'local-active-room';
const LOCAL_ACTIVE_DEMO_REALTIME_SESSION_ID = 'local-realtime-session';
const LOCAL_ACTIVE_DEMO_ACTOR: DuelWordsActorIdentity = {
  actorType: 'guest_session',
  guestSessionId: 'local-demo-session',
};

export type WordDuelActiveControllerMode = 'local_mock' | 'runtime';
export type WordDuelActiveControllerSource = 'apps_av_api' | 'disabled_runtime' | 'local_mock';

export type WordDuelActiveRuntimeSession = {
  actor: DuelWordsActorIdentity;
  gameId: string;
  playerId: string;
  realtime: DuelWordsBackendRealtimeSession;
};

export type WordDuelActiveRuntimeClients = {
  apiClient: DuelWordsApiClient;
  initialViewModel?: ActiveDuelViewModel;
  realtimeClient: DuelWordsRealtimeProjectionClient;
  session: WordDuelActiveRuntimeSession;
};

export type WordDuelActiveOwnRoundSnapshotResult = {
  feedbackAvailable: boolean;
  opponentStatus: DuelWordsApiOwnRoundSnapshot['opponent']['status'];
  ownStatus: DuelWordsApiOwnRoundSnapshot['own']['status'];
  roundNumber: number;
  viewModel: ActiveDuelViewModel;
};

export type WordDuelActiveController = {
  source: WordDuelActiveControllerSource;
  acceptRematchProposal(input: {
    proposalId: string;
  }): Promise<DuelWordsApiRematchProposal>;
  cancelRematchProposal(input: {
    proposalId: string;
  }): Promise<DuelWordsApiRematchProposal>;
  createRematchProposal(input: {
    language: GameLanguage;
  }): Promise<DuelWordsApiRematchProposal>;
  declineRematchProposal(input: {
    proposalId: string;
  }): Promise<DuelWordsApiRematchProposal>;
  getFinalResult(): Promise<DuelWordsApiFinalResult>;
  getCurrentRematchProposal(): Promise<DuelWordsApiRematchProposal | null>;
  getViewModel(): ActiveDuelViewModel;
  openNextRoundIfDue(input: {
    roundNumber: number;
  }): Promise<DuelWordsOpenNextRoundResult>;
  publishLocalPlayerSubmittedProjection(input: {
    roundNumber: number;
  }): void;
  refreshOwnRoundSnapshot(input: {
    roundNumber: number;
  }): Promise<WordDuelActiveOwnRoundSnapshotResult>;
  reconcilePresence(): Promise<DuelWordsApiPresenceReconciliation>;
  sendPresenceHeartbeat(): Promise<DuelWordsRealtimeMutationResult>;
  sendReaction(input: {
    clientRequestId: string;
    reaction: ActiveDuelReactionId;
  }): Promise<DuelWordsRealtimeMutationResult>;
  submitGuess(input: {
    clientRequestId: string;
    guess: string;
    roundNumber: number;
  }): Promise<DuelWordsSubmitGuessResult>;
  subscribeActiveRoomView(
    listener: (view: DuelWordsRealtimeRoomView | null) => void,
  ): DuelWordsRealtimeSubscription;
  timeoutRound(input: {
    roundNumber: number;
  }): Promise<DuelWordsTimeoutRoundResult>;
};

export type WordDuelActiveControllerErrorCode = 'controller_not_available';

export class WordDuelActiveControllerError extends Error {
  readonly code: WordDuelActiveControllerErrorCode;

  constructor(code: WordDuelActiveControllerErrorCode, message: string) {
    super(message);
    this.name = 'WordDuelActiveControllerError';
    this.code = code;
  }
}

export function createWordDuelActiveController(input: {
  handoff: WordDuelActiveHandoff;
  mode?: WordDuelActiveControllerMode;
  now?: () => Date;
  realtimeNow?: () => number;
  runtime?: WordDuelActiveRuntimeClients;
}): WordDuelActiveController {
  if (input.mode === 'runtime') {
    if (input.runtime) {
      return createAppsApiWordDuelActiveController({
        handoff: input.handoff,
        nowMs: input.realtimeNow,
        runtime: input.runtime,
      });
    }

    return createDisabledRuntimeWordDuelActiveController(input.handoff);
  }

  return createLocalMockWordDuelActiveController({
    handoff: input.handoff,
    now: input.now,
    realtimeNow: input.realtimeNow,
  });
}

function createLocalMockWordDuelActiveController(input: {
  handoff: WordDuelActiveHandoff;
  now?: () => Date;
  realtimeNow?: () => number;
}): WordDuelActiveController {
  const activeClient = createMockActiveDuelClient({
    gameId: LOCAL_ACTIVE_DEMO_GAME_ID,
    gameLanguage: input.handoff.gameLanguage,
    now: input.now,
    playerId: LOCAL_ACTIVE_DEMO_PLAYER_ID,
    remainingSeconds: 37,
  });
  const realtimeClient = createDuelWordsRealtimeProjectionClient({
    gameLanguage: input.handoff.gameLanguage,
    mode: 'local_mock',
    now: input.realtimeNow,
    ownSide: 'a',
    realtimeSessionId: LOCAL_ACTIVE_DEMO_REALTIME_SESSION_ID,
    remainingMs: 37_000,
    roomToken: LOCAL_ACTIVE_DEMO_ROOM_TOKEN,
  }).client;

  return {
    source: 'local_mock',

    async acceptRematchProposal() {
      throw new WordDuelActiveControllerError(
        'controller_not_available',
        'The local active demo does not expose Apps AV API rematch proposals.',
      );
    },

    async cancelRematchProposal() {
      throw new WordDuelActiveControllerError(
        'controller_not_available',
        'The local active demo does not expose Apps AV API rematch proposals.',
      );
    },

    async createRematchProposal() {
      throw new WordDuelActiveControllerError(
        'controller_not_available',
        'The local active demo does not expose Apps AV API rematch proposals.',
      );
    },

    async declineRematchProposal() {
      throw new WordDuelActiveControllerError(
        'controller_not_available',
        'The local active demo does not expose Apps AV API rematch proposals.',
      );
    },

    async getCurrentRematchProposal() {
      throw new WordDuelActiveControllerError(
        'controller_not_available',
        'The local active demo does not expose Apps AV API rematch proposals.',
      );
    },

    getViewModel() {
      return activeClient.getViewModel();
    },

    async getFinalResult() {
      throw new WordDuelActiveControllerError(
        'controller_not_available',
        'The local active demo does not expose an Apps AV API final result.',
      );
    },

    openNextRoundIfDue({ roundNumber }) {
      return activeClient.openNextRoundIfDue({
        gameId: LOCAL_ACTIVE_DEMO_GAME_ID,
        roundNumber,
      });
    },

    publishLocalPlayerSubmittedProjection({ roundNumber }) {
      realtimeClient.publishLocalPlayerSubmittedProjection({
        roomToken: LOCAL_ACTIVE_DEMO_ROOM_TOKEN,
        roundNumber,
        side: 'a',
      });
    },

    async refreshOwnRoundSnapshot({ roundNumber }) {
      const current = activeClient.getViewModel();
      const row = current.ownBoardRows[roundNumber - 1];
      const ownStatus = row?.state === 'revealed'
        ? 'accepted'
        : row?.state === 'submitted_pending'
          ? 'submitted_pending'
          : row?.state === 'timeout'
            ? 'timeout'
            : 'waiting';

      return {
        feedbackAvailable: row?.state === 'revealed',
        opponentStatus: current.opponent.roundState === 'timeout'
          ? 'timed_out'
          : current.opponent.roundState === 'waiting'
            ? 'waiting'
            : 'submitted',
        ownStatus,
        roundNumber,
        viewModel: current,
      };
    },

    async reconcilePresence() {
      throw new WordDuelActiveControllerError(
        'controller_not_available',
        'The local active demo does not reconcile remote presence.',
      );
    },

    sendPresenceHeartbeat() {
      return realtimeClient.sendPresenceHeartbeat({
        realtimeSessionId: LOCAL_ACTIVE_DEMO_REALTIME_SESSION_ID,
        roomToken: LOCAL_ACTIVE_DEMO_ROOM_TOKEN,
      });
    },

    sendReaction({ clientRequestId, reaction }) {
      return realtimeClient.sendReaction({
        clientRequestId,
        reactionKey: activeDuelReactionToRealtimeKey(reaction),
        realtimeSessionId: LOCAL_ACTIVE_DEMO_REALTIME_SESSION_ID,
        roomToken: LOCAL_ACTIVE_DEMO_ROOM_TOKEN,
      });
    },

    submitGuess({ clientRequestId, guess, roundNumber }) {
      return activeClient.submitGuess({
        actor: LOCAL_ACTIVE_DEMO_ACTOR,
        clientRequestId,
        gameId: LOCAL_ACTIVE_DEMO_GAME_ID,
        guess,
        playerId: LOCAL_ACTIVE_DEMO_PLAYER_ID,
        roundNumber,
      });
    },

    subscribeActiveRoomView(listener) {
      return realtimeClient.subscribeActiveRoomView(
        {
          realtimeSessionId: LOCAL_ACTIVE_DEMO_REALTIME_SESSION_ID,
          roomToken: LOCAL_ACTIVE_DEMO_ROOM_TOKEN,
        },
        listener,
      );
    },

    timeoutRound({ roundNumber }) {
      return activeClient.timeoutRound({
        actor: LOCAL_ACTIVE_DEMO_ACTOR,
        gameId: LOCAL_ACTIVE_DEMO_GAME_ID,
        playerId: LOCAL_ACTIVE_DEMO_PLAYER_ID,
        roundNumber,
      });
    },
  };
}

function createAppsApiWordDuelActiveController(input: {
  handoff: WordDuelActiveHandoff;
  nowMs?: () => number;
  runtime: WordDuelActiveRuntimeClients;
}): WordDuelActiveController {
  const { apiClient, realtimeClient, session } = input.runtime;
  const realtimeRequest = toDuelWordsRealtimeSessionRequest(session.realtime);
  const nowMs = input.nowMs ?? (() => Date.now());
  let viewModel =
    input.runtime.initialViewModel ??
    createDemoActiveDuelViewModel({
      gameLanguage: input.handoff.gameLanguage,
      ownSide: session.realtime.side,
      remainingSeconds: 37,
      scenario: 'editing',
    });

  function updateFromProjection(view: DuelWordsRealtimeRoomView | null) {
    if (view) {
      viewModel = applyRealtimeProjectionToActiveDuelViewModel(viewModel, view);
    }
  }

  async function updateFromCurrentRealtimeViewAfter(
    result: DuelWordsRealtimeMutationResult,
  ): Promise<DuelWordsRealtimeMutationResult> {
    if (result.ok) {
      updateFromProjection(await realtimeClient.getActiveRoomView(realtimeRequest));
    }

    return result;
  }

  return {
    source: 'apps_av_api',

    acceptRematchProposal({ proposalId }) {
      return apiClient.acceptRematchProposal({
        actor: session.actor,
        gameId: session.gameId,
        playerId: session.playerId,
        proposalId,
      });
    },

    cancelRematchProposal({ proposalId }) {
      return apiClient.cancelRematchProposal({
        actor: session.actor,
        gameId: session.gameId,
        playerId: session.playerId,
        proposalId,
      });
    },

    createRematchProposal({ language }) {
      return apiClient.createRematchProposal({
        actor: session.actor,
        gameId: session.gameId,
        language,
        playerId: session.playerId,
      });
    },

    declineRematchProposal({ proposalId }) {
      return apiClient.declineRematchProposal({
        actor: session.actor,
        gameId: session.gameId,
        playerId: session.playerId,
        proposalId,
      });
    },

    getCurrentRematchProposal() {
      return apiClient.getCurrentRematchProposal({
        actor: session.actor,
        gameId: session.gameId,
        playerId: session.playerId,
      });
    },

    getViewModel() {
      return viewModel;
    },

    getFinalResult() {
      return apiClient.getFinalResult({
        actor: session.actor,
        gameId: session.gameId,
        playerId: session.playerId,
      });
    },

    async openNextRoundIfDue({ roundNumber }) {
      const response = await apiClient.openNextRoundIfDue({
        gameId: session.gameId,
        roundNumber,
      });
      const previousRoundNumber = viewModel.roundNumber;
      if (response.game.currentRound > previousRoundNumber) {
        viewModel = synchronizeActiveDuelRound(viewModel, response.game.currentRound);
      }

      return {
        advanced: response.game.currentRound > previousRoundNumber,
        game: activeGameFromApi(response.game, session.playerId, viewModel, nowMs()),
        requestPath: buildRoundScopedDuelWordsPath({
          action: 'open-next-if-due',
          gameId: session.gameId,
          roundNumber,
        }),
        viewModel,
      };
    },

    publishLocalPlayerSubmittedProjection() {
      return undefined;
    },

    async refreshOwnRoundSnapshot({ roundNumber }) {
      const snapshot = await apiClient.getOwnRoundSnapshot({
        actor: session.actor,
        gameId: session.gameId,
        playerId: session.playerId,
        roundNumber,
      });
      viewModel = applyOwnRoundSnapshotToViewModel(viewModel, snapshot);

      return {
        feedbackAvailable: snapshot.feedbackAvailable,
        opponentStatus: snapshot.opponent.status,
        ownStatus: snapshot.own.status,
        roundNumber: snapshot.roundNumber,
        viewModel,
      };
    },

    reconcilePresence() {
      return apiClient.reconcilePresence({
        actor: session.actor,
        gameId: session.gameId,
        playerId: session.playerId,
      });
    },

    async sendPresenceHeartbeat() {
      return updateFromCurrentRealtimeViewAfter(await realtimeClient.sendPresenceHeartbeat(realtimeRequest));
    },

    async sendReaction({ clientRequestId, reaction }) {
      return updateFromCurrentRealtimeViewAfter(await realtimeClient.sendReaction({
        ...realtimeRequest,
        clientRequestId,
        reactionKey: activeDuelReactionToRealtimeKey(reaction),
      }));
    },

    async submitGuess({ clientRequestId, guess, roundNumber }) {
      const response = await apiClient.submitGuess({
        actor: session.actor,
        clientRequestId,
        gameId: session.gameId,
        guess,
        playerId: session.playerId,
        roundNumber,
      });
      const letters = lettersFromGuess(guess, viewModel.gameLanguage);
      viewModel = markActiveDuelGuessSubmitted(viewModel, letters);

      return {
        game: activeGameFromApi(response.game, session.playerId, viewModel, nowMs()),
        requestPath: buildRoundScopedDuelWordsPath({
          action: 'submit',
          gameId: session.gameId,
          roundNumber,
        }),
        submission: {
          acceptedAt: response.submission.submittedAt,
          clientRequestId,
          letterCount: letters.length,
          playerId: session.playerId,
          roundNumber: response.submission.roundNumber,
        },
        viewModel,
      };
    },

    subscribeActiveRoomView(listener) {
      return realtimeClient.subscribeActiveRoomView(realtimeRequest, (view) => {
        updateFromProjection(view);
        listener(view);
      });
    },

    async timeoutRound({ roundNumber }) {
      const response = await apiClient.timeoutRound({
        actor: session.actor,
        gameId: session.gameId,
        playerId: session.playerId,
        roundNumber,
      });
      viewModel = markActiveDuelTimedOut(viewModel);

      return {
        game: activeGameFromApi(response.game, session.playerId, viewModel, nowMs()),
        requestPath: buildRoundScopedDuelWordsPath({
          action: 'timeout',
          gameId: session.gameId,
          roundNumber,
        }),
        timeout: {
          consumedAt: response.timeout.timedOutAt ?? new Date(nowMs()).toISOString(),
          playerId: session.playerId,
          roundNumber: response.timeout.roundNumber,
        },
        viewModel,
      };
    },
  };
}

function createDisabledRuntimeWordDuelActiveController(
  handoff: WordDuelActiveHandoff,
): WordDuelActiveController {
  const viewModel = createDemoActiveDuelViewModel({
    gameLanguage: handoff.gameLanguage,
    remainingSeconds: 37,
    scenario: 'editing',
  });

  async function unavailable(): Promise<never> {
    throw new WordDuelActiveControllerError(
      'controller_not_available',
      'The runtime active duel controller is not available until Apps AV API and Convex are enabled.',
    );
  }

  return {
    source: 'disabled_runtime',

    acceptRematchProposal: unavailable,

    cancelRematchProposal: unavailable,

    createRematchProposal: unavailable,

    declineRematchProposal: unavailable,

    getCurrentRematchProposal: unavailable,

    getViewModel() {
      return viewModel;
    },

    getFinalResult: unavailable,

    openNextRoundIfDue: unavailable,

    publishLocalPlayerSubmittedProjection() {
      return undefined;
    },

    refreshOwnRoundSnapshot: unavailable,

    reconcilePresence: unavailable,

    async sendPresenceHeartbeat() {
      return { ok: false, reason: 'room_unavailable' };
    },

    async sendReaction() {
      return { ok: false, reason: 'room_unavailable' };
    },

    submitGuess: unavailable,

    subscribeActiveRoomView(listener) {
      listener(null);
      return () => undefined;
    },

    timeoutRound: unavailable,
  };
}

function applyOwnRoundSnapshotToViewModel(
  viewModel: ActiveDuelViewModel,
  snapshot: DuelWordsApiOwnRoundSnapshot,
): ActiveDuelViewModel {
  if (snapshot.own.status === 'accepted') {
    return revealActiveDuelOwnRoundFeedback(viewModel, {
      feedback: snapshot.own.feedback.states.map(feedbackStateFromApi),
      letters: Array.from(snapshot.own.displayWord),
      roundNumber: snapshot.roundNumber,
    });
  }
  if (snapshot.own.status === 'timeout') {
    return markActiveDuelTimedOut(viewModel);
  }

  return viewModel;
}

function activeGameFromApi(
  game: DuelWordsApiSafeGame,
  selfPlayerId: string,
  viewModel: ActiveDuelViewModel,
  nowMs: number,
): DuelWordsSubmitGuessResult['game'] {
  const remainingSeconds = game.roundDeadlineAt
    ? Math.max(0, Math.ceil((Date.parse(game.roundDeadlineAt) - nowMs) / 1000))
    : viewModel.remainingSeconds;

  return {
    currentRound: game.currentRound,
    gameId: game.gameId,
    language: game.language,
    maxAttempts: game.maxAttempts,
    mode: game.mode,
    players: game.players.map((player) => ({
      isSelf: player.playerId === selfPlayerId,
      playerId: player.playerId,
      side: player.side,
      status: activePlayerStatusFromViewModel(player.playerId === selfPlayerId, viewModel),
    })),
    remainingSeconds,
    status: activeGameStatusFromApi(game.status),
    wordLength: game.wordLength,
  };
}

function activeGameStatusFromApi(status: DuelWordsApiSafeGame['status']): DuelWordsSubmitGuessResult['game']['status'] {
  if (status === 'round_resolving') {
    return 'resolving';
  }
  if (status === 'finalized') {
    return 'finished';
  }

  return 'active';
}

function activePlayerStatusFromViewModel(
  isSelf: boolean,
  viewModel: ActiveDuelViewModel,
): DuelWordsSubmitGuessResult['game']['players'][number]['status'] {
  if (isSelf) {
    if (viewModel.ownRoundState === 'timed_out') {
      return 'timed_out';
    }
    return viewModel.ownRoundState === 'waiting_for_rival' || viewModel.ownRoundState === 'resolving'
      ? 'submitted'
      : 'active';
  }

  return viewModel.opponent.roundState === 'timeout' ? 'timed_out' : 'submitted';
}

function feedbackStateFromApi(value: DuelWordsApiFeedbackState): LetterFeedback {
  if (value === 'correct') {
    return 'exact';
  }
  if (value === 'present') {
    return 'present';
  }
  return 'absent';
}

function lettersFromGuess(guess: string, gameLanguage: ActiveDuelViewModel['gameLanguage']): string[] {
  return Array.from(normalizeGuess(guess, gameLanguage)).map((letter) => letter.toUpperCase());
}
