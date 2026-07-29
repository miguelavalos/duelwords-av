import type { GameLanguage } from '../word-duel-engine';
import type {
  DuelWordsRealtimeMutationResult,
  DuelWordsRealtimePlayerStatus,
  DuelWordsRealtimePlayerView,
  DuelWordsRealtimePresenceState,
  DuelWordsRealtimeProjectionClient,
  DuelWordsRealtimeReactionKey,
  DuelWordsRealtimeReactionRequest,
  DuelWordsRealtimeReactionView,
  DuelWordsRealtimeRoomStatus,
  DuelWordsRealtimeRoomView,
  DuelWordsRealtimeSessionRequest,
  DuelWordsRealtimeSide,
} from './realtime-projection';

const MAX_ACTIVE_REACTIONS = 10;
const MAX_PAYLOAD_SCAN_DEPTH = 8;

const FORBIDDEN_CONVEX_PAYLOAD_KEY_PARTS = [
  'accountuserid',
  'accesstoken',
  'authsecret',
  'authtoken',
  'candidate',
  'convexdeploykey',
  'deploykey',
  'dictionary',
  'displayword',
  'email',
  'feedback',
  'feedbackjson',
  'guess',
  'guestsessionid',
  'normalizedword',
  'opponentfeedback',
  'provider',
  'pushtoken',
  'refreshtoken',
  'secret',
  'target',
];

const ALLOWED_SAFE_FEEDBACK_KEYS = new Set(['feedbackavailableround']);

const ROOM_STATUSES = new Set<string>([
  'pending_invite',
  'lobby',
  'ready_locked',
  'countdown',
  'active_round',
  'round_resolving',
  'finalized',
  'cancelled_before_first_round',
  'expired',
  'technical_error',
]);

const PLAYER_STATUSES = new Set<string>([
  'joined',
  'ready',
  'submitted',
  'timed_out',
  'solved',
  'failed',
  'left',
  'disconnected',
]);

const REACTION_KEYS = new Set<string>([
  'nice',
  'close_one',
  'your_turn',
  'tick_tock',
  'almost_there',
  'good_duel',
]);

export const DUELWORDS_CONVEX_FUNCTIONS = {
  getActiveRoomView: 'duelwords:getActiveRoomView',
  sendPresenceHeartbeat: 'duelwords:sendPresenceHeartbeat',
  sendReaction: 'duelwords:sendReaction',
} as const;

export type DuelWordsConvexRealtimeFunctionRefs = {
  getActiveRoomView: unknown;
  sendPresenceHeartbeat: unknown;
  sendReaction: unknown;
};

export type DuelWordsConvexWatch<T> = {
  localQueryResult(): T | undefined;
  onUpdate(listener: () => void): () => void;
};

export type DuelWordsConvexRealtimeClient = {
  close?: () => Promise<void> | void;
  mutation<T>(functionRef: unknown, args: Record<string, unknown>): Promise<T>;
  query<T>(functionRef: unknown, args: Record<string, unknown>): Promise<T>;
  watchQuery<T>(functionRef: unknown, args: Record<string, unknown>): DuelWordsConvexWatch<T>;
};

export function createDuelWordsConvexRealtimeProjectionClient(input: {
  convexClient: DuelWordsConvexRealtimeClient;
  functionRefs?: Partial<DuelWordsConvexRealtimeFunctionRefs>;
}): DuelWordsRealtimeProjectionClient {
  const functionRefs = {
    ...DUELWORDS_CONVEX_FUNCTIONS,
    ...input.functionRefs,
  };

  return {
    async getActiveRoomView(request) {
      const payload = await input.convexClient.query<unknown>(
        functionRefs.getActiveRoomView,
        sessionRequestArgs(request),
      );

      return readDuelWordsRealtimeRoomView(payload);
    },

    publishLocalPlayerSubmittedProjection() {
      return undefined;
    },

    async sendPresenceHeartbeat(request) {
      const payload = await input.convexClient.mutation<unknown>(
        functionRefs.sendPresenceHeartbeat,
        sessionRequestArgs(request),
      );

      return readDuelWordsRealtimeMutationResult(payload);
    },

    async sendReaction(request) {
      const payload = await input.convexClient.mutation<unknown>(
        functionRefs.sendReaction,
        reactionRequestArgs(request),
      );

      return readDuelWordsRealtimeMutationResult(payload);
    },

    subscribeActiveRoomView(request, listener) {
      const watch = input.convexClient.watchQuery<unknown>(
        functionRefs.getActiveRoomView,
        sessionRequestArgs(request),
      );
      let closed = false;
      const emitCurrentView = () => {
        if (closed) {
          return;
        }

        listener(readDuelWordsRealtimeRoomView(watch.localQueryResult() ?? null));
      };
      const unsubscribe = watch.onUpdate(emitCurrentView);
      emitCurrentView();

      return () => {
        closed = true;
        unsubscribe();
      };
    },
  };
}

