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
      hapticsEnabled: false,
      interfaceLocale: 'ca',
      version: 2,
    })).toEqual({
      appearance: 'dark',
      gameLanguage: 'es',
      hapticsEnabled: false,
      interfaceLocale: 'ca',
      version: 2,
    });
  });

  it('recovers invalid individual fields without trusting unknown values', () => {
    expect(parseAppPreferences({
      appearance: 'provider-theme',
      gameLanguage: 'ca',
      interfaceLocale: 'xx',
      version: 2,
    })).toEqual(DEFAULT_APP_PREFERENCES);
  });

  it('fails closed for corrupt JSON and unknown schema versions', () => {
    expect(parseStoredAppPreferences('{bad-json')).toEqual(DEFAULT_APP_PREFERENCES);
    expect(parseStoredAppPreferences(JSON.stringify({
      appearance: 'dark',
      gameLanguage: 'es',
      interfaceLocale: 'es',
      version: 3,
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
      version: 2,
    });
  });
});
