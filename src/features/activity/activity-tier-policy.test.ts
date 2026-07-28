import { describe, expect, it } from 'vitest';

import type { DuelWordsActivitySummary } from '@/game/activity/device-activity-store';

import { duelWordsStatsWindow, visibleDuelWordsHistory } from './activity-tier-policy';

function records(count: number): DuelWordsActivitySummary[] {
  return Array.from({ length: count }, (_, index) => ({
    attemptsUsed: 1,
    completedAt: new Date(Date.UTC(2026, 6, 28 - index)).toISOString(),
    language: 'en',
    mode: 'practice',
    outcome: 'win',
    version: 1,
  }));
}

describe('tiered local activity visibility', () => {
  it('caps history at 25, 100, and 1,000 records', () => {
    const activity = records(1_100);
    expect(visibleDuelWordsHistory(activity, 'guest')).toHaveLength(25);
    expect(visibleDuelWordsHistory(activity, 'free')).toHaveLength(100);
    expect(visibleDuelWordsHistory(activity, 'pro')).toHaveLength(1_000);
  });

  it('uses 7, 30, and 365-day statistics windows', () => {
    const activity = records(500);
    const now = new Date('2026-07-28T12:00:00.000Z');
    expect(duelWordsStatsWindow(activity, 'guest', now)).toHaveLength(7);
    expect(duelWordsStatsWindow(activity, 'free', now)).toHaveLength(30);
    expect(duelWordsStatsWindow(activity, 'pro', now)).toHaveLength(365);
  });
});
