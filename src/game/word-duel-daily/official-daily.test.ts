import { describe, expect, it, vi } from 'vitest';

import { getLocalDictionary } from '../dictionaries/local-fixtures';
import { readDuelWordsActivity } from '../activity/device-activity-store';
import type { DuelWordsApiDailyTarget } from '../word-duel-lobby/api-client';
import {
  applyOfficialDailyGuess,
  createOfficialDailySession,
  createSafeOfficialDailyShare,
  OfficialDailyLoader,
  persistOfficialDailySession,
  readOfficialDailyStats,
  readOfficialDailySession,
  readOfficialDailySessionsForDate,
  type OfficialDailyStorage,
} from './official-daily';

const DAILY_ACTOR = { actorType: 'guest_session', guestSessionId: 'daily-guest' } as const;

function memoryStorage(): OfficialDailyStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('official Daily local-first runtime', () => {
  it('fetches once for an uncached date and language, then resumes with zero requests', async () => {
    const storage = memoryStorage();
    const dictionary = getLocalDictionary('en');
    const targetWord = dictionary.validGuesses.find((word) => !dictionary.targetWords.includes(word));
    expect(targetWord).toBeTruthy();
    const response: DuelWordsApiDailyTarget = {
      dailyDate: '2026-07-27',
      timeZone: 'Europe/Madrid',
      language: 'en',
      wordLength: 5,
      targetWord: targetWord!,
      dictionaryVersion: 'production-release',
      policyVersion: 'duelwords-daily-v1',
      ruleVersion: 'duelwords-feedback-v1',
    };
    const getDailyTarget = vi.fn(async () => response);

    const first = await new OfficialDailyLoader({ getDailyTarget }, storage).load({
      actor: DAILY_ACTOR,
      language: 'en',
      now: new Date('2026-07-27T10:00:00.000Z'),
      timeZone: 'Europe/Madrid',
    });
    const second = await new OfficialDailyLoader({
      getDailyTarget: vi.fn(() => Promise.reject(new Error('network must not run'))),
    }, storage).load({
      actor: DAILY_ACTOR,
      language: 'en',
      now: new Date('2026-07-27T10:05:00.000Z'),
      timeZone: 'Europe/Madrid',
    });

    expect(getDailyTarget).toHaveBeenCalledTimes(1);
    expect(first.source).toBe('network');
    expect(second.source).toBe('cache');
    expect(second.session).toEqual(first.session);
    expect(readOfficialDailySession({
      dailyDate: '2026-07-27',
      language: 'en',
      storage,
      timeZone: 'Europe/Madrid',
    })).toEqual(first.session);
  });

  it('coalesces simultaneous starts into one request', async () => {
    const storage = memoryStorage();
    const response = targetResponse('es', 'avion');
    const getDailyTarget = vi.fn(async () => response);
    const loader = new OfficialDailyLoader({ getDailyTarget }, storage);
    const input = {
      actor: DAILY_ACTOR,
      language: 'es' as const,
      now: new Date('2026-07-27T10:00:00.000Z'),
      timeZone: 'Europe/Madrid',
    };

    const [first, second] = await Promise.all([loader.load(input), loader.load(input)]);

    expect(getDailyTarget).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('finds an already-started Daily in any language for the one-total-per-day tiers', () => {
    const storage = memoryStorage();
    const spanish = createOfficialDailySession(
      targetResponse('es', 'avion'),
      '2026-07-27',
      new Date('2026-07-27T08:00:00.000Z'),
    );
    persistOfficialDailySession(spanish, storage);

    expect(readOfficialDailySessionsForDate({
      dailyDate: '2026-07-27',
      storage,
      timeZone: 'Europe/Madrid',
    })).toEqual([spanish]);
    expect(readOfficialDailySessionsForDate({
      dailyDate: '2026-07-28',
      storage,
      timeZone: 'Europe/Madrid',
    })).toEqual([]);
  });

  it('rejects an unknown server target without caching it', async () => {
    const storage = memoryStorage();
    const getDailyTarget = vi.fn(async () => targetResponse('fr', 'xxxxx'));

    await expect(new OfficialDailyLoader({ getDailyTarget }, storage).load({
      actor: DAILY_ACTOR,
      language: 'fr',
      now: new Date('2026-07-27T10:00:00.000Z'),
      timeZone: 'UTC',
    })).rejects.toMatchObject({ code: 'invalid_target' });
    expect(readOfficialDailySession({
      dailyDate: '2026-07-27', language: 'fr', storage, timeZone: 'UTC',
    })).toBeNull();
  });

  it('fails closed for corrupt saved state and for unavailable first-time play', async () => {
    const storage = memoryStorage();
    storage.setItem('duelwords-av:official-daily:v1', JSON.stringify({
      version: 1,
      stats: {},
      sessions: {
        '2026-07-27|UTC|en': {
          ...createOfficialDailySession(
            targetResponse('en', getLocalDictionary('en').targetWords[0]),
            '2026-07-27',
            new Date('2026-07-27T08:00:00.000Z'),
          ),
          targetDisplayWord: 'xxxxx',
        },
      },
    }));

    expect(readOfficialDailySession({
      dailyDate: '2026-07-27', language: 'en', storage, timeZone: 'UTC',
    })).toBeNull();

    const offline = new Error('offline');
    await expect(new OfficialDailyLoader({
      getDailyTarget: vi.fn(() => Promise.reject(offline)),
    }, storage).load({
      actor: DAILY_ACTOR,
      language: 'en',
      now: new Date('2026-07-27T08:00:00.000Z'),
      timeZone: 'UTC',
    })).rejects.toBe(offline);
  });

  it('keeps play and participation streaks local, final, and safe to share', () => {
    const storage = memoryStorage();
    const dictionary = getLocalDictionary('de');
    const target = dictionary.targetWords[0];
    const miss = dictionary.validGuesses.find((word) => word !== target)!;
    let solved = createOfficialDailySession(
      targetResponse('de', target, '2026-07-27'),
      '2026-07-27',
      new Date('2026-07-27T08:00:00.000Z'),
    );
    persistOfficialDailySession(solved, storage);
    const solvedResult = applyOfficialDailyGuess({
      input: target,
      now: new Date('2026-07-27T08:01:00.000Z'),
      session: solved,
      storage,
    });
    expect(solvedResult.accepted).toBe(true);
    if (!solvedResult.accepted) throw new Error('Expected accepted Daily guess.');
    solved = solvedResult.session;
    expect(solved.state.status).toBe('won');

    let failed = createOfficialDailySession(
      targetResponse('de', target, '2026-07-28'),
      '2026-07-28',
      new Date('2026-07-28T08:00:00.000Z'),
    );
    persistOfficialDailySession(failed, storage);
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const result = applyOfficialDailyGuess({
        input: miss,
        now: new Date(`2026-07-28T08:0${attempt}:00.000Z`),
        session: failed,
        storage,
      });
      expect(result.accepted).toBe(true);
      if (!result.accepted) throw new Error('Expected accepted Daily guess.');
      failed = result.session;
    }

    expect(failed.state.status).toBe('lost');
    expect(readOfficialDailyStats('de', storage)).toEqual({
      bestAttempts: 1,
      completed: 2,
      currentStreak: 2,
      failed: 1,
      lastCompletedDate: '2026-07-28',
      solved: 1,
    });
    expect(readDuelWordsActivity(storage)).toMatchObject([
      { language: 'de', mode: 'daily', outcome: 'no_winner' },
      { language: 'de', mode: 'daily', outcome: 'win' },
    ]);
    const share = createSafeOfficialDailyShare(solved);
    expect(share).toContain('1/6');
    expect(share.toLowerCase()).not.toContain(target.toLowerCase());
    expect(share).not.toContain('🟩');
  });
});

function targetResponse(
  language: DuelWordsApiDailyTarget['language'],
  targetWord: string,
  dailyDate = '2026-07-27',
): DuelWordsApiDailyTarget {
  return {
    dailyDate,
    timeZone: language === 'es' ? 'Europe/Madrid' : 'UTC',
    language,
    wordLength: 5,
    targetWord,
    dictionaryVersion: 'production-release',
    policyVersion: 'duelwords-daily-v1',
    ruleVersion: 'duelwords-feedback-v1',
  };
}
