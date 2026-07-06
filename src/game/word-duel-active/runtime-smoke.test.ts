import { describe, expect, it } from 'vitest';

import {
  createWordDuelLobbyController,
  createWordDuelLobbyControllerStateFromAcceptedRematchProposal,
} from '../word-duel-lobby/controller';
import { createDuelWordsRuntimeApiClient } from '../word-duel-lobby/runtime-api-client';
import {
  type DuelWordsConvexWatch,
} from './convex-realtime-client';
import {
  createDuelWordsConvexRealtimeClientFromReactClient,
  DUELWORDS_CONVEX_SDK_FUNCTION_REFS,
  type DuelWordsConvexReactClientLike,
} from '../word-duel-runtime/convex-client-factory';
import { createWordDuelActiveRuntimeController } from './runtime-controller';

const NOW_MS = Date.parse('2026-07-05T12:00:00.000Z');
const COUNTDOWN_ENDS_AT = '2026-07-05T12:00:03.000Z';
const ROUND_DEADLINE_AT = '2026-07-05T12:00:40.000Z';
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
const HOST_ACTOR = {
  actorType: 'guest_session',
  guestSessionId: 'guest-a',
  safeDisplayName: 'Host',
} as const;

describe('Word Duel connected runtime smoke', () => {
  it('flows from Apps AV API lobby state into active runtime through the SDK bridge with a local fake React client', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        invite: invitePayload({
          joinAvailability: 'viewer_already_joined',
          playerCount: 2,
        }),
        lobby: lobbyPayload({
          game: safeGamePayload({
            players: bothJoinedPlayers(),
            status: 'lobby',
          }),
        }),
        realtime: {
          realtimeSessionId: 'dwrs_session_a',
          roomToken: 'dwr_room_1',
          side: 'a',
        },
      }),
      jsonResponse({
        game: safeGamePayload({
          countdownEndsAt: COUNTDOWN_ENDS_AT,
          players: bothReadyPlayers(),
          status: 'countdown',
        }),
      }),
      jsonResponse({
        game: safeGamePayload({
          currentRound: 1,
          players: bothReadyPlayers(),
          roundDeadlineAt: ROUND_DEADLINE_AT,
          status: 'active_round',
        }),
      }),
      jsonResponse({
        game: safeGamePayload({
          currentRound: 1,
          players: bothReadyPlayers(),
          roundDeadlineAt: ROUND_DEADLINE_AT,
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
          submittedAt: '2026-07-05T12:00:10.000Z',
        },
      }),
      jsonResponse({
        proposal: rematchProposalPayload({
          nextGame: safeGamePayload({
            dictionaryVersionId: 'private-rematch-version-filtered',
            gameId: 'game-2',
            players: [
              {
                joinedAt: '2026-07-05T12:01:00.000Z',
                playerId: 'player-a-rematch',
                readyAt: null,
                safeDisplayName: 'Host',
                side: 'a',
                status: 'joined',
              },
              {
                joinedAt: '2026-07-05T12:01:00.000Z',
                playerId: 'player-b-rematch',
                readyAt: null,
                safeDisplayName: 'Rival',
                side: 'b',
                status: 'joined',
              },
            ],
            roomToken: 'dwr_room_2',
            status: 'lobby',
            targetWordId: 'next-target-filtered',
          }),
          remainingSeconds: null,
          respondedAt: '2026-07-05T12:01:00.000Z',
          status: 'accepted',
        }),
      }),
    ]);
    const runtimeApiClient = createDuelWordsRuntimeApiClient({
      fetchImpl: recorder.fetch,
      platform: 'ios',
      runtimeConfig: ENABLED_API_CONFIG,
    });
    const lobbyController = createWordDuelLobbyController({
      mode: 'runtime',
      runtimeApiClient,
    });
    const hostLobby = await lobbyController.createHostInvite({
      gameLanguage: 'en',
      host: HOST_ACTOR,
      nowMs: NOW_MS,
    });
    const countdown = await lobbyController.markReady({
      nowMs: NOW_MS + 1_000,
      state: hostLobby,
    });
    const activeLobby = await lobbyController.openFirstRoundIfDue({
      nowMs: Date.parse(COUNTDOWN_ENDS_AT),
      state: countdown,
    });
    const watch = createFakeWatch<unknown>(safeRoomProjection());
    const reactClient = createFakeReactClient({ watch });
    const convexClient = createDuelWordsConvexRealtimeClientFromReactClient(reactClient);

    expect(reactClient.queries).toEqual([]);
    expect(reactClient.watches).toEqual([]);
    expect(reactClient.mutations).toEqual([]);

    const activeBundle = createWordDuelActiveRuntimeController({
      convexClient,
      lobbyState: activeLobby,
      realtimeNow: () => NOW_MS,
      realtimeRuntimeConfig: ENABLED_REALTIME_CONFIG,
      runtimeApiClient,
    });

    expect(lobbyController.source).toBe('apps_av_api');
    expect(activeLobby).toMatchObject({
      lobby: {
        canOpenActiveDuel: true,
        status: 'active_round',
      },
      realtime: {
        realtimeSessionId: 'dwrs_session_a',
        roomToken: 'dwr_room_1',
        side: 'a',
      },
      source: 'apps_av_api',
    });
    expect(activeBundle).toMatchObject({
      ok: true,
      reason: null,
      source: 'apps_av_api',
    });
    expect(activeBundle.controller.getViewModel()).toMatchObject({
      ownRoundState: 'editing',
      ownSide: 'a',
      roundNumber: 1,
    });

    const receivedStatuses: Array<string | null> = [];
    const unsubscribe = activeBundle.controller.subscribeActiveRoomView((view) => {
      receivedStatuses.push(view?.room.status ?? null);
    });

    watch.emit(safeRoomProjection({
      opponent: {
        attemptCount: 1,
        hasSubmittedCurrentRound: true,
        status: 'submitted',
      },
    }));
    expect(activeBundle.controller.getViewModel()).toMatchObject({
      opponent: {
        roundState: 'submitted',
      },
      ownRoundState: 'rival_submitted',
    });

    await expect(activeBundle.controller.sendPresenceHeartbeat()).resolves.toEqual({ ok: true });
    await expect(activeBundle.controller.sendReaction({
      clientRequestId: 'reaction-a-001',
      reaction: 'tick_tock',
    })).resolves.toEqual({ ok: true });
    const submitted = await activeBundle.controller.submitGuess({
      clientRequestId: 'submit-a-001',
      guess: 'adore',
      roundNumber: 1,
    });
    expect(submitted.viewModel.ownRoundState).toBe('waiting_for_rival');

    const currentRematch = await activeBundle.controller.getCurrentRematchProposal();
    expect(currentRematch).toMatchObject({
      nextGame: {
        gameId: 'game-2',
        status: 'lobby',
      },
      status: 'accepted',
      viewer: {
        role: 'owner',
        side: 'a',
      },
    });
    if (!currentRematch || activeLobby.session.actor === null) {
      throw new Error('Expected an accepted rematch proposal and active actor.');
    }
    const nextLobbyState = createWordDuelLobbyControllerStateFromAcceptedRematchProposal({
      actor: activeLobby.session.actor,
      nowMs: NOW_MS + 61_000,
      proposal: currentRematch,
    });
    expect(nextLobbyState).toMatchObject({
      lobby: {
        canPressReady: true,
        status: 'lobby',
      },
      session: {
        gameId: 'game-2',
        playerId: 'player-a-rematch',
      },
      source: 'apps_av_api',
    });
    expect(JSON.stringify({ currentRematch, lobby: nextLobbyState.lobby }).toLowerCase()).not.toContain('target');
    expect(JSON.stringify({ currentRematch, lobby: nextLobbyState.lobby }).toLowerCase()).not.toContain('dictionary');

    watch.emit(safeRoomProjection({
      opponent: {
        attemptCount: 1,
        hasSubmittedCurrentRound: true,
        status: 'submitted',
      },
      own: {
        attemptCount: 1,
        hasSubmittedCurrentRound: true,
        status: 'submitted',
      },
      room: {
        status: 'round_resolving',
      },
    }));
    expect(activeBundle.controller.getViewModel().ownRoundState).toBe('resolving');
    unsubscribe();

    expect(receivedStatuses).toEqual(['active_round', 'active_round', 'round_resolving']);
    expect(recorder.calls.map((call) => call.url)).toEqual([
      'https://api.test/v1/apps/duelwords/invites',
      'https://api.test/v1/apps/duelwords/games/game-1/ready',
      'https://api.test/v1/apps/duelwords/games/game-1/start',
      'https://api.test/v1/apps/duelwords/games/game-1/rounds/1/submit',
      'https://api.test/v1/apps/duelwords/games/game-1/rematch-proposals/current?actorType=guest_session&guestSessionId=guest-a&playerId=player-a',
    ]);
    expect(reactClient.watches).toEqual([
      {
        args: {
          realtimeSessionId: 'dwrs_session_a',
          roomToken: 'dwr_room_1',
        },
        functionRef: DUELWORDS_CONVEX_SDK_FUNCTION_REFS.getActiveRoomView,
      },
    ]);
    expect(reactClient.mutations).toEqual([
      {
        args: {
          realtimeSessionId: 'dwrs_session_a',
          roomToken: 'dwr_room_1',
        },
        functionRef: DUELWORDS_CONVEX_SDK_FUNCTION_REFS.sendPresenceHeartbeat,
      },
      {
        args: {
          clientRequestId: 'reaction-a-001',
          reactionKey: 'tick_tock',
          realtimeSessionId: 'dwrs_session_a',
          roomToken: 'dwr_room_1',
        },
        functionRef: DUELWORDS_CONVEX_SDK_FUNCTION_REFS.sendReaction,
      },
    ]);
    const serializedPublicState = JSON.stringify({
      activeLobby: activeLobby.lobby,
      viewModel: activeBundle.controller.getViewModel(),
    }).toLowerCase();
    for (const forbidden of [
      'civic',
      'target',
      'dictionary',
      'dwrs_session_a',
      'dwr_room_1',
      'guest-a',
      'player-a',
      'provider',
      'token',
    ]) {
      expect(serializedPublicState).not.toContain(forbidden);
    }
  });
});

