import { describe, expect, it } from 'vitest';

import {
  ACTIVE_DUEL_KEY_ROWS,
  ACTIVE_DUEL_MOBILE_LAYOUT_ORDER,
  createDemoActiveDuelViewModel,
  createRuntimeActiveDuelViewModel,
  markActiveDuelGuessSubmitted,
  markActiveDuelTimedOut,
  reconcileActiveDuelResolvedOwnRow,
  revealActiveDuelOwnRoundFeedback,
  shouldReportActiveDuelTimeoutFailure,
  synchronizeActiveDuelRound,
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

  it('keeps every active row and marker aligned with Epic 7/8 rules', () => {
    const editing = createRuntimeActiveDuelViewModel({
      gameLanguage: 'en',
      maxAttempts: 8,
      ownSide: 'a',
      roundNumber: 1,
      wordLength: 7,
    });
    const drafted = updateActiveDuelEditingLetters(editing, [
      'A', 'N', 'O', 'T', 'H', 'E', 'R',
    ]);
    const submitted = markActiveDuelGuessSubmitted(drafted, [
      'A', 'N', 'O', 'T', 'H', 'E', 'R',
    ]);
    const roundEight = synchronizeActiveDuelRound(submitted, 8);

    expect(editing.ownBoardRows).toHaveLength(8);
    expect(editing.ownBoardRows.every((row) => row.cells.length === 7)).toBe(true);
    expect(editing.opponent.attemptMarkers).toHaveLength(8);
    expect(submitted.ownBoardRows[0]?.cells.map((cell) => cell.letter)).toEqual([
      'A', 'N', 'O', 'T', 'H', 'E', 'R',
    ]);
    expect(roundEight.roundNumber).toBe(8);
    expect(roundEight.ownBoardRows[7]).toMatchObject({ state: 'editing' });
    expect(roundEight.ownBoardRows[7]?.cells).toHaveLength(7);
  });

  it('does not surface a stale timeout failure after a round resolves or advances', () => {
    const editing = createRuntimeActiveDuelViewModel({
      gameLanguage: 'en',
      ownSide: 'a',
      roundNumber: 1,
    });
    const submitted = markActiveDuelGuessSubmitted(editing, ['R', 'A', 'I', 'S', 'E']);
    const nextRound = createRuntimeActiveDuelViewModel({
      gameLanguage: 'en',
      ownSide: 'a',
      roundNumber: 2,
    });

    expect(shouldReportActiveDuelTimeoutFailure(editing, 1)).toBe(true);
    expect(shouldReportActiveDuelTimeoutFailure(submitted, 1)).toBe(false);
    expect(shouldReportActiveDuelTimeoutFailure(nextRound, 1)).toBe(false);
  });

  it('applies a late resolved row without closing input in the new round', () => {
    const roundFour = createRuntimeActiveDuelViewModel({
      gameLanguage: 'ca',
      ownSide: 'a',
      roundNumber: 4,
    });
    const submitted = markActiveDuelGuessSubmitted(roundFour, ['T', 'A', 'P', 'E', 'S']);
    const resolved = revealActiveDuelOwnRoundFeedback(submitted, {
      feedback: ['present', 'absent', 'absent', 'absent', 'absent'],
      letters: ['T', 'A', 'P', 'E', 'S'],
      roundNumber: 4,
    });
    const roundFive = synchronizeActiveDuelRound(submitted, 5);
    const reconciled = reconcileActiveDuelResolvedOwnRow(roundFive, resolved, 4);

    expect(reconciled.roundNumber).toBe(5);
    expect(reconciled.ownRoundState).toBe('editing');
    expect(reconciled.ownBoardRows[3]?.state).toBe('revealed');
    expect(reconciled.ownBoardRows[4]?.state).toBe('editing');
    expect(reconciled.ownKeyboardFeedback.t).toBe('present');
  });

  it('records a late timeout on its original row without disabling the current keyboard', () => {
    const roundFour = createRuntimeActiveDuelViewModel({
      gameLanguage: 'en',
      ownSide: 'a',
      roundNumber: 4,
    });
    const roundFive = synchronizeActiveDuelRound(roundFour, 5);
    const timedOut = markActiveDuelTimedOut(roundFive, 4);

    expect(timedOut.roundNumber).toBe(5);
    expect(timedOut.ownRoundState).toBe('editing');
    expect(timedOut.ownBoardRows[3]?.state).toBe('timeout');
    expect(timedOut.ownBoardRows[4]?.state).toBe('editing');
  });

  it('records a late accepted submission on its original row without blocking the new round', () => {
    const roundFour = createRuntimeActiveDuelViewModel({
      gameLanguage: 'ca',
      ownSide: 'a',
      roundNumber: 4,
    });
    const roundFive = synchronizeActiveDuelRound(roundFour, 5);
    const submitted = markActiveDuelGuessSubmitted(
      roundFive,
      ['T', 'A', 'P', 'E', 'S'],
      4,
    );

    expect(submitted.roundNumber).toBe(5);
    expect(submitted.ownRoundState).toBe('editing');
    expect(submitted.ownBoardRows[3]).toMatchObject({ state: 'submitted_pending' });
    expect(submitted.ownBoardRows[3]?.cells.map((cell) => cell.letter)).toEqual([
      'T', 'A', 'P', 'E', 'S',
    ]);
    expect(submitted.ownBoardRows[4]?.state).toBe('editing');
  });

  it('never replaces authoritative feedback with a late command response', () => {
    const roundFour = createRuntimeActiveDuelViewModel({
      gameLanguage: 'en',
      ownSide: 'a',
      roundNumber: 4,
    });
    const submitted = markActiveDuelGuessSubmitted(roundFour, ['R', 'A', 'I', 'S', 'E']);
    const resolved = revealActiveDuelOwnRoundFeedback(submitted, {
      feedback: ['absent', 'present', 'exact', 'absent', 'absent'],
      letters: ['R', 'A', 'I', 'S', 'E'],
      roundNumber: 4,
    });
    const roundFive = synchronizeActiveDuelRound(resolved, 5);

    expect(markActiveDuelGuessSubmitted(
      roundFive,
      ['R', 'A', 'I', 'S', 'E'],
      4,
    )).toBe(roundFive);
    expect(markActiveDuelTimedOut(roundFive, 4)).toBe(roundFive);
    expect(roundFive.ownBoardRows[3]?.state).toBe('revealed');
  });
});
