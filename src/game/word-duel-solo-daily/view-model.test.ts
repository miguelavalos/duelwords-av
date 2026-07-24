import { describe, expect, it } from 'vitest';

import { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH } from '../word-duel-engine';
import {
  applySoloDailyGuess,
  createSafeSoloDailySharePreview,
  createSoloDailySession,
  createSoloDailyViewModel,
} from './view-model';

const NOW_MS = Date.parse('2026-07-05T09:30:00.000Z');

describe('word duel solo and daily local preview', () => {
  it('creates repeatable Solo Practice as local-only Word Duel rules', () => {
    const session = createSoloDailySession({
      gameLanguage: 'en',
      mode: 'solo_practice',
      nowMs: NOW_MS,
      seed: 2,
    });
    const viewModel = createSoloDailyViewModel(session);

    expect(viewModel).toMatchObject({
      attemptsUsed: 0,
      canRecordOfficialResult: false,
      dailyDate: null,
      gameLanguage: 'en',
      isLocalPreviewOnly: true,
      maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
      mode: 'solo_practice',
      official: false,
      status: 'playing',
      wordLength: WORD_DUEL_WORD_LENGTH,
    });
    expect(viewModel.targetReveal).toEqual({ displayWord: null, visible: false });
  });

  it('creates Daily preview from date, timezone, language and word length without official authority', () => {
    const first = createSoloDailySession({
      dailyDate: '2026-07-05',
      gameLanguage: 'es',
      mode: 'daily_preview',
      nowMs: NOW_MS,
      timezone: 'Europe/Madrid',
    });
    const second = createSoloDailySession({
      dailyDate: '2026-07-05',
      gameLanguage: 'es',
      mode: 'daily_preview',
      nowMs: NOW_MS + 60_000,
      timezone: 'Europe/Madrid',
    });
    const viewModel = createSoloDailyViewModel(first);

    expect(first.target.id).toBe(second.target.id);
    expect(viewModel).toMatchObject({
      canRecordOfficialResult: false,
      dailyDate: '2026-07-05',
      gameLanguage: 'es',
      isLocalPreviewOnly: true,
      mode: 'daily_preview',
      official: false,
      timezone: 'Europe/Madrid',
    });
  });

  it('keeps English and Spanish game language independent per session', () => {
    const english = createSoloDailySession({
      gameLanguage: 'en',
      mode: 'solo_practice',
      nowMs: NOW_MS,
      seed: 0,
    });
    const spanish = createSoloDailySession({
      gameLanguage: 'es',
      mode: 'solo_practice',
      nowMs: NOW_MS,
      seed: 55,
    });

    expect(english.state.language).toBe('en');
    expect(spanish.state.language).toBe('es');
    expect(english.target.language).toBe('en');
    expect(spanish.target.language).toBe('es');
    expect(spanish.target.displayWord).toContain('ñ');
  });

  it('does not consume attempts for invalid guesses', () => {
    const session = createSoloDailySession({
      gameLanguage: 'en',
      mode: 'solo_practice',
      nowMs: NOW_MS,
      seed: 0,
    });
    const result = applySoloDailyGuess({ input: 'xxxxx', nowMs: NOW_MS + 1_000, session });

    expect(result.accepted).toBe(false);
    expect(result.session.state.guesses).toHaveLength(0);
    if (!result.accepted) {
      expect(result.rejection).toBe('invalid_word');
    }
  });

  it('hides target and share preview while playing, then reveals target after finalization', () => {
    const session = createSoloDailySession({
      gameLanguage: 'en',
      mode: 'solo_practice',
      nowMs: NOW_MS,
      seed: 0,
    });
    const playingView = createSoloDailyViewModel(session);
    const solved = applySoloDailyGuess({
      input: session.target.displayWord,
      nowMs: NOW_MS + 4_000,
      session,
    });

    expect(playingView.targetReveal.visible).toBe(false);
    expect(playingView.targetReveal.displayWord).toBeNull();
    expect(playingView.safeSharePreview).toBeNull();
    if (!solved.accepted) {
      throw new Error('Expected target guess to solve the local game.');
    }

    const solvedView = createSoloDailyViewModel(solved.session);
    expect(solvedView.status).toBe('won');
    expect(solvedView.targetReveal).toEqual({
      displayWord: session.target.displayWord.toUpperCase(),
      visible: true,
    });
    expect(solvedView.safeSharePreview?.text).toContain('DuelWords AV');
  });

  it('keeps the local share preview free of target, guesses, letters, boards and Wordle-like grids', () => {
    const session = createSoloDailySession({
      gameLanguage: 'en',
      mode: 'solo_practice',
      nowMs: NOW_MS,
      seed: 0,
    });
    const first = applySoloDailyGuess({ input: 'flame', nowMs: NOW_MS + 1_000, session });
    if (!first.accepted) {
      throw new Error('Expected fixture guess to be accepted.');
    }
    const solved = applySoloDailyGuess({
      input: session.target.displayWord,
      nowMs: NOW_MS + 2_000,
      session: first.session,
    });
    if (!solved.accepted) {
      throw new Error('Expected target guess to solve the local game.');
    }

    const share = createSafeSoloDailySharePreview(solved.session);
    const serialized = JSON.stringify(share).toLowerCase();

    expect(serialized).not.toContain(session.target.normalizedWord);
    expect(serialized).not.toContain('flame');
    expect(serialized).not.toContain('feedback');
    expect(serialized).not.toContain('board');
    expect(serialized).not.toContain('🟩');
    expect(serialized).not.toContain('⬛');
    expect(serialized).not.toContain('⬜');
  });

  it('reserves ads but keeps them hidden during active play', () => {
    const session = createSoloDailySession({
      gameLanguage: 'en',
      mode: 'daily_preview',
      nowMs: NOW_MS,
      seed: 0,
    });
    const playingView = createSoloDailyViewModel(session);
    const solved = applySoloDailyGuess({
      input: session.target.displayWord,
      nowMs: NOW_MS + 3_000,
      session,
    });

    expect(playingView.adSlot).toEqual({ reserved: true, visible: false });
    if (!solved.accepted) {
      throw new Error('Expected target guess to solve the local game.');
    }
    expect(createSoloDailyViewModel(solved.session).adSlot).toEqual({ reserved: true, visible: true });
  });
});