export function readDuelWordsRealtimeRoomView(payload: unknown): DuelWordsRealtimeRoomView | null {
  if (!isRecord(payload) || containsForbiddenConvexPayloadKey(payload)) {
    return null;
  }

  const room = readRoom(payload.room);
  const own = readNullablePlayer(payload.own);
  const opponent = readNullableOpponent(payload.opponent);
  const reactions = readReactions(payload.reactions);

  if (
    !room.ok
    || !own.ok
    || !opponent.ok
    || !reactions.ok
    || !roundSummariesFitRoom(own.value, room.value)
    || !roundSummariesFitRoom(opponent.value, room.value)
  ) {
    return null;
  }

  return {
    opponent: opponent.value,
    own: own.value,
    reactions: reactions.value,
    room: room.value,
  };
}

function readDuelWordsRealtimeMutationResult(payload: unknown): DuelWordsRealtimeMutationResult {
  if (!isRecord(payload) || containsForbiddenConvexPayloadKey(payload)) {
    return { ok: false, reason: 'room_unavailable' };
  }

  if (payload.ok === true) {
    return payload.duplicate === true ? { duplicate: true, ok: true } : { ok: true };
  }

  if (payload.ok !== false) {
    return { ok: false, reason: 'room_unavailable' };
  }

  if (payload.reason === 'invalid_session' || payload.reason === 'rate_limited' || payload.reason === 'room_unavailable') {
    return {
      ok: false,
      reason: payload.reason,
    };
  }

  return { ok: false, reason: 'room_unavailable' };
}

function sessionRequestArgs(request: DuelWordsRealtimeSessionRequest): Record<string, unknown> {
  return {
    realtimeSessionId: request.realtimeSessionId,
    roomToken: request.roomToken,
  };
}

function reactionRequestArgs(request: DuelWordsRealtimeReactionRequest): Record<string, unknown> {
  return {
    ...sessionRequestArgs(request),
    clientRequestId: request.clientRequestId,
    reactionKey: request.reactionKey,
  };
}

function readRoom(payload: unknown): ReadResult<DuelWordsRealtimeRoomView['room']> {
  if (!isRecord(payload)) {
    return { ok: false };
  }

  const language = readLanguage(payload.language);
  const maxAttempts = readPositiveInteger(payload.maxAttempts);
  const roundNumber = readNonNegativeInteger(payload.roundNumber);
  const serverNow = readNonNegativeNumber(payload.serverNow);
  const status = readRoomStatus(payload.status);
  const wordLength = readPositiveInteger(payload.wordLength);

  if (
    language === null
    || maxAttempts === null
    || roundNumber === null
    || serverNow === null
    || status === null
    || payload.mode !== 'human_duel'
    || wordLength === null
  ) {
    return { ok: false };
  }

  const countdownEndsAt = readOptionalNonNegativeNumber(payload.countdownEndsAt);
  const roundDeadlineAt = readOptionalNonNegativeNumber(payload.roundDeadlineAt);
  const resultReason = readOptionalString(payload.resultReason);
  const winnerSide = readOptionalWinnerSide(payload.winnerSide);

  if (!countdownEndsAt.ok || !roundDeadlineAt.ok || !resultReason.ok || !winnerSide.ok) {
    return { ok: false };
  }

  return {
    ok: true,
    value: stripUndefined({
      countdownEndsAt: countdownEndsAt.value,
      language,
      maxAttempts,
      mode: 'human_duel',
      resultReason: resultReason.value,
      roundDeadlineAt: roundDeadlineAt.value,
      roundNumber,
      serverNow,
      status,
      winnerSide: winnerSide.value,
      wordLength,
    }),
  };
}