type FetchCall = {
  body: unknown;
  headers: Record<string, string>;
  method: string;
  url: string;
};

type FakeSdkCall = {
  args: Record<string, unknown>;
  functionRef: unknown;
};

type FakeReactClient = DuelWordsConvexReactClientLike & {
  mutations: FakeSdkCall[];
  queries: FakeSdkCall[];
  watches: FakeSdkCall[];
};

type FakeWatch<T> = DuelWordsConvexWatch<T> & {
  emit(nextValue: T): void;
};

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

function createFakeReactClient(input: {
  mutationPayloads?: unknown[];
  queryPayload?: unknown;
  watch?: FakeWatch<unknown>;
} = {}): FakeReactClient {
  const mutations: FakeSdkCall[] = [];
  const queries: FakeSdkCall[] = [];
  const watches: FakeSdkCall[] = [];
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

function jsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
    status: init.status ?? 200,
  });
}

function invitePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    challengeName: 'Word Duel',
    expiresAt: '2026-07-05T12:10:00.000Z',
    gameLanguage: 'en',
    gameName: 'DuelWords AV',
    hostSafeDisplayName: 'Host',
    inviteToken: 'invite_public_1',
    joinAvailability: 'joinable',
    maxAttempts: 6,
    mode: 'human_duel',
    playerCount: 1,
    roomCode: 'ABCD-1234',
    roomState: 'waiting_for_opponent',
    settingsLocked: true,
    solutionSelected: false,
    wordLength: 5,
    ...overrides,
  };
}

