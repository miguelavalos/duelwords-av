import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  parseDuelWordsAdsMode,
  validAdMobBannerUnitId,
  type DuelWordsAdsMode,
} from './ads-policy';

export type DuelWordsAdsConfig = {
  homeBannerAdUnitId: string | null;
  mode: DuelWordsAdsMode;
};

export function getDuelWordsAdsConfig(): DuelWordsAdsConfig {
  const extra = isRecord(Constants.expoConfig?.extra) ? Constants.expoConfig.extra : {};
  const duelWordsAv = isRecord(extra.duelWordsAv) ? extra.duelWordsAv : {};
  const ads = isRecord(duelWordsAv.ads) ? duelWordsAv.ads : {};
  const mode = parseDuelWordsAdsMode(
    process.env.EXPO_PUBLIC_DUELWORDSAV_ADS_MODE ?? ads.mode,
  );

  if (mode !== 'live') {
    return { homeBannerAdUnitId: null, mode };
  }

  if (Platform.OS !== 'ios') {
    return { homeBannerAdUnitId: null, mode: 'disabled' };
  }

  const homeBannerAdUnitId = validAdMobBannerUnitId(
    process.env.EXPO_PUBLIC_DUELWORDSAV_ADMOB_IOS_HOME_BANNER_ID ?? ads.homeBannerAdUnitId,
  );
  return homeBannerAdUnitId
    ? { homeBannerAdUnitId, mode }
    : { homeBannerAdUnitId: null, mode: 'disabled' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
