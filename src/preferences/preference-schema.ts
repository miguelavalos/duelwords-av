import type { GameLanguage } from '@/game/word-duel-engine';
import {
  DEFAULT_AVI_DIFFICULTY,
  isAviDifficulty,
  type AviDifficulty,
} from '../game/word-duel-bot/difficulty';
import type { InterfaceLocale } from '@/i18n/locales';

export type AppAppearance = 'dark' | 'light' | 'system';

export type AppPreferences = {
  appearance: AppAppearance;
  aviDifficulty: AviDifficulty;
  gameLanguage: GameLanguage;
  hapticsEnabled: boolean;
  interfaceLocale: InterfaceLocale;
  playerDisplayName: string;
  version: 3;
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = Object.freeze({
  appearance: 'system',
  aviDifficulty: DEFAULT_AVI_DIFFICULTY,
  gameLanguage: 'en',
  hapticsEnabled: true,
  interfaceLocale: 'en',
  playerDisplayName: '',
  version: 3,
});

export function parseAppPreferences(value: unknown): AppPreferences {
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2 && value.version !== 3)) {
    return DEFAULT_APP_PREFERENCES;
  }

  return {
    appearance: isAppearance(value.appearance) ? value.appearance : DEFAULT_APP_PREFERENCES.appearance,
    aviDifficulty: isAviDifficulty(value.aviDifficulty)
      ? value.aviDifficulty
      : DEFAULT_APP_PREFERENCES.aviDifficulty,
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
    playerDisplayName: sanitizePlayerDisplayName(value.playerDisplayName),
    version: 3,
  };
}

export function sanitizePlayerDisplayName(value: unknown): string {
  if (typeof value !== 'string') return '';

  const normalized = value.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (/[\u0000-\u001f\u007f]/.test(normalized) || Array.from(normalized).length > 32) {
    return '';
  }

  return normalized;
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
