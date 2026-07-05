import { describe, expect, it } from 'vitest';

import type { DuelWordsAppsApiRuntimeConfig } from '../../config/apps-api';
import type { DuelWordsRealtimeRuntimeConfig } from '../../config/realtime';
import type {
  DuelWordsConvexRealtimeClient,
  DuelWordsConvexWatch,
} from '../word-duel-active/convex-realtime-client';
import type { WordDuelLobbyControllerState } from '../word-duel-lobby/controller';
import { deriveWordDuelLobbyViewModel, type WordDuelInvitePreview } from '../word-duel-lobby/view-model';
import {
  createWordDuelConnectedActiveRuntimeController,
  describeWordDuelConnectedRuntimeStatus,
} from './connected-runtime';
import { createDuelWordsRuntimeClients } from './runtime-clients';

const NOW_MS = Date.parse('2026-07-05T13:00:00.000Z');
const ENABLED_APPS_API_CONFIG: DuelWordsAppsApiRuntimeConfig = {
  apiBaseUrl: 'https://api.test',
  disabledReason: null,
  provider: 'apps_av_api',
};
const ENABLED_REALTIME_CONFIG: DuelWordsRealtimeRuntimeConfig = {
  convexUrl: 'https://duelwords-av.convex.cloud',
  disabledReason: null,
  provider: 'convex',
};

describe('Word Duel connected runtime route helpers', () => {
  it('reports a sanitized fail-closed runtime status by default', () => {
    const runtime = createDuelWordsRuntimeClients();
    const status = describeWordDuelConnectedRuntimeStatus(runtime);

    expect(status).toEqual({
      appsApiSource: 'disabled',
      ok: false,
      reason: 'apps_api_disabled',
      realtimeSource: 'disabled',
      source: 'runtime_disabled',
    });
    expect(JSON.stringify(status)).not.toContain('https://');
    expect(JSON.stringify(status).toLowerCase()).not.toContain('token');
  });

  it('recovers a backend-issued realtime session before subscribing to Convex', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        realtime: {
          realtimeSessionId: 'dwrs_recovered_session',
          roomToken: 'dwr_recovered_room',
          side: 'a',
        },
      }),
    ]);
    const convexClient = fakeConvexClient();
    const runtime = createDuelWordsRuntimeClients({
      appsApiRuntimeConfig: ENABLED_APPS_API_CONFIG,
      createConvexClient() {
        return convexClient;
      },
      fetchImpl: recorder.fetch,
      platform: 'ios',
      realtimeRuntimeConfig: ENABLED_REALTIME_CONFIG,
    });

    expect(runtime.ok).toBe(true);
    if (!runtime.ok) {
      throw new Error('Expected ready connected runtime.');
    }
    expect(convexClient.watches).toEqual([]);

    const bundle = await createWordDuelConnectedActiveRuntimeController({
      lobbyState: activeRuntimeLobbyState({ realtime: null }),
      realtimeNow: () => NOW_MS,
      runtime,
    });

    expect(bundle).toMatchObject({
      ok: true,
      realtimeSessionSource: 'recovered',
      source: 'apps_av_api',
    });
    expect(recorder.calls).toEqual([
      {
        body: {
          actor: {
            actorType: 'guest_session',
            guestSessionId: 'guest-a',
          },
          playerId: 'player-a',
        },
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-appsav-app-id': 'duelwordsav',
          'x-appsav-platform': 'ios',
        },
        method: 'POST',
        url: 'https://api.test/v1/apps/duelwords/games/game-1/realtime-sessions',
      },
    ]);
    expect(convexClient.watches).toEqual([]);

    const unsubscribe = bundle.controller.subscribeActiveRoomView(() => undefined);
    expect(convexClient.watches).toEqual([
      {
        args: {
          realtimeSessionId: 'dwrs_recovered_session',
          roomToken: 'dwr_recovered_room',
        },
        functionRef: 'duelwords:getActiveRoomView',
      },
    ]);
    unsubscribe();
  });

  it('does not recover realtime or subscribe when the composed runtime is disabled', async () => {
    const runtime = createDuelWordsRuntimeClients({
      fetchImpl: async () => {
        throw new Error('No fetch expected for disabled runtime.');
      },
    });

    const bundle = await createWordDuelConnectedActiveRuntimeController({
      lobbyState: activeRuntimeLobbyState({ realtime: null }),
      runtime,
    });

    expect(bundle).toMatchObject({
      ok: false,
      reason: 'api_runtime_disabled',
      realtimeSessionSource: 'missing',
      source: 'disabled_runtime',
    });
  });
});

