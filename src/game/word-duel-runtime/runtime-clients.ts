import type { DuelWordsAppsApiRuntimeConfig } from '../../config/apps-api';
import type { DuelWordsRealtimeRuntimeConfig } from '../../config/realtime';
import type { DuelWordsConvexRealtimeClient } from '../word-duel-active/convex-realtime-client';
import {
  createDuelWordsRealtimeProjectionClient,
  type DuelWordsRealtimeProjectionClientBundle,
} from '../word-duel-active/realtime-client';
import {
  createDuelWordsRuntimeApiClient,
  type DuelWordsRuntimeApiClientBundle,
  type DuelWordsRuntimeApiClientInput,
} from '../word-duel-lobby/runtime-api-client';

export type DuelWordsRuntimeClientsDisabledReason =
  | 'apps_api_disabled'
  | 'convex_client_factory_failed'
  | 'convex_client_factory_missing'
  | 'convex_runtime_pending'
  | 'realtime_disabled';

export type DuelWordsRuntimeClientsInput = {
  appsApiRuntimeConfig?: DuelWordsAppsApiRuntimeConfig;
  createConvexClient?: (input: { convexUrl: string }) => DuelWordsConvexRealtimeClient;
  fetchImpl?: DuelWordsRuntimeApiClientInput['fetchImpl'];
  getAuthToken?: DuelWordsRuntimeApiClientInput['getAuthToken'];
  platform?: DuelWordsRuntimeApiClientInput['platform'];
  realtimeRuntimeConfig?: DuelWordsRealtimeRuntimeConfig;
};

export type DuelWordsRuntimeClientsDispose = () => Promise<void> | void;

export type DuelWordsRuntimeClientsBundle =
  | {
      appsApi: Extract<DuelWordsRuntimeApiClientBundle, { ok: true }>;
      dispose: DuelWordsRuntimeClientsDispose;
      ok: true;
      realtime: DuelWordsRealtimeProjectionClientBundle & { source: 'convex_runtime' };
      reason: null;
      source: 'runtime_ready';
    }
  | {
      appsApi: DuelWordsRuntimeApiClientBundle;
      dispose: DuelWordsRuntimeClientsDispose;
      ok: false;
      realtime: DuelWordsRealtimeProjectionClientBundle;
      reason: DuelWordsRuntimeClientsDisabledReason;
      source: 'runtime_disabled';
    };

export function createDuelWordsRuntimeClients(
  input: DuelWordsRuntimeClientsInput = {},
): DuelWordsRuntimeClientsBundle {
  const appsApi = createDuelWordsRuntimeApiClient({
    fetchImpl: input.fetchImpl,
    getAuthToken: input.getAuthToken,
    platform: input.platform,
    runtimeConfig: input.appsApiRuntimeConfig,
  });
  const pendingRealtime = createDuelWordsRealtimeProjectionClient({
    mode: 'runtime',
    runtimeConfig: input.realtimeRuntimeConfig,
  });

  if (!appsApi.ok) {
    return disabledRuntimeClients({
      appsApi,
      reason: 'apps_api_disabled',
      realtime: pendingRealtime,
    });
  }

  if (pendingRealtime.source === 'disabled') {
    return disabledRuntimeClients({
      appsApi,
      reason: 'realtime_disabled',
      realtime: pendingRealtime,
    });
  }

  const realtimeRuntimeConfig = pendingRealtime.runtimeConfig;
  if (realtimeRuntimeConfig.provider !== 'convex') {
    return disabledRuntimeClients({
      appsApi,
      reason: 'realtime_disabled',
      realtime: pendingRealtime,
    });
  }

  if (!input.createConvexClient) {
    return disabledRuntimeClients({
      appsApi,
      reason: 'convex_client_factory_missing',
      realtime: pendingRealtime,
    });
  }

  let convexClient: DuelWordsConvexRealtimeClient;
  try {
    convexClient = input.createConvexClient({
      convexUrl: realtimeRuntimeConfig.convexUrl,
    });
  } catch {
    return disabledRuntimeClients({
      appsApi,
      reason: 'convex_client_factory_failed',
      realtime: pendingRealtime,
    });
  }

  const realtime = createDuelWordsRealtimeProjectionClient({
    convexClient,
    mode: 'runtime',
    runtimeConfig: realtimeRuntimeConfig,
  });

  if (!isConvexRuntimeRealtimeBundle(realtime)) {
    return disabledRuntimeClients({
      appsApi,
      dispose: disposeConvexClient(convexClient),
      reason: 'convex_runtime_pending',
      realtime,
    });
  }

  return {
    appsApi,
    dispose: disposeConvexClient(convexClient),
    ok: true,
    reason: null,
    realtime,
    source: 'runtime_ready',
  };
}

function disabledRuntimeClients(input: {
  appsApi: DuelWordsRuntimeApiClientBundle;
  dispose?: DuelWordsRuntimeClientsDispose;
  reason: DuelWordsRuntimeClientsDisabledReason;
  realtime: DuelWordsRealtimeProjectionClientBundle;
}): DuelWordsRuntimeClientsBundle {
  return {
    appsApi: input.appsApi,
    dispose: input.dispose ?? noopDispose,
    ok: false,
    reason: input.reason,
    realtime: input.realtime,
    source: 'runtime_disabled',
  };
}

function isConvexRuntimeRealtimeBundle(
  bundle: DuelWordsRealtimeProjectionClientBundle,
): bundle is DuelWordsRealtimeProjectionClientBundle & { source: 'convex_runtime' } {
  return bundle.source === 'convex_runtime';
}

function disposeConvexClient(client: DuelWordsConvexRealtimeClient): DuelWordsRuntimeClientsDispose {
  return () => client.close?.();
}

function noopDispose() {
  return undefined;
}
