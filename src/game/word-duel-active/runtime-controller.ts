import type { DuelWordsRealtimeRuntimeConfig } from '../../config/realtime';
import type { WordDuelLobbyControllerState } from '../word-duel-lobby/controller';
import {
  createDuelWordsRuntimeApiClient,
  type DuelWordsRuntimeApiClientBundle,
} from '../word-duel-lobby/runtime-api-client';
import {
  createWordDuelActiveController,
  type WordDuelActiveController,
  type WordDuelActiveRuntimeSession,
} from './controller';
import {
  createWordDuelActiveDemoHandoff,
  createWordDuelActiveHandoffFromLobby,
  type WordDuelActiveHandoff,
  type WordDuelActiveHandoffErrorCode,
} from './handoff';
import { createDuelWordsRealtimeProjectionClient } from './realtime-client';
import type { DuelWordsConvexRealtimeClient } from './convex-realtime-client';
import type { DuelWordsRealtimeProjectionClient } from './realtime-projection';
import { toDuelWordsRuntimeRealtimeClientInput } from './realtime-session';
import { createRuntimeActiveDuelViewModel } from './view-model';

const DEFAULT_DISABLED_REALTIME_CONFIG: DuelWordsRealtimeRuntimeConfig = {
  convexUrl: null,
  disabledReason: 'disabled_by_config',
  provider: 'disabled',
};

export type WordDuelActiveRuntimeControllerDisabledReason =
  | 'api_runtime_disabled'
  | 'convex_runtime_pending'
  | 'lobby_not_active'
  | 'missing_player_session'
  | 'missing_realtime_session'
  | 'non_runtime_lobby_state'
  | 'realtime_runtime_disabled'
  | 'unsupported_lobby_settings';

export type WordDuelActiveRuntimeControllerBundle =
  | {
      controller: WordDuelActiveController;
      ok: true;
      reason: null;
      source: 'apps_av_api';
    }
  | {
      controller: WordDuelActiveController;
      ok: false;
      reason: WordDuelActiveRuntimeControllerDisabledReason;
      source: 'disabled_runtime';
    };

export type WordDuelActiveRuntimeControllerInput = {
  convexClient?: DuelWordsConvexRealtimeClient;
  convexRealtimeClient?: DuelWordsRealtimeProjectionClient;
  lobbyState: WordDuelLobbyControllerState;
  now?: () => Date;
  realtimeNow?: () => number;
  realtimeRuntimeConfig?: DuelWordsRealtimeRuntimeConfig;
  runtimeApiClient?: DuelWordsRuntimeApiClientBundle;
};