function readNullablePlayer(payload: unknown): ReadResult<DuelWordsRealtimePlayerView | null> {
  if (payload === null || payload === undefined) {
    return { ok: true, value: null };
  }

  return readPlayer(payload);
}

function readNullableOpponent(
  payload: unknown,
): ReadResult<(DuelWordsRealtimePlayerView & { presenceState: DuelWordsRealtimePresenceState }) | null> {
  if (payload === null || payload === undefined) {
    return { ok: true, value: null };
  }
  if (!isRecord(payload)) {
    return { ok: false };
  }

  const player = readPlayer(payload);
  const presenceState = readPresenceState(payload.presenceState);
  if (!player.ok || presenceState === null) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      ...player.value,
      presenceState,
    },
  };
}

function readPlayer(payload: unknown): ReadResult<DuelWordsRealtimePlayerView> {
  if (!isRecord(payload)) {
    return { ok: false };
  }

  const attemptCount = readNonNegativeInteger(payload.attemptCount);
  const feedbackAvailableRound = readOptionalPositiveInteger(payload.feedbackAvailableRound);
  const safeDisplayName = readDisplayName(payload.safeDisplayName);
  const roundSummaries = readRoundSummaries(payload.roundSummaries);
  const side = readSide(payload.side);
  const status = readPlayerStatus(payload.status);
  const timeoutCount = readNonNegativeInteger(payload.timeoutCount);

  if (
    attemptCount === null
    || !feedbackAvailableRound.ok
    || typeof payload.hasSubmittedCurrentRound !== 'boolean'
    || typeof payload.isReady !== 'boolean'
    || safeDisplayName === null
    || !roundSummaries.ok
    || side === null
    || status === null
    || timeoutCount === null
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    value: stripUndefined({
      attemptCount,
      feedbackAvailableRound: feedbackAvailableRound.value,
      hasSubmittedCurrentRound: payload.hasSubmittedCurrentRound,
      isReady: payload.isReady,
      roundSummaries: roundSummaries.value,
      safeDisplayName,
      side,
      status,
      timeoutCount,
    }),
  };
}

function readRoundSummaries(
  payload: unknown,
): ReadResult<NonNullable<DuelWordsRealtimePlayerView['roundSummaries']>> {
  if (payload === undefined || payload === null) {
    return { ok: true, value: [] };
  }
  if (!Array.isArray(payload)) {
    return { ok: false };
  }

  const summaries: NonNullable<DuelWordsRealtimePlayerView['roundSummaries']> = [];
  for (const item of payload.slice(0, 6)) {
    if (!isRecord(item)) {
      return { ok: false };
    }
    const roundNumber = readPositiveInteger(item.roundNumber);
    if (roundNumber === null) {
      return { ok: false };
    }
    if (item.state === 'timeout') {
      summaries.push({ roundNumber, state: 'timeout' });
      continue;
    }
    const exactCount = readNonNegativeInteger(item.exactCount);
    const validCount = readNonNegativeInteger(item.validCount);
    if (item.state !== 'scored' || exactCount === null || validCount === null || exactCount > validCount) {
      return { ok: false };
    }
    summaries.push({ exactCount, roundNumber, state: 'scored', validCount });
  }

  return { ok: true, value: summaries };
}

function roundSummariesFitRoom(
  player: DuelWordsRealtimePlayerView | null,
  room: DuelWordsRealtimeRoomView['room'],
): boolean {
  const seenRounds = new Set<number>();
  for (const summary of player?.roundSummaries ?? []) {
    if (
      summary.roundNumber > room.maxAttempts
      || seenRounds.has(summary.roundNumber)
      || (summary.state === 'scored' && summary.validCount > room.wordLength)
    ) {
      return false;
    }
    seenRounds.add(summary.roundNumber);
  }
  return true;
}

