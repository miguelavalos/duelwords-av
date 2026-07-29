import { describe, expect, it } from 'vitest';

import { createDemoActiveDuelViewModel, markActiveDuelTimedOut } from './view-model';
import {
  activeDuelReactionToRealtimeKey,
  applyRealtimeProjectionToActiveDuelViewModel,
  createLocalDuelWordsRealtimeProjectionClient,
  latestActiveDuelReactionFromRealtimeProjection,
} from './realtime-projection';

describe('active duel realtime projection adapter', () => {
  it('returns a Convex-shaped safe room projection without private payloads', async () => {
    const client = createLocalDuelWordsRealtimeProjectionClient({
      now: () => Date.parse('2026-07-05T09:00:00.000Z'),
      realtimeSessionId: 'session-1',
      roomToken: 'room-1',
    });

    const view = await client.getActiveRoomView({
      realtimeSessionId: 'session-1',
      roomToken: 'room-1',
    });

    expect(view?.room.status).toBe('active_round');
    expect(view?.opponent?.hasSubmittedCurrentRound).toBe(true);
    expect(view?.opponent?.presenceState).toBe('online');

    const serialized = JSON.stringify(view).toLowerCase();
    for (const forbidden of [
      'target',
      'normalized',
      'display_word',
      'opponentguess',
      'opponent_guess',
      'guestsessionid',
      'guest_session_id',
      'realtimesessionid',
      'realtime_session_id',
      'accountuserid',
      'account_user_id',
      'provider',
      'email',
      'auth',
      'token',
      'feedback_json',
      'candidate',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it('maps the projection into the active duel view model without replacing the own board', async () => {
    const client = createLocalDuelWordsRealtimeProjectionClient({
      now: () => Date.parse('2026-07-05T09:00:00.000Z'),
      remainingMs: 21_000,
    });
    const base = createDemoActiveDuelViewModel({
      gameLanguage: 'en',
      initialLetters: ['A', 'D'],
      scenario: 'editing',
    });
    const projection = await client.getActiveRoomView({
      realtimeSessionId: 'local-realtime-session',
      roomToken: 'local-active-room',
    });

    const mapped = applyRealtimeProjectionToActiveDuelViewModel(base, projection!);

    expect(mapped.remainingSeconds).toBe(21);
    expect(mapped.ownBoardRows[1]?.cells.map((cell) => cell.letter)).toEqual(['A', 'D', null, null, null]);
    expect(mapped.opponent.attemptMarkers).toEqual([
      'failed',
      'submitted',
      'waiting',
      'waiting',
      'waiting',
      'waiting',
    ]);
    expect(mapped.opponent.presence).toBe('connected');
    expect(mapped.ownRoundState).toBe('rival_submitted');
  });

  it('opens authoritative new rounds instead of carrying a timeout lock forward', async () => {
    const client = createLocalDuelWordsRealtimeProjectionClient({
      roundNumber: 3,
    });
    const timedOutRoundTwo = markActiveDuelTimedOut(createDemoActiveDuelViewModel({
      gameLanguage: 'en',
      scenario: 'editing',
    }));
    const projection = await client.getActiveRoomView({
      realtimeSessionId: 'local-realtime-session',
      roomToken: 'local-active-room',
    });

    const mapped = applyRealtimeProjectionToActiveDuelViewModel(timedOutRoundTwo, projection!);

    expect(mapped.roundNumber).toBe(3);
    expect(mapped.ownRoundState).toBe('rival_submitted');
    expect(mapped.ownBoardRows[1]?.state).toBe('timeout');
    expect(mapped.ownBoardRows[2]?.state).toBe('editing');
  });

  it('publishes a local accepted submit projection and switches to resolving when both sides submitted', async () => {
    const client = createLocalDuelWordsRealtimeProjectionClient();
    const received: string[] = [];
    client.subscribeActiveRoomView(
      {
        realtimeSessionId: 'local-realtime-session',
        roomToken: 'local-active-room',
      },
      (view) => {
        if (view) {
          received.push(view.room.status);
        }
      },
    );

    client.publishLocalPlayerSubmittedProjection({
      roomToken: 'local-active-room',
      roundNumber: 2,
      side: 'a',
    });
    const view = await client.getActiveRoomView({
      realtimeSessionId: 'local-realtime-session',
      roomToken: 'local-active-room',
    });

    expect(received).toEqual(['active_round', 'round_resolving']);
    expect(view?.own?.hasSubmittedCurrentRound).toBe(true);
    expect(view?.room.status).toBe('round_resolving');
  });

  it('sends closed-set reactions idempotently and exposes the latest active reaction', async () => {
    let currentTime = Date.parse('2026-07-05T09:00:00.000Z');
    const client = createLocalDuelWordsRealtimeProjectionClient({
      now: () => currentTime,
      realtimeSessionId: 'session-1',
      roomToken: 'room-1',
    });

    const first = await client.sendReaction({
      clientRequestId: 'reaction-1',
      reactionKey: activeDuelReactionToRealtimeKey('almost'),
      realtimeSessionId: 'session-1',
      roomToken: 'room-1',
    });
    const duplicate = await client.sendReaction({
      clientRequestId: 'reaction-1',
      reactionKey: activeDuelReactionToRealtimeKey('almost'),
      realtimeSessionId: 'session-1',
      roomToken: 'room-1',
    });
    const rateLimited = await client.sendReaction({
      clientRequestId: 'reaction-2',
      reactionKey: activeDuelReactionToRealtimeKey('tick_tock'),
      realtimeSessionId: 'session-1',
      roomToken: 'room-1',
    });

    expect(first).toEqual({ ok: true });
    expect(duplicate).toEqual({ ok: true, duplicate: true });
    expect(rateLimited).toEqual({ ok: false, reason: 'rate_limited' });

    currentTime += 8_001;
    await client.sendReaction({
      clientRequestId: 'reaction-3',
      reactionKey: activeDuelReactionToRealtimeKey('tick_tock'),
      realtimeSessionId: 'session-1',
      roomToken: 'room-1',
    });
    const view = await client.getActiveRoomView({
      realtimeSessionId: 'session-1',
      roomToken: 'room-1',
    });

    expect(latestActiveDuelReactionFromRealtimeProjection(view!)).toBe('tick_tock');
    expect(applyRealtimeProjectionToActiveDuelViewModel(
      createDemoActiveDuelViewModel({ gameLanguage: 'en' }),
      view!,
    ).activeReaction).toBe('tick_tock');
  });

  it('rejects invalid local realtime sessions without leaking session details', async () => {
    const client = createLocalDuelWordsRealtimeProjectionClient({
      realtimeSessionId: 'session-1',
      roomToken: 'room-1',
    });

    await expect(
      client.getActiveRoomView({
        realtimeSessionId: 'wrong-session',
        roomToken: 'room-1',
      }),
    ).resolves.toBeNull();
    await expect(
      client.sendPresenceHeartbeat({
        realtimeSessionId: 'wrong-session',
        roomToken: 'room-1',
      }),
    ).resolves.toEqual({ ok: false, reason: 'invalid_session' });
  });
});
