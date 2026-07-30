import { getDuelWordsWebRuntimeConfig } from '@/config/web-runtime';

import type { DuelWordsAccountAvConfig } from './account-av-config';

export const DUELWORDS_ACCOUNT_AV_APP_ID = 'duelwordsav' as const;

export function getDuelWordsAccountAvConfig(): DuelWordsAccountAvConfig {
  const runtime = getDuelWordsWebRuntimeConfig();
  return {
    accountApiBaseUrl: runtime?.accountApiBaseUrl ?? null,
    keychainAccessGroup: '935PM55U6R.com.avalsys.duelwordsav',
    keychainService: 'com.avalsys.duelwordsav.account',
    iosSsoRedirectUrl: 'com.avalsys.duelwordsav://callback',
    publishableKey: runtime?.accountPublishableKey ?? null,
  };
}
