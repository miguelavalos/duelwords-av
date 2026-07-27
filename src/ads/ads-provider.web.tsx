import type { ReactNode } from 'react';

import { DuelWordsAdsContext, NO_DUELWORDS_ADS } from './ads-context';

export function DuelWordsAdsProvider({ children }: { children: ReactNode }) {
  return <DuelWordsAdsContext.Provider value={NO_DUELWORDS_ADS}>{children}</DuelWordsAdsContext.Provider>;
}
