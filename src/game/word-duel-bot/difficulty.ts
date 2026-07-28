export const AVI_DIFFICULTIES = ['friendly', 'balanced', 'expert'] as const;

export type AviDifficulty = (typeof AVI_DIFFICULTIES)[number];

export const DEFAULT_AVI_DIFFICULTY: AviDifficulty = 'friendly';

export function isAviDifficulty(value: unknown): value is AviDifficulty {
  return typeof value === 'string' && AVI_DIFFICULTIES.includes(value as AviDifficulty);
}

export function aviDifficultyMinimumSolveRound(difficulty: AviDifficulty): number {
  switch (difficulty) {
    case 'friendly':
      return 4;
    case 'balanced':
      return 3;
    case 'expert':
      return 2;
  }
}

export function aviDifficultyClueMemory(difficulty: AviDifficulty): number {
  switch (difficulty) {
    case 'friendly':
      return 1;
    case 'balanced':
      return 2;
    case 'expert':
      return Number.POSITIVE_INFINITY;
  }
}
