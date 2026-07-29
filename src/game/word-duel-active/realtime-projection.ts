import type {
  GameLanguage,
} from '../word-duel-engine';
import {
  type ActiveDuelOpponentMarkerState,
  type ActiveDuelPresenceState,
  type ActiveDuelReactionId,
  type ActiveDuelViewModel,
  synchronizeActiveDuelRound,
} from './view-model';

const REACTION_TTL_MS = 4000;
const MIN_MS_BETWEEN_REACTIONS_PER_SIDE = 8000;
const MAX_REACTIONS_PER_SIDE_PER_ROOM_MINUTE = 6;

export type DuelWordsRealtimeSide = 'a' | 'b';
export type DuelWordsRealtimeRoomStatus =
  | 'pending_invite'
  | 'lobby'
  | 'ready_locked'
  | 'countdown'
  | 'active_round'
  | 'round_resolving'
  | 'finalized'
  | 'cancelled_before_first_round'
  | 'expired'
  | 'technical_error';
export type DuelWordsRealtimePlayerStatus =
  | 'joined'
  | 'ready'
  | 'submitted'
  | 'timed_out'
  | 'solved'
  | 'failed'
  | 'left'
  | 'disconnected';
export type DuelWordsRealtimePresenceState = 'online' | 'disconnected';
export type DuelWordsRealtimeReactionKey =
  | 'nice'
  | 'close_one'
  | 'your_turn'
  | 'tick_tock'
  | 'almost_there'
  | 'good_duel';

export type DuelWordsRealtimeRoomView = {
  room: {
    countdownEndsAt?: number;
    language: GameLanguage;
    maxAttempts: number;
    mode: 'human_duel';
    resultReason?: string;
    roundDeadlineAt?: number;
    roundNumber: number;
    serverNow: number;
    status: DuelWordsRealtimeRoomStatus;
    winnerSide?: DuelWordsRealtimeSide | 'draw';
    wordLength: number;
  };
  own: DuelWordsRealtimePlayerView | null;
  opponent: (DuelWordsRealtimePlayerView & {
    presenceState: DuelWordsRealtimePresenceState;
  }) | null;
  reactions: DuelWordsRealtimeReactionView[];
};

export type DuelWordsRealtimePlayerView = {
  attemptCount: number;
  feedbackAvailableRound?: number;
  hasSubmittedCurrentRound: boolean;
  isReady: boolean;
  safeDisplayName: string;
  side: DuelWordsRealtimeSide;
  status: DuelWordsRealtimePlayerStatus;
  timeoutCount: number;
};

export type DuelWordsRealtimeReactionView = {
  expiresAt: number;
  reactionKey: DuelWordsRealtimeReactionKey;
  side: DuelWordsRealtimeSide;
};

export type DuelWordsRealtimeMutationResult =
  | {
      duplicate?: boolean;
      ok: true;
    }
  | {
      ok: false;
      reason: 'invalid_session' | 'rate_limited' | 'room_unavailable';
    };

export type DuelWordsRealtimeSessionRequest = {
  realtimeSessionId: string;
  roomToken: string;
};

export type DuelWordsRealtimeReactionRequest = DuelWordsRealtimeSessionRequest & {
  clientRequestId?: string;
  reactionKey: DuelWordsRealtimeReactionKey;
};

export type DuelWordsRealtimeSubscription = () => void;

export type DuelWordsRealtimeProjectionClient = {
  getActiveRoomView(input: DuelWordsRealtimeSessionRequest): Promise<DuelWordsRealtimeRoomView | null>;
  publishLocalPlayerSubmittedProjection(input: {
    roundNumber: number;
    roomToken: string;
    side: DuelWordsRealtimeSide;
  }): void;
  sendPresenceHeartbeat(input: DuelWordsRealtimeSessionRequest): Promise<DuelWordsRealtimeMutationResult>;
  sendReaction(input: DuelWordsRealtimeReactionRequest): Promise<DuelWordsRealtimeMutationResult>;
  subscribeActiveRoomView(
    input: DuelWordsRealtimeSessionRequest,
    listener: (view: DuelWordsRealtimeRoomView | null) => void,
  ): DuelWordsRealtimeSubscription;
};

