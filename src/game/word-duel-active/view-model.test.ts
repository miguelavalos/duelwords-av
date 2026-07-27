import { describe, expect, it } from 'vitest';

import {
  ACTIVE_DUEL_KEY_ROWS,
  ACTIVE_DUEL_MOBILE_LAYOUT_ORDER,
  createDemoActiveDuelViewModel,
  markActiveDuelGuessSubmitted,
  updateActiveDuelEditingLetters,
} from './view-model';

describe('active duel safe view model', () => {
  it('does not include target, opponent guesses, private ids, or raw feedback payload names', () => {
    const viewModel = createDemoActiveDuelViewModel({
      gameLanguage: 'en',
    });
    const serialized = JSON.stringify(viewModel).toLowerCase();

    for (const forbidden of [
      'target',
      'normalized',
      'displayword',
      'display_word',
      'opponentguess',
      'opponent_guess',
      'guest_session',
      'account_user',
      'provider',
      'email',
      'auth',
      'token',
      'candidate',
      'clue',
      'feedback_json',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it('keeps opponent progress abstract', () => {
    const { opponent } = createDemoActiveDuelViewModel({ gameLanguage: 'en' });

    expect(opponent.attemptMarkers).toEqual([
      'failed',
      'submitted',
      'waiting',
      'waiting',
      'waiting',
      'waiting',
    ]);
    expect(JSON.stringify(opponent)).not.toContain('letters');
    expect(JSON.stringify(opponent)).not.toContain('feedback');
  });

  it('keeps keyboard language-specific', () => {
    expect(ACTIVE_DUEL_KEY_ROWS.en.flat()).not.toContain('Ñ');
    expect(ACTIVE_DUEL_KEY_ROWS.es.flat()).toContain('Ñ');
  });

  it('keeps mobile layout order away from spoiler and ad placement regressions', () => {
    const order = ACTIVE_DUEL_MOBILE_LAYOUT_ORDER;

    expect(order.indexOf('opponentSummary')).toBeLessThan(order.indexOf('ownBoard'));
    expect(order.indexOf('ownBoard')).toBeLessThan(order.indexOf('keyboard'));
    expect(order.at(-1)).toBe('keyboard');
  });

  it('supports a local editing state without adding opponent letters', () => {
    const viewModel = createDemoActiveDuelViewModel({
      gameLanguage: 'en',
      scenario: 'editing',
    });
    const updated = updateActiveDuelEditingLetters(viewModel, ['A', 'D', 'O', 'R', 'E']);
    const submitted = markActiveDuelGuessSubmitted(updated, ['A', 'D', 'O', 'R', 'E']);

    expect(updated.ownBoardRows[1]?.state).toBe('editing');
    expect(submitted.ownBoardRows[1]?.state).toBe('submitted_pending');
    expect(submitted.ownRoundState).toBe('waiting_for_rival');
    expect(JSON.stringify(submitted.opponent)).not.toContain('ADORE');
    expect(JSON.stringify(submitted.opponent)).not.toContain('letters');
    expect(JSON.stringify(submitted.opponent)).not.toContain('feedback');
  });
});