export function createWordDuelActiveRuntimeController(
  input: WordDuelActiveRuntimeControllerInput,
): WordDuelActiveRuntimeControllerBundle {
  const handoff = handoffFromLobbyOrDisabled(input.lobbyState);
  if (!handoff.ok) {
    return disabledBundle({
      handoff: handoff.fallback,
      now: input.now,
      realtimeNow: input.realtimeNow,
      reason: handoff.reason,
    });
  }

  if (input.lobbyState.source !== 'apps_av_api') {
    return disabledBundle({
      handoff: handoff.value,
      now: input.now,
      realtimeNow: input.realtimeNow,
      reason: 'non_runtime_lobby_state',
    });
  }

  const runtimeApiClient = input.runtimeApiClient ?? createDuelWordsRuntimeApiClient();
  if (!runtimeApiClient.ok) {
    return disabledBundle({
      handoff: handoff.value,
      now: input.now,
      realtimeNow: input.realtimeNow,
      reason: 'api_runtime_disabled',
    });
  }

  const session = activeRuntimeSessionFromLobby(input.lobbyState);
  if (!session.ok) {
    return disabledBundle({
      handoff: handoff.value,
      now: input.now,
      realtimeNow: input.realtimeNow,
      reason: session.reason,
    });
  }

  const realtimeConfig = input.realtimeRuntimeConfig ?? DEFAULT_DISABLED_REALTIME_CONFIG;
  const realtimeBundle = createDuelWordsRealtimeProjectionClient(
    {
      ...toDuelWordsRuntimeRealtimeClientInput({
        runtimeConfig: realtimeConfig,
        session: session.value.realtime,
      }),
      convexClient: input.convexClient,
    },
  );

  if (realtimeBundle.source === 'disabled') {
    return disabledBundle({
      handoff: handoff.value,
      now: input.now,
      realtimeNow: input.realtimeNow,
      reason: 'realtime_runtime_disabled',
    });
  }

  if (!input.convexRealtimeClient && realtimeBundle.source === 'convex_runtime_pending') {
    return disabledBundle({
      handoff: handoff.value,
      now: input.now,
      realtimeNow: input.realtimeNow,
      reason: 'convex_runtime_pending',
    });
  }

  const realtimeClient = input.convexRealtimeClient ?? realtimeBundle.client;

  return {
    controller: createWordDuelActiveController({
      handoff: handoff.value,
      mode: 'runtime',
      realtimeNow: input.realtimeNow,
      runtime: {
        apiClient: runtimeApiClient.client,
        initialViewModel: createRuntimeActiveDuelViewModel({
          gameLanguage: handoff.value.gameLanguage,
          includeAdSlot: true,
          ownSide: session.value.realtime.side,
          roundNumber: input.lobbyState.lobby.activeRound?.roundNumber ?? 1,
        }),
        realtimeClient,
        session: session.value,
      },
    }),
    ok: true,
    reason: null,
    source: 'apps_av_api',
  };
}

function handoffFromLobbyOrDisabled(lobbyState: WordDuelLobbyControllerState):
  | {
      ok: true;
      value: WordDuelActiveHandoff;
    }
  | {
      fallback: WordDuelActiveHandoff;
      ok: false;
      reason: WordDuelActiveHandoffErrorCode;
    } {
  try {
    return {
      ok: true,
      value: createWordDuelActiveHandoffFromLobby(lobbyState.lobby),
    };
  } catch (error) {
    return {
      fallback: createWordDuelActiveDemoHandoff({
        gameLanguage: lobbyState.lobby.invitePreview.gameLanguage,
      }),
      ok: false,
      reason: handoffErrorReason(error),
    };
  }
}

function activeRuntimeSessionFromLobby(lobbyState: WordDuelLobbyControllerState):
  | {
      ok: true;
      value: WordDuelActiveRuntimeSession;
    }
  | {
      ok: false;
      reason: 'missing_player_session' | 'missing_realtime_session';
    } {
  const { actor, gameId, playerId } = lobbyState.session;
  if (actor === null || gameId === null || playerId === null) {
    return { ok: false, reason: 'missing_player_session' };
  }
  if (lobbyState.realtime === null) {
    return { ok: false, reason: 'missing_realtime_session' };
  }

  return {
    ok: true,
    value: {
      actor,
      gameId,
      playerId,
      realtime: lobbyState.realtime,
    },
  };
}

function disabledBundle(input: {
  handoff: WordDuelActiveHandoff;
  now?: () => Date;
  reason: WordDuelActiveRuntimeControllerDisabledReason;
  realtimeNow?: () => number;
}): WordDuelActiveRuntimeControllerBundle {
  return {
    controller: createWordDuelActiveController({
      handoff: input.handoff,
      mode: 'runtime',
      now: input.now,
      realtimeNow: input.realtimeNow,
    }),
    ok: false,
    reason: input.reason,
    source: 'disabled_runtime',
  };
}

function handoffErrorReason(error: unknown): WordDuelActiveHandoffErrorCode {
  if (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code: unknown }).code === 'unsupported_lobby_settings'
  ) {
    return 'unsupported_lobby_settings';
  }

  return 'lobby_not_active';
}
