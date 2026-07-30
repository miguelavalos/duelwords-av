import { DuelWordsClientError } from '../../game/word-duel-active/api-adapter';
import { DuelWordsApiError } from '../../game/word-duel-lobby/api-client';

export type ActiveDuelSubmitFailure =
  | 'invalid_word'
  | 'round_changed'
  | 'word_length'
  | 'retry';

const ROUND_CHANGED_API_CODES = new Set([
  'game_not_active_round',
  'round_already_submitted',
  'round_deadline_elapsed',
  'round_not_current',
  'round_not_open',
]);

export function classifyActiveDuelSubmitFailure(error: unknown): ActiveDuelSubmitFailure {
  if (error instanceof DuelWordsApiError) {
    if (error.code === 'guess_not_in_dictionary') {
      return 'invalid_word';
    }
    if (error.code === 'invalid_guess_length') {
      return 'word_length';
    }
    if (ROUND_CHANGED_API_CODES.has(error.code)) {
      return 'round_changed';
    }
  }

  if (error instanceof DuelWordsClientError) {
    if (error.code === 'invalid_guess_length') {
      return 'word_length';
    }
    if (error.code === 'invalid_round' || error.code === 'round_locked') {
      return 'round_changed';
    }
  }

  return 'retry';
}
