import { describe, expect, it } from 'vitest';

import { draftRematchProposal } from './rematch-proposal';
import {
  createDemoWordDuelResultViewModel,
  createSafeResultSharePreview,
  createWordDuelResultLocalPayload,
  createWordDuelResultViewModelFromLocalPayload,
  parseWordDuelResultLocalPayload,
  serializeWordDuelResultLocalPayload,
  shouldRevealTarget,
} from './view-model';

describe('word duel result view model', () => {
  it('reveals the target only after a started finalized match', () => {
    expect(
      shouldRevealTarget({
        isFinalized: true,
        matchStarted: true,
        resultReason: 'solved',
      }),
    ).toBe(true);
    expect(
      shouldRevealTarget({
        isFinalized: false,
        matchStarted: true,
        resultReason: 'solved',
      }),
    ).toBe(false);
    expect(
      shouldRevealTarget({
        isFinalized: true,
        matchStarted: false,
        resultReason: 'solved',
      }),
    ).toBe(false);
    expect(
      shouldRevealTarget({
        isFinalized: true,
        matchStarted: true,
        resultReason: 'cancelled_before_first_round',
      }),
    ).toBe(false);
  });

  it('keeps cancelled-before-first-round result from exposing the target', () => {
    const result = createDemoWordDuelResultViewModel({
      isFinalized: true,
      matchStarted: false,
      resultReason: 'cancelled_before_first_round',
    });

    expect(result.targetReveal.visible).toBe(false);
    expect(result.targetReveal.displayWord).toBeNull();
  });

  it('keeps public share text safe and distinct from board replay', () => {
    const result = createDemoWordDuelResultViewModel();
    const share = result.safeSharePreview.text.toLowerCase();

    expect(share).toContain('duelwords av');
    expect(share).toContain('word duel');
    expect(share).toContain('challenge me');

    for (const forbidden of [
      'field',
      'civic',
      'adore',
      'merit',
      'crane',
      'slate',
      'bride',
      'piece',
      'target',
      'display_word',
      'normalized',
      'guest',
      'account',
      'provider',
      'email',
      'auth',
      'token',
      'room',
      'game-',
      '🟩',
      '🟨',
      '⬛',
    ]) {
      expect(share).not.toContain(forbidden);
    }
  });

  it('keeps completed boards in-app only after finalization', () => {
    const result = createDemoWordDuelResultViewModel();
    const ownLetters = result.own.boardRows
      .flatMap((row) => row.cells)
      .map((cell) => cell.letter)
      .join('');

    expect(result.isFinalized).toBe(true);
    expect(result.targetReveal.displayWord).toBe('FIELD');
    expect(ownLetters).toContain('FIELD');
    expect(result.safeSharePreview.text).not.toContain('FIELD');
  });

  it('keeps rematch proposal language separate from the finalized result language', () => {
    const result = createDemoWordDuelResultViewModel();
    const rematch = draftRematchProposal(result.rematch, { gameLanguage: 'es' });
    const nextResult = createDemoWordDuelResultViewModel({
      gameLanguage: result.gameLanguage,
      rematch,
    });

    expect(nextResult.gameLanguage).toBe('en');
    expect(nextResult.rematch.settings.gameLanguage).toBe('es');
    expect(nextResult.safeSharePreview.text).toContain('English');
    expect(JSON.stringify(nextResult).toLowerCase()).not.toContain('newgameid');
    expect(JSON.stringify(nextResult).toLowerCase()).not.toContain('new_game_id');
  });

  it('builds a local result from actual compact rows', () => {
    const payload = createWordDuelResultLocalPayload({
      gameLanguage: 'en',
      opponent: {
        guesses: [
          guessRow('flame', ['absent', 'present', 'absent', 'absent', 'exact']),
        ],
        safeDisplayName: 'Avi',
        side: 'b',
        solved: false,
      },
      outcome: 'win',
      own: {
        guesses: [
          guessRow('civic', ['absent', 'absent', 'absent', 'absent', 'absent']),
          guessRow('crane', ['exact', 'exact', 'exact', 'exact', 'exact']),
        ],
        solved: true,
      },
      resultReason: 'solved',
      targetDisplayWord: 'crane',
    });
    const encoded = serializeWordDuelResultLocalPayload(payload);
    const decoded = parseWordDuelResultLocalPayload(encoded);

    expect(decoded).toEqual(payload);

    if (!decoded) {
      throw new Error('Expected local result payload to parse.');
    }

    const result = createWordDuelResultViewModelFromLocalPayload(decoded);
    const firstOwnWord = result.own.boardRows[0].cells.map((cell) => cell.letter).join('');
    const secondOwnWord = result.own.boardRows[1].cells.map((cell) => cell.letter).join('');
    const opponentWord = result.opponent.boardRows[0].cells.map((cell) => cell.letter).join('');

    expect(result.own.attemptsUsed).toBe(2);
    expect(result.opponent.safeDisplayName).toBe('Avi');
    expect(result.targetReveal.displayWord).toBe('CRANE');
    expect(firstOwnWord).toBe('CIVIC');
    expect(secondOwnWord).toBe('CRANE');
    expect(opponentWord).toBe('FLAME');
    expect(result.safeSharePreview.text).not.toContain('CRANE');
    expect(result.safeSharePreview.text).not.toContain('CIVIC');
  });

  it('ignores invalid local result payloads', () => {
    expect(parseWordDuelResultLocalPayload('not-json')).toBeNull();
    expect(parseWordDuelResultLocalPayload(JSON.stringify({ version: 'other' }))).toBeNull();
  });

  it('does not describe solo local results as a duel against Solo', () => {
    const payload = createWordDuelResultLocalPayload({
      gameLanguage: 'en',
      outcome: 'win',
      own: {
        guesses: [
          guessRow('crane', ['exact', 'exact', 'exact', 'exact', 'exact']),
        ],
        solved: true,
      },
      resultReason: 'solved',
      targetDisplayWord: 'crane',
    });
    const result = createWordDuelResultViewModelFromLocalPayload(payload);
    const spanishShare = createSafeResultSharePreview(result, 'es');

    expect(result.safeSharePreview.text).toContain('Won');
    expect(result.safeSharePreview.text).not.toContain('vs Solo');
    expect(spanishShare.ctaLabel).toBe('Réteme');
    expect(spanishShare.text).toContain('Victoria');
  });
});

function guessRow(
  normalizedWord: string,
  feedback: ['exact' | 'present' | 'absent', 'exact' | 'present' | 'absent', 'exact' | 'present' | 'absent', 'exact' | 'present' | 'absent', 'exact' | 'present' | 'absent'],
) {
  return {
    feedback,
    input: normalizedWord,
    letters: Array.from(normalizedWord),
    normalizedWord,
  };
}
