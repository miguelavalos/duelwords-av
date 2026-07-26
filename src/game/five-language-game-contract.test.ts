import { describe, expect, it } from 'vitest';

import { GAME_LANGUAGES } from '../i18n/locales';

import { getLocalDictionary } from './dictionaries/local-fixtures';
import { applyGuess, createLocalGame } from './word-duel-engine';
import { createAviBotDuelSession, submitAviBotDuelGuess } from './word-duel-bot/view-model';
import { ACTIVE_DUEL_KEY_ROWS } from './word-duel-active/view-model';
import { applySoloDailyGuess, createSoloDailySession } from './word-duel-solo-daily/view-model';

const NOW_MS = Date.parse('2026-07-26T09:30:00.000Z');

describe('five-language playable game contract', () => {
  it('ships exactly EN, ES, CA, FR, and DE with a usable keyboard', () => {
    expect(GAME_LANGUAGES.map(({ code }) => code)).toEqual(['en', 'es', 'ca', 'fr', 'de']);
    expect(Object.keys(ACTIVE_DUEL_KEY_ROWS).sort()).toEqual(['ca', 'de', 'en', 'es', 'fr']);

    for (const { code } of GAME_LANGUAGES) {
      const keys = ACTIVE_DUEL_KEY_ROWS[code].flat();
      expect(keys).toContain('ENTER');
      expect(keys).toContain('DEL');
      expect(keys.filter((key) => key.length === 1).length).toBeGreaterThanOrEqual(26);
    }
    expect(ACTIVE_DUEL_KEY_ROWS.es.flat()).toContain('Ñ');
  });

  it.each(GAME_LANGUAGES.map(({ code }) => code))('%s accepts a bundled word in Practice, Solo, and Play Avi', (language) => {
    const dictionary = getLocalDictionary(language);
    const target = dictionary.targetWords[0];
    if (!target) throw new Error(`Missing ${language} target.`);

    const practice = applyGuess(
      createLocalGame({ dictionary, language, target }),
      target,
      dictionary,
    );
    expect(practice.accepted).toBe(true);

    const solo = createSoloDailySession({ gameLanguage: language, mode: 'solo_practice', nowMs: NOW_MS, seed: 0 });
    expect(applySoloDailyGuess({ input: solo.target.displayWord, nowMs: NOW_MS + 1_000, session: solo }).accepted).toBe(true);

    const avi = createAviBotDuelSession({ gameLanguage: language, gameSeed: 0, nowMs: NOW_MS });
    expect(submitAviBotDuelGuess({ input: avi.target.displayWord, nowMs: NOW_MS + 1_000, session: avi }).accepted).toBe(true);
  });
});
