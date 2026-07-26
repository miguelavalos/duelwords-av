import { describe, expect, it } from 'vitest';

import { copy, INTERFACE_LOCALES } from './locales';

describe('base interface locale contract', () => {
  it('keeps the navigation labels in the correct language', () => {
    expect(copy.en.stats).toBe('Stats');
    expect(copy.es.stats).toBe('Estadísticas');
    expect(copy.ca.stats).toBe('Estadístiques');
    expect(copy.fr.stats).toBe('Statistiques');
    expect(copy.de.stats).toBe('Statistik');
  });

  it('localizes the complete Practice end-state vocabulary', () => {
    for (const { code } of INTERFACE_LOCALES) {
      expect(copy[code].gameFinished).toBeTruthy();
      expect(copy[code].opening).toBeTruthy();
      expect(copy[code].openResult).toBeTruthy();
    }

    for (const code of ['es', 'ca', 'fr', 'de'] as const) {
      expect(copy[code].gameFinished).not.toBe(copy.en.gameFinished);
      expect(copy[code].opening).not.toBe(copy.en.opening);
      expect(copy[code].openResult).not.toBe(copy.en.openResult);
    }
  });
});
