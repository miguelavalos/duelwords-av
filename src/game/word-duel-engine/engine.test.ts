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
    const state = game('en', 'crane');
    const result = applyGuess(state, 'xxxxx', getLocalDictionary('en'));

    expect(result.accepted).toBe(false);
    expect(result.state.guesses).toHaveLength(0);
    if (!result.accepted) {
      expect(result.rejection).toBe('invalid_word');
    }
  });

  it('rejects too-short and too-long guesses without consuming attempts', () => {
    const state = game('en', 'crane');
    const shortResult = applyGuess(state, 'can', getLocalDictionary('en'));
    const longResult = applyGuess(state, 'cranes', getLocalDictionary('en'));

    expect(shortResult.accepted).toBe(false);
    expect(longResult.accepted).toBe(false);
    expect(shortResult.state.guesses).toHaveLength(0);
    expect(longResult.state.guesses).toHaveLength(0);
  });

  it('wins immediately on a correct English guess', () => {
    const result = applyGuess(game('en', 'crane'), 'crane', getLocalDictionary('en'));

    expect(result.accepted).toBe(true);
    expect(result.state.status).toBe('won');
    expect(result.state.guesses).toHaveLength(1);
  });

  it('wins with Spanish accent-tolerant input', () => {
    const result = applyGuess(game('es', 'cañón'), 'cañon', getLocalDictionary('es'));

    expect(result.accepted).toBe(true);
    expect(result.state.status).toBe('won');
  });

  it('loses after six accepted non-winning guesses', () => {
    const guesses = ['flame', 'civic', 'sling', 'brave', 'cocoa', 'belle'];
    const finalState = guesses.reduce((state, guessWord) => {
      const result = applyGuess(state, guessWord, getLocalDictionary('en'));
      if (!result.accepted) {
        throw new Error(`Expected ${guessWord} to be accepted.`);
      }
      return result.state;
    }, game('en', 'crane'));

    expect(finalState.guesses).toHaveLength(WORD_DUEL_MAX_ATTEMPTS);
    expect(finalState.status).toBe('lost');
  });

  it('rejects guesses after game over', () => {
    const won = applyGuess(game('en', 'crane'), 'crane', getLocalDictionary('en'));
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
  it('keeps valid guesses and target words separate in each local fixture profile', () => {
    for (const language of ['en', 'es'] as const) {
      const entries = LOCAL_WORD_FIXTURES[language];
      expect(entries.some((entry) => entry.isValidGuess && !entry.isTarget)).toBe(true);
      expect(entries.every((entry) => entry.length === 5)).toBe(true);
      expect(entries.filter((entry) => entry.isTarget).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('creates a local summary without target, guesses, boards, or Wordle-like share blocks', () => {
    const first = applyGuess(game('en', 'crane'), 'flame', getLocalDictionary('en'));
    if (!first.accepted) {
      throw new Error('Expected first guess to be accepted.');
    }

    const summary = createLocalPracticeSummary(first.state);
    const serialized = JSON.stringify(summary);

    expect(serialized).not.toContain('crane');
    expect(serialized).not.toContain('flame');
    expect(serialized).not.toContain('🟩');
    expect(serialized).not.toContain('⬛');
    expect(serialized).not.toContain('⬜');
  });
});
