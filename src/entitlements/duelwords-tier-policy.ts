import type { DuelWordsAccess } from '@/account/account-api-client';

export type DuelWordsTier = 'guest' | 'free' | 'pro';

export type DuelWordsTierPolicy = {
  dailyChallengesPerDay: number;
  dailyLanguageSelection: boolean;
  humanChallengeCreationsPerDay: number;
  historyRecords: number;
  statsWindowDays: number;
};

export const DUELWORDS_TIER_POLICIES: Readonly<Record<DuelWordsTier, DuelWordsTierPolicy>> = {
  guest: {
    dailyChallengesPerDay: 1,
    dailyLanguageSelection: false,
    humanChallengeCreationsPerDay: 3,
    historyRecords: 25,
    statsWindowDays: 7,
  },
  free: {
    dailyChallengesPerDay: 1,
    dailyLanguageSelection: false,
    humanChallengeCreationsPerDay: 6,
    historyRecords: 100,
    statsWindowDays: 30,
  },
  pro: {
    dailyChallengesPerDay: 5,
    dailyLanguageSelection: true,
    humanChallengeCreationsPerDay: 100,
    historyRecords: 1_000,
    statsWindowDays: 365,
  },
};

export function duelWordsTierForAccess(access: DuelWordsAccess): DuelWordsTier {
  if (access.planTier === 'pro') return 'pro';
  return access.accessMode === 'guest' ? 'guest' : 'free';
}

export function duelWordsPolicyForAccess(access: DuelWordsAccess): DuelWordsTierPolicy {
  return DUELWORDS_TIER_POLICIES[duelWordsTierForAccess(access)];
}
