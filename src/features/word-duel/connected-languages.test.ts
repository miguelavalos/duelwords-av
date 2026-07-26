import { describe, expect, it } from 'vitest';

import { GAME_LANGUAGES } from '../../i18n/locales';

import { CONNECTED_GAME_LANGUAGES, connectedGameLanguage } from './connected-languages';

describe('connected DuelWords languages', () => {
  it('offers every playable language in connected Challenge', () => {
    expect(CONNECTED_GAME_LANGUAGES.map(({ code }) => code)).toEqual(
      GAME_LANGUAGES.map(({ code }) => code),
    );
    expect(CONNECTED_GAME_LANGUAGES.map(({ code }) => code)).toEqual(['en', 'es', 'ca', 'fr', 'de']);
  });

  it('preserves the selected game language without an EN/ES fallback', () => {
    for (const { code } of GAME_LANGUAGES) {
      expect(connectedGameLanguage(code)).toBe(code);
    }
  });
});
