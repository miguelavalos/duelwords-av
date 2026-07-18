import { useEffect, useMemo } from 'react';

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
  const appsApiRuntimeConfig = useMemo(
    () => input.appsApiRuntimeConfig ?? getDuelWordsAppsApiRuntimeConfig(),
    [input.appsApiRuntimeConfig],
  );
  const createConvexClient = input.createConvexClient ?? createDuelWordsConvexReactClient;
  const realtimeRuntimeConfig = useMemo(
    () => input.realtimeRuntimeConfig ?? getDuelWordsRealtimeRuntimeConfig(),
    [input.realtimeRuntimeConfig],
  );

  const bundle = useMemo(
    () => createDuelWordsRuntimeClients({
      appsApiRuntimeConfig,
      createConvexClient,
      fetchImpl: input.fetchImpl,
      getAuthToken: input.getAuthToken,
      platform: input.platform,
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
    if (isPromiseLike(disposeResult)) {
      disposeResult.catch(() => undefined);
    }
  }, [bundle]);

  return bundle;
}

function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return typeof value === 'object'
    && value !== null
    && 'catch' in value
    && typeof value.catch === 'function';
}
