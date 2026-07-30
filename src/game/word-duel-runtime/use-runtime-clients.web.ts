import { useEffect, useMemo, useState } from 'react';

import { getDuelWordsAppsApiRuntimeConfig } from '../../config/expo-apps-api';
import { getDuelWordsRealtimeRuntimeConfig } from '../../config/expo-realtime';
import { createDuelWordsConvexReactClient } from './convex-client-factory';
import {
  createDuelWordsRuntimeClients,
  type DuelWordsRuntimeClientsBundle,
  type DuelWordsRuntimeClientsInput,
} from './runtime-clients';

export type UseDuelWordsRuntimeClientsInput = DuelWordsRuntimeClientsInput;

export function useDuelWordsRuntimeClients(
  input: UseDuelWordsRuntimeClientsInput = {},
): DuelWordsRuntimeClientsBundle {
  const hasExplicitRuntime = input.appsApiRuntimeConfig !== undefined
    || input.realtimeRuntimeConfig !== undefined;
  const [mounted, setMounted] = useState(hasExplicitRuntime);
  useEffect(() => setMounted(true), []);

  const appsApiRuntimeConfig = useMemo(
    () => mounted
      ? input.appsApiRuntimeConfig ?? getDuelWordsAppsApiRuntimeConfig()
      : undefined,
    [input.appsApiRuntimeConfig, mounted],
  );
  const createConvexClient = input.createConvexClient ?? createDuelWordsConvexReactClient;
  const realtimeRuntimeConfig = useMemo(
    () => mounted
      ? input.realtimeRuntimeConfig ?? getDuelWordsRealtimeRuntimeConfig()
      : undefined,
    [input.realtimeRuntimeConfig, mounted],
  );

  const bundle = useMemo(
    () => createDuelWordsRuntimeClients({
      appsApiRuntimeConfig,
      createConvexClient,
      fetchImpl: input.fetchImpl,
      getAuthToken: input.getAuthToken,
      platform: input.platform ?? 'web',
      realtimeRuntimeConfig,
    }),
    [
      appsApiRuntimeConfig,
      createConvexClient,
      input.fetchImpl,
      input.getAuthToken,
      input.platform,
      realtimeRuntimeConfig,
    ],
  );

  useEffect(() => () => {
    const disposeResult = bundle.dispose();
    if (isPromiseLike(disposeResult)) disposeResult.catch(() => undefined);
  }, [bundle]);

  return bundle;
}

function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return typeof value === 'object'
    && value !== null
    && 'catch' in value
    && typeof value.catch === 'function';
}
