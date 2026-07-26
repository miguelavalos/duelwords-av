import { describe, expect, it } from 'vitest';

import type { WordDuelLobbyStatus } from '@/game/word-duel-lobby/view-model';

import { shouldRearmActiveDuelOpening, shouldShowLobbyRefresh } from './public-challenge-flow';

describe('public Challenge recovery flow', () => {
  it('keeps Refresh available when an active duel still needs to open', () => {
    expect(shouldShowLobbyRefresh('active_round')).toBe(true);
    expect(shouldRearmActiveDuelOpening({
      hasActiveController: false,
      lobbyStatus: 'active_round',
    })).toBe(true);
  });

  it('does not rearm an already open duel', () => {
    expect(shouldRearmActiveDuelOpening({
      hasActiveController: true,
      lobbyStatus: 'active_round',
    })).toBe(false);
  });

  it.each([
    ['invite_review', false],
    ['waiting_for_player', true],
    ['lobby', true],
    ['countdown', true],
    ['active_round', true],
    ['cancelled_before_first_round', false],
    ['expired', false],
  ] satisfies [WordDuelLobbyStatus, boolean][])('sets Refresh visibility for %s', (status, visible) => {
    expect(shouldShowLobbyRefresh(status)).toBe(visible);
  });
});
