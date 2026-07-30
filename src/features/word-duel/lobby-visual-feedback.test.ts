import { describe, expect, test } from 'vitest';

import {
  createLocalInviteLobbyViewModel,
  joinInvite,
  openRoundIfDue,
  pressReady,
  simulateOpponentReady,
  viewInviteReview,
  viewLobbyAsHost,
} from '../../game/word-duel-lobby/view-model';

import {
  createLobbyVisualSnapshot,
  lobbyVisualFeedbackDurationMs,
  lobbyVisualFeedbackFromViewModel,
} from './lobby-visual-feedback';

const NOW_MS = Date.parse('2026-07-30T15:30:00.000Z');

describe('lobby visual feedback', () => {
  test('keeps every state interruption visible long enough to notice', () => {
    expect(lobbyVisualFeedbackDurationMs({
      id: 'joined',
      kind: 'rival_joined',
      rivalName: 'Rival',
    })).toBeGreaterThanOrEqual(3_600);
    expect(lobbyVisualFeedbackDurationMs({
      id: 'ready',
      kind: 'rival_ready',
      rivalName: 'Rival',
    })).toBeGreaterThanOrEqual(3_600);
    expect(lobbyVisualFeedbackDurationMs({
      id: 'countdown',
      kind: 'countdown_started',
      seconds: 3,
    })).toBeGreaterThanOrEqual(3_200);
    expect(lobbyVisualFeedbackDurationMs({
      id: 'started',
      kind: 'duel_started',
      roundNumber: 1,
    })).toBeGreaterThanOrEqual(2_200);
  });

  test('keeps the initial projection quiet', () => {
    expect(lobbyVisualFeedbackFromViewModel(null, hostWaiting()).feedback).toBeNull();
  });

  test('announces when the rival joins without exposing private state', () => {
    const previous = createLobbyVisualSnapshot(hostWaiting());
    const joined = hostJoined();
    const result = lobbyVisualFeedbackFromViewModel(previous, joined);

    expect(result.feedback).toEqual({
      id: 'rival-joined:b:Rival',
      kind: 'rival_joined',
      rivalName: 'Rival',
    });
    expect(JSON.stringify(result.feedback).toLowerCase()).not.toMatch(
      /target|guess|feedback|token|session|email|subject/,
    );
    expect(lobbyVisualFeedbackFromViewModel(result.snapshot, joined).feedback).toBeNull();
  });

  test('announces a remote Ready change when countdown has not started', () => {
    const joined = hostJoined();
    const rivalReady = simulateOpponentReady({ lobby: joined, nowMs: NOW_MS + 3_000 });

    expect(lobbyVisualFeedbackFromViewModel(
      createLobbyVisualSnapshot(joined),
      rivalReady,
    ).feedback).toEqual({
      id: 'rival-ready:b',
      kind: 'rival_ready',
      rivalName: 'Rival',
    });
  });

  test('prioritizes the authoritative countdown over the simultaneous Ready change', () => {
    const joined = hostJoined();
    const ownReady = pressReady({ lobby: joined, nowMs: NOW_MS + 3_000 });
    const countdown = simulateOpponentReady({ lobby: ownReady, nowMs: NOW_MS + 4_000 });

    expect(lobbyVisualFeedbackFromViewModel(
      createLobbyVisualSnapshot(ownReady),
      countdown,
    ).feedback).toEqual({
      id: `countdown:${countdown.countdown?.endsAtMs}`,
      kind: 'countdown_started',
      seconds: 3,
    });
  });

  test('announces the first active round once', () => {
    const joined = hostJoined();
    const ownReady = pressReady({ lobby: joined, nowMs: NOW_MS + 3_000 });
    const countdown = simulateOpponentReady({ lobby: ownReady, nowMs: NOW_MS + 4_000 });
    const active = openRoundIfDue({ lobby: countdown, nowMs: NOW_MS + 7_000 });
    const result = lobbyVisualFeedbackFromViewModel(
      createLobbyVisualSnapshot(countdown),
      active,
    );

    expect(result.feedback).toEqual({
      id: 'duel-started:1',
      kind: 'duel_started',
      roundNumber: 1,
    });
    expect(lobbyVisualFeedbackFromViewModel(result.snapshot, active).feedback).toBeNull();
  });
});

function hostWaiting() {
  return createLocalInviteLobbyViewModel({ gameLanguage: 'en', nowMs: NOW_MS });
}

function hostJoined() {
  const review = viewInviteReview(hostWaiting(), NOW_MS + 1_000);
  const recipient = joinInvite({ lobby: review, nowMs: NOW_MS + 2_000, safeDisplayName: 'Rival' });
  return viewLobbyAsHost(recipient, NOW_MS + 2_000);
}
