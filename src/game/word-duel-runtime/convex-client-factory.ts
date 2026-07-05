import { ConvexReactClient } from 'convex/react';
import { makeFunctionReference, type FunctionReference } from 'convex/server';

import {
  DUELWORDS_CONVEX_FUNCTIONS,
  type DuelWordsConvexRealtimeClient,
  type DuelWordsConvexWatch,
} from '../word-duel-active/convex-realtime-client';

export const DUELWORDS_CONVEX_SDK_FUNCTION_REFS = {
  getActiveRoomView: makeFunctionReference<'query'>(
    DUELWORDS_CONVEX_FUNCTIONS.getActiveRoomView,
  ),
  sendPresenceHeartbeat: makeFunctionReference<'mutation'>(
    DUELWORDS_CONVEX_FUNCTIONS.sendPresenceHeartbeat,
  ),
  sendReaction: makeFunctionReference<'mutation'>(
    DUELWORDS_CONVEX_FUNCTIONS.sendReaction,
  ),
} as const;

type DuelWordsConvexQueryFunctionRef = FunctionReference<'query'>;
type DuelWordsConvexMutationFunctionRef = FunctionReference<'mutation'>;

export type DuelWordsConvexReactClientLike = {
  close?: () => Promise<void> | void;
  mutation<T>(functionRef: DuelWordsConvexMutationFunctionRef, args: Record<string, unknown>): Promise<T>;
  query<T>(functionRef: DuelWordsConvexQueryFunctionRef, args: Record<string, unknown>): Promise<T>;
  watchQuery<T>(
    functionRef: DuelWordsConvexQueryFunctionRef,
    args: Record<string, unknown>,
  ): DuelWordsConvexWatch<T>;
};

export function createDuelWordsConvexReactClient(input: {
  convexUrl: string;
}): DuelWordsConvexRealtimeClient {
  const client = new ConvexReactClient(input.convexUrl);

  return createDuelWordsConvexRealtimeClientFromReactClient(
    client as unknown as DuelWordsConvexReactClientLike,
  );
}

export function createDuelWordsConvexRealtimeClientFromReactClient(
  client: DuelWordsConvexReactClientLike,
): DuelWordsConvexRealtimeClient {
  return {
    close() {
      return client.close?.();
    },

    async mutation<T>(functionRef: unknown, args: Record<string, unknown>) {
      return client.mutation<T>(approvedMutationRef(functionRef), args);
    },

    async query<T>(functionRef: unknown, args: Record<string, unknown>) {
      return client.query<T>(approvedQueryRef(functionRef), args);
    },

    watchQuery<T>(functionRef: unknown, args: Record<string, unknown>) {
      return client.watchQuery<T>(approvedQueryRef(functionRef), args);
    },
  };
}

function approvedQueryRef(functionRef: unknown): DuelWordsConvexQueryFunctionRef {
  if (
    functionRef === DUELWORDS_CONVEX_FUNCTIONS.getActiveRoomView
    || functionRef === DUELWORDS_CONVEX_SDK_FUNCTION_REFS.getActiveRoomView
  ) {
    return DUELWORDS_CONVEX_SDK_FUNCTION_REFS.getActiveRoomView;
  }

  throw new Error('duelwords_convex_query_not_allowed');
}

function approvedMutationRef(functionRef: unknown): DuelWordsConvexMutationFunctionRef {
  if (
    functionRef === DUELWORDS_CONVEX_FUNCTIONS.sendPresenceHeartbeat
    || functionRef === DUELWORDS_CONVEX_SDK_FUNCTION_REFS.sendPresenceHeartbeat
  ) {
    return DUELWORDS_CONVEX_SDK_FUNCTION_REFS.sendPresenceHeartbeat;
  }

  if (
    functionRef === DUELWORDS_CONVEX_FUNCTIONS.sendReaction
    || functionRef === DUELWORDS_CONVEX_SDK_FUNCTION_REFS.sendReaction
  ) {
    return DUELWORDS_CONVEX_SDK_FUNCTION_REFS.sendReaction;
  }

  throw new Error('duelwords_convex_mutation_not_allowed');
}
