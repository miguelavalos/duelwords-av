import { describe, expect, it } from 'vitest';

import { getLocalDictionary, LOCAL_WORD_FIXTURES } from '../dictionaries/local-fixtures';
import {
  applyGuess,
  createLocalGame,
  createLocalPracticeSummary,
  normalizeGuess,
  scoreGuess,
  WORD_DUEL_MAX_ATTEMPTS,
} from './index';
import type { GameLanguage, LocalWordDuelState } from './index';

function game(language: GameLanguage, target: string): LocalWordDuelState {
  return createLocalGame({
    dictionary: getLocalDictionary(language),
    language,
    target,
  });
}

const ENGLISH_TEST_TARGET = LOCAL_WORD_FIXTURES.en[0].displayWord;

describe('normalizeGuess', () => {
  it('normalizes English by lowercasing, removing accents, and keeping only letters', () => {
    expect(normalizeGuess('  CrânE! ', 'en')).toBe('crane');
  });

  it('accepts missing Spanish vowel accents', () => {
    expect(normalizeGuess('CAÑÓN', 'es')).toBe('cañon');
    expect(normalizeGuess('cañon', 'es')).toBe('cañon');
  });

  it('keeps Spanish ñ distinct from plain n', () => {
    expect(normalizeGuess('cañón', 'es')).not.toBe(normalizeGuess('canon', 'es'));
  });

  it('accepts accentless input for Catalan, French, and German', () => {
    expect(normalizeGuess('també', 'ca')).toBe('tambe');
    expect(normalizeGuess('après', 'fr')).toBe('apres');
    expect(normalizeGuess('Käfer', 'de')).toBe('kafer');
  });
});

describe('scoreGuess', () => {
  it('scores duplicate letters with exact matches before present letters', () => {
    expect(scoreGuess('cocoa', 'civic')).toEqual([
      'exact',
      'absent',
      'present',
      'absent',
      'absent',
    ]);
  });

  it('does not treat n as ñ during feedback', () => {
    expect(scoreGuess('canon', 'cañon')).toEqual([
      'exact',
      'exact',
      'absent',
      'exact',
      'exact',
    ]);
  });
});

describe('applyGuess', () => {
  it('does not consume an attempt for an invalid local fixture word', () => {
    const state = game('en', ENGLISH_TEST_TARGET);
    const result = applyGuess(state, 'xxxxx', getLocalDictionary('en'));

    expect(result.accepted).toBe(false);
    expect(result.state.guesses).toHaveLength(0);
    if (!result.accepted) {
      expect(result.rejection).toBe('invalid_word');
    }
  });

  it('rejects too-short and too-long guesses without consuming attempts', () => {
    const state = game('en', ENGLISH_TEST_TARGET);
    const shortResult = applyGuess(state, 'can', getLocalDictionary('en'));
    const longResult = applyGuess(state, 'cranes', getLocalDictionary('en'));

    expect(shortResult.accepted).toBe(false);
    expect(longResult.accepted).toBe(false);
    expect(shortResult.state.guesses).toHaveLength(0);
    expect(longResult.state.guesses).toHaveLength(0);
  });

  it('wins immediately on a correct English guess', () => {
    const result = applyGuess(game('en', ENGLISH_TEST_TARGET), ENGLISH_TEST_TARGET, getLocalDictionary('en'));

    expect(result.accepted).toBe(true);
    expect(result.state.status).toBe('won');
    expect(result.state.guesses).toHaveLength(1);
  });

  it('wins with Spanish accent-tolerant input', () => {
    const result = applyGuess(game('es', 'cañón'), 'cañon', getLocalDictionary('es'));

    expect(result.accepted).toBe(true);
    expect(result.state.status).toBe('won');
  });

  it.each(['ca', 'fr', 'de'] as const)('wins with a bundled %s target', (language) => {
    const target = LOCAL_WORD_FIXTURES[language][0];
    const result = applyGuess(
      game(language, target.displayWord),
      target.normalizedWord,
      getLocalDictionary(language),
    );

    expect(result.accepted).toBe(true);
    expect(result.state.status).toBe('won');
  });

  it('loses after six accepted non-winning guesses', () => {
    const guesses = ['flame', 'civic', 'brave', 'cocoa', 'belle', 'crane'];
    const finalState = guesses.reduce((state, guessWord) => {
      const result = applyGuess(state, guessWord, getLocalDictionary('en'));
      if (!result.accepted) {
        throw new Error(`Expected ${guessWord} to be accepted.`);
      }
      return result.state;
    }, game('en', ENGLISH_TEST_TARGET));

    expect(finalState.guesses).toHaveLength(WORD_DUEL_MAX_ATTEMPTS);
    expect(finalState.status).toBe('lost');
  });

  it('rejects guesses after game over', () => {
    const won = applyGuess(game('en', ENGLISH_TEST_TARGET), ENGLISH_TEST_TARGET, getLocalDictionary('en'));
    if (!won.accepted) {
      throw new Error('Expected winning guess to be accepted.');
    }

    const afterGame = applyGuess(won.state, 'flame', getLocalDictionary('en'));
    expect(afterGame.accepted).toBe(false);
    if (!afterGame.accepted) {
      expect(afterGame.rejection).toBe('game_over');
    }
  });
});

