import { describe, expect, it } from 'vitest';

import {
  createDuelWordsConvexRealtimeProjectionClient,
  DUELWORDS_CONVEX_FUNCTIONS,
  type DuelWordsConvexRealtimeClient,
  type DuelWordsConvexWatch,
} from './convex-realtime-client';

const SESSION_REQUEST = {
  realtimeSessionId: 'dwrs_session_a',
  roomToken: 'dwr_room_1',
};

describe('DuelWords Convex realtime projection client', () => {
  it('queries the safe active room projection through the approved Convex function', async () => {
    const convexClient = createFakeConvexClient({
      queryPayload: safeRoomPayload(),
    });
    const client = createDuelWordsConvexRealtimeProjectionClient({ convexClient });

    const view = await client.getActiveRoomView(SESSION_REQUEST);

    expect(convexClient.queries).toEqual([
      {
        args: SESSION_REQUEST,
        functionRef: DUELWORDS_CONVEX_FUNCTIONS.getActiveRoomView,
      },
    ]);
    expect(view).toMatchObject({
      opponent: {
        hasSubmittedCurrentRound: true,
        presenceState: 'online',
        roundSummaries: [
          { exactCount: 1, roundNumber: 1, state: 'scored', validCount: 3 },
        ],
        safeDisplayName: 'Rival',
      },
      own: {
        feedbackAvailableRound: 1,
        safeDisplayName: 'Host',
      },
      room: {
        language: 'en',
        mode: 'human_duel',
        roundNumber: 1,
        status: 'active_round',
      },
    });
    expect(JSON.stringify(view).toLowerCase()).not.toContain('civic');
    expect(JSON.stringify(view).toLowerCase()).not.toContain('target');
    expect(JSON.stringify(view).toLowerCase()).not.toContain('guess');
  });

  it('subscribes with watchQuery and emits parsed safe updates', () => {
    const watch = createFakeWatch<unknown>(safeRoomPayload({
      room: {
        status: 'active_round',
      },
    }));
    const convexClient = createFakeConvexClient({ watch });
    const client = createDuelWordsConvexRealtimeProjectionClient({ convexClient });
    const received: (string | null)[] = [];

    const unsubscribe = client.subscribeActiveRoomView(SESSION_REQUEST, (view) => {
      received.push(view?.room.status ?? null);
    });
    watch.emit(safeRoomPayload({
      opponent: {
        hasSubmittedCurrentRound: true,
        status: 'submitted',
      },
      room: {
        roundNumber: 1,
        status: 'round_resolving',
      },
    }));
    unsubscribe();
    watch.emit(safeRoomPayload({
      room: {
        status: 'finalized',
      },
    }));

    expect(convexClient.watches).toEqual([
      {
        args: SESSION_REQUEST,
        functionRef: DUELWORDS_CONVEX_FUNCTIONS.getActiveRoomView,
      },
    ]);
    expect(received).toEqual(['active_round', 'round_resolving']);
  });

  it('accepts the safe pre-round lobby projection with round zero', async () => {
    const convexClient = createFakeConvexClient({
      queryPayload: safeRoomPayload({
        room: {
          roundNumber: 0,
          status: 'lobby',
        },
      }),
    });
    const client = createDuelWordsConvexRealtimeProjectionClient({ convexClient });

    const view = await client.getActiveRoomView(SESSION_REQUEST);

    expect(view?.room).toMatchObject({ roundNumber: 0, status: 'lobby' });
  });

  it('rejects rival round summaries outside the room contract', async () => {
    const convexClient = createFakeConvexClient({
      queryPayload: safeRoomPayload({
        opponent: {
          roundSummaries: [
            { exactCount: 1, roundNumber: 1, state: 'scored', validCount: 6 },
          ],
        },
      }),
    });
    const client = createDuelWordsConvexRealtimeProjectionClient({ convexClient });

    await expect(client.getActiveRoomView(SESSION_REQUEST)).resolves.toBeNull();
  });

  it('sends heartbeat and reactions through public Convex mutations only', async () => {
    const convexClient = createFakeConvexClient({
      mutationPayloads: [
        { ok: true },
        { duplicate: true, ok: true },
        { ok: false, reason: 'rate_limited' },
        { ok: false, reason: 'player_unavailable' },
      ],
    });
    const client = createDuelWordsConvexRealtimeProjectionClient({ convexClient });

    await expect(client.sendPresenceHeartbeat(SESSION_REQUEST)).resolves.toEqual({ ok: true });
    await expect(client.sendReaction({
      ...SESSION_REQUEST,
      clientRequestId: 'reaction-1',
      reactionKey: 'tick_tock',
    })).resolves.toEqual({ duplicate: true, ok: true });
    await expect(client.sendReaction({
      ...SESSION_REQUEST,
      clientRequestId: 'reaction-2',
      reactionKey: 'your_turn',
    })).resolves.toEqual({ ok: false, reason: 'rate_limited' });
    await expect(client.sendPresenceHeartbeat(SESSION_REQUEST)).resolves.toEqual({
      ok: false,
      reason: 'room_unavailable',
    });

    expect(convexClient.mutations).toEqual([
      {
        args: SESSION_REQUEST,
        functionRef: DUELWORDS_CONVEX_FUNCTIONS.sendPresenceHeartbeat,
      },
      {
        args: {
          ...SESSION_REQUEST,
          clientRequestId: 'reaction-1',
          reactionKey: 'tick_tock',
        },
        functionRef: DUELWORDS_CONVEX_FUNCTIONS.sendReaction,
      },
      {
        args: {
          ...SESSION_REQUEST,
          clientRequestId: 'reaction-2',
          reactionKey: 'your_turn',
        },
        functionRef: DUELWORDS_CONVEX_FUNCTIONS.sendReaction,
      },
      {
        args: SESSION_REQUEST,
        functionRef: DUELWORDS_CONVEX_FUNCTIONS.sendPresenceHeartbeat,
      },
    ]);
  });

  it('fails closed when a Convex payload includes gameplay, dictionary, or identity fields', async () => {
    const clientWithTarget = createDuelWordsConvexRealtimeProjectionClient({
      convexClient: createFakeConvexClient({
        queryPayload: {
          ...safeRoomPayload(),
          targetWord: 'civic',
        },
      }),
    });
    const clientWithOpponentFeedback = createDuelWordsConvexRealtimeProjectionClient({
      convexClient: createFakeConvexClient({
        queryPayload: safeRoomPayload({
          opponent: {
            feedback: ['correct', 'absent'],
          },
        }),
      }),
    });
    const clientWithAccount = createDuelWordsConvexRealtimeProjectionClient({
      convexClient: createFakeConvexClient({
        queryPayload: safeRoomPayload({
          own: {
            accountUserId: 'user-secret',
          },
        }),
      }),
    });

    await expect(clientWithTarget.getActiveRoomView(SESSION_REQUEST)).resolves.toBeNull();
    await expect(clientWithOpponentFeedback.getActiveRoomView(SESSION_REQUEST)).resolves.toBeNull();
    await expect(clientWithAccount.getActiveRoomView(SESSION_REQUEST)).resolves.toBeNull();
  });
});