function readReactions(payload: unknown): ReadResult<DuelWordsRealtimeReactionView[]> {
  if (!Array.isArray(payload)) {
    return { ok: false };
  }

  const reactions: DuelWordsRealtimeReactionView[] = [];
  for (const item of payload.slice(0, MAX_ACTIVE_REACTIONS)) {
    const reaction = readReaction(item);
    if (!reaction.ok) {
      return { ok: false };
    }
    reactions.push(reaction.value);
  }

  return {
    ok: true,
    value: reactions,
  };
}

function readReaction(payload: unknown): ReadResult<DuelWordsRealtimeReactionView> {
  if (!isRecord(payload)) {
    return { ok: false };
  }

  const expiresAt = readNonNegativeNumber(payload.expiresAt);
  const reactionKey = readReactionKey(payload.reactionKey);
  const side = readSide(payload.side);

  if (expiresAt === null || reactionKey === null || side === null) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      expiresAt,
      reactionKey,
      side,
    },
  };
}

function readLanguage(value: unknown): GameLanguage | null {
  return value === 'ca' || value === 'de' || value === 'en' || value === 'es' || value === 'fr'
    ? value
    : null;
}

function readRoomStatus(value: unknown): DuelWordsRealtimeRoomStatus | null {
  return typeof value === 'string' && ROOM_STATUSES.has(value) ? value as DuelWordsRealtimeRoomStatus : null;
}

function readPlayerStatus(value: unknown): DuelWordsRealtimePlayerStatus | null {
  return typeof value === 'string' && PLAYER_STATUSES.has(value) ? value as DuelWordsRealtimePlayerStatus : null;
}

function readPresenceState(value: unknown): DuelWordsRealtimePresenceState | null {
  return value === 'online' || value === 'disconnected' ? value : null;
}

function readReactionKey(value: unknown): DuelWordsRealtimeReactionKey | null {
  return typeof value === 'string' && REACTION_KEYS.has(value) ? value as DuelWordsRealtimeReactionKey : null;
}

function readSide(value: unknown): DuelWordsRealtimeSide | null {
  return value === 'a' || value === 'b' ? value : null;
}

function readOptionalWinnerSide(value: unknown): ReadResult<DuelWordsRealtimeSide | 'draw' | undefined> {
  if (value === null || value === undefined) {
    return { ok: true, value: undefined };
  }
  if (value === 'a' || value === 'b' || value === 'draw') {
    return { ok: true, value };
  }

  return { ok: false };
}

function readDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized.slice(0, 32) : 'Player';
}

function readOptionalString(value: unknown): ReadResult<string | undefined> {
  if (value === null || value === undefined) {
    return { ok: true, value: undefined };
  }
  if (typeof value === 'string') {
    return { ok: true, value };
  }

  return { ok: false };
}

function readNonNegativeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function readNonNegativeInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

function readPositiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function readOptionalNonNegativeNumber(value: unknown): ReadResult<number | undefined> {
  if (value === null || value === undefined) {
    return { ok: true, value: undefined };
  }

  const parsed = readNonNegativeNumber(value);
  return parsed === null ? { ok: false } : { ok: true, value: parsed };
}

function readOptionalPositiveInteger(value: unknown): ReadResult<number | undefined> {
  if (value === null || value === undefined) {
    return { ok: true, value: undefined };
  }

  const parsed = readPositiveInteger(value);
  return parsed === null ? { ok: false } : { ok: true, value: parsed };
}

function containsForbiddenConvexPayloadKey(value: unknown, depth = 0): boolean {
  if (depth > MAX_PAYLOAD_SCAN_DEPTH) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsForbiddenConvexPayloadKey(item, depth + 1));
  }
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(([key, child]) => {
    const normalizedKey = normalizedPayloadKey(key);
    if (
      !ALLOWED_SAFE_FEEDBACK_KEYS.has(normalizedKey)
      && FORBIDDEN_CONVEX_PAYLOAD_KEY_PARTS.some((forbidden) => normalizedKey.includes(forbidden))
    ) {
      return true;
    }

    return containsForbiddenConvexPayloadKey(child, depth + 1);
  });
}

function normalizedPayloadKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

type ReadResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
    };