describe('local fixtures and safe summaries', () => {
  it('bundles the expected valid-guess and target profiles', () => {
    const expectedCounts = {
      en: { targets: 750, validGuesses: 8_734 },
      es: { targets: 750, validGuesses: 7_571 },
      ca: { targets: 500, validGuesses: 5_481 },
      fr: { targets: 500, validGuesses: 5_654 },
      de: { targets: 500, validGuesses: 6_299 },
    } as const;
    for (const language of ['en', 'es', 'ca', 'fr', 'de'] as const) {
      const entries = LOCAL_WORD_FIXTURES[language];
      const dictionary = getLocalDictionary(language);
      expect(entries.every((entry) => entry.length === 5)).toBe(true);
      expect(entries).toHaveLength(expectedCounts[language].targets);
      expect(dictionary.validGuesses).toHaveLength(expectedCounts[language].validGuesses);
      expect(new Set(dictionary.validGuesses).size).toBe(dictionary.validGuesses.length);
      expect(dictionary.validGuesses.every((word) => Array.from(word).length === 5)).toBe(true);
      expect(dictionary.targetWords).toHaveLength(expectedCounts[language].targets);
      expect(new Set(dictionary.targetWords).size).toBe(dictionary.targetWords.length);
      expect(dictionary.targetWords.every((target) => dictionary.validGuesses.includes(target))).toBe(true);
    }
  });

  it('keeps sensitive Gaia entries valid for input but out of target selection', () => {
    const exclusions = {
      ca: ['merda'],
      fr: ['arabe', 'juifs', 'juive'],
      de: ['adolf', 'juden'],
    } as const;

    for (const language of ['ca', 'fr', 'de'] as const) {
      const dictionary = getLocalDictionary(language);
      for (const excluded of exclusions[language]) {
        expect(dictionary.validGuesses).toContain(excluded);
        expect(dictionary.targetWords).not.toContain(excluded);
      }
    }
  });

  it('creates a local summary without target, guesses, boards, or Wordle-like share blocks', () => {
    const first = applyGuess(game('en', ENGLISH_TEST_TARGET), 'flame', getLocalDictionary('en'));
    if (!first.accepted) {
      throw new Error('Expected first guess to be accepted.');
    }

    const summary = createLocalPracticeSummary(first.state);
    const serialized = JSON.stringify(summary);

    expect(serialized).not.toContain(ENGLISH_TEST_TARGET);
    expect(serialized).not.toContain('flame');
    expect(serialized).not.toContain('🟩');
    expect(serialized).not.toContain('⬛');
    expect(serialized).not.toContain('⬜');
  });
});
