import { describe, expect, it } from 'vitest';

import {
  createDemoActiveDuelViewModel,
  markActiveDuelGuessSubmitted,
  updateActiveDuelEditingLetters,
} from './view-model';
import { createActiveDuelFinalResultLocalPayload } from './result-snapshot';

describe('active duel final result snapshot', () => {
  it('creates a final local result payload without changing the safe active view model', () => {
    const viewModel = createDemoActiveDuelViewModel({
      gameLanguage: 'en',
      scenario: 'editing',
    });
    const payload = createActiveDuelFinalResultLocalPayload(viewModel);

    expect(payload.version).toBe('word-duel-local-result-v1');
    expect(payload.gameLanguage).toBe('en');
    expect(payload.outcome).toBe('win');
    expect(payload.resultReason).toBe('solved');
    expect(payload.targetDisplayWord).toBe('cider');
    expect(payload.own.rows.at(-1)?.word).toBe('CIDER');
    expect(payload.opponent?.safeDisplayName).toBe('Rival');
    expect(payload.opponent?.rows.at(-1)?.word).toBe('CIDER');

    const safeActiveJson = JSON.stringify(viewModel).toLowerCase();
    expect(safeActiveJson).not.toContain('cider');
    expect(safeActiveJson).not.toContain('target');
  });

  it('keeps a submitted current guess in the final own path before the solving row', () => {
    const editing = updateActiveDuelEditingLetters(
      createDemoActiveDuelViewModel({
        gameLanguage: 'en',
        scenario: 'editing',
      }),
      ['A', 'D', 'O', 'R', 'E'],
    );
    const submitted = markActiveDuelGuessSubmitted(editing, ['A', 'D', 'O', 'R', 'E']);
    const payload = createActiveDuelFinalResultLocalPayload(submitted);

    expect(payload.own.rows.map((row) => row.word)).toEqual(['CIVIC', 'ADORE', 'CIDER']);
    expect(payload.own.solved).toBe(true);
    expect(payload.opponent?.rows.length).toBe(4);
  });

  it('uses the active game language for localized final words', () => {
    const payload = createActiveDuelFinalResultLocalPayload(
      createDemoActiveDuelViewModel({
        gameLanguage: 'es',
        scenario: 'editing',
      }),
    );

    expect(payload.gameLanguage).toBe('es');
    expect(payload.targetDisplayWord).toBe('cinta');
    expect(payload.own.rows.at(-1)?.word).toBe('CINTA');
    expect(payload.opponent?.rows.at(-1)?.word).toBe('CINTA');
  });
});
