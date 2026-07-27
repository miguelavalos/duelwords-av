import type { GameLanguage } from '../word-duel-engine';

const STORAGE_KEY = 'duelwords-av:activity:v1';
const MAX_ACTIVITY_RECORDS = 100;
const listeners = new Set<() => void>();
let revision = 0;

export type DuelWordsActivityMode = 'practice' | 'bot_duel' | 'human_duel' | 'daily';
export type DuelWordsActivityOutcome = 'win' | 'loss' | 'draw' | 'no_winner';
export type DuelWordsActivityStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type DuelWordsActivitySummary = {
  attemptsUsed: number;
  completedAt: string;
  language: GameLanguage;
  mode: DuelWordsActivityMode;
  opponentDisplayName?: string;
  outcome: DuelWordsActivityOutcome;
  version: 1;
};

type DuelWordsActivityStore = {
  records: DuelWordsActivitySummary[];
  version: 1;
};

export function readDuelWordsActivity(
  storage: DuelWordsActivityStorage | null = deviceStorage(),
): readonly DuelWordsActivitySummary[] {
  return readStore(storage).records;
}

export function recordDuelWordsActivity(
  input: Omit<DuelWordsActivitySummary, 'completedAt' | 'opponentDisplayName' | 'version'> & {
    completedAt?: string;
    opponentDisplayName?: string | null;
  },
  storage: DuelWordsActivityStorage | null = deviceStorage(),
): boolean {
  if (!storage) return false;

  const record = createRecord(input);
  if (!record) return false;

  try {
    const store = readStore(storage);
    store.records = [record, ...store.records].slice(0, MAX_ACTIVITY_RECORDS);
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    return false;
  }

  revision += 1;
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // A presentation subscriber must never interrupt result finalization.
    }
  });
  return true;
}

export function subscribeToDuelWordsActivity(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDuelWordsActivityRevision(): number {
  return revision;
}

function createRecord(
  input: Omit<DuelWordsActivitySummary, 'completedAt' | 'opponentDisplayName' | 'version'> & {
    completedAt?: string;
    opponentDisplayName?: string | null;
  },
): DuelWordsActivitySummary | null {
  const completedAt = input.completedAt ?? new Date().toISOString();
  if (!Number.isInteger(input.attemptsUsed)
    || input.attemptsUsed < 0
    || input.attemptsUsed > 6
    || Number.isNaN(Date.parse(completedAt))) {
    return null;
  }

  const opponentDisplayName = input.mode === 'human_duel'
    ? sanitizeDisplayName(input.opponentDisplayName)
    : null;

  return {
    attemptsUsed: input.attemptsUsed,
    completedAt,
    language: input.language,
    mode: input.mode,
    ...(opponentDisplayName ? { opponentDisplayName } : {}),
    outcome: input.outcome,
    version: 1,
  };
}

function readStore(storage: DuelWordsActivityStorage | null): DuelWordsActivityStore {
  if (!storage) return emptyStore();

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as Partial<DuelWordsActivityStore> | null;
    if (parsed?.version !== 1 || !Array.isArray(parsed.records)) return emptyStore();
    return {
      records: parsed.records.filter(isActivitySummary).slice(0, MAX_ACTIVITY_RECORDS),
      version: 1,
    };
  } catch {
    return emptyStore();
  }
}

function isActivitySummary(value: unknown): value is DuelWordsActivitySummary {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<DuelWordsActivitySummary>;
  if (record.version !== 1
    || !isMode(record.mode)
    || !isOutcome(record.outcome)
    || !isLanguage(record.language)
    || !Number.isInteger(record.attemptsUsed)
    || (record.attemptsUsed ?? -1) < 0
    || (record.attemptsUsed ?? 7) > 6
    || typeof record.completedAt !== 'string'
    || Number.isNaN(Date.parse(record.completedAt))) {
    return false;
  }

  return record.opponentDisplayName === undefined
    || (record.mode === 'human_duel'
      && sanitizeDisplayName(record.opponentDisplayName) === record.opponentDisplayName);
}

function sanitizeDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
  return normalized || null;
}

function isMode(value: unknown): value is DuelWordsActivityMode {
  return value === 'practice' || value === 'bot_duel' || value === 'human_duel' || value === 'daily';
}

function isOutcome(value: unknown): value is DuelWordsActivityOutcome {
  return value === 'win' || value === 'loss' || value === 'draw' || value === 'no_winner';
}

function isLanguage(value: unknown): value is GameLanguage {
  return value === 'en' || value === 'es' || value === 'ca' || value === 'fr' || value === 'de';
}

function emptyStore(): DuelWordsActivityStore {
  return { records: [], version: 1 };
}

function deviceStorage(): DuelWordsActivityStorage | null {
  try {
    const storage = globalThis.localStorage;
    return storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function'
      ? storage
      : null;
  } catch {
    return null;
  }
}
