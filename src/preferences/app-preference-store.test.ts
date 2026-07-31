import { describe, expect, it } from 'vitest';

import { loadAppPreferences } from './app-preference-loader';
import { DEFAULT_APP_PREFERENCES } from './preference-schema';

function createMemoryStorage(initialValue?: string) {
  let value = initialValue ?? null;
  return {
    getItem: () => value,
    setItem: (_key: string, nextValue: string) => {
      value = nextValue;
    },
    storedValue: () => value,
  };
}

describe('app preference store initialization', () => {
  it('persists the device-derived first-run language once', () => {
    const storage = createMemoryStorage();

    const firstLaunch = loadAppPreferences(storage, ['es-ES']);
    const laterLaunchAfterDeviceChange = loadAppPreferences(storage, ['de-DE']);

    expect(firstLaunch.interfaceLocale).toBe('es');
    expect(firstLaunch.gameLanguage).toBe('es');
    expect(laterLaunchAfterDeviceChange).toEqual(firstLaunch);
    expect(JSON.parse(storage.storedValue() ?? '')).toEqual(firstLaunch);
  });

  it('keeps a valid manual preference ahead of the device language', () => {
    const manualPreferences = {
      ...DEFAULT_APP_PREFERENCES,
      gameLanguage: 'ca' as const,
      interfaceLocale: 'fr' as const,
    };
    const storage = createMemoryStorage(JSON.stringify(manualPreferences));

    expect(loadAppPreferences(storage, ['es-ES'])).toEqual(manualPreferences);
  });

  it('keeps the first-run choice in memory when persistence is unavailable', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('unavailable');
      },
    };

    expect(loadAppPreferences(storage, ['fr-FR'])).toEqual({
      ...DEFAULT_APP_PREFERENCES,
      gameLanguage: 'fr',
      interfaceLocale: 'fr',
    });
  });
});
