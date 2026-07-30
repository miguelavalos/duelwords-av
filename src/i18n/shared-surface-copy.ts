import translations from './generated/shared-surface-copy.json';
import type { InterfaceLocale } from './locales';

export type SharedSurfaceCopyKey = keyof typeof translations.en;

export function sharedSurfaceT(
  locale: InterfaceLocale,
  key: SharedSurfaceCopyKey,
  values: Record<string, string | number> = {},
): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    translations[locale][key],
  );
}

export function sharedSurfaceHasKey(key: string): key is SharedSurfaceCopyKey {
  return Object.prototype.hasOwnProperty.call(translations.en, key);
}
