import type { GameLanguage } from '@/game/word-duel-engine';
import type { InterfaceLocale } from '@/i18n/locales';

export type AppAppearance = 'dark' | 'light' | 'system';

export type AppPreferences = {
  appearance: AppAppearance;
  gameLanguage: GameLanguage;
  hapticsEnabled: boolean;
  interfaceLocale: InterfaceLocale;
  version: 2;
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = Object.freeze({
  appearance: 'system',
  gameLanguage: 'en',
  hapticsEnabled: true,
  interfaceLocale: 'en',
  version: 2,
});

export function parseAppPreferences(value: unknown): AppPreferences {
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) {
    return DEFAULT_APP_PREFERENCES;
  }

  return {
    appearance: isAppearance(value.appearance) ? value.appearance : DEFAULT_APP_PREFERENCES.appearance,
    gameLanguage: isGameLanguage(value.gameLanguage)
      ? value.gameLanguage
      : DEFAULT_APP_PREFERENCES.gameLanguage,
    hapticsEnabled: value.version === 1
      ? DEFAULT_APP_PREFERENCES.hapticsEnabled
      : typeof value.hapticsEnabled === 'boolean'
        ? value.hapticsEnabled
        : DEFAULT_APP_PREFERENCES.hapticsEnabled,
    interfaceLocale: isInterfaceLocale(value.interfaceLocale)
      ? value.interfaceLocale
      : DEFAULT_APP_PREFERENCES.interfaceLocale,
    version: 2,
  };
}

export function parseStoredAppPreferences(value: string | null): AppPreferences {
  if (value === null) {
    return DEFAULT_APP_PREFERENCES;
  }

  try {
    return parseAppPreferences(JSON.parse(value));
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

function isAppearance(value: unknown): value is AppAppearance {
  return value === 'dark' || value === 'light' || value === 'system';
}

function isGameLanguage(value: unknown): value is GameLanguage {
  return value === 'ca' || value === 'de' || value === 'en' || value === 'es' || value === 'fr';
}

function isInterfaceLocale(value: unknown): value is InterfaceLocale {
  return value === 'ca' || value === 'de' || value === 'en' || value === 'es' || value === 'fr';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
