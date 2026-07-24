import { useSyncExternalStore } from 'react';

import {
  DEFAULT_APP_PREFERENCES,
  parseStoredAppPreferences,
  type AppPreferences,
} from './preference-schema';

const APP_PREFERENCES_STORAGE_KEY = 'duelwords-av:preferences:v1';
const listeners = new Set<() => void>();
let cachedPreferences: AppPreferences | null = null;

export function useAppPreferences(): readonly [
  AppPreferences,
  (next: AppPreferences | ((current: AppPreferences) => AppPreferences)) => void,
] {
  const preferences = useSyncExternalStore(
    subscribe,
    readPreferences,
    () => DEFAULT_APP_PREFERENCES,
  );

  return [preferences, setAppPreferences] as const;
}

function readPreferences(): AppPreferences {
  if (cachedPreferences !== null) {
    return cachedPreferences;
  }

  if (typeof localStorage === 'undefined') {
    cachedPreferences = DEFAULT_APP_PREFERENCES;
    return cachedPreferences;
  }

  try {
    cachedPreferences = parseStoredAppPreferences(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY));
  } catch {
    cachedPreferences = DEFAULT_APP_PREFERENCES;
  }

  return cachedPreferences;
}

function setAppPreferences(
  next: AppPreferences | ((current: AppPreferences) => AppPreferences),
): void {
  const current = readPreferences();
  const value = typeof next === 'function' ? next(current) : next;
  cachedPreferences = {
    ...value,
    version: 2,
  };

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(cachedPreferences));
    } catch {
      // Preferences remain available in memory if device storage is unavailable.
    }
  }

  // React may unsubscribe and resubscribe consumers while handling a store
  // update. Notify a stable snapshot so those mutations cannot make later
  // theme consumers miss the same preference change.
  [...listeners].forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
