import Constants from 'expo-constants';

import { resolveDuelWordsRevenueCatConfig } from './revenuecat-config';

export function getDuelWordsRevenueCatConfig() {
  const extra = isRecord(Constants.expoConfig?.extra) ? Constants.expoConfig.extra : {};
  const duelWordsAv = isRecord(extra.duelWordsAv) ? extra.duelWordsAv : {};
  const configured = isRecord(duelWordsAv.revenueCat) ? duelWordsAv.revenueCat : {};

  return resolveDuelWordsRevenueCatConfig({
    ...configured,
    apiKey: process.env.EXPO_PUBLIC_DUELWORDSAV_REVENUECAT_PUBLIC_API_KEY ?? configured.apiKey,
    monthlyPackageId: process.env.EXPO_PUBLIC_DUELWORDSAV_REVENUECAT_MONTHLY_PACKAGE_ID
      ?? configured.monthlyPackageId,
    offeringId: process.env.EXPO_PUBLIC_DUELWORDSAV_REVENUECAT_OFFERING_ID ?? configured.offeringId,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
