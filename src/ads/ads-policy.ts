export type DuelWordsAdsMode = 'disabled' | 'live' | 'test';

export type DuelWordsAdsAccountSnapshot = {
  planTier: 'free' | 'pro';
  status: 'account_error' | 'guest' | 'loading' | 'signed_in' | 'signed_in_offline' | 'unavailable';
};

const RESOLVED_FREE_STATES = new Set<DuelWordsAdsAccountSnapshot['status']>([
  'guest',
  'signed_in',
  'signed_in_offline',
]);

export function canRequestDuelWordsAds(
  mode: DuelWordsAdsMode,
  account: DuelWordsAdsAccountSnapshot,
): boolean {
  return mode !== 'disabled'
    && account.planTier === 'free'
    && RESOLVED_FREE_STATES.has(account.status);
}

export function parseDuelWordsAdsMode(value: unknown): DuelWordsAdsMode {
  return value === 'test' || value === 'live' ? value : 'disabled';
}

export function validAdMobBannerUnitId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return /^ca-app-pub-\d+\/\d+$/.test(normalized) ? normalized : null;
}
