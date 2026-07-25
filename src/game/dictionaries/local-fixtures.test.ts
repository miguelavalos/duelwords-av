import { describe, expect, it } from 'vitest';

import type { GameLanguage } from '../word-duel-engine/types';
import {
  getLocalDictionary,
  getLocalTargetCount,
  LOCAL_WORD_FIXTURES,
} from './local-fixtures';

const EXPECTED_VALID_GUESSES = {
  ca: 5_481,
  de: 6_299,
  en: 8_734,
  es: 7_571,
  fr: 5_654,
} as const;

const EXPECTED_TARGETS = {
  ca: 500,
  de: 500,
  en: 750,
  es: 750,
  fr: 500,
} as const;

const GAME_LANGUAGES = ['en', 'es', 'ca', 'fr', 'de'] as const satisfies readonly GameLanguage[];

const PROHIBITED_TARGETS: Partial<Record<GameLanguage, ReadonlySet<string>>> = {
  ca: new Set(['barca', 'jesus', 'lluis', 'maria', 'marta', 'merce', 'paris', 'pujol']),
  de: new Set(['adolf', 'chris', 'david', 'james', 'jesus', 'juden', 'maria', 'meyer', 'paris', 'peter', 'tokio']),
  en: new Set(['blabs', 'kikes', 'nazis', 'sluts']),
  es: new Set(['arabe', 'judia', 'judio', 'nazis', 'rusos', 'sexos']),
};

describe('bundled local dictionaries', () => {
  it.each(GAME_LANGUAGES)('%s keeps a broad allowlist and a V1-sized target deck', (language) => {
    const dictionary = getLocalDictionary(language);
    const targets = LOCAL_WORD_FIXTURES[language];
    const valid = new Set(dictionary.validGuesses);

    expect(dictionary.validGuesses).toHaveLength(EXPECTED_VALID_GUESSES[language]);
    expect(getLocalTargetCount(language)).toBe(EXPECTED_TARGETS[language]);
    expect(new Set(dictionary.validGuesses).size).toBe(dictionary.validGuesses.length);
    expect(new Set(dictionary.targetWords).size).toBe(dictionary.targetWords.length);
    expect(targets).toHaveLength(getLocalTargetCount(language));

    for (const target of targets) {
      expect(target.length).toBe(5);
      expect(target.isTarget).toBe(true);
      expect(valid.has(target.normalizedWord)).toBe(true);
      expect(PROHIBITED_TARGETS[language]?.has(target.normalizedWord) ?? false).toBe(false);
    }
  });
});
