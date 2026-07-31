import type { GameLanguage } from '@/game/word-duel-engine';
import type { InterfaceLocale } from '@/i18n/locales';

export type SupportedAppLanguage = GameLanguage & InterfaceLocale;

export const SUPPORTED_APP_LANGUAGES = [
  'ca',
  'de',
  'en',
  'es',
  'fr',
] as const satisfies readonly SupportedAppLanguage[];

export function resolveInitialAppLanguage(
  preferredLanguages: readonly string[],
): SupportedAppLanguage {
  const primaryLanguage = normalizeLanguageCode(preferredLanguages[0]);
  return isSupportedAppLanguage(primaryLanguage) ? primaryLanguage : 'en';
}

export function normalizeLanguageCode(rawValue: string | null | undefined): string | null {
  if (typeof rawValue !== 'string') return null;

  const primarySubtag = rawValue.trim().replaceAll('_', '-').split('-', 1)[0]?.toLowerCase();
  return primarySubtag && /^[a-z]+$/.test(primarySubtag) ? primarySubtag : null;
}

function isSupportedAppLanguage(value: string | null): value is SupportedAppLanguage {
  return value !== null && SUPPORTED_APP_LANGUAGES.some((language) => language === value);
}
