import { describe, expect, it } from 'vitest';

import { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH } from '../word-duel-engine';
import {
  cancelInvite,
  createLocalInviteLobbyViewModel,
  expireInvite,
  joinInvite,
  openRoundIfDue,
  pressReady,
  simulateOpponentReady,
  viewInviteReview,
  viewLobbyAsHost,
  WordDuelLobbyError,
} from './view-model';

const NOW_MS = Date.parse('2026-07-05T09:30:00.000Z');

describe('word duel lobby view model', () => {
  it('creates a safe host invite lobby without selecting a solution', () => {
    const lobby = createLocalInviteLobbyViewModel({ gameLanguage: 'en', nowMs: NOW_MS });

    expect(lobby.status).toBe('waiting_for_player');
    expect(lobby.viewerRole).toBe('host');
    expect(lobby.canShareInvite).toBe(true);
    expect(lobby.canCancel).toBe(true);
    expect(lobby.canPressReady).toBe(false);
    expect(lobby.invitePreview).toMatchObject({
      gameLanguage: 'en',
      maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
      mode: 'human_duel',
      roomCode: 'DUEL-WORD',
      solutionSelected: false,
      wordLength: WORD_DUEL_WORD_LENGTH,
    });
    expect(lobby.players.map((player) => player.state)).toEqual(['joined', 'waiting']);
  });

  it('keeps invite review read-only until explicit join', () => {
    const hostLobby = createLocalInviteLobbyViewModel({ gameLanguage: 'es', nowMs: NOW_MS });
    const review = viewInviteReview(hostLobby, NOW_MS + 1_000);

    expect(review.status).toBe('invite_review');
    expect(review.viewerRole).toBe('recipient');
    expect(review.canJoin).toBe(true);
    expect(review.readyBySide).toEqual({ a: false, b: false });
    expect(review.players.map((player) => player.state)).toEqual(['joined', 'waiting']);

    const joined = joinInvite({ lobby: review, nowMs: NOW_MS + 2_000, safeDisplayName: 'Rival' });

    expect(joined.status).toBe('lobby');
    expect(joined.viewerSide).toBe('b');
    expect(joined.players.map((player) => player.state)).toEqual(['joined', 'joined']);
    expect(joined.canPressReady).toBe(true);
  });

  it('blocks Ready until both seats are joined', () => {
    const lobby = createLocalInviteLobbyViewModel({ gameLanguage: 'en', nowMs: NOW_MS });

    expect(() => pressReady({ lobby, nowMs: NOW_MS + 1_000 })).toThrow(WordDuelLobbyError);
  });

  it('uses one-way Ready and starts countdown only after both players are ready', () => {
    const review = viewInviteReview(createLocalInviteLobbyViewModel({ gameLanguage: 'en', nowMs: NOW_MS }), NOW_MS);
    const recipientLobby = joinInvite({ lobby: review, nowMs: NOW_MS + 1_000, safeDisplayName: 'Rival' });
    const recipientReady = pressReady({ lobby: recipientLobby, nowMs: NOW_MS + 2_000 });

    expect(recipientReady.status).toBe('lobby');
    expect(recipientReady.readyBySide).toEqual({ a: false, b: true });
    expect(recipientReady.canPressReady).toBe(false);
    expect(recipientReady.countdown).toBeNull();

    const countdown = simulateOpponentReady({ lobby: recipientReady, nowMs: NOW_MS + 3_000 });

    expect(countdown.status).toBe('countdown');
    expect(countdown.readyBySide).toEqual({ a: true, b: true });
    expect(countdown.countdown?.remainingSeconds).toBe(3);
    expect(countdown.canOpenActiveDuel).toBe(false);
    expect(countdown.adSlot.visible).toBe(false);
  });

  it('does not open round 1 until the authoritative countdown deadline has elapsed', () => {
    const review = viewInviteReview(createLocalInviteLobbyViewModel({ gameLanguage: 'en', nowMs: NOW_MS }), NOW_MS);
    const joined = joinInvite({ lobby: review, nowMs: NOW_MS + 1_000 });
    const ready = pressReady({ lobby: joined, nowMs: NOW_MS + 2_000 });
    const countdown = simulateOpponentReady({ lobby: ready, nowMs: NOW_MS + 3_000 });

    expect(() => openRoundIfDue({ lobby: countdown, nowMs: NOW_MS + 5_000 })).toThrow(WordDuelLobbyError);

    const active = openRoundIfDue({ lobby: countdown, nowMs: NOW_MS + 6_000 });

    expect(active.status).toBe('active_round');
    expect(active.activeRound).toEqual({
      roundNumber: 1,
      roundOpenedAtMs: NOW_MS + 6_000,
    });
    expect(active.canOpenActiveDuel).toBe(true);
  });

  it('prevents host cancellation after any player is Ready', () => {
    const review = viewInviteReview(createLocalInviteLobbyViewModel({ gameLanguage: 'en', nowMs: NOW_MS }), NOW_MS);
    const recipientLobby = joinInvite({ lobby: review, nowMs: NOW_MS + 1_000 });
    const hostLobby = viewLobbyAsHost(recipientLobby, NOW_MS + 2_000);
    const hostReady = pressReady({ lobby: hostLobby, nowMs: NOW_MS + 3_000 });

    expect(hostReady.canCancel).toBe(false);
    expect(() => cancelInvite({ lobby: hostReady, nowMs: NOW_MS + 4_000 })).toThrow(WordDuelLobbyError);
  });

  it('keeps cancelled and expired rooms from creating active rounds', () => {
    const hostLobby = createLocalInviteLobbyViewModel({ gameLanguage: 'en', nowMs: NOW_MS });
    const cancelled = cancelInvite({ lobby: hostLobby, nowMs: NOW_MS + 1_000 });
    const expired = expireInvite({ lobby: hostLobby, nowMs: NOW_MS + 601_000 });

    for (const lobby of [cancelled, expired]) {
      expect(lobby.activeRound).toBeNull();
      expect(lobby.countdown).toBeNull();
      expect(lobby.canOpenActiveDuel).toBe(false);
      expect(lobby.canJoin).toBe(false);
    }
  });

  it('does not expose hidden gameplay or private identity fields in local safe views', () => {
    const review = viewInviteReview(createLocalInviteLobbyViewModel({ gameLanguage: 'es', nowMs: NOW_MS }), NOW_MS);
    const joined = joinInvite({ lobby: review, nowMs: NOW_MS + 1_000, safeDisplayName: 'Rival' });
    const ready = pressReady({ lobby: joined, nowMs: NOW_MS + 2_000 });
    const countdown = simulateOpponentReady({ lobby: ready, nowMs: NOW_MS + 3_000 });
    const active = openRoundIfDue({ lobby: countdown, nowMs: NOW_MS + 6_000 });
    const payload = JSON.stringify([review, joined, countdown, active]).toLowerCase();

    for (const forbidden of [
      'target',
      'guess',
      'feedback',
      'candidate',
      'account',
      'provider',
      'email',
      'auth',
      'push',
      'convex',
      'd1',
      'session',
      'playerid',
      'gameid',
      'dictionary',
    ]) {
      expect(payload).not.toContain(forbidden);
    }
  });
});
