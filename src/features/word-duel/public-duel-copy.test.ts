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
    expect(publicDuelT(locale, 'accountChallenge')).not.toHaveLength(0);
    expect(publicDuelT(locale, 'accountPlayerName')).not.toHaveLength(0);
    expect(publicDuelT(locale, 'accountRoomNameHelp')).not.toHaveLength(0);
    expect(publicDuelT(locale, 'wordDuel')).not.toHaveLength(0);
    expect(publicDuelT(locale, 'validLetters')).not.toHaveLength(0);
    expect(publicDuelT(locale, 'correctPosition')).not.toHaveLength(0);
    expect(publicDuelT(locale, 'rivalRounds')).not.toHaveLength(0);
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
      expect(publicDuelT(locale, 'onlineUnavailable')).not.toBe(publicDuelT('en', 'onlineUnavailable'));
      expect(publicDuelT(locale, 'requestRematch')).not.toBe(publicDuelT('en', 'requestRematch'));
      expect(publicDuelT(locale, 'roomNameHelp')).not.toBe(publicDuelT('en', 'roomNameHelp'));
      expect(publicDuelT(locale, 'runtimeDescription')).not.toBe(publicDuelT('en', 'runtimeDescription'));
      expect(publicDuelT(locale, 'accountRoomNameHelp')).not.toBe(publicDuelT('en', 'accountRoomNameHelp'));
      expect(publicDuelT(locale, 'wordDuel')).not.toBe(publicDuelT('en', 'wordDuel'));
    }
    expect(publicDuelT('es', 'apiDisabled')).not.toBe(publicDuelT('en', 'apiDisabled'));
    expect(publicDuelT('es', 'couldNotCloseTimeout')).not.toBe(publicDuelT('en', 'couldNotCloseTimeout'));
    expect(publicDuelT('es', 'couldNotOpenDuel')).not.toBe(publicDuelT('en', 'couldNotOpenDuel'));
    expect(publicDuelT('es', 'couldNotOpenNext')).not.toBe(publicDuelT('en', 'couldNotOpenNext'));
    expect(publicDuelT('es', 'couldNotOpenResult')).not.toBe(publicDuelT('en', 'couldNotOpenResult'));
    expect(publicDuelT('es', 'couldNotSync')).not.toBe(publicDuelT('en', 'couldNotSync'));
    expect(publicDuelT('es', 'safeRealtimeUnavailable')).not.toBe(publicDuelT('en', 'safeRealtimeUnavailable'));
  });

  it('keeps service names and implementation vocabulary out of availability messages', () => {
    for (const locale of locales) {
      const visible = [
        publicDuelT(locale, 'apiDisabled'),
        publicDuelT(locale, 'onlineUnavailable'),
        publicDuelT(locale, 'realtimeDisabled'),
        publicDuelT(locale, 'runtimeDescription'),
        publicDuelT(locale, 'safeRealtimeRequired'),
        publicDuelT(locale, 'safeRealtimeUnavailable'),
      ].join(' ');

      expect(visible).not.toMatch(/\b(API|server|backend|runtime|realtime|Convex|Clerk|entitlement|HTTPS|build|release|deployment|version)\b|versi[oó]n|versió/i);
    }
  });

  it('asks players for an invitation link without exposing token terminology', () => {
    for (const locale of locales) {
      const visible = [
        publicDuelT(locale, 'inviteLabel'),
        publicDuelT(locale, 'invitePlaceholder'),
        publicDuelT(locale, 'validInviteRequired'),
      ].join(' ');

      expect(visible).not.toMatch(/token|jeton/i);
    }
  });
});