type FetchCall = {
  body: unknown;
  headers: Record<string, string>;
  method: string;
  url: string;
};

type FakeConvexClient = DuelWordsConvexRealtimeClient & {
  watches: Array<{
    args: Record<string, unknown>;
    functionRef: unknown;
  }>;
};

function activeRuntimeLobbyState(input: {
  realtime?: WordDuelLobbyControllerState['realtime'];
} = {}): WordDuelLobbyControllerState {
  return {
    lobby: deriveWordDuelLobbyViewModel({
      activeRound: {
        roundNumber: 1,
        roundOpenedAtMs: NOW_MS,
      },
      adSlot: {
        reserved: true,
        visible: true,
      },
      countdown: null,
      invitePreview: invitePreview(),
      players: [
        {
          isViewer: true,
          role: 'host',
          safeDisplayName: 'Host',
          side: 'a',
          state: 'ready',
        },
        {
          isViewer: false,
          role: 'recipient',
          safeDisplayName: 'Rival',
          side: 'b',
          state: 'ready',
        },
      ],
      readyBySide: {
        a: true,
        b: true,
      },
      status: 'active_round',
      viewerRole: 'host',
      viewerSide: 'a',
    }, NOW_MS),
    realtime: input.realtime === undefined
      ? {
          realtimeSessionId: 'dwrs_lobby_session',
          roomToken: 'dwr_lobby_room',
          side: 'a',
        }
      : input.realtime,
    session: {
      actor: {
        actorType: 'guest_session',
        guestSessionId: 'guest-a',
      },
      apiInvite: null,
      gameId: 'game-1',
      inviteToken: 'invite-1',
      playerId: 'player-a',
      side: 'a',
    },
    source: 'apps_av_api',
  };
}

function invitePreview(): WordDuelInvitePreview {
  return {
    expiresAtMs: NOW_MS + 600_000,
    gameLanguage: 'en',
    gameName: 'Word Duel',
    inviteUrl: 'https://app.duelwords-av.avalsys.com/i/c/invite-1',
    joinAvailability: 'started',
    maxAttempts: 6,
    mode: 'human_duel',
    roomCode: 'ABCD-1234',
    roomState: 'active_round',
    solutionSelected: false,
    wordLength: 5,
  };
}

function createFetchRecorder(responses: Response[]) {
  const calls: FetchCall[] = [];
  let index = 0;
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({
      body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      method: init?.method ?? 'GET',
      url: String(input),
    });

    const response = responses[index];
    index += 1;
    if (!response) {
      throw new Error('Unexpected fetch call.');
    }

    return response;
  };

  return {
    calls,
    fetch: fetchImpl,
  };
}

function jsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
  });
}

function fakeConvexClient(): FakeConvexClient {
  const watches: FakeConvexClient['watches'] = [];

  return {
    watches,

    async mutation<T>() {
      return { ok: true } as T;
    },
    async query<T>() {
      return null as T;
    },
    watchQuery<T>(functionRef: unknown, args: Record<string, unknown>): DuelWordsConvexWatch<T> {
      watches.push({ args, functionRef });
      return {
        localQueryResult() {
          return null as T;
        },
        onUpdate() {
          return () => undefined;
        },
      };
    },
  };
}
