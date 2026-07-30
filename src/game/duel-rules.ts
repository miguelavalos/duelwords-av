import type { DuelWordLength } from './word-duel-engine';

export const DUEL_ATTEMPT_OPTIONS = [4, 6, 8] as const;
export type DuelMaxAttempts = (typeof DUEL_ATTEMPT_OPTIONS)[number];

export type DuelRules = Readonly<{
  maxAttempts: DuelMaxAttempts;
  wordLength: DuelWordLength;
}>;

export type DuelRulesPresetId = 'classic' | 'quick' | 'strategic' | 'epic';

export const DUEL_RULES_PRESETS: readonly {
  id: DuelRulesPresetId;
  rules: DuelRules;
}[] = [
  { id: 'classic', rules: { maxAttempts: 6, wordLength: 5 } },
  { id: 'quick', rules: { maxAttempts: 4, wordLength: 5 } },
  { id: 'strategic', rules: { maxAttempts: 6, wordLength: 6 } },
  { id: 'epic', rules: { maxAttempts: 8, wordLength: 7 } },
];

export const DEFAULT_DUEL_RULES = DUEL_RULES_PRESETS[0].rules;

export function duelRulesPresetId(rules: DuelRules): DuelRulesPresetId | null {
  return DUEL_RULES_PRESETS.find((preset) => sameDuelRules(preset.rules, rules))?.id ?? null;
}

export function sameDuelRules(left: DuelRules, right: DuelRules): boolean {
  return left.maxAttempts === right.maxAttempts && left.wordLength === right.wordLength;
}

export function isDuelWordLength(value: number): value is DuelWordLength {
  return value === 5 || value === 6 || value === 7;
}

export function isDuelMaxAttempts(value: number): value is DuelMaxAttempts {
  return value === 4 || value === 6 || value === 8;
}
