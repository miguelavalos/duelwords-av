import { describe, expect, it } from 'vitest';

import type { InterfaceLocale } from '@/i18n/locales';

import { publicDuelT } from './public-duel-copy';

const locales: InterfaceLocale[] = ['en', 'es', 'ca', 'fr', 'de'];

describe('public duel copy', () => {
  it.each(locales)('provides localized core journey labels for %s', (locale) => {
    expect(publicDuelT(locale, 'createChallenge')).not.toHaveLength(0);
    expect(publicDuelT(locale, 'joinChallenge')).not.toHaveLength(0);
    expect(publicDuelT(locale, 'ready')).not.toHaveLength(0);
    expect(publicDuelT(locale, 'finalResult')).not.toHaveLength(0);
    expect(publicDuelT(locale, 'requestRematch')).not.toHaveLength(0);
    expect(publicDuelT(locale, 'runtimeDescription')).not.toHaveLength(0);
  });

  it('interpolates all public runtime values', () => {
    expect(publicDuelT('es', 'opponentAttempt', { number: 2, state: 'Enviado' }))
      .toBe('Intento rival 2: Enviado');
    expect(publicDuelT('fr', 'target', { word: 'PERLE' })).toBe('Mot : PERLE');
    expect(publicDuelT('de', 'wordLength', { count: 5 })).toBe('5 Buchstaben');
  });

  it('does not silently fall back to English for the core localized labels', () => {
    for (const locale of locales.filter((value) => value !== 'en')) {
      expect(publicDuelT(locale, 'createChallenge')).not.toBe(publicDuelT('en', 'createChallenge'));
      expect(publicDuelT(locale, 'requestRematch')).not.toBe(publicDuelT('en', 'requestRematch'));
    }
    expect(publicDuelT('es', 'runtimeDescription')).not.toBe(publicDuelT('en', 'runtimeDescription'));
    expect(publicDuelT('es', 'apiDisabled')).not.toBe(publicDuelT('en', 'apiDisabled'));
  });
});
