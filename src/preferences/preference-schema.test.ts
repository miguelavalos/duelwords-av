import { describe, expect, it } from 'vitest';

import {
  createInitialAppPreferences,
  DEFAULT_APP_PREFERENCES,
  parseAppPreferences,
  parseStoredAppPreferences,
} from './preference-schema';

describe('app preference schema', () => {
  it.each([
    ['ca', 'ca_ES'],
    ['de', 'de-DE'],
    ['en', 'en-US'],
    ['es', 'es-419'],
    ['fr', 'fr-CA'],
  ] as const)('initializes interface and game language as %s for %s', (expected, preferred) => {
    expect(createInitialAppPreferences([preferred])).toEqual({
      ...DEFAULT_APP_PREFERENCES,
      gameLanguage: expected,
      interfaceLocale: expected,
    });
  });

  it('uses only the primary device language and falls back to English', () => {
    expect(createInitialAppPreferences(['it-IT', 'es-ES'])).toEqual(DEFAULT_APP_PREFERENCES);
    expect(createInitialAppPreferences([])).toEqual(DEFAULT_APP_PREFERENCES);
    expect(createInitialAppPreferences(['esoteric'])).toEqual(DEFAULT_APP_PREFERENCES);
  });

  it('accepts the complete versioned preference shape', () => {
    expect(parseAppPreferences({
      appearance: 'dark',
      aviDifficulty: 'balanced',
      gameLanguage: 'es',
      hapticsEnabled: false,
      interfaceLocale: 'ca',
      playerDisplayName: 'María Sol',
      version: 3,
    })).toEqual({
      appearance: 'dark',
      aviDifficulty: 'balanced',
      gameLanguage: 'es',
      hapticsEnabled: false,
      interfaceLocale: 'ca',
      playerDisplayName: 'María Sol',
      version: 3,
    });
  });

  it('recovers invalid individual fields without trusting unknown values', () => {
    expect(parseAppPreferences({
      appearance: 'provider-theme',
      gameLanguage: 'ca',
      interfaceLocale: 'xx',
      version: 3,
    })).toEqual({
      ...DEFAULT_APP_PREFERENCES,
      gameLanguage: 'ca',
    });
  });

  it.each(['ca', 'de', 'en', 'es', 'fr'] as const)('persists %s as a playable language', (gameLanguage) => {
    expect(parseAppPreferences({
      ...DEFAULT_APP_PREFERENCES,
      gameLanguage,
    }).gameLanguage).toBe(gameLanguage);
  });

  it('fails closed for corrupt JSON and unknown schema versions', () => {
    expect(parseStoredAppPreferences('{bad-json')).toEqual(DEFAULT_APP_PREFERENCES);
    expect(parseStoredAppPreferences(JSON.stringify({
      appearance: 'dark',
      gameLanguage: 'es',
      interfaceLocale: 'es',
      version: 4,
    }))).toEqual(DEFAULT_APP_PREFERENCES);
  });

  it('migrates the V1 preference shape with haptics enabled by default', () => {
    expect(parseAppPreferences({
      appearance: 'light',
      gameLanguage: 'es',
      interfaceLocale: 'es',
      version: 1,
    })).toEqual({
      appearance: 'light',
      gameLanguage: 'es',
      hapticsEnabled: true,
      interfaceLocale: 'es',
      playerDisplayName: '',
      aviDifficulty: 'friendly',
      version: 3,
    });
  });

  it('sanitizes the optional local DuelWords display name during migration', () => {
    expect(parseAppPreferences({
      ...DEFAULT_APP_PREFERENCES,
      playerDisplayName: '  María   Sol  ',
    }).playerDisplayName).toBe('María Sol');
    expect(parseAppPreferences({
      ...DEFAULT_APP_PREFERENCES,
      playerDisplayName: 'a'.repeat(33),
    }).playerDisplayName).toBe('');
  });
});
