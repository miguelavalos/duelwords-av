import { getFunctionName } from 'convex/server';
import { describe, expect, it } from 'vitest';

import {
  DUELWORDS_CONVEX_FUNCTIONS,
  type DuelWordsConvexWatch,
} from '../word-duel-active/convex-realtime-client';
import {
  createDuelWordsConvexRealtimeClientFromReactClient,
  DUELWORDS_CONVEX_SDK_FUNCTION_REFS,
  type DuelWordsConvexReactClientLike,
} from './convex-client-factory';

describe('DuelWords Convex React client bridge', () => {
  it('defines exactly the approved public Convex function references', () => {
    expect(Object.values(DUELWORDS_CONVEX_FUNCTIONS)).toEqual([
      'duelwords:getActiveRoomView',
      'duelwords:sendPresenceHeartbeat',
      'duelwords:sendReaction',
      'duelwords:setReactionPreference',
    ]);
    expect(getFunctionName(DUELWORDS_CONVEX_SDK_FUNCTION_REFS.getActiveRoomView)).toBe(
      'duelwords:getActiveRoomView',
    );
    expect(getFunctionName(DUELWORDS_CONVEX_SDK_FUNCTION_REFS.sendPresenceHeartbeat)).toBe(
      'duelwords:sendPresenceHeartbeat',
    );
    expect(getFunctionName(DUELWORDS_CONVEX_SDK_FUNCTION_REFS.sendReaction)).toBe(
      'duelwords:sendReaction',
    );
    expect(getFunctionName(DUELWORDS_CONVEX_SDK_FUNCTION_REFS.setReactionPreference)).toBe(
      'duelwords:setReactionPreference',
    );
  });

  it('maps approved string refs to SDK function refs for query, watch, and mutations', async () => {
    const reactClient = createFakeReactClient({
      queryPayload: { room: null },
      watch: createFakeWatch({ room: null }),
    });
    const client = createDuelWordsConvexRealtimeClientFromReactClient(reactClient);
    const sessionArgs = {
      realtimeSessionId: 'dwrs_session_1',
      roomToken: 'dwr_room_1',
    };

    await expect(
      client.query(DUELWORDS_CONVEX_FUNCTIONS.getActiveRoomView, sessionArgs),
    ).resolves.toEqual({ room: null });
    client.watchQuery(DUELWORDS_CONVEX_FUNCTIONS.getActiveRoomView, sessionArgs);
    await client.mutation(DUELWORDS_CONVEX_FUNCTIONS.sendPresenceHeartbeat, sessionArgs);
    await client.mutation(DUELWORDS_CONVEX_FUNCTIONS.sendReaction, {
      ...sessionArgs,
      clientRequestId: 'reaction-1',
      reactionKey: 'tick_tock',
    });
    await client.mutation(DUELWORDS_CONVEX_FUNCTIONS.setReactionPreference, {
      ...sessionArgs,
      acceptsReactions: false,
    });

    expect(reactClient.queries).toEqual([
      {
        args: sessionArgs,
        functionRef: DUELWORDS_CONVEX_SDK_FUNCTION_REFS.getActiveRoomView,
      },
    ]);
    expect(reactClient.watches).toEqual([
      {
        args: sessionArgs,
        functionRef: DUELWORDS_CONVEX_SDK_FUNCTION_REFS.getActiveRoomView,
      },
    ]);
    expect(reactClient.mutations).toEqual([
      {
        args: sessionArgs,
        functionRef: DUELWORDS_CONVEX_SDK_FUNCTION_REFS.sendPresenceHeartbeat,
      },
      {
        args: {
          ...sessionArgs,
          clientRequestId: 'reaction-1',
          reactionKey: 'tick_tock',
        },
        functionRef: DUELWORDS_CONVEX_SDK_FUNCTION_REFS.sendReaction,
      },
      {
        args: {
          ...sessionArgs,
          acceptsReactions: false,
        },
        functionRef: DUELWORDS_CONVEX_SDK_FUNCTION_REFS.setReactionPreference,
      },
    ]);
  });

  it('rejects unapproved Convex functions before calling the SDK client', async () => {
    const reactClient = createFakeReactClient();
    const client = createDuelWordsConvexRealtimeClientFromReactClient(reactClient);

    await expect(client.query('duelwords:getTargetWord', {})).rejects.toThrow(
      'duelwords_convex_query_not_allowed',
    );
    await expect(client.mutation('duelwords:submitGuess', {})).rejects.toThrow(
      'duelwords_convex_mutation_not_allowed',
    );
    expect(reactClient.queries).toEqual([]);
    expect(reactClient.mutations).toEqual([]);
    expect(reactClient.watches).toEqual([]);
  });

  it('forwards close to the underlying ConvexReactClient lifecycle', async () => {
    let closeCalls = 0;
    const reactClient = createFakeReactClient({
      close() {
        closeCalls += 1;
      },
    });
    const client = createDuelWordsConvexRealtimeClientFromReactClient(reactClient);

    await client.close?.();

    expect(closeCalls).toBe(1);
  });
});

type FakeSdkCall = {
  args: Record<string, unknown>;
  functionRef: unknown;
};

type FakeReactClient = DuelWordsConvexReactClientLike & {
  mutations: FakeSdkCall[];
  queries: FakeSdkCall[];
  watches: FakeSdkCall[];
};

function createFakeReactClient(input: {
  close?: () => Promise<void> | void;
  mutationPayload?: unknown;
  queryPayload?: unknown;
  watch?: DuelWordsConvexWatch<unknown>;
} = {}): FakeReactClient {
  const mutations: FakeSdkCall[] = [];
  const queries: FakeSdkCall[] = [];
  const watches: FakeSdkCall[] = [];

  return {
    close: input.close,
    mutations,
    queries,
    watches,

    async mutation<T>(functionRef: unknown, args: Record<string, unknown>) {
      mutations.push({ args, functionRef });
      return (input.mutationPayload ?? { ok: true }) as T;
    },

    async query<T>(functionRef: unknown, args: Record<string, unknown>) {
      queries.push({ args, functionRef });
      return input.queryPayload as T;
    },

    watchQuery<T>(functionRef: unknown, args: Record<string, unknown>) {
      watches.push({ args, functionRef });
      return (input.watch ?? createFakeWatch(null)) as DuelWordsConvexWatch<T>;
    },
  };
}

function createFakeWatch<T>(initial: T): DuelWordsConvexWatch<T> {
  return {
    localQueryResult() {
      return initial;
    },
    onUpdate() {
      return () => undefined;
    },
  };
}
