import { describe, expect, it } from 'vitest';

import { createDemoWordDuelResultViewModel } from '../../game/word-duel-result/view-model';
import { INTERFACE_LOCALES, type InterfaceLocale } from '../../i18n/locales';

import { buildLocalizedSafeShareText, wordDuelResultCopy } from './result-copy';

const expectedWinTitles: Record<InterfaceLocale, string> = {
  ca: 'Has guanyat',
  de: 'Du hast gewonnen',
  en: 'You won',
  es: 'Has ganado',
  fr: 'Vous avez gagné',
};

describe('word duel result copy', () => {
  it('provides complete localized result, mode, reason, replay, and rematch labels', () => {
    for (const locale of INTERFACE_LOCALES.map(({ code }) => code)) {
      const copy = wordDuelResultCopy(locale);

      expect(copy.outcomeTitles.win).toBe(expectedWinTitles[locale]);
      expect(Object.values(copy.outcomeLabels)).toHaveLength(5);
      expect(Object.values(copy.reasonLabels)).toHaveLength(8);
      expect(Object.values(copy.modeLabels)).toHaveLength(5);
      expect(Object.values(copy.replayLabels)).toHaveLength(5);
      expect(Object.values(copy.rematchTerminalTitles)).toHaveLength(3);
      expect(copy.opponentPath('Avi')).toContain('Avi');
      expect(copy.tries(2)).toContain('2');
      expect(copy.completedBoard(copy.yourPath).trim().length).toBeGreaterThan(0);
    }
  });

  it('localizes safe share text without exposing either board or the target', () => {
    const result = createDemoWordDuelResultViewModel({ gameLanguage: 'es' });
    const spanishShare = buildLocalizedSafeShareText(result, wordDuelResultCopy('es'));

    expect(spanishShare).toContain('Duelo de palabras');
    expect(spanishShare).toContain('Victoria');
    expect(spanishShare).toContain('Victoria · Español · 4/6');
    expect(spanishShare).not.toContain('<link>');
    expect(spanishShare).not.toMatch(/FIELD|CIVIC|ADORE|MERIT|CRANE|SLATE|BRIDE|PIECE/i);
  });

  it('uses user language rather than implementation language in English results', () => {
    const copy = wordDuelResultCopy('en');
    const visible = [
      ...Object.values(copy.outcomeTitles),
      ...Object.values(copy.outcomeLabels),
      ...Object.values(copy.reasonLabels),
      ...Object.values(copy.modeLabels),
      ...Object.values(copy.replayLabels),
      ...Object.values(copy.rematchTerminalTitles),
    ].join(' ');

    expect(visible).not.toMatch(/\b(server|backend|runtime|realtime|convex|clerk|fixture|mock|entitlement|build)\b/i);
  });
});
