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
  const appsApiRuntimeConfig = input.appsApiRuntimeConfig ?? getDuelWordsAppsApiRuntimeConfig();
  const createConvexClient = input.createConvexClient ?? createDuelWordsConvexReactClient;
  const realtimeRuntimeConfig = input.realtimeRuntimeConfig ?? getDuelWordsRealtimeRuntimeConfig();

  const bundle = useMemo(
    () => createDuelWordsRuntimeClients({
      ...input,
      appsApiRuntimeConfig,
      createConvexClient,
      realtimeRuntimeConfig,
    }),
    [
      appsApiRuntimeConfig.apiBaseUrl,
      appsApiRuntimeConfig.disabledReason,
      appsApiRuntimeConfig.provider,
      createConvexClient,
      input.fetchImpl,
      input.getAuthToken,
      input.platform,
      realtimeRuntimeConfig.convexUrl,
      realtimeRuntimeConfig.disabledReason,
      realtimeRuntimeConfig.provider,
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
