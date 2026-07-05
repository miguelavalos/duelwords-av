import { describe, expect, it } from 'vitest';

import type { DuelWordsConvexRealtimeClient } from './convex-realtime-client';
import { createDuelWordsRealtimeProjectionClient } from './realtime-client';

describe('active duel realtime client factory', () => {
  it('keeps the active demo on the local mock client', async () => {
    const bundle = createDuelWordsRealtimeProjectionClient({
      mode: 'local_mock',
      realtimeSessionId: 'session-1',
      roomToken: 'room-1',
    });

    const view = await bundle.client.getActiveRoomView({
      realtimeSessionId: 'session-1',
      roomToken: 'room-1',
    });

    expect(bundle.source).toBe('local_mock');
    expect(view?.room.status).toBe('active_round');
  });

  it('fails closed when runtime realtime is disabled by config', async () => {
    const bundle = createDuelWordsRealtimeProjectionClient({
      mode: 'runtime',
      runtimeConfig: {
        convexUrl: null,
        disabledReason: 'disabled_by_config',
        provider: 'disabled',
      },
    });

    expect(bundle.source).toBe('disabled');
    await expect(
      bundle.client.sendReaction({
        reactionKey: 'tick_tock',
        realtimeSessionId: 'session-1',
        roomToken: 'room-1',
      }),
    ).resolves.toEqual({ ok: false, reason: 'room_unavailable' });
  });

  it('stays pending when Convex config is enabled but no Convex client is injected', async () => {
    const bundle = createDuelWordsRealtimeProjectionClient({
      mode: 'runtime',
      runtimeConfig: {
        convexUrl: 'https://duelwords-av.convex.cloud',
        disabledReason: null,
        provider: 'convex',
      },
    });

    expect(bundle.source).toBe('convex_runtime_pending');
    await expect(
      bundle.client.getActiveRoomView({
        realtimeSessionId: 'session-1',
        roomToken: 'room-1',
      }),
    ).resolves.toBeNull();
  });

  it('creates the Convex realtime adapter only from an injected Convex client', async () => {
    const bundle = createDuelWordsRealtimeProjectionClient({
      convexClient: fakeConvexClient(),
      mode: 'runtime',
      runtimeConfig: {
        convexUrl: 'https://duelwords-av.convex.cloud',
        disabledReason: null,
        provider: 'convex',
      },
    });

    expect(bundle.source).toBe('convex_runtime');
    await expect(
      bundle.client.sendPresenceHeartbeat({
        realtimeSessionId: 'dwrs_session_1',
        roomToken: 'dwr_room_1',
      }),
    ).resolves.toEqual({ ok: true });
  });
});

function fakeConvexClient(): DuelWordsConvexRealtimeClient {
  return {
    async mutation<T>() {
      return { ok: true } as T;
    },
    async query<T>() {
      return null as T;
    },
    watchQuery<T>() {
      return {
        localQueryResult() {
          return null as T;
        },
        onUpdate() {
          return () => undefined;
        },
      };
    },
  };
}