type LocalReactionRecord = DuelWordsRealtimeReactionView & {
  clientRequestId?: string;
  createdAt: number;
};

export function createLocalDuelWordsRealtimeProjectionClient(input: {
  gameLanguage?: GameLanguage;
  maxAttempts?: number;
  now?: () => number;
  ownSide?: DuelWordsRealtimeSide;
  realtimeSessionId?: string;
  remainingMs?: number;
  roomToken?: string;
  roundNumber?: number;
  wordLength?: number;
} = {}): DuelWordsRealtimeProjectionClient {
  const roomToken = input.roomToken ?? 'local-active-room';
  const realtimeSessionId = input.realtimeSessionId ?? 'local-realtime-session';
  const ownSide = input.ownSide ?? 'a';
  const opponentSide = ownSide === 'a' ? 'b' : 'a';
  const now = input.now ?? (() => Date.now());
  const listeners = new Set<(view: DuelWordsRealtimeRoomView | null) => void>();
  let reactions: LocalReactionRecord[] = [];
  let roomView: DuelWordsRealtimeRoomView = {
    room: {
      language: input.gameLanguage ?? 'en',
      maxAttempts: input.maxAttempts ?? 6,
      mode: 'human_duel',
      roundDeadlineAt: now() + (input.remainingMs ?? 37_000),
      roundNumber: input.roundNumber ?? 2,
      serverNow: now(),
      status: 'active_round',
      wordLength: input.wordLength ?? 5,
    },
    own: {
      attemptCount: Math.max(0, (input.roundNumber ?? 2) - 1),
      hasSubmittedCurrentRound: false,
      isReady: true,
      safeDisplayName: 'You',
      side: ownSide,
      status: 'joined',
      timeoutCount: 0,
    },
    opponent: {
      attemptCount: input.roundNumber ?? 2,
      hasSubmittedCurrentRound: true,
      isReady: true,
      presenceState: 'online',
      safeDisplayName: 'Rival',
      side: opponentSide,
      status: 'submitted',
      timeoutCount: 0,
    },
    reactions: [],
  };

  function isValidSession(request: DuelWordsRealtimeSessionRequest) {
    return request.roomToken === roomToken && request.realtimeSessionId === realtimeSessionId;
  }

  function currentView(): DuelWordsRealtimeRoomView {
    pruneExpiredReactions();
    return cloneRoomView({
      ...roomView,
      reactions: reactions.map(({ clientRequestId: _clientRequestId, createdAt: _createdAt, ...reaction }) => reaction),
      room: {
        ...roomView.room,
        serverNow: now(),
      },
    });
  }

  function emit() {
    const view = currentView();
    listeners.forEach((listener) => listener(view));
  }

  function patchPlayer(side: DuelWordsRealtimeSide, patch: Partial<DuelWordsRealtimePlayerView>) {
    if (roomView.own?.side === side) {
      roomView = { ...roomView, own: { ...roomView.own, ...patch } };
    }
    if (roomView.opponent?.side === side) {
      roomView = { ...roomView, opponent: { ...roomView.opponent, ...patch } };
    }
  }

  function pruneExpiredReactions() {
    const currentTime = now();
    reactions = reactions.filter((reaction) => reaction.expiresAt > currentTime);
  }

  return {
    async getActiveRoomView(request) {
      if (!isValidSession(request)) {
        return null;
      }

      return currentView();
    },

    publishLocalPlayerSubmittedProjection(event) {
      if (event.roomToken !== roomToken || event.roundNumber !== roomView.room.roundNumber) {
        return;
      }

      patchPlayer(event.side, {
        attemptCount: Math.max(event.roundNumber, playerAttemptCount(roomView, event.side)),
        hasSubmittedCurrentRound: true,
        status: 'submitted',
      });

      const bothSubmitted = Boolean(roomView.own?.hasSubmittedCurrentRound && roomView.opponent?.hasSubmittedCurrentRound);
      roomView = {
        ...roomView,
        room: {
          ...roomView.room,
          status: bothSubmitted ? 'round_resolving' : roomView.room.status,
        },
      };
      emit();
    },

    async sendPresenceHeartbeat(request) {
      if (!isValidSession(request)) {
        return { ok: false, reason: 'invalid_session' };
      }

      if (!clientWritable(roomView.room.status)) {
        return { ok: false, reason: 'room_unavailable' };
      }

      emit();
      return { ok: true };
    },

    async sendReaction(request) {
      if (!isValidSession(request)) {
        return { ok: false, reason: 'invalid_session' };
      }

      if (!clientWritable(roomView.room.status)) {
        return { ok: false, reason: 'room_unavailable' };
      }

      pruneExpiredReactions();
      const currentTime = now();
      if (
        request.clientRequestId
        && reactions.some((reaction) => reaction.clientRequestId === request.clientRequestId)
      ) {
        return { ok: true, duplicate: true };
      }

      const recentOwnReactions = reactions.filter(
        (reaction) => reaction.side === ownSide && reaction.createdAt > currentTime - 60_000,
      );
      if (
        recentOwnReactions.some((reaction) => reaction.createdAt > currentTime - MIN_MS_BETWEEN_REACTIONS_PER_SIDE)
        || recentOwnReactions.length >= MAX_REACTIONS_PER_SIDE_PER_ROOM_MINUTE
      ) {
        return { ok: false, reason: 'rate_limited' };
      }

      reactions = [
        ...reactions,
        {
          clientRequestId: request.clientRequestId,
          createdAt: currentTime,
          expiresAt: currentTime + REACTION_TTL_MS,
          reactionKey: request.reactionKey,
          side: ownSide,
        },
      ];
      emit();

      return { ok: true };
    },

    subscribeActiveRoomView(request, listener) {
      if (!isValidSession(request)) {
        listener(null);
        return () => undefined;
      }

      listeners.add(listener);
      listener(currentView());

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function activeDuelReactionToRealtimeKey(reaction: ActiveDuelReactionId): DuelWordsRealtimeReactionKey {
  if (reaction === 'gg') {
    return 'good_duel';
  }
  if (reaction === 'close') {
    return 'close_one';
  }
  if (reaction === 'almost') {
    return 'almost_there';
  }
  return reaction;
}

export function latestActiveDuelReactionFromRealtimeProjection(
  view: DuelWordsRealtimeRoomView,
): ActiveDuelReactionId | null {
  const latestReaction = [...view.reactions]
    .filter((reaction) => reaction.expiresAt > view.room.serverNow)
    .sort((left, right) => right.expiresAt - left.expiresAt)[0];
  if (!latestReaction) {
    return null;
  }

  return realtimeReactionToActiveDuelReaction(latestReaction.reactionKey);
}

export function applyRealtimeProjectionToActiveDuelViewModel(
  viewModel: ActiveDuelViewModel,
  projection: DuelWordsRealtimeRoomView,
): ActiveDuelViewModel {
  const roundChanged = projection.room.roundNumber > viewModel.roundNumber;
  const currentRoundViewModel = roundChanged
    ? synchronizeActiveDuelRound(viewModel, projection.room.roundNumber)
    : viewModel;
  const remainingSeconds = projection.room.roundDeadlineAt
    ? Math.max(0, Math.ceil((projection.room.roundDeadlineAt - projection.room.serverNow) / 1000))
    : currentRoundViewModel.remainingSeconds;
  const opponent = projection.opponent;
  const ownRoundState = deriveOwnRoundState(projection, currentRoundViewModel);

  return {
    ...currentRoundViewModel,
    activeReaction: latestActiveDuelReactionFromRealtimeProjection(projection),
    gameLanguage: projection.room.language,
    maxAttempts: projection.room.maxAttempts,
    opponent: opponent
      ? {
          attemptMarkers: opponentMarkersFromProjection(opponent, projection.room.roundNumber, projection.room.maxAttempts),
          presence: presenceFromProjection(opponent.presenceState),
          roundState: opponentRoundStateFromProjection(opponent, projection.room.roundNumber),
          safeDisplayName: opponent.safeDisplayName,
        }
      : {
          ...currentRoundViewModel.opponent,
          presence: 'disconnected',
          roundState: 'waiting',
        },
    ownRoundState,
    remainingSeconds,
    roundNumber: projection.room.roundNumber,
    wordLength: projection.room.wordLength,
  };
}

function cloneRoomView(view: DuelWordsRealtimeRoomView): DuelWordsRealtimeRoomView {
  return {
    room: { ...view.room },
    own: view.own ? { ...view.own } : null,
    opponent: view.opponent ? { ...view.opponent } : null,
    reactions: view.reactions.map((reaction) => ({ ...reaction })),
  };
}

function clientWritable(status: DuelWordsRealtimeRoomStatus): boolean {
  return status === 'lobby'
    || status === 'ready_locked'
    || status === 'countdown'
    || status === 'active_round'
    || status === 'round_resolving';
}

function playerAttemptCount(view: DuelWordsRealtimeRoomView, side: DuelWordsRealtimeSide): number {
  if (view.own?.side === side) {
    return view.own.attemptCount;
  }
  if (view.opponent?.side === side) {
    return view.opponent.attemptCount;
  }
  return 0;
}

function realtimeReactionToActiveDuelReaction(reaction: DuelWordsRealtimeReactionKey): ActiveDuelReactionId {
  if (reaction === 'good_duel') {
    return 'gg';
  }
  if (reaction === 'close_one') {
    return 'close';
  }
  if (reaction === 'almost_there') {
    return 'almost';
  }
  return reaction;
}

function presenceFromProjection(presenceState: DuelWordsRealtimePresenceState): ActiveDuelPresenceState {
  return presenceState === 'online' ? 'connected' : 'disconnected';
}

function opponentRoundStateFromProjection(
  opponent: DuelWordsRealtimePlayerView,
  roundNumber: number,
): ActiveDuelOpponentMarkerState {
  if (opponent.status === 'timed_out') {
    return 'timeout';
  }
  if (opponent.status === 'solved') {
    return 'solved';
  }
  if (opponent.hasSubmittedCurrentRound && opponent.attemptCount >= roundNumber) {
    return 'submitted';
  }
  if (opponent.status === 'failed') {
    return 'failed';
  }
  return 'waiting';
}

function opponentMarkersFromProjection(
  opponent: DuelWordsRealtimePlayerView,
  roundNumber: number,
  maxAttempts: number,
): ActiveDuelOpponentMarkerState[] {
  return Array.from({ length: maxAttempts }, (_, index) => {
    const attemptNumber = index + 1;
    if (opponent.status === 'solved' && opponent.feedbackAvailableRound === attemptNumber) {
      return 'solved';
    }
    if (opponent.status === 'timed_out' && attemptNumber === roundNumber) {
      return 'timeout';
    }
    if (attemptNumber === roundNumber && opponent.hasSubmittedCurrentRound) {
      return 'submitted';
    }
    if (attemptNumber < roundNumber && attemptNumber <= opponent.attemptCount) {
      return 'failed';
    }
    return 'waiting';
  });
}

function deriveOwnRoundState(
  projection: DuelWordsRealtimeRoomView,
  current: ActiveDuelViewModel,
): ActiveDuelViewModel['ownRoundState'] {
  if (projection.room.status === 'round_resolving') {
    return 'resolving';
  }

  if (projection.own?.status === 'timed_out') {
    return 'timed_out';
  }

  if (projection.own?.hasSubmittedCurrentRound) {
    return 'waiting_for_rival';
  }

  if (projection.opponent?.hasSubmittedCurrentRound) {
    return 'rival_submitted';
  }

  return current.ownRoundState === 'waiting_for_rival' ? 'editing' : current.ownRoundState;
}
