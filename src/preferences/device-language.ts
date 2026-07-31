import { getLocales } from 'expo-localization';

export function readPreferredDeviceLanguages(): readonly string[] {
  try {
    return getLocales().map((locale) => locale.languageTag);
  } catch {
    return [];
  }
}
