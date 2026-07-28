import type {
  DuelWordsActivityOutcome,
  DuelWordsActivitySummary,
} from '@/game/activity/device-activity-store';
import type { GameLanguage } from '@/game/word-duel-engine';
import type { OfficialDailyStats } from '@/game/word-duel-daily/official-daily';

export type DuelWordsStatsSummary = {
  completed: number;
  currentDailyStreak: number;
  modeCounts: {
    avi: number;
    daily: number;
    friends: number;
    practice: number;
  };
  successRate: number;
  victories: number;
};

export type DuelWordsRecentRival = {
  displayName: string;
  lastCompletedAt: string;
  lastOutcome: DuelWordsActivityOutcome;
  matches: number;
};

export function summarizeDuelWordsStats(input: {
  dailyStats: Record<GameLanguage, OfficialDailyStats>;
  records: readonly DuelWordsActivitySummary[];
  selectedLanguage: GameLanguage;
}): DuelWordsStatsSummary {
  const completed = input.records.length;
  const victories = input.records.filter((record) => record.outcome === 'win').length;

  return {
    completed,
    currentDailyStreak: input.dailyStats[input.selectedLanguage].currentStreak,
    modeCounts: {
      avi: input.records.filter((record) => record.mode === 'bot_duel').length,
      daily: input.records.filter((record) => record.mode === 'daily').length,
      friends: input.records.filter((record) => record.mode === 'human_duel').length,
      practice: input.records.filter((record) => record.mode === 'practice').length,
    },
    successRate: completed === 0 ? 0 : Math.round((victories / completed) * 100),
    victories,
  };
}

export function summarizeRecentRivals(
  records: readonly DuelWordsActivitySummary[],
): readonly DuelWordsRecentRival[] {
  const rivals = new Map<string, DuelWordsRecentRival>();

  for (const record of records) {
    if (record.mode !== 'human_duel' || !record.opponentDisplayName) continue;
    const key = record.opponentDisplayName.toLocaleLowerCase();
    const current = rivals.get(key);
    if (current) {
      current.matches += 1;
      if (Date.parse(record.completedAt) > Date.parse(current.lastCompletedAt)) {
        current.displayName = record.opponentDisplayName;
        current.lastCompletedAt = record.completedAt;
        current.lastOutcome = record.outcome;
      }
    } else {
      rivals.set(key, {
        displayName: record.opponentDisplayName,
        lastCompletedAt: record.completedAt,
        lastOutcome: record.outcome,
        matches: 1,
      });
    }
  }

  return Array.from(rivals.values())
    .sort((left, right) => Date.parse(right.lastCompletedAt) - Date.parse(left.lastCompletedAt))
    .slice(0, 20);
}
