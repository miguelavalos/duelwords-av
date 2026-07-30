import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createWordDuelLobbyController,
  type WordDuelLobbyControllerState,
} from '../../game/word-duel-lobby/controller';

import {
  clearActiveChallengeSession,
  isActiveChallengeSessionProtected,
  readActiveChallengeSession,
  rememberActiveChallengeSession,
  subscribeActiveChallengeSession,
} from './active-challenge-session';

describe('volatile active Challenge session', () => {
  beforeEach(() => clearActiveChallengeSession());

  it('keeps a joined live journey recoverable without retaining realtime credentials', async () => {
    const controller = createWordDuelLobbyController({ mode: 'local_mock' });
    const host = await controller.createHostInvite({ gameLanguage: 'en', nowMs: 1_000 });
    const state = {
      ...host,
      realtime: { realtimeSessionId: 'private-session', roomToken: 'private-token' } as never,
    } satisfies WordDuelLobbyControllerState;

    rememberActiveChallengeSession(state);

    expect(isActiveChallengeSessionProtected(state)).toBe(true);
    expect(readActiveChallengeSession()).toEqual({ ...state, realtime: null });
  });

  it('does not keep invite previews or terminal lobbies as active sessions', async () => {
    const controller = createWordDuelLobbyController({ mode: 'local_mock' });
    const host = await controller.createHostInvite({ gameLanguage: 'en', nowMs: 1_000 });
    const review = await controller.viewInviteReview({ nowMs: 2_000, state: host });
    const expired = await controller.expireInvite({
      nowMs: review.lobby.invitePreview.expiresAtMs + 1,
      state: review,
    });

    rememberActiveChallengeSession(host);
    rememberActiveChallengeSession(review);
    expect(isActiveChallengeSessionProtected(review)).toBe(false);
    expect(readActiveChallengeSession()).toBeNull();

    rememberActiveChallengeSession(expired);
    expect(isActiveChallengeSessionProtected(expired)).toBe(false);
    expect(readActiveChallengeSession()).toBeNull();
  });

  it('notifies Home when the resumable session appears or is cleared', async () => {
    const controller = createWordDuelLobbyController({ mode: 'local_mock' });
    const host = await controller.createHostInvite({ gameLanguage: 'en', nowMs: 1_000 });
    const listener = vi.fn();
    const unsubscribe = subscribeActiveChallengeSession(listener);

    rememberActiveChallengeSession(host);
    clearActiveChallengeSession();
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
