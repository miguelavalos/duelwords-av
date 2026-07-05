import type { DuelWordsRealtimeRuntimeConfig } from '../../config/realtime';

import {
  createDuelWordsConvexRealtimeProjectionClient,
  type DuelWordsConvexRealtimeClient,
} from './convex-realtime-client';
import {
  createLocalDuelWordsRealtimeProjectionClient,
  type DuelWordsRealtimeProjectionClient,
} from './realtime-projection';
import type { GameLanguage } from '../word-duel-engine';

const DEFAULT_DISABLED_RUNTIME_CONFIG: DuelWordsRealtimeRuntimeConfig = {
  convexUrl: null,
  disabledReason: 'disabled_by_config',
  provider: 'disabled',
};

export type DuelWordsRealtimeClientMode = 'local_mock' | 'runtime';

export type DuelWordsRealtimeProjectionClientBundle = {
  client: DuelWordsRealtimeProjectionClient;
  runtimeConfig: DuelWordsRealtimeRuntimeConfig;
  source: 'convex_runtime' | 'convex_runtime_pending' | 'disabled' | 'local_mock';
};

type DuelWordsRealtimeProjectionClientInput = {
  convexClient?: DuelWordsConvexRealtimeClient;
  gameLanguage?: GameLanguage;
  maxAttempts?: number;
  mode: DuelWordsRealtimeClientMode;
  now?: () => number;
  ownSide?: 'a' | 'b';
  realtimeSessionId?: string;
  remainingMs?: number;
  roomToken?: string;
  roundNumber?: number;
  runtimeConfig?: DuelWordsRealtimeRuntimeConfig;
  wordLength?: number;
};

export function createDuelWordsRealtimeProjectionClient(
  input: DuelWordsRealtimeProjectionClientInput,
): DuelWordsRealtimeProjectionClientBundle {
  if (input.mode === 'local_mock') {
    return {
      client: createLocalDuelWordsRealtimeProjectionClient(input),
      runtimeConfig: DEFAULT_DISABLED_RUNTIME_CONFIG,
      source: 'local_mock',
    };
  }

  const runtimeConfig = input.runtimeConfig ?? DEFAULT_DISABLED_RUNTIME_CONFIG;
  if (runtimeConfig.provider === 'disabled') {
    return {
      client: createDisabledDuelWordsRealtimeProjectionClient(),
      runtimeConfig,
      source: 'disabled',
    };
  }

  if (input.convexClient) {
    return {
      client: createDuelWordsConvexRealtimeProjectionClient({
        convexClient: input.convexClient,
      }),
      runtimeConfig,
      source: 'convex_runtime',
    };
  }

  return {
    client: createDisabledDuelWordsRealtimeProjectionClient(),
    runtimeConfig,
    source: 'convex_runtime_pending',
  };
}

export function createDisabledDuelWordsRealtimeProjectionClient(): DuelWordsRealtimeProjectionClient {
  return {
    async getActiveRoomView() {
      return null;
    },
    publishLocalPlayerSubmittedProjection() {
      return undefined;
    },
    async sendPresenceHeartbeat() {
      return { ok: false, reason: 'room_unavailable' };
    },
    async sendReaction() {
      return { ok: false, reason: 'room_unavailable' };
    },
    subscribeActiveRoomView(_input, listener) {
      listener(null);
      return () => undefined;
    },
  };
}
