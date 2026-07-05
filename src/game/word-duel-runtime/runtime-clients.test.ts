import { describe, expect, it } from 'vitest';

import type { DuelWordsAppsApiRuntimeConfig } from '../../config/apps-api';
import type { DuelWordsRealtimeRuntimeConfig } from '../../config/realtime';
import type { DuelWordsConvexRealtimeClient } from '../word-duel-active/convex-realtime-client';
import { createDuelWordsRuntimeClients } from './runtime-clients';

const ENABLED_APPS_API_CONFIG: DuelWordsAppsApiRuntimeConfig = {
  apiBaseUrl: 'https://api-account-av-preview.avalsys.com',
  disabledReason: null,
  provider: 'apps_av_api',
};

const ENABLED_REALTIME_CONFIG: DuelWordsRealtimeRuntimeConfig = {
  convexUrl: 'https://duelwords-av.convex.cloud',
  disabledReason: null,
  provider: 'convex',
};

describe('DuelWords composed runtime clients', () => {
  it('fails closed by default without constructing a Convex client', () => {
    let createConvexClientCalls = 0;

    const bundle = createDuelWordsRuntimeClients({
      createConvexClient() {
        createConvexClientCalls += 1;
        return fakeConvexClient();
      },
    });

    expect(bundle).toMatchObject({
      appsApi: {
        client: null,
        ok: false,
        reason: 'disabled_by_config',
        source: 'disabled',
      },
      ok: false,
      reason: 'apps_api_disabled',
      realtime: {
        source: 'disabled',
      },
      source: 'runtime_disabled',
    });
    expect(createConvexClientCalls).toBe(0);
    expect(bundle.dispose()).toBeUndefined();
  });

  it('does not construct realtime when the Apps AV API is disabled', () => {
    let createConvexClientCalls = 0;

    const bundle = createDuelWordsRuntimeClients({
      createConvexClient() {
        createConvexClientCalls += 1;
        return fakeConvexClient();
      },
      realtimeRuntimeConfig: ENABLED_REALTIME_CONFIG,
    });

    expect(bundle.ok).toBe(false);
    expect(bundle.reason).toBe('apps_api_disabled');
    expect(bundle.realtime.source).toBe('convex_runtime_pending');
    expect(createConvexClientCalls).toBe(0);
  });

  it('keeps runtime disabled when Apps AV API is enabled but realtime is disabled', () => {
    const bundle = createDuelWordsRuntimeClients({
      appsApiRuntimeConfig: ENABLED_APPS_API_CONFIG,
      realtimeRuntimeConfig: {
        convexUrl: null,
        disabledReason: 'disabled_by_config',
        provider: 'disabled',
      },
    });

    expect(bundle.ok).toBe(false);
    expect(bundle.reason).toBe('realtime_disabled');
    expect(bundle.appsApi.ok).toBe(true);
    expect(bundle.realtime.source).toBe('disabled');
  });

  it('stays pending when both configs are enabled but no Convex client factory is injected', () => {
    const bundle = createDuelWordsRuntimeClients({
      appsApiRuntimeConfig: ENABLED_APPS_API_CONFIG,
      realtimeRuntimeConfig: ENABLED_REALTIME_CONFIG,
    });

    expect(bundle.ok).toBe(false);
    expect(bundle.reason).toBe('convex_client_factory_missing');
    expect(bundle.appsApi.ok).toBe(true);
    expect(bundle.realtime.source).toBe('convex_runtime_pending');
  });

  it('does not expose factory failures as a ready runtime', () => {
    const bundle = createDuelWordsRuntimeClients({
      appsApiRuntimeConfig: ENABLED_APPS_API_CONFIG,
      createConvexClient() {
        throw new Error('SDK unavailable');
      },
      realtimeRuntimeConfig: ENABLED_REALTIME_CONFIG,
    });

    expect(bundle.ok).toBe(false);
    expect(bundle.reason).toBe('convex_client_factory_failed');
    expect(bundle.realtime.source).toBe('convex_runtime_pending');
  });

  it('returns ready clients only after both configs are enabled and Convex is injected', async () => {
    const requestedUrls: string[] = [];
    let closeCalls = 0;
    const convexClient = fakeConvexClient({
      close() {
        closeCalls += 1;
      },
    });
    const bundle = createDuelWordsRuntimeClients({
      appsApiRuntimeConfig: ENABLED_APPS_API_CONFIG,
      createConvexClient({ convexUrl }) {
        requestedUrls.push(convexUrl);
        return convexClient;
      },
      fetchImpl: async () => new Response('{}'),
      realtimeRuntimeConfig: ENABLED_REALTIME_CONFIG,
    });

    expect(bundle.ok).toBe(true);
    if (!bundle.ok) {
      throw new Error('Expected ready runtime clients.');
    }
    expect(bundle.source).toBe('runtime_ready');
    expect(bundle.appsApi.source).toBe('apps_av_api');
    expect(bundle.realtime.source).toBe('convex_runtime');
    expect(requestedUrls).toEqual(['https://duelwords-av.convex.cloud']);
    expect(convexClient.watches).toEqual([]);
    await expect(
      bundle.realtime.client.sendPresenceHeartbeat({
        realtimeSessionId: 'dwrs_session_1',
        roomToken: 'dwr_room_1',
      }),
    ).resolves.toEqual({ ok: true });
    await bundle.dispose();
    expect(closeCalls).toBe(1);
  });
});

type FakeConvexClient = DuelWordsConvexRealtimeClient & {
  watches: Array<{
    args: Record<string, unknown>;
    functionRef: unknown;
  }>;
};

function fakeConvexClient(input: {
  close?: () => Promise<void> | void;
} = {}): FakeConvexClient {
  const watches: FakeConvexClient['watches'] = [];

  return {
    close: input.close,
    watches,

    async mutation<T>() {
      return { ok: true } as T;
    },
    async query<T>() {
      return null as T;
    },
    watchQuery<T>(functionRef: unknown, args: Record<string, unknown>) {
      watches.push({ args, functionRef });
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
