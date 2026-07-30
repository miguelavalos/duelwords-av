import { describe, expect, it } from 'vitest';

import { DuelWordsClientError } from '../../game/word-duel-active/api-adapter';
import { DuelWordsApiError } from '../../game/word-duel-lobby/api-client';

import { classifyActiveDuelSubmitFailure } from './active-duel-submit';

describe('active DuelWords submission feedback', () => {
  it('distinguishes a dictionary rejection from a temporary request failure', () => {
    expect(classifyActiveDuelSubmitFailure(
      new DuelWordsApiError(422, 'guess_not_in_dictionary'),
    )).toBe('invalid_word');
    expect(classifyActiveDuelSubmitFailure(
      new DuelWordsApiError(503, 'service_unavailable'),
    )).toBe('retry');
  });

  it('turns stale server and local round errors into a round-change message', () => {
    expect(classifyActiveDuelSubmitFailure(
      new DuelWordsApiError(409, 'round_not_current'),
    )).toBe('round_changed');
    expect(classifyActiveDuelSubmitFailure(
      new DuelWordsClientError('invalid_round', 'stale round'),
    )).toBe('round_changed');
  });

  it('keeps length errors actionable', () => {
    expect(classifyActiveDuelSubmitFailure(
      new DuelWordsApiError(422, 'invalid_guess_length'),
    )).toBe('word_length');
  });
});
