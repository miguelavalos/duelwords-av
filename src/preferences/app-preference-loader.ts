import {
  createInitialAppPreferences,
  parseStoredAppPreferences,
  type AppPreferences,
} from './preference-schema';

export const APP_PREFERENCES_STORAGE_KEY = 'duelwords-av:preferences:v1';

type AppPreferenceStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function loadAppPreferences(
  storage: AppPreferenceStorage,
  preferredLanguages: readonly string[],
): AppPreferences {
  const storedPreferences = storage.getItem(APP_PREFERENCES_STORAGE_KEY);
  if (storedPreferences !== null) {
    return parseStoredAppPreferences(storedPreferences);
  }

  const initialPreferences = createInitialAppPreferences(preferredLanguages);
  try {
    storage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(initialPreferences));
  } catch {
    // Keep the device-derived first-run choice in memory when storage is unavailable.
  }
  return initialPreferences;
}
