import { createContext, use } from 'react';

import type { DuelWordsAdsMode } from './ads-policy';

export type DuelWordsAdsContextValue = {
  activateHomePlacement: () => () => void;
  canShowAds: boolean;
  homeBannerAdUnitId: string | null;
  mode: DuelWordsAdsMode;
  privacyOptionsRequired: boolean;
  showPrivacyOptions: () => Promise<void>;
};

export const NO_DUELWORDS_ADS: DuelWordsAdsContextValue = {
  activateHomePlacement: () => () => undefined,
  canShowAds: false,
  homeBannerAdUnitId: null,
  mode: 'disabled',
  privacyOptionsRequired: false,
  showPrivacyOptions: async () => undefined,
};

export const DuelWordsAdsContext = createContext<DuelWordsAdsContextValue>(NO_DUELWORDS_ADS);

export function useDuelWordsAds(): DuelWordsAdsContextValue {
  return use(DuelWordsAdsContext);
}