type FakeConvexCall = {
  args: Record<string, unknown>;
  functionRef: unknown;
};

type FakeConvexClient = DuelWordsConvexRealtimeClient & {
  mutations: FakeConvexCall[];
  queries: FakeConvexCall[];
  watches: FakeConvexCall[];
};

function createFakeConvexClient(input: {
  mutationPayloads?: unknown[];
  queryPayload?: unknown;
  watch?: FakeWatch<unknown>;
} = {}): FakeConvexClient {
  const mutations: FakeConvexCall[] = [];
  const queries: FakeConvexCall[] = [];
  const watches: FakeConvexCall[] = [];
  let mutationIndex = 0;

  return {
    mutations,
    queries,
    watches,

    async mutation<T>(functionRef: unknown, args: Record<string, unknown>) {
      mutations.push({ args, functionRef });
      const payload = input.mutationPayloads?.[mutationIndex] ?? { ok: true };
      mutationIndex += 1;
      return payload as T;
    },

    async query<T>(functionRef: unknown, args: Record<string, unknown>) {
      queries.push({ args, functionRef });
      return input.queryPayload as T;
    },

    watchQuery<T>(functionRef: unknown, args: Record<string, unknown>) {
      watches.push({ args, functionRef });
      return (input.watch ?? createFakeWatch<unknown>(input.queryPayload)) as DuelWordsConvexWatch<T>;
    },
  };
}

function createFakeWatch<T>(initial: T): FakeWatch<T> {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    emit(nextValue: T) {
      value = nextValue;
      listeners.forEach((listener) => listener());
    },

    localQueryResult() {
      return value;
    },

    onUpdate(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

type FakeWatch<T> = DuelWordsConvexWatch<T> & {
  emit(nextValue: T): void;
};

function safeRoomPayload(overrides: {
  opponent?: Record<string, unknown>;
  own?: Record<string, unknown>;
  reactions?: unknown[];
  room?: Record<string, unknown>;
} = {}): Record<string, unknown> {
  return {
    opponent: {
      attemptCount: 1,
      hasSubmittedCurrentRound: true,
      isReady: true,
      presenceState: 'online',
      roundSummaries: [
        { exactCount: 1, roundNumber: 1, state: 'scored', validCount: 3 },
      ],
      safeDisplayName: 'Rival',
      side: 'b',
      status: 'submitted',
      timeoutCount: 0,
      ...overrides.opponent,
    },
    own: {
      attemptCount: 1,
      feedbackAvailableRound: 1,
      hasSubmittedCurrentRound: false,
      isReady: true,
      safeDisplayName: 'Host',
      side: 'a',
      status: 'joined',
      timeoutCount: 0,
      ...overrides.own,
    },
    reactions: overrides.reactions ?? [
      {
        expiresAt: Date.parse('2026-07-05T11:00:04.000Z'),
        reactionKey: 'tick_tock',
        side: 'b',
      },
    ],
    room: {
      language: 'en',
      maxAttempts: 6,
      mode: 'human_duel',
      roundDeadlineAt: Date.parse('2026-07-05T11:00:37.000Z'),
      roundNumber: 1,
      serverNow: Date.parse('2026-07-05T11:00:00.000Z'),
      status: 'active_round',
      wordLength: 5,
      ...overrides.room,
    },
  };
}
