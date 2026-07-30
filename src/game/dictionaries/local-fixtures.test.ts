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
  en: 9_354,
  es: 8_365,
  fr: 5_654,
} as const;

const EXPECTED_TARGETS = {
  ca: 750,
  de: 750,
  en: 750,
  es: 750,
  fr: 750,
} as const;

const GAME_LANGUAGES = ['en', 'es', 'ca', 'fr', 'de'] as const satisfies readonly GameLanguage[];

const PROHIBITED_TARGETS: Partial<Record<GameLanguage, ReadonlySet<string>>> = {
  ca: new Set(['acabem', 'barca', 'haver', 'jesus', 'lluis', 'maria', 'marta', 'merce', 'paris', 'passa', 'pujol', 'serem', 'tenia', 'trobes']),
  de: new Set(['adolf', 'chris', 'david', 'geboren', 'gesetzt', 'haben', 'james', 'jesus', 'juden', 'maria', 'meyer', 'paris', 'peter', 'spielen', 'tokio', 'waren', 'wurde']),
  en: new Set(['being', 'blabs', 'going', 'kikes', 'nazis', 'playing', 'sluts', 'working']),
  es: new Set(['emplean', 'existio', 'habrian', 'judia', 'judio', 'llamada', 'llamado', 'nazis', 'pinto', 'rusos', 'sexos', 'tenia']),
  fr: new Set(['appele', 'avoir', 'compose', 'connu', 'ecrit', 'etaient', 'furent', 'passe', 'possede', 'rendit', 'venait']),
};

describe('bundled local dictionaries', () => {
  it.each(GAME_LANGUAGES)('%s bundles separate six and seven-letter decks', (language) => {
    for (const wordLength of [6, 7] as const) {
      const dictionary = getLocalDictionary(language, wordLength);
      expect(getLocalTargetCount(language, wordLength)).toBe(EXPECTED_TARGETS[language]);
      expect(dictionary.validGuesses.length).toBeGreaterThan(9_000);
      expect(dictionary.validGuesses.every((word) => Array.from(word).length === wordLength)).toBe(true);
      expect(dictionary.targetWords).toHaveLength(EXPECTED_TARGETS[language]);
      expect(dictionary.targetWords.every((word) => dictionary.validGuesses.includes(word))).toBe(true);
      expect(dictionary.targetWords.every((word) => !(PROHIBITED_TARGETS[language]?.has(word) ?? false))).toBe(true);
    }
  });

  it.each(GAME_LANGUAGES)('%s keeps a broad allowlist and a standardized target deck', (language) => {
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