function lobbyPayload(input: {
  game?: Record<string, unknown>;
  invite?: Record<string, unknown>;
  viewer?: {
    isHost: boolean;
    playerId: string;
    side: 'a' | 'b';
  } | null;
} = {}) {
  return {
    game: input.game ?? safeGamePayload(),
    invite: input.invite ?? invitePayload(),
    viewer: input.viewer ?? {
      isHost: true,
      playerId: 'player-a',
      side: 'a',
    },
  };
}

function safeGamePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    countdownEndsAt: null,
    currentRound: 0,
    dictionaryVersionId: 'private-version-filtered',
    gameId: 'game-1',
    language: 'en',
    maxAttempts: 6,
    mode: 'human_duel',
    players: bothJoinedPlayers(),
    roomToken: 'dwr_room_1',
    roundDeadlineAt: null,
    status: 'lobby',
    targetWord: 'civic',
    targetWordId: 'target-filtered',
    wordLength: 5,
    ...overrides,
  };
}

function bothJoinedPlayers() {
  return [
    {
      joinedAt: '2026-07-05T12:00:00.000Z',
      playerId: 'player-a',
      readyAt: null,
      safeDisplayName: 'Host',
      side: 'a',
      status: 'joined',
    },
    {
      joinedAt: '2026-07-05T12:00:00.000Z',
      playerId: 'player-b',
      readyAt: null,
      safeDisplayName: 'Rival',
      side: 'b',
      status: 'joined',
    },
  ] as const;
}

