import { describe, expect, it } from 'vitest';

import { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH } from '../word-duel-engine';
import {
  createAviBotDelayMs,
  createAviBotDuelSession,
  createAviBotDuelViewModel,
  createAviBotSafeRealtimeProjection,
  resolveAviBotRound,
  selectAviBotGuess,
  submitAviBotDuelGuess,
} from './view-model';
import type { AviBotDuelSession } from './view-model';

const NOW_MS = Date.parse('2026-07-05T09:30:00.000Z');

function submitAndResolve(session: AviBotDuelSession, input: string, nowMs = NOW_MS): AviBotDuelSession {
  const submitted = submitAviBotDuelGuess({ input, nowMs: nowMs + 1_000, session });
  if (!submitted.accepted) {
    throw new Error(`Expected ${input} to be accepted.`);
  }

  return resolveAviBotRound({ nowMs: nowMs + 4_000, session: submitted.session });
}

describe('Avi bot duel local view model', () => {
  it('creates Play Avi as a local bot duel without invite, Ready, or generative AI', () => {
    const session = createAviBotDuelSession({ gameLanguage: 'en', gameSeed: 3, nowMs: NOW_MS });

    expect(session).toMatchObject({
      botProfile: 'normal',
      botProfileVersion: 'normal-v1',
      dictionaryVersion: 'local-fixture-preview',
      gameLanguage: 'en',
      isLocalPreviewOnly: true,
      mode: 'bot_duel',
      normalizationVersion: 'word-duel-normalize-v1',
      openingPoolVersion: 'local-openers-v1',
      requiresInvite: false,
      requiresReady: false,
      roundTimeoutMs: 60_000,
      ruleVersion: 'word-duel-v1',
      solverKind: 'deterministic_dictionary',
      solverVersion: 'deterministic-local-v1',
      usesGenerativeAi: false,
    });
  });

  it('locks Word Duel V1 shape in the view model', () => {
    const viewModel = createAviBotDuelViewModel(
      createAviBotDuelSession({ gameLanguage: 'es', gameSeed: 0, nowMs: NOW_MS }),
    );

    expect(viewModel).toMatchObject({
      gameLanguage: 'es',
      isInputOpen: true,
      maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
      mode: 'bot_duel',
      phase: 'editing',
      roundNumber: 1,
      status: 'active',
      wordLength: WORD_DUEL_WORD_LENGTH,
    });
    expect(viewModel.opponent).toMatchObject({
      kind: 'bot',
      profileLabel: 'Bot Normal',
      safeDisplayName: 'Avi',
    });
  });

  it('keeps invalid player guesses from consuming attempts or scheduling Avi', () => {
    const session = createAviBotDuelSession({ gameLanguage: 'en', gameSeed: 0, nowMs: NOW_MS });
    const result = submitAviBotDuelGuess({ input: 'xxxxx', nowMs: NOW_MS + 1_000, session });

    expect(result.accepted).toBe(false);
    expect(result.session.humanState.guesses).toHaveLength(0);
    expect(result.session.botState.guesses).toHaveLength(0);
    expect(result.session.pendingRound).toBeNull();
    if (!result.accepted) {
      expect(result.rejection).toBe('invalid_word');
    }
  });

  it('uses deterministic replay for the same seed and human path', () => {
    const first = submitAndResolve(
      submitAndResolve(createAviBotDuelSession({ gameLanguage: 'en', gameSeed: 0, nowMs: NOW_MS }), 'flame', NOW_MS),
      'civic',
      NOW_MS + 10_000,
    );
    const second = submitAndResolve(
      submitAndResolve(createAviBotDuelSession({ gameLanguage: 'en', gameSeed: 0, nowMs: NOW_MS }), 'flame', NOW_MS),
      'civic',
      NOW_MS + 10_000,
    );

    expect(first.botState.guesses.map((guess) => guess.normalizedWord)).toEqual(
      second.botState.guesses.map((guess) => guess.normalizedWord),
    );
    expect(first.status).toBe(second.status);
  });

  it('varies opening guesses by deterministic seed', () => {
    const baseInput = {
      botProfile: 'normal',
      botProfileVersion: 'normal-v1',
      dictionary: {
        language: 'en',
        validGuesses: ['crane', 'flame', 'civic'],
        targetWords: ['crane', 'flame', 'civic'],
      },
      language: 'en',
      openingPoolVersion: 'local-openers-v1',
      priorGuesses: [],
      roundNumber: 1,
      solverVersion: 'deterministic-local-v1',
      wordLength: WORD_DUEL_WORD_LENGTH,
    } as const;

    expect(selectAviBotGuess({ ...baseInput, gameSeed: 0 })).toBe('crane');
    expect(selectAviBotGuess({ ...baseInput, gameSeed: 1 })).toBe('flame');
  });

  it('prevents Normal Avi from winning on the first guess when opener matches target', () => {
    const session = createAviBotDuelSession({ gameLanguage: 'en', gameSeed: 0, nowMs: NOW_MS });
    const submitted = submitAviBotDuelGuess({ input: 'flame', nowMs: NOW_MS + 1_000, session });

    expect(session.target.normalizedWord).toBe('abbot');
    if (!submitted.accepted) {
      throw new Error('Expected human fixture guess to be accepted.');
    }
    expect(submitted.session.pendingRound?.botRow.normalizedWord).not.toBe(session.target.normalizedWord);
  });

  it('keeps deterministic bot delay in the V1 Normal range and before timeout', () => {
    const delay = createAviBotDelayMs({ gameSeed: 4, language: 'es', roundNumber: 2 });
    const session = createAviBotDuelSession({ gameLanguage: 'es', gameSeed: 4, nowMs: NOW_MS });
    const submitted = submitAviBotDuelGuess({ input: 'perla', nowMs: NOW_MS + 1_000, session });

    expect(delay).toBeGreaterThanOrEqual(2_000);
    expect(delay).toBeLessThanOrEqual(12_000);
    if (!submitted.accepted) {
      throw new Error('Expected human fixture guess to be accepted.');
    }
    expect(submitted.session.pendingRound?.botDelayMs).toBeGreaterThanOrEqual(2_000);
    expect(submitted.session.pendingRound?.botDelayMs).toBeLessThanOrEqual(12_000);
    expect(submitted.session.pendingRound?.botDueAtMs).toBeLessThan(session.roundOpenedAtMs + session.roundTimeoutMs);
  });

  it('keeps target and share hidden until finalization', () => {
    const session = createAviBotDuelSession({ gameLanguage: 'en', gameSeed: 2, nowMs: NOW_MS });
    const activeView = createAviBotDuelViewModel(session);
    const submitted = submitAviBotDuelGuess({ input: session.target.displayWord, nowMs: NOW_MS + 1_000, session });

    expect(activeView.targetReveal.visible).toBe(false);
    expect(activeView.safeSharePreview).toBeNull();
    if (!submitted.accepted) {
      throw new Error('Expected target guess to be accepted.');
    }

    const finalSession = resolveAviBotRound({ nowMs: NOW_MS + 4_000, session: submitted.session });
    const finalView = createAviBotDuelViewModel(finalSession);

    expect(finalView.status).not.toBe('active');
    expect(finalView.targetReveal.visible).toBe(true);
    expect(finalView.targetReveal.displayWord).toBe(session.target.displayWord.toUpperCase());
    expect(finalView.safeSharePreview?.text).toContain('Play Avi');
  });

  it('exposes only safe opponent realtime projection', () => {
    const session = createAviBotDuelSession({ gameLanguage: 'en', gameSeed: 0, nowMs: NOW_MS });
    const submitted = submitAviBotDuelGuess({ input: 'flame', nowMs: NOW_MS + 1_000, session });
    if (!submitted.accepted) {
      throw new Error('Expected fixture guess to be accepted.');
    }

    const projection = createAviBotSafeRealtimeProjection(submitted.session);
    const serialized = JSON.stringify(projection).toLowerCase();

    expect(projection).toMatchObject({
      mode: 'bot_duel',
      opponentKind: 'bot',
      opponentName: 'Avi',
      opponentProfile: 'normal',
    });
    for (const forbidden of [
      'target',
      'guess',
      'feedback',
      'candidate',
      'solver',
      'normalized',
      session.target.normalizedWord,
      submitted.session.pendingRound?.botRow.normalizedWord ?? '',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it('keeps external share free of target, guesses, bot path, boards and Wordle-like grids', () => {
    const started = createAviBotDuelSession({ gameLanguage: 'en', gameSeed: 0, nowMs: NOW_MS });
    const final = submitAndResolve(started, started.target.displayWord, NOW_MS);
    const share = createAviBotDuelViewModel(final).safeSharePreview;
    const serialized = JSON.stringify(share).toLowerCase();

    expect(share).not.toBeNull();
    for (const forbidden of [
      started.target.normalizedWord,
      started.target.displayWord,
      final.botState.guesses[0]?.normalizedWord ?? '',
      'feedback',
      'board',
      '🟩',
      '⬛',
      '⬜',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it('keeps Avi reactions closed-set and non-free-text', () => {
    const viewModel = createAviBotDuelViewModel(
      createAviBotDuelSession({ gameLanguage: 'en', gameSeed: 1, nowMs: NOW_MS }),
    );

    expect(viewModel.availableReactions).toEqual(['nice', 'your_turn', 'tick_tock', 'no_pressure', 'gg']);
  });
});
