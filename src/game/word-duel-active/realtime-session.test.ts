import { describe, expect, it } from 'vitest';

import { createDuelWordsRealtimeProjectionClient } from './realtime-client';
import {
  readDuelWordsRealtimeSessionFromApiPayload,
  toDuelWordsRealtimeSessionRequest,
  toDuelWordsRuntimeRealtimeClientInput,
} from './realtime-session';

const ENABLED_CONVEX_RUNTIME_CONFIG = {
  convexUrl: 'https://duelwords-av.convex.cloud',
  disabledReason: null,
  provider: 'convex',
} as const;

describe('active duel backend-issued realtime session contract', () => {
  it('reads the approved realtime envelope from create, join, or recovery API payloads', () => {
    const parsed = readDuelWordsRealtimeSessionFromApiPayload({
      game: {
        gameId: 'game-1',
        status: 'active_round',
      },
      realtime: {
        realtimeSessionId: 'dwrs_123',
        roomToken: 'dwr_room_123',
        side: 'b',
      },
    });

    expect(parsed).toEqual({
      ok: true,
      session: {
        realtimeSessionId: 'dwrs_123',
        roomToken: 'dwr_room_123',
        side: 'b',
      },
    });
    if (!parsed.ok) {
      throw new Error('Expected realtime session to parse.');
    }

    expect(toDuelWordsRealtimeSessionRequest(parsed.session)).toEqual({
      realtimeSessionId: 'dwrs_123',
      roomToken: 'dwr_room_123',
    });
  });

  it('maps a backend-issued session into the runtime realtime client input', () => {
    const parsed = readDuelWordsRealtimeSessionFromApiPayload({
      realtime: {
        realtimeSessionId: 'dwrs_456',
        roomToken: 'dwr_room_456',
        side: 'a',
      },
    });
    if (!parsed.ok) {
      throw new Error('Expected realtime session to parse.');
    }

    const clientInput = toDuelWordsRuntimeRealtimeClientInput({
      runtimeConfig: ENABLED_CONVEX_RUNTIME_CONFIG,
      session: parsed.session,
    });
    const bundle = createDuelWordsRealtimeProjectionClient(clientInput);

    expect(clientInput).toMatchObject({
      mode: 'runtime',
      ownSide: 'a',
      realtimeSessionId: 'dwrs_456',
      roomToken: 'dwr_room_456',
    });
    expect(bundle.source).toBe('convex_runtime_pending');
  });

  it('fails closed when the backend realtime envelope is absent or malformed', () => {
    expect(readDuelWordsRealtimeSessionFromApiPayload({})).toEqual({
      ok: false,
      reason: 'missing_realtime',
    });
    expect(
      readDuelWordsRealtimeSessionFromApiPayload({
        realtime: {
          realtimeSessionId: 'session-1',
          roomToken: 'dwr_room',
          side: 'a',
        },
      }),
    ).toEqual({ ok: false, reason: 'invalid_realtime_session' });
    expect(
      readDuelWordsRealtimeSessionFromApiPayload({
        realtime: {
          realtimeSessionId: 'dwrs_123',
          roomToken: 'room-1',
          side: 'a',
        },
      }),
    ).toEqual({ ok: false, reason: 'invalid_room_token' });
    expect(
      readDuelWordsRealtimeSessionFromApiPayload({
        realtime: {
          realtimeSessionId: 'dwrs_123',
          roomToken: 'dwr_room',
          side: 'c',
        },
      }),
    ).toEqual({ ok: false, reason: 'invalid_side' });
  });

  it('blocks sensitive fields inside the client realtime session envelope', () => {
    const parsed = readDuelWordsRealtimeSessionFromApiPayload({
      realtime: {
        accountUserId: 'user-secret',
        realtimeSessionId: 'dwrs_123',
        roomToken: 'dwr_room',
        side: 'a',
      },
    });

    expect(parsed).toEqual({
      ok: false,
      reason: 'blocked_sensitive_payload',
    });
  });

  it('returns only session routing fields and no gameplay or identity payload', () => {
    const parsed = readDuelWordsRealtimeSessionFromApiPayload({
      realtime: {
        realtimeSessionId: 'dwrs_safe',
        roomToken: 'dwr_safe',
        side: 'a',
      },
    });

    expect(parsed.ok).toBe(true);
    const serialized = JSON.stringify(parsed).toLowerCase();
    for (const forbidden of [
      'target',
      'guess',
      'feedback',
      'displayword',
      'normalizedword',
      'guestsessionid',
      'accountuserid',
      'email',
      'deploykey',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
