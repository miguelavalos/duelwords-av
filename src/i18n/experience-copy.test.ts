import { describe, expect, it } from 'vitest';

import { experienceCopy } from './experience-copy';
import { INTERFACE_LOCALES, type InterfaceLocale } from './locales';

const LOCALES = INTERFACE_LOCALES.map(({ code }) => code);
const USER_COPY_KEYS = [
  'homeTitle',
  'challengeDetail',
  'playAviDetail',
  'practiceDetail',
  'dailyUnavailableDetail',
  'aviDetail',
] as const;

function flattenCopy(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flattenCopy);
  if (value && typeof value === 'object') return Object.values(value).flatMap(flattenCopy);
  return [];
}

describe('DuelWords experience copy', () => {
  it('provides a complete, non-empty interface in all five languages', () => {
    for (const locale of LOCALES) {
      const values = flattenCopy(experienceCopy(locale));

      expect(values.length).toBeGreaterThan(50);
      expect(values.every((value) => value.trim().length > 0)).toBe(true);
      expect(experienceCopy(locale).onboardingPages).toHaveLength(3);
      expect(experienceCopy(locale).rivalsPrivacyPills).toHaveLength(4);
    }
  });

  it('does not fall back to English for core product guidance', () => {
    const english = experienceCopy('en');

    for (const locale of LOCALES.filter((value): value is Exclude<InterfaceLocale, 'en'> => value !== 'en')) {
      const localized = experienceCopy(locale);
      for (const key of USER_COPY_KEYS) expect(localized[key], `${locale}.${key}`).not.toBe(english[key]);
      expect(localized.onboardingPages[2]?.detail).not.toBe(english.onboardingPages[2]?.detail);
    }
  });

  it('keeps internal implementation vocabulary out of English user copy', () => {
    const english = flattenCopy(experienceCopy('en')).join(' ');

    expect(english).not.toMatch(/\b(server|backend|runtime|realtime|convex|clerk|fixture|mock|deterministic|entitlement|https|build)\b/i);
  });
});
