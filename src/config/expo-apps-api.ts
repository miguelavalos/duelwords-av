import Constants from 'expo-constants';

import {
  resolveDuelWordsAppsApiRuntimeConfig,
  type DuelWordsAppsApiRuntimeConfig,
} from './apps-api';

export function getDuelWordsAppsApiRuntimeConfig(): DuelWordsAppsApiRuntimeConfig {
  return resolveDuelWordsAppsApiRuntimeConfig(
    withExpoPublicAppsApiFallback(Constants.expoConfig?.extra),
  );
}

type DuelWordsAppsApiExtra = {
  duelWordsAv?: {
    apiBaseUrl?: unknown;
    apiDisabled?: unknown;
  };
};

function withExpoPublicAppsApiFallback(extra: unknown): DuelWordsAppsApiExtra {
  const appExtra = isRecord(extra) ? (extra as DuelWordsAppsApiExtra) : {};
  const duelWordsAv = isRecord(appExtra.duelWordsAv) ? appExtra.duelWordsAv : {};

  return {
    ...appExtra,
    duelWordsAv: {
      ...duelWordsAv,
      apiBaseUrl: duelWordsAv.apiBaseUrl ?? process.env.EXPO_PUBLIC_DUELWORDSAV_API_BASE_URL,
      apiDisabled: duelWordsAv.apiDisabled ?? process.env.EXPO_PUBLIC_DUELWORDSAV_API_DISABLED,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