function bothReadyPlayers() {
  return bothJoinedPlayers().map((player) => ({
    ...player,
    readyAt: '2026-07-05T12:00:01.000Z',
    status: 'ready',
  }));
}

function rematchProposalPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    createdAt: '2026-07-05T12:00:50.000Z',
    expiresAt: '2026-07-05T12:01:50.000Z',
    nextGame: null,
    owner: {
      playerId: 'player-a',
      safeDisplayName: 'Host',
      side: 'a',
    },
    previousGameId: 'game-1',
    proposalId: 'dwrp_proposal_1',
    recipient: {
      playerId: 'player-b',
      safeDisplayName: 'Rival',
      side: 'b',
    },
    remainingSeconds: 60,
    respondedAt: null,
    settings: {
      language: 'en',
      maxAttempts: 6,
      wordLength: 5,
    },
    status: 'sent',
    viewer: {
      canAccept: false,
      canCancel: false,
      canDecline: false,
      playerId: 'player-a',
      role: 'owner',
      side: 'a',
    },
    ...overrides,
  };
}

function safeRoomProjection(overrides: {
  opponent?: Record<string, unknown>;
  own?: Record<string, unknown>;
  reactions?: unknown[];
  room?: Record<string, unknown>;
} = {}): Record<string, unknown> {
  return {
    opponent: {
      attemptCount: 0,
      hasSubmittedCurrentRound: false,
      isReady: true,
      presenceState: 'online',
      safeDisplayName: 'Rival',
      side: 'b',
      status: 'ready',
      timeoutCount: 0,
      ...overrides.opponent,
    },
    own: {
      attemptCount: 0,
      hasSubmittedCurrentRound: false,
      isReady: true,
      safeDisplayName: 'Host',
      side: 'a',
      status: 'ready',
      timeoutCount: 0,
      ...overrides.own,
    },
    reactions: overrides.reactions ?? [],
    room: {
      language: 'en',
      maxAttempts: 6,
      mode: 'human_duel',
      roundDeadlineAt: Date.parse(ROUND_DEADLINE_AT),
      roundNumber: 1,
      serverNow: NOW_MS,
      status: 'active_round',
      wordLength: 5,
      ...overrides.room,
    },
  };
}
