import { describe, expect, it } from 'vitest';

import { DUELWORDS_TIER_POLICIES, duelWordsTierForAccess } from './duelwords-tier-policy';

describe('DuelWords tier policy', () => {
  it('keeps every quantitative limit strictly ordered except Official Daily', () => {
    const { guest, free, pro } = DUELWORDS_TIER_POLICIES;
    expect(guest.humanChallengeCreationsPerDay).toBeLessThan(free.humanChallengeCreationsPerDay);
    expect(free.humanChallengeCreationsPerDay).toBeLessThan(pro.humanChallengeCreationsPerDay);
    expect(guest.historyRecords).toBeLessThan(free.historyRecords);
    expect(free.historyRecords).toBeLessThan(pro.historyRecords);
    expect(guest.statsWindowDays).toBeLessThan(free.statsWindowDays);
    expect(free.statsWindowDays).toBeLessThan(pro.statsWindowDays);
    expect(guest.dailyChallengesPerDay).toBe(free.dailyChallengesPerDay);
    expect(pro.dailyChallengesPerDay).toBeGreaterThan(free.dailyChallengesPerDay);
  });

  it('distinguishes guest access from a signed-in Free account', () => {
    expect(duelWordsTierForAccess({ accessMode: 'guest', planTier: 'free' })).toBe('guest');
    expect(duelWordsTierForAccess({ accessMode: 'signedInFree', planTier: 'free' })).toBe('free');
    expect(duelWordsTierForAccess({ accessMode: 'signedInPro', planTier: 'pro' })).toBe('pro');
  });
});
