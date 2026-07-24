import Constants from 'expo-constants';

import {
  resolveDuelWordsRealtimeRuntimeConfig,
  type DuelWordsRealtimeRuntimeConfig,
} from './realtime';

export function getDuelWordsRealtimeRuntimeConfig(): DuelWordsRealtimeRuntimeConfig {
  return resolveDuelWordsRealtimeRuntimeConfig(
    withExpoPublicRealtimeFallback(Constants.expoConfig?.extra),
  );
}

type DuelWordsRealtimeExtra = {
  duelWordsAv?: {
    convexRealtimeDisabled?: unknown;
    convexUrl?: unknown;
  };
};

function withExpoPublicRealtimeFallback(extra: unknown): DuelWordsRealtimeExtra {
  const appExtra = isRecord(extra) ? (extra as DuelWordsRealtimeExtra) : {};
  const duelWordsAv = isRecord(appExtra.duelWordsAv) ? appExtra.duelWordsAv : {};

  return {
    ...appExtra,
    duelWordsAv: {
      ...duelWordsAv,
      convexRealtimeDisabled:
        process.env.EXPO_PUBLIC_DUELWORDSAV_CONVEX_REALTIME_DISABLED
        ?? duelWordsAv.convexRealtimeDisabled,
      convexUrl: process.env.EXPO_PUBLIC_DUELWORDSAV_CONVEX_URL ?? duelWordsAv.convexUrl,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
