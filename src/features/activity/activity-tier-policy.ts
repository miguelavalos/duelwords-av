import { DUELWORDS_TIER_POLICIES, type DuelWordsTier } from '../../entitlements/duelwords-tier-policy';
import type { DuelWordsActivitySummary } from '../../game/activity/device-activity-store';

export function visibleDuelWordsHistory(
  records: readonly DuelWordsActivitySummary[],
  tier: DuelWordsTier,
): readonly DuelWordsActivitySummary[] {
  return records.slice(0, DUELWORDS_TIER_POLICIES[tier].historyRecords);
}

export function duelWordsStatsWindow(
  records: readonly DuelWordsActivitySummary[],
  tier: DuelWordsTier,
  now = new Date(),
): readonly DuelWordsActivitySummary[] {
  const visible = visibleDuelWordsHistory(records, tier);
  const cutoff = new Date(now);
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - (DUELWORDS_TIER_POLICIES[tier].statsWindowDays - 1));
  return visible.filter((record) => Date.parse(record.completedAt) >= cutoff.getTime());
}
