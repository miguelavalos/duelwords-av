import { describe, expect, it } from 'vitest';

import {
  canRequestDuelWordsAds,
  parseDuelWordsAdsMode,
  validAdMobBannerUnitId,
} from './ads-policy';

describe('DuelWords advertising policy', () => {
  it('fails closed for disabled config, Pro, and unresolved account state', () => {
    expect(canRequestDuelWordsAds('disabled', { planTier: 'free', status: 'guest' })).toBe(false);
    expect(canRequestDuelWordsAds('test', { planTier: 'pro', status: 'signed_in' })).toBe(false);
    expect(canRequestDuelWordsAds('live', { planTier: 'free', status: 'loading' })).toBe(false);
    expect(canRequestDuelWordsAds('live', { planTier: 'free', status: 'account_error' })).toBe(false);
    expect(canRequestDuelWordsAds('live', { planTier: 'free', status: 'unavailable' })).toBe(false);
  });

  it('allows only resolved Guest and Free account states', () => {
    expect(canRequestDuelWordsAds('test', { planTier: 'free', status: 'guest' })).toBe(true);
    expect(canRequestDuelWordsAds('live', { planTier: 'free', status: 'signed_in' })).toBe(true);
    expect(canRequestDuelWordsAds('live', { planTier: 'free', status: 'signed_in_offline' })).toBe(true);
  });

  it('parses modes and live banner identifiers conservatively', () => {
    expect(parseDuelWordsAdsMode('test')).toBe('test');
    expect(parseDuelWordsAdsMode('live')).toBe('live');
    expect(parseDuelWordsAdsMode('production')).toBe('disabled');
    expect(validAdMobBannerUnitId('ca-app-pub-123456/7890')).toBe('ca-app-pub-123456/7890');
    expect(validAdMobBannerUnitId('ca-app-pub-123456~7890')).toBeNull();
    expect(validAdMobBannerUnitId('')).toBeNull();
  });
});
