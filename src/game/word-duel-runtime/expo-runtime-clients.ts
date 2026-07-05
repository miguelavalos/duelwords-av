import { getDuelWordsAppsApiRuntimeConfig } from '../../config/expo-apps-api';
import { getDuelWordsRealtimeRuntimeConfig } from '../../config/expo-realtime';
import { createDuelWordsConvexReactClient } from './convex-client-factory';
import {
  createDuelWordsRuntimeClients,
  type DuelWordsRuntimeClientsBundle,
  type DuelWordsRuntimeClientsInput,
} from './runtime-clients';

export type DuelWordsExpoRuntimeClientsInput = Omit<
  DuelWordsRuntimeClientsInput,
  'appsApiRuntimeConfig' | 'realtimeRuntimeConfig'
>;

export function createDuelWordsRuntimeClientsFromExpoConfig(
  input: DuelWordsExpoRuntimeClientsInput = {},
): DuelWordsRuntimeClientsBundle {
  return createDuelWordsRuntimeClients({
    ...input,
    appsApiRuntimeConfig: getDuelWordsAppsApiRuntimeConfig(),
    createConvexClient: input.createConvexClient ?? createDuelWordsConvexReactClient,
    realtimeRuntimeConfig: getDuelWordsRealtimeRuntimeConfig(),
  });
}
