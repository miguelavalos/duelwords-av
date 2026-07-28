import { describe, expect, it } from 'vitest';

import type { DuelWordsActivitySummary } from '@/game/activity/device-activity-store';
import type { GameLanguage } from '@/game/word-duel-engine';
import type { OfficialDailyStats } from '@/game/word-duel-daily/official-daily';

import { summarizeDuelWordsStats, summarizeRecentRivals } from './activity-summary';

const emptyDaily: OfficialDailyStats = {
  bestAttempts: null,
  completed: 0,
  currentStreak: 0,
  failed: 0,
  lastCompletedDate: null,
  solved: 0,
};

function record(input: Partial<DuelWordsActivitySummary>): DuelWordsActivitySummary {
  return {
    attemptsUsed: 4,
    completedAt: '2026-07-27T10:00:00.000Z',
    language: 'en',
    mode: 'practice',
    outcome: 'win',
    version: 1,
    ...input,
  };
}

function dailyStats(overrides: Partial<Record<GameLanguage, Partial<OfficialDailyStats>>> = {}) {
  return Object.fromEntries((['en', 'es', 'ca', 'fr', 'de'] as const).map((language) => [
    language,
    { ...emptyDaily, ...overrides[language] },
  ])) as Record<GameLanguage, OfficialDailyStats>;
}

describe('activity summaries', () => {
  it('summarizes the supplied tier and time-window activity without double-counting Daily rows', () => {
    const summary = summarizeDuelWordsStats({
      dailyStats: dailyStats({ en: { completed: 2, currentStreak: 2, solved: 1 } }),
      records: [
        record({ mode: 'practice', outcome: 'win' }),
        record({ mode: 'human_duel', outcome: 'loss', opponentDisplayName: 'Marta' }),
        record({ mode: 'daily', outcome: 'win' }),
      ],
      selectedLanguage: 'en',
    });

    expect(summary).toEqual({
      completed: 3,
      currentDailyStreak: 2,
      modeCounts: { avi: 0, daily: 1, friends: 1, practice: 1 },
      successRate: 67,
      victories: 2,
    });
  });

  it('groups recent completed human opponents without account identifiers', () => {
    expect(summarizeRecentRivals([
      record({ completedAt: '2026-07-26T12:00:00.000Z', mode: 'human_duel', opponentDisplayName: 'marta', outcome: 'loss' }),
      record({ completedAt: '2026-07-27T12:00:00.000Z', mode: 'human_duel', opponentDisplayName: 'Marta', outcome: 'win' }),
      record({ mode: 'bot_duel', opponentDisplayName: undefined }),
    ])).toEqual([{
      displayName: 'Marta',
      lastCompletedAt: '2026-07-27T12:00:00.000Z',
      lastOutcome: 'win',
      matches: 2,
    }]);
  });
});
