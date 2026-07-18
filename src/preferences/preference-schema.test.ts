import { describe, expect, it } from 'vitest';

import {
  DEFAULT_APP_PREFERENCES,
  parseAppPreferences,
  parseStoredAppPreferences,
} from './preference-schema';

describe('app preference schema', () => {
  it('accepts the complete versioned preference shape', () => {
    expect(parseAppPreferences({
      appearance: 'dark',
      gameLanguage: 'es',
      interfaceLocale: 'ca',
      version: 1,
    })).toEqual({
      appearance: 'dark',
      gameLanguage: 'es',
      interfaceLocale: 'ca',
      version: 1,
    });
  });

  it('recovers invalid individual fields without trusting unknown values', () => {
    expect(parseAppPreferences({
      appearance: 'provider-theme',
      gameLanguage: 'ca',
      interfaceLocale: 'xx',
      version: 1,
    })).toEqual(DEFAULT_APP_PREFERENCES);
  });

  it('fails closed for corrupt JSON and unknown schema versions', () => {
    expect(parseStoredAppPreferences('{bad-json')).toEqual(DEFAULT_APP_PREFERENCES);
    expect(parseStoredAppPreferences(JSON.stringify({
      appearance: 'dark',
      gameLanguage: 'es',
      interfaceLocale: 'es',
      version: 2,
    }))).toEqual(DEFAULT_APP_PREFERENCES);
  });
});
