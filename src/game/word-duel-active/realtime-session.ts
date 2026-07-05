import type { DuelWordsRealtimeRuntimeConfig } from '../../config/realtime';
import type { DuelWordsRealtimeSide, DuelWordsRealtimeSessionRequest } from './realtime-projection';

const SESSION_ID_PREFIX = 'dwrs_';
const ROOM_TOKEN_PREFIX = 'dwr_';

const FORBIDDEN_REALTIME_KEY_PARTS = [
  'accountuserid',
  'authtoken',
  'candidate',
  'convexdeploykey',
  'deploykey',
  'dictionary',
  'displayword',
  'email',
  'feedback',
  'guess',
  'guestsessionid',
  'normalizedword',
  'provider',
  'pushtoken',
  'target',
];

export type DuelWordsBackendRealtimeSession = {
  realtimeSessionId: string;
  roomToken: string;
  side: DuelWordsRealtimeSide;
};

export type DuelWordsRealtimeSessionParseErrorCode =
  | 'blocked_sensitive_payload'
  | 'invalid_realtime_session'
  | 'invalid_room_token'
  | 'invalid_side'
  | 'missing_realtime';

export type DuelWordsRealtimeSessionParseResult =
  | {
      ok: true;
      session: DuelWordsBackendRealtimeSession;
    }
  | {
      ok: false;
      reason: DuelWordsRealtimeSessionParseErrorCode;
    };

export type DuelWordsRuntimeRealtimeClientInput = {
  mode: 'runtime';
  ownSide: DuelWordsRealtimeSide;
  realtimeSessionId: string;
  roomToken: string;
  runtimeConfig: DuelWordsRealtimeRuntimeConfig;
};

export function readDuelWordsRealtimeSessionFromApiPayload(
  payload: unknown,
): DuelWordsRealtimeSessionParseResult {
  const realtime = isRecord(payload) ? payload.realtime : undefined;
  if (!isRecord(realtime)) {
    return { ok: false, reason: 'missing_realtime' };
  }

  if (containsForbiddenRealtimeKey(realtime)) {
    return { ok: false, reason: 'blocked_sensitive_payload' };
  }

  const realtimeSessionId = normalizedString(realtime.realtimeSessionId);
  if (realtimeSessionId === null || !realtimeSessionId.startsWith(SESSION_ID_PREFIX)) {
    return { ok: false, reason: 'invalid_realtime_session' };
  }

  const roomToken = normalizedString(realtime.roomToken);
  if (roomToken === null || !roomToken.startsWith(ROOM_TOKEN_PREFIX)) {
    return { ok: false, reason: 'invalid_room_token' };
  }

  if (realtime.side !== 'a' && realtime.side !== 'b') {
    return { ok: false, reason: 'invalid_side' };
  }

  return {
    ok: true,
    session: {
      realtimeSessionId,
      roomToken,
      side: realtime.side,
    },
  };
}

export function toDuelWordsRealtimeSessionRequest(
  session: DuelWordsBackendRealtimeSession,
): DuelWordsRealtimeSessionRequest {
  return {
    realtimeSessionId: session.realtimeSessionId,
    roomToken: session.roomToken,
  };
}

export function toDuelWordsRuntimeRealtimeClientInput(input: {
  runtimeConfig: DuelWordsRealtimeRuntimeConfig;
  session: DuelWordsBackendRealtimeSession;
}): DuelWordsRuntimeRealtimeClientInput {
  return {
    mode: 'runtime',
    ownSide: input.session.side,
    realtimeSessionId: input.session.realtimeSessionId,
    roomToken: input.session.roomToken,
    runtimeConfig: input.runtimeConfig,
  };
}

function normalizedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function containsForbiddenRealtimeKey(value: Record<string, unknown>): boolean {
  return Object.keys(value).some((key) => {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    return FORBIDDEN_REALTIME_KEY_PARTS.some((forbidden) => normalizedKey.includes(forbidden));
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
