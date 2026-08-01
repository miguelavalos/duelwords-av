import { describe, expect, it } from 'vitest';

import translations from './generated/shared-surface-copy.json';
import { INTERFACE_LOCALES } from './locales';
import { sharedSurfaceT } from './shared-surface-copy';

/* eslint-disable @typescript-eslint/no-require-imports */
const { execFileSync } = require('node:child_process') as {
  execFileSync(file: string, args: string[], options: { stdio: 'pipe' }): void;
};
const { readFileSync } = require('node:fs') as {
  readFileSync(file: string, encoding: 'utf8'): string;
};
const path = require('node:path') as { resolve(...parts: string[]): string };

describe('shared native and React surface copy', () => {
  it('is generated from the canonical Swift catalog without drift', () => {
    const before = readFileSync(path.resolve('src/i18n/generated/shared-surface-copy.json'), 'utf8');
    execFileSync(process.execPath, ['scripts/generate-shared-surface-copy.mjs'], { stdio: 'pipe' });
    const after = readFileSync(path.resolve('src/i18n/generated/shared-surface-copy.json'), 'utf8');
    expect(after).toBe(before);
  });

  it('has the same complete, non-empty key set in all five locales', () => {
    const englishKeys = Object.keys(translations.en).sort();
    expect(englishKeys.length).toBeGreaterThan(180);
    for (const { code } of INTERFACE_LOCALES) {
      expect(Object.keys(translations[code]).sort(), code).toEqual(englishKeys);
      expect(Object.values(translations[code]).every((value) => value.trim().length > 0), code).toBe(true);
    }
  });

  it('never falls back to English for explanatory copy', () => {
    const keys = [
      'A fair word duel, whenever you are ready.',
      'Game preferences',
      'Your account and DuelWords access in one place.',
      'Pro keeps more private history without changing the rules of a duel.',
      'This deletes the shared identity used by connected Apps AV products—not only DuelWords AV.',
    ] as const;
    for (const { code } of INTERFACE_LOCALES.filter(({ code }) => code !== 'en')) {
      for (const key of keys) expect(sharedSurfaceT(code, key), `${code}: ${key}`).not.toBe(key);
    }
  });

  it('preserves format placeholders and legal links in every translation', () => {
    for (const [key, english] of Object.entries(translations.en)) {
      const englishTokens = templateTokens(english);
      for (const { code } of INTERFACE_LOCALES.filter(({ code }) => code !== 'en')) {
        expect(templateTokens(translations[code][key as keyof typeof translations.en]), `${code}: ${key}`)
          .toEqual(englishTokens);
      }
    }
  });

  it('keeps technical implementation terms out of player guidance', () => {
    for (const { code } of INTERFACE_LOCALES) {
      const visible = Object.values(translations[code]).join(' ');
      expect(visible).not.toMatch(/\b(Convex|Clerk|fixture|mock|deploy key|schema|projection)\b/i);
    }
  });

  it('uses plain, accurate account and game wording', () => {
    const english = Object.values(translations.en).join(' ');

    expect(english).not.toMatch(/target deck|guarded workflow|Account-backed access|shared Account AV deletion workflow|Refresh Apps AV access|Confirming Pro access with Apps AV|Practice, Solo/i);
    expect(translations.en['Pro access follows this account. Game history and rivals stay on this device.']).toBeTruthy();
    expect(translations.en['One official word per language each day']).toBeTruthy();
    expect(translations.en['Practice and Play Avi rotate through fresh words']).toBeTruthy();
  });
});

function templateTokens(value: string): string[] {
  return [...value.matchAll(/%@|\{[^}]+\}|https:\/\/[^)\s]+/gu)].map(([token]) => token).sort();
}
