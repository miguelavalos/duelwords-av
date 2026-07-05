import { describe, expect, it } from 'vitest';

import { deriveWordDuelLobbyViewModel, type WordDuelInvitePreview } from '../word-duel-lobby/view-model';
import { createDuelWordsRuntimeApiClient } from '../word-duel-lobby/runtime-api-client';
import type { WordDuelLobbyControllerState } from '../word-duel-lobby/controller';
import type { DuelWordsConvexRealtimeClient } from './convex-realtime-client';
import { createWordDuelActiveRuntimeController } from './runtime-controller';

const NOW_MS = Date.parse('2026-07-05T11:00:00.000Z');
const ENABLED_API_CONFIG = {
  apiBaseUrl: 'https://api.test',
  disabledReason: null,
  provider: 'apps_av_api',
} as const;
const ENABLED_REALTIME_CONFIG = {
  convexUrl: 'https://duelwords-av.convex.cloud',
  disabledReason: null,
  provider: 'convex',
} as const;

describe('Word Duel active runtime controller assembler', () => {
  it('fails closed by default without creating an Apps AV API or Convex runtime surface', async () => {
    const bundle = createWordDuelActiveRuntimeController({
      lobbyState: activeRuntimeLobbyState(),
      realtimeNow: () => NOW_MS,
    });

    expect(bundle).toMatchObject({
      ok: false,
      reason: 'api_runtime_disabled',
      source: 'disabled_runtime',
    });
    expect(bundle.controller.source).toBe('disabled_runtime');
    await expect(bundle.controller.sendPresenceHeartbeat()).resolves.toEqual({
      ok: false,
      reason: 'room_unavailable',
    });
    expect(JSON.stringify(bundle).toLowerCase()).not.toContain('game-1');
    expect(JSON.stringify(bundle).toLowerCase()).not.toContain('player-a');
    expect(JSON.stringify(bundle).toLowerCase()).not.toContain('dwr_room_1');
  });

  it('requires a runtime lobby state, player session, realtime session, and injected Convex adapter', () => {
    const runtimeApiClient = createDuelWordsRuntimeApiClient({
      fetchImpl: async () => {
        throw new Error('No fetch expected while assembling fail-closed runtime.');
      },
      runtimeConfig: ENABLED_API_CONFIG,
    });

    expect(createWordDuelActiveRuntimeController({
      lobbyState: activeRuntimeLobbyState({ source: 'local_mock' }),
      realtimeRuntimeConfig: ENABLED_REALTIME_CONFIG,
      runtimeApiClient,
    })).toMatchObject({
      ok: false,
      reason: 'non_runtime_lobby_state',
    });
    expect(createWordDuelActiveRuntimeController({
      lobbyState: activeRuntimeLobbyState({ realtime: null }),
      realtimeRuntimeConfig: ENABLED_REALTIME_CONFIG,
      runtimeApiClient,
    })).toMatchObject({
      ok: false,
      reason: 'missing_realtime_session',
    });
    expect(createWordDuelActiveRuntimeController({
      lobbyState: activeRuntimeLobbyState(),
      realtimeRuntimeConfig: ENABLED_REALTIME_CONFIG,
      runtimeApiClient,
    })).toMatchObject({
      ok: false,
      reason: 'convex_runtime_pending',
    });
  });

  it('assembles an active Apps AV API controller from lobby state with injected realtime', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        game: safeGamePayload({
          currentRound: 1,
          roundDeadlineAt: '2026-07-05T11:00:37.000Z',
          status: 'active_round',
        }),
        round: {
          feedbackAvailable: false,
          gameFinalized: false,
          resultReason: null,
          roundNumber: 1,
          status: 'open',
          waitingForOpponent: true,
          winnerSide: null,
        },
        submission: {
          accepted: true,
          roundNumber: 1,
          side: 'a',
          submittedAt: '2026-07-05T11:00:03.000Z',
        },
      }),
    ]);
    const runtimeApiClient = createDuelWordsRuntimeApiClient({
      fetchImpl: recorder.fetch,
      platform: 'ios',
      runtimeConfig: ENABLED_API_CONFIG,
    });
    const bundle = createWordDuelActiveRuntimeController({
      convexClient: fakeConvexClient(),
      lobbyState: activeRuntimeLobbyState(),
      realtimeNow: () => NOW_MS,
      realtimeRuntimeConfig: ENABLED_REALTIME_CONFIG,
      runtimeApiClient,
    });

    expect(bundle).toMatchObject({
      ok: true,
      reason: null,
      source: 'apps_av_api',
    });
    expect(bundle.controller.source).toBe('apps_av_api');
    expect(bundle.controller.getViewModel()).toMatchObject({
      ownRoundState: 'editing',
      ownSide: 'a',
      roundNumber: 1,
    });
    expect(JSON.stringify(bundle.controller.getViewModel()).toLowerCase()).not.toContain('civic');
    expect(JSON.stringify(bundle.controller.getViewModel()).toLowerCase()).not.toContain('arose');

    await expect(bundle.controller.sendPresenceHeartbeat()).resolves.toEqual({ ok: true });
    const submitted = await bundle.controller.submitGuess({
      clientRequestId: 'submit-a-001',
      guess: 'adore',
      roundNumber: 1,
    });

    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]).toMatchObject({
      body: {
        actor: {
          actorType: 'guest_session',
          guestSessionId: 'guest-a',
        },
        clientRequestId: 'submit-a-001',
        guess: 'adore',
        playerId: 'player-a',
      },
      headers: {
        'x-appsav-app-id': 'duelwordsav',
        'x-appsav-platform': 'ios',
      },
      method: 'POST',
      url: 'https://api.test/v1/apps/duelwords/games/game-1/rounds/1/submit',
    });
    expect(submitted.viewModel.ownRoundState).toBe('waiting_for_rival');
    expect(JSON.stringify(bundle).toLowerCase()).not.toContain('target');
    expect(JSON.stringify(bundle).toLowerCase()).not.toContain('dictionary');
    expect(JSON.stringify(bundle).toLowerCase()).not.toContain('dwr_room_1');
  });
});

