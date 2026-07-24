import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'duelwords-av:onboarding:v1';
const listeners = new Set<() => void>();
let cached: boolean | null = null;

export function useOnboardingComplete(): readonly [boolean, () => void] {
  const complete = useSyncExternalStore(subscribe, read, () => false);
  return [complete, markOnboardingComplete] as const;
}

function read(): boolean {
  if (cached !== null) return cached;
  try {
    cached = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'complete';
  } catch {
    cached = false;
  }
  return cached;
}

function markOnboardingComplete() {
  cached = true;
  try {
    localStorage.setItem(STORAGE_KEY, 'complete');
  } catch {
    // The current session can still continue when device storage is unavailable.
  }
  [...listeners].forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
