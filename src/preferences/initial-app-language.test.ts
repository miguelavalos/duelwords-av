import { describe, expect, it } from 'vitest';

import {
  normalizeLanguageCode,
  resolveInitialAppLanguage,
} from './initial-app-language';

describe('initial app language', () => {
  it('normalizes BCP 47 and underscore locale variants', () => {
    expect(normalizeLanguageCode(' ES_latn_ES ')).toBe('es');
    expect(normalizeLanguageCode('ca-ES')).toBe('ca');
  });

  it.each(['catalog', 'desktop', 'english', 'esoteric', 'french', '-es', '123'])
  ('rejects unsupported or malformed %s values', (language) => {
    expect(resolveInitialAppLanguage([language])).toBe('en');
  });

  it('does not scan secondary device languages', () => {
    expect(resolveInitialAppLanguage(['it-IT', 'fr-FR'])).toBe('en');
  });
});
