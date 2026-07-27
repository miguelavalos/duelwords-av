import { describe, expect, it } from 'vitest';

import { DAILY_COPY } from './daily-copy';

describe('official Daily interface copy', () => {
  it('ships complete user-facing copy in all five interface locales', () => {
    const englishKeys = Object.keys(DAILY_COPY.en).sort();
    for (const locale of ['en', 'es', 'ca', 'fr', 'de'] as const) {
      expect(Object.keys(DAILY_COPY[locale]).sort()).toEqual(englishKeys);
      expect(Object.values(DAILY_COPY[locale]).every((value) => value.trim().length > 0)).toBe(true);
    }
  });

  it('keeps English copy free of implementation terminology', () => {
    const english = Object.values(DAILY_COPY.en).join(' ').toLowerCase();
    for (const term of ['api', 'cache', 'convex', 'd1', 'runtime', 'server', 'worker']) {
      expect(english).not.toContain(term);
    }
  });
});