type FetchCall = {
  body: unknown;
  headers: Record<string, string>;
  method: string;
  url: string;
};

function activeRuntimeLobbyState(input: {
  realtime?: WordDuelLobbyControllerState['realtime'];
  source?: WordDuelLobbyControllerState['source'];
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
          realtimeSessionId: 'dwrs_session_a',
          roomToken: 'dwr_room_1',
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
    source: input.source ?? 'apps_av_api',
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

function safeGamePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    countdownEndsAt: null,
    currentRound: 1,
    gameId: 'game-1',
    language: 'en',
    maxAttempts: 6,
    mode: 'human_duel',
    players: [
      {
        joinedAt: '2026-07-05T11:00:00.000Z',
        playerId: 'player-a',
        readyAt: '2026-07-05T11:00:00.000Z',
        safeDisplayName: 'Host',
        side: 'a',
        status: 'ready',
      },
      {
        joinedAt: '2026-07-05T11:00:00.000Z',
        playerId: 'player-b',
        readyAt: '2026-07-05T11:00:00.000Z',
        safeDisplayName: 'Rival',
        side: 'b',
        status: 'ready',
      },
    ],
    roomToken: 'dwr_room_1',
    roundDeadlineAt: '2026-07-05T11:00:37.000Z',
    status: 'active_round',
    wordLength: 5,
    ...overrides,
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
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
    status: init.status ?? 200,
  });
}

function fakeConvexClient(): DuelWordsConvexRealtimeClient {
  return {
    async mutation<T>() {
      return { ok: true } as T;
    },
    async query<T>() {
      return null as T;
    },
    watchQuery<T>() {
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
