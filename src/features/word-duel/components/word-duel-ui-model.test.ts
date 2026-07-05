import { describe, expect, it } from 'vitest';

import { getLocalDictionary } from '../../../game/dictionaries/local-fixtures';
import { applyGuess, createLocalGame, WORD_DUEL_MAX_ATTEMPTS } from '../../../game/word-duel-engine';

import {
  createKeyboardFeedbackFromGuesses,
  createRowsFromLocalWordDuelState,
  fillEditingRow,
  rowFromLetters,
} from './word-duel-ui-model';

describe('word duel shared UI model helpers', () => {
  it('creates scored, current, and empty board rows from a local game', () => {
    const initial = createLocalGame({
      dictionary: getLocalDictionary('en'),
      language: 'en',
      target: 'crane',
    });
    const first = applyGuess(initial, 'flame', getLocalDictionary('en'));
    if (!first.accepted) {
      throw new Error('Expected fixture guess to be accepted.');
    }

    const rows = createRowsFromLocalWordDuelState(first.state, 'civ');

    expect(rows).toHaveLength(WORD_DUEL_MAX_ATTEMPTS);
    expect(rows[0]?.state).toBe('scored');
    expect(rows[0]?.cells.map((cell) => cell.letter).join('')).toBe('FLAME');
    expect(rows[1]?.state).toBe('current');
    expect(rows[1]?.cells.slice(0, 3).map((cell) => cell.letter).join('')).toBe('CIV');
    expect(rows.slice(2).every((row) => row.state === 'empty')).toBe(true);
  });

  it('keeps strongest keyboard feedback per key', () => {
    const initial = createLocalGame({
      dictionary: getLocalDictionary('en'),
      language: 'en',
      target: 'crane',
    });
    const first = applyGuess(initial, 'flame', getLocalDictionary('en'));
    if (!first.accepted) {
      throw new Error('Expected fixture guess to be accepted.');
    }
    const second = applyGuess(first.state, 'crane', getLocalDictionary('en'));
    if (!second.accepted) {
      throw new Error('Expected target guess to be accepted.');
    }

    const feedback = createKeyboardFeedbackFromGuesses(second.state.guesses);

    expect(feedback.get('e')).toBe('exact');
    expect(feedback.get('a')).toBe('exact');
    expect(feedback.get('f')).toBe('absent');
  });

  it('fills only editing/current rows with draft letters', () => {
    const rows = [
      rowFromLetters(['A', 'B', 'C'], 'revealed'),
      rowFromLetters([], 'editing'),
      rowFromLetters([], 'empty'),
    ];
    const filled = fillEditingRow(rows, 'perla');

    expect(filled[0]?.cells.map((cell) => cell.letter).join('')).toBe('ABC');
    expect(filled[1]?.cells.map((cell) => cell.letter).join('')).toBe('PERLA');
    expect(filled[2]?.cells.every((cell) => cell.letter === null)).toBe(true);
  });
});
