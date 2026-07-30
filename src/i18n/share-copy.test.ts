import { describe, expect, it } from 'vitest';

import { SHARE_COPY } from './share-copy';

describe('localized share copy', () => {
  it('has complete non-empty copy for every interface locale', () => {
    expect(Object.keys(SHARE_COPY)).toEqual(['en', 'es', 'ca', 'fr', 'de']);
    for (const copy of Object.values(SHARE_COPY)) {
      expect(copy.challengeMe).not.toBe('');
      expect(copy.dailyPreview).not.toBe('');
      expect(copy.playAvi).not.toBe('');
      expect(copy.soloPractice).not.toBe('');
      expect(copy.wordDuel).not.toBe('');
      expect(Object.values(copy.outcomeAgainst).every(Boolean)).toBe(true);
      expect(Object.values(copy.outcomeSolo).every(Boolean)).toBe(true);
    }
  });

  it('does not fall back to English for translated share actions', () => {
    for (const locale of ['es', 'ca', 'fr', 'de'] as const) {
      expect(SHARE_COPY[locale].challengeMe).not.toBe(SHARE_COPY.en.challengeMe);
      expect(SHARE_COPY[locale].outcomeAgainst.win).not.toBe(SHARE_COPY.en.outcomeAgainst.win);
    }
  });
});
