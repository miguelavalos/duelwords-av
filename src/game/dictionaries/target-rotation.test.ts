import { describe, expect, it } from 'vitest';

import {
  advanceTargetSelection,
  commitTargetSelection,
  planTargetSelection,
  type TargetRotationStorage,
} from './target-rotation';

function memoryStorage(initial?: string): TargetRotationStorage {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set('duelwords-av:target-rotation:v1', initial);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('local target rotation', () => {
  it('uses every target exactly once before starting another cycle', () => {
    let selection = planTargetSelection({
      language: 'ca',
      mode: 'practice',
      random: () => 0.25,
      storage: null,
      targetCount: 500,
    });
    const indexes: number[] = [];

    for (let count = 0; count < 500; count += 1) {
      indexes.push(selection.index);
      selection = advanceTargetSelection(selection);
    }

    expect(new Set(indexes).size).toBe(500);
    expect(Math.min(...indexes)).toBe(0);
    expect(Math.max(...indexes)).toBe(499);
  });

  it('does not repeat a target at a cycle boundary', () => {
    let selection = planTargetSelection({
      language: 'de',
      mode: 'play_avi',
      random: () => 0.75,
      storage: null,
      targetCount: 17,
    });
    const indexes: number[] = [];
    for (let count = 0; count < 18; count += 1) {
      indexes.push(selection.index);
      selection = advanceTargetSelection(selection);
    }

    expect(indexes[16]).not.toBe(indexes[17]);
  });

  it('shares a language cursor across local modes and separates languages', () => {
    const storage = memoryStorage();
    const englishPractice = planTargetSelection({
      language: 'en', mode: 'practice', random: () => 0.1, storage, targetCount: 10,
    });
    expect(commitTargetSelection(englishPractice, storage)).toBe(true);
    expect(commitTargetSelection(englishPractice, storage)).toBe(false);

    const nextEnglishPractice = planTargetSelection({
      language: 'en', mode: 'practice', random: () => 0.9, storage, targetCount: 10,
    });
    const englishAvi = planTargetSelection({
      language: 'en', mode: 'play_avi', random: () => 0.1, storage, targetCount: 10,
    });
    const spanishPractice = planTargetSelection({
      language: 'es', mode: 'practice', random: () => 0.1, storage, targetCount: 10,
    });

    expect(nextEnglishPractice.position).toBe(1);
    expect(englishAvi.position).toBe(1);
    expect(spanishPractice.position).toBe(0);
  });

  it('recovers safely from malformed persisted state', () => {
    const selection = planTargetSelection({
      language: 'fr',
      mode: 'practice',
      random: () => 0.5,
      storage: memoryStorage('{not-json'),
      targetCount: 20,
    });

    expect(selection.position).toBe(0);
    expect(selection.index).toBeGreaterThanOrEqual(0);
    expect(selection.index).toBeLessThan(20);
  });

  it('migrates a persisted cursor when a dictionary target count changes', () => {
    const storage = memoryStorage(JSON.stringify({
      streams: {
        'local:en': { nextPosition: 37, seed: 123, targetCount: 589 },
      },
      version: 1,
    }));
    const migrated = planTargetSelection({
      language: 'en',
      mode: 'practice',
      random: () => 0.5,
      storage,
      targetCount: 750,
    });

    expect(migrated.position).toBe(0);
    expect(commitTargetSelection(migrated, storage)).toBe(true);
    expect(planTargetSelection({
      language: 'en',
      mode: 'play_avi',
      random: () => 0.9,
      storage,
      targetCount: 750,
    }).position).toBe(1);
  });
});
