import type { DuelWordLength, GameLanguage } from '../word-duel-engine/types';

export type LocalTargetMode = 'play_avi' | 'practice' | 'solo_practice';

export type TargetRotationSelection = Readonly<{
  index: number;
  language: GameLanguage;
  mode: LocalTargetMode;
  position: number;
  seed: number;
  targetCount: number;
  wordLength: DuelWordLength;
}>;

type TargetRotationStream = {
  nextPosition: number;
  seed: number;
  targetCount: number;
};

type TargetRotationState = {
  streams: Record<string, TargetRotationStream>;
  version: 1;
};

export type TargetRotationStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type TargetRotationResetStorage = Pick<Storage, 'removeItem'>;

const STORAGE_KEY = 'duelwords-av:target-rotation:v1';

export function planTargetSelection({
  language,
  mode,
  random = Math.random,
  storage = deviceStorage(),
  targetCount,
  wordLength = 5,
}: {
  language: GameLanguage;
  mode: LocalTargetMode;
  random?: () => number;
  storage?: TargetRotationStorage | null;
  targetCount: number;
  wordLength?: DuelWordLength;
}): TargetRotationSelection {
  assertTargetCount(targetCount);
  const stored = readState(storage).streams[streamKey(language, mode, wordLength)];
  const stream = stored && stored.targetCount === targetCount
    ? stored
    : {
        nextPosition: 0,
        seed: stored ? mixSeed(stored.seed, targetCount) : randomSeed(random),
        targetCount,
      };

  return selectionAt({
    language,
    mode,
    position: stream.nextPosition,
    seed: stream.seed,
    targetCount,
    wordLength,
  });
}

export function advanceTargetSelection(selection: TargetRotationSelection): TargetRotationSelection {
  return selectionAt({
    ...selection,
    position: selection.position + 1,
  });
}

export function commitTargetSelection(
  selection: TargetRotationSelection,
  storage: TargetRotationStorage | null = deviceStorage(),
): boolean {
  if (!storage) return false;

  const state = readState(storage);
  const key = streamKey(selection.language, selection.mode, selection.wordLength);
  const current = state.streams[key];

  // React development mode can run effects more than once. Only the plan for
  // the current cursor may advance it, which makes persistence idempotent.
  if (current) {
    const isTargetCountMigration = current.targetCount !== selection.targetCount
      && selection.position === 0;
    if (!isTargetCountMigration && (
      current.seed !== selection.seed
      || current.targetCount !== selection.targetCount
      || current.nextPosition !== selection.position
    )) {
      return false;
    }
  } else if (selection.position !== 0) {
    return false;
  }

  state.streams[key] = {
    nextPosition: selection.position + 1,
    seed: selection.seed,
    targetCount: selection.targetCount,
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
  return true;
}

export function resetTargetRotation(
  storage: TargetRotationResetStorage | null = deviceStorage(),
): boolean {
  if (!storage) return false;
  storage.removeItem(STORAGE_KEY);
  return true;
}

function selectionAt({
  language,
  mode,
  position,
  seed,
  targetCount,
  wordLength,
}: Omit<TargetRotationSelection, 'index'>): TargetRotationSelection {
  assertTargetCount(targetCount);
  if (!Number.isSafeInteger(position) || position < 0) {
    throw new Error('Target rotation position must be a non-negative safe integer.');
  }

  const cycle = Math.floor(position / targetCount);
  const cyclePosition = position % targetCount;
  const order = shuffledIndexes(targetCount, mixSeed(seed, cycle));

  if (cycle > 0 && targetCount > 1) {
    const previousOrder = shuffledIndexes(targetCount, mixSeed(seed, cycle - 1));
    if (order[0] === previousOrder[targetCount - 1]) {
      [order[0], order[1]] = [order[1], order[0]];
    }
  }

  return {
    index: order[cyclePosition],
    language,
    mode,
    position,
    seed,
    targetCount,
    wordLength,
  };
}

function shuffledIndexes(count: number, seed: number): number[] {
  const values = Array.from({ length: count }, (_, index) => index);
  const random = mulberry32(seed);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function mixSeed(seed: number, value: number): number {
  let mixed = (seed ^ Math.imul(value + 1, 0x9e3779b1)) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x85ebca6b) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35) >>> 0;
  return (mixed ^ (mixed >>> 16)) >>> 0;
}

function randomSeed(random: () => number): number {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error('Target rotation random source must return a value in [0, 1).');
  }
  return Math.floor(value * 4_294_967_296) >>> 0;
}

function streamKey(language: GameLanguage, mode: LocalTargetMode, wordLength: DuelWordLength): string {
  // All non-Daily local modes share one device-local deck so switching modes
  // does not surface a word that the player has just seen elsewhere.
  void mode;
  return `local:${language}:${wordLength}`;
}

function readState(storage: TargetRotationStorage | null): TargetRotationState {
  if (!storage) return emptyState();

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as Partial<TargetRotationState> | null;
    if (parsed?.version !== 1 || !parsed.streams || typeof parsed.streams !== 'object') {
      return emptyState();
    }

    const streams: Record<string, TargetRotationStream> = {};
    for (const [key, value] of Object.entries(parsed.streams)) {
      if (
        value
        && Number.isSafeInteger(value.nextPosition)
        && value.nextPosition >= 0
        && Number.isInteger(value.seed)
        && value.seed >= 0
        && Number.isInteger(value.targetCount)
        && value.targetCount > 0
      ) {
        streams[key] = value;
      }
    }
    return { streams, version: 1 };
  } catch {
    return emptyState();
  }
}

function emptyState(): TargetRotationState {
  return { streams: {}, version: 1 };
}

function deviceStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function assertTargetCount(targetCount: number): void {
  if (!Number.isInteger(targetCount) || targetCount < 1) {
    throw new Error('Target rotation requires at least one target.');
  }
}
