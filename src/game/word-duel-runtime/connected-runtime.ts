import {
  createWordDuelActiveRuntimeController,
  type WordDuelActiveRuntimeControllerBundle,
} from '../word-duel-active/runtime-controller';
import type { WordDuelLobbyControllerState } from '../word-duel-lobby/controller';
import type { DuelWordsRuntimeClientsBundle } from './runtime-clients';

export type WordDuelConnectedRuntimeStatus = {
  appsApiSource: 'apps_av_api' | 'disabled';
  ok: boolean;
  reason: DuelWordsRuntimeClientsBundle['reason'];
  realtimeSource: DuelWordsRuntimeClientsBundle['realtime']['source'];
  source: DuelWordsRuntimeClientsBundle['source'];
};

export type WordDuelConnectedActiveRealtimeSessionSource =
  | 'lobby_payload'
  | 'missing'
  | 'recovered';

export type WordDuelConnectedActiveRuntimeControllerBundle =
  WordDuelActiveRuntimeControllerBundle & {
    lobbyState: WordDuelLobbyControllerState;
    realtimeSessionSource: WordDuelConnectedActiveRealtimeSessionSource;
  };

export function describeWordDuelConnectedRuntimeStatus(
  runtime: DuelWordsRuntimeClientsBundle,
): WordDuelConnectedRuntimeStatus {
  return {
    appsApiSource: runtime.appsApi.source,
    ok: runtime.ok,
    reason: runtime.reason,
    realtimeSource: runtime.realtime.source,
    source: runtime.source,
  };
}

export async function createWordDuelConnectedActiveRuntimeController(input: {
  lobbyState: WordDuelLobbyControllerState;
  now?: () => Date;
  realtimeNow?: () => number;
  runtime: DuelWordsRuntimeClientsBundle;
}): Promise<WordDuelConnectedActiveRuntimeControllerBundle> {
  const recovered = await recoverWordDuelConnectedRealtimeSessionIfNeeded({
    lobbyState: input.lobbyState,
    runtime: input.runtime,
  });
  const activeBundle = createWordDuelActiveRuntimeController({
    convexRealtimeClient: input.runtime.ok ? input.runtime.realtime.client : undefined,
    lobbyState: recovered.lobbyState,
    now: input.now,
    realtimeNow: input.realtimeNow,
    realtimeRuntimeConfig: input.runtime.realtime.runtimeConfig,
    runtimeApiClient: input.runtime.appsApi,
  });

  return {
    ...activeBundle,
    lobbyState: recovered.lobbyState,
    realtimeSessionSource: recovered.realtimeSessionSource,
  };
}

export async function recoverWordDuelConnectedRealtimeSessionIfNeeded(input: {
  lobbyState: WordDuelLobbyControllerState;
  runtime: DuelWordsRuntimeClientsBundle;
}): Promise<{
  lobbyState: WordDuelLobbyControllerState;
  realtimeSessionSource: WordDuelConnectedActiveRealtimeSessionSource;
}> {
  if (input.lobbyState.realtime !== null) {
    return {
      lobbyState: input.lobbyState,
      realtimeSessionSource: 'lobby_payload',
    };
  }

  if (!input.runtime.ok) {
    return {
      lobbyState: input.lobbyState,
      realtimeSessionSource: 'missing',
    };
  }

  const { actor, gameId, playerId } = input.lobbyState.session;
  if (actor === null || gameId === null || playerId === null) {
    return {
      lobbyState: input.lobbyState,
      realtimeSessionSource: 'missing',
    };
  }

  let realtimeResult: Awaited<ReturnType<
    typeof input.runtime.appsApi.client.createRealtimeSession
  >>;
  try {
    realtimeResult = await input.runtime.appsApi.client.createRealtimeSession({
      actor,
      gameId,
      playerId,
    });
  } catch {
    return {
      lobbyState: input.lobbyState,
      realtimeSessionSource: 'missing',
    };
  }

  if (!realtimeResult.ok) {
    return {
      lobbyState: input.lobbyState,
      realtimeSessionSource: 'missing',
    };
  }

  return {
    lobbyState: {
      ...input.lobbyState,
      realtime: realtimeResult.realtime,
    },
    realtimeSessionSource: 'recovered',
  };
}
