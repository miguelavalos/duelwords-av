import Constants from 'expo-constants';

import { duelWordsIosSsoRedirectUrl } from './account-native-auth-contract';

export const DUELWORDS_ACCOUNT_AV_APP_ID = 'duelwordsav' as const;

export type DuelWordsAccountAvConfig = {
  accountApiBaseUrl: string | null;
  keychainAccessGroup: string;
  keychainService: string;
  iosSsoRedirectUrl: string;
  publishableKey: string | null;
};

export function getDuelWordsAccountAvConfig(): DuelWordsAccountAvConfig {
  const extra = isRecord(Constants.expoConfig?.extra) ? Constants.expoConfig.extra : {};
  const accountAv = isRecord(extra.accountAv) ? extra.accountAv : {};
  const duelWordsAv = isRecord(extra.duelWordsAv) ? extra.duelWordsAv : {};

  return {
    accountApiBaseUrl: httpsUrl(accountAv.apiBaseUrl ?? duelWordsAv.apiBaseUrl),
    keychainAccessGroup: stringValue(accountAv.keychainAccessGroup)
      ?? '935PM55U6R.com.avalsys.duelwordsav',
    keychainService: stringValue(accountAv.keychainService)
      ?? 'com.avalsys.duelwordsav.account',
    iosSsoRedirectUrl: duelWordsIosSsoRedirectUrl(Constants.expoConfig?.scheme),
    publishableKey: publishableKey(accountAv.publishableKey),
  };
}

function httpsUrl(value: unknown): string | null {
  const normalized = stringValue(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    return url.protocol === 'https:' ? url.toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

function publishableKey(value: unknown): string | null {
  const normalized = stringValue(value);
  return normalized?.startsWith('pk_') ? normalized : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
