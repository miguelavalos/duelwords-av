import { describe, expect, it } from 'vitest';

import {
  joinInvite,
  openRoundIfDue,
  pressReady,
  createLocalInviteLobbyViewModel,
  viewInviteReview,
  viewLobbyAsHost,
} from '../word-duel-lobby/view-model';
import {
  createWordDuelActiveDemoHandoff,
  createWordDuelActiveHandoffFromLobby,
  WordDuelActiveHandoffError,
} from './handoff';

const NOW_MS = Date.parse('2026-07-05T09:30:00.000Z');

describe('Word Duel active handoff', () => {
  it('creates a direct local demo handoff with configurable rules', () => {
    expect(createWordDuelActiveDemoHandoff({ gameLanguage: 'es', maxAttempts: 8, wordLength: 7 })).toEqual({
      gameLanguage: 'es',
      maxAttempts: 8,
      mode: 'human_duel',
      source: 'direct_active_demo',
      wordLength: 7,
    });
  });

  it('creates a lobby handoff only after the first round is open', () => {
    const handoff = createWordDuelActiveHandoffFromLobby(createActiveLobby());

    expect(handoff).toEqual({
      gameLanguage: 'es',
      maxAttempts: 8,
      mode: 'human_duel',
      source: 'local_lobby_demo',
      wordLength: 7,
    });
    expect(serialized(handoff)).not.toContain('target');
    expect(serialized(handoff)).not.toContain('dictionary');
    expect(serialized(handoff)).not.toContain('feedback');
    expect(serialized(handoff)).not.toContain('gameid');
    expect(serialized(handoff)).not.toContain('playerid');
    expect(serialized(handoff)).not.toContain('realtime');
    expect(serialized(handoff)).not.toContain('session');
  });

  it('rejects lobby states that are not ready to open the active board', () => {
    const lobby = createLocalInviteLobbyViewModel({
      gameLanguage: 'en',
      nowMs: NOW_MS,
    });

    expect(() => createWordDuelActiveHandoffFromLobby(lobby)).toThrow(WordDuelActiveHandoffError);
    try {
      createWordDuelActiveHandoffFromLobby(lobby);
    } catch (error) {
      expect(error).toMatchObject({
        code: 'lobby_not_active',
      });
    }
  });
});

function createActiveLobby() {
  const invite = createLocalInviteLobbyViewModel({
    gameLanguage: 'es',
    maxAttempts: 8,
    nowMs: NOW_MS,
    wordLength: 7,
  });
  const review = viewInviteReview(invite, NOW_MS + 1_000);
  const joined = joinInvite({
    lobby: review,
    nowMs: NOW_MS + 2_000,
    safeDisplayName: 'Rival',
  });
  const recipientReady = pressReady({
    lobby: joined,
    nowMs: NOW_MS + 3_000,
  });
  const hostView = viewLobbyAsHost(recipientReady, NOW_MS + 4_000);
  const countdown = pressReady({
    lobby: hostView,
    nowMs: NOW_MS + 5_000,
  });

  return openRoundIfDue({
    lobby: countdown,
    nowMs: countdown.countdown?.endsAtMs ?? NOW_MS + 8_000,
  });
}

function serialized(value: unknown): string {
  return JSON.stringify(value).toLowerCase();
}
