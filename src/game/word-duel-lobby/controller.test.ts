import { describe, expect, it } from 'vitest';

import { createDuelWordsRuntimeApiClient } from './runtime-api-client';
import {
  createLocalMockWordDuelLobbyControllerState,
  createWordDuelLobbyController,
  createWordDuelLobbyControllerStateFromAcceptedRematchProposal,
  WordDuelLobbyControllerError,
} from './controller';
import type { DuelWordsApiRematchProposal, DuelWordsApiSafeGame } from './api-client';

const NOW_MS = Date.parse('2026-07-05T10:00:00.000Z');
const HOST_ACTOR = {
  actorType: 'guest_session',
  guestSessionId: 'guest-a',
  safeDisplayName: 'Host',
} as const;

describe('Word Duel lobby controller', () => {
  it('creates the local mock state used by the lobby demo without runtime wiring', () => {
    const state = createLocalMockWordDuelLobbyControllerState({
      gameLanguage: 'es',
      nowMs: NOW_MS,
    });

    expect(state).toMatchObject({
      realtime: null,
      session: {
        actor: {
          actorType: 'guest_session',
          guestSessionId: 'local-guest-a',
        },
        gameId: 'local-lobby-demo',
        inviteToken: 'demo-duel',
        playerId: 'local-player-a',
        side: 'a',
      },
      source: 'local_mock',
    });
    expect(state.lobby.invitePreview.gameLanguage).toBe('es');
    expect(state.lobby.status).toBe('waiting_for_player');
  });

  it('uses the local mock flow by default', async () => {
    const controller = createWordDuelLobbyController();

    const host = await controller.createHostInvite({
      gameLanguage: 'en',
      maxAttempts: 8,
      nowMs: NOW_MS,
      wordLength: 7,
    });
    expect(host.lobby.invitePreview).toMatchObject({ maxAttempts: 8, wordLength: 7 });
    const review = await controller.viewInviteReview({
      nowMs: NOW_MS + 1_000,
      state: host,
    });
    const joined = await controller.joinInvite({
      nowMs: NOW_MS + 2_000,
      safeDisplayName: 'Rival',
      state: review,
    });
    const recipientReady = await controller.markReady({
      nowMs: NOW_MS + 3_000,
      state: joined,
    });
    const hostView = await controller.viewAsHost({
      nowMs: NOW_MS + 4_000,
      state: recipientReady,
    });
    const countdown = await controller.markReady({
      nowMs: NOW_MS + 5_000,
      state: hostView,
    });
    const active = await controller.openFirstRoundIfDue({
      nowMs: countdown.lobby.countdown?.endsAtMs ?? NOW_MS + 8_000,
      state: countdown,
    });

    expect(controller.source).toBe('local_mock');
    expect(host.source).toBe('local_mock');
    expect(joined.lobby.players.find((player) => player.side === 'b')).toMatchObject({
      isViewer: true,
      safeDisplayName: 'Rival',
      state: 'joined',
    });
    expect(countdown.lobby.status).toBe('countdown');
    expect(countdown.lobby).not.toHaveProperty('adSlot');
    expect(active.lobby.status).toBe('active_round');
    expect(active.lobby.canOpenActiveDuel).toBe(true);
  });

  it('fails closed when runtime API config is disabled', async () => {
    const controller = createWordDuelLobbyController({ mode: 'runtime' });

    await expect(
      controller.createHostInvite({
        gameLanguage: 'en',
        host: HOST_ACTOR,
        nowMs: NOW_MS,
      }),
    ).rejects.toMatchObject({
      code: 'controller_not_available',
    });
    expect(controller.source).toBe('disabled_runtime');
  });

  it('maps injected Apps AV API lobby payloads without leaking private game fields to UI state', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        invite: invitePayload(),
        lobby: lobbyPayload(),
        realtime: {
          realtimeSessionId: 'dwrs_session_a',
          roomToken: 'dwr_room_1',
          side: 'a',
        },
      }),
    ]);
    const runtimeApiClient = createDuelWordsRuntimeApiClient({
      fetchImpl: recorder.fetch,
      platform: 'ios',
      runtimeConfig: {
        apiBaseUrl: 'https://api-account-av-preview.avalsys.com',
        disabledReason: null,
        provider: 'apps_av_api',
      },
    });
    const controller = createWordDuelLobbyController({
      mode: 'runtime',
      runtimeApiClient,
    });

    const state = await controller.createHostInvite({
      gameLanguage: 'en',
      host: HOST_ACTOR,
      nowMs: NOW_MS,
    });

    expect(controller.source).toBe('apps_av_api');
    expect(state).toMatchObject({
      realtime: {
        realtimeSessionId: 'dwrs_session_a',
        roomToken: 'dwr_room_1',
        side: 'a',
      },
      session: {
        gameId: 'game-1',
        inviteToken: 'dwr_room_1',
        playerId: 'player-a',
        side: 'a',
      },
      source: 'apps_av_api',
    });
    expect(state.lobby.status).toBe('lobby');
    expect(state.lobby.viewerRole).toBe('host');
    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]).toMatchObject({
      body: {
        host: HOST_ACTOR,
        language: 'en',
      },
      method: 'POST',
      url: 'https://api-account-av-preview.avalsys.com/v1/apps/duelwords/invites',
    });
    expect(JSON.stringify(state.lobby).toLowerCase()).not.toContain('target');
    expect(JSON.stringify(state.lobby).toLowerCase()).not.toContain('dictionary');
    expect(JSON.stringify(state.lobby).toLowerCase()).not.toContain('player-a');
    expect(JSON.stringify(state.lobby).toLowerCase()).not.toContain('game-1');
  });

  it('can join an Apps AV API invite by token without a previous lobby state', async () => {
    const player = {
      actorType: 'guest_session',
      guestSessionId: 'guest-b',
      safeDisplayName: 'Rival',
    } as const;
    const recorder = createFetchRecorder([
      jsonResponse({
        invite: invitePayload({
          joinAvailability: 'viewer_already_joined',
          playerCount: 2,
        }),
        lobby: lobbyPayload({
          game: safeGamePayload({
            players: bothJoinedPlayers(),
          }),
          viewer: {
            isHost: false,
            playerId: 'player-b',
            side: 'b',
          },
        }),
      }),
    ]);
    const runtimeApiClient = createDuelWordsRuntimeApiClient({
      fetchImpl: recorder.fetch,
      runtimeConfig: {
        apiBaseUrl: 'https://api.test',
        disabledReason: null,
        provider: 'apps_av_api',
      },
    });
    const controller = createWordDuelLobbyController({
      mode: 'runtime',
      runtimeApiClient,
    });

    const state = await controller.joinInviteByToken({
      inviteToken: 'dwr_room_1',
      nowMs: NOW_MS,
      player,
    });

    expect(state).toMatchObject({
      session: {
        gameId: 'game-1',
        inviteToken: 'dwr_room_1',
        playerId: 'player-b',
        side: 'b',
      },
      source: 'apps_av_api',
    });
    expect(state.lobby.viewerRole).toBe('recipient');
    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]).toMatchObject({
      body: {
        player,
      },
      method: 'POST',
      url: 'https://api.test/v1/apps/duelwords/invites/dwr_room_1/join',
    });
    expect(JSON.stringify(state.lobby).toLowerCase()).not.toContain('guest-b');
    expect(JSON.stringify(state.lobby).toLowerCase()).not.toContain('player-b');
  });

  it('previews an invite without joining and only mutates after explicit confirmation', async () => {
    const player = {
      actorType: 'guest_session',
      guestSessionId: 'guest-b',
      safeDisplayName: 'Rival',
    } as const;
    const recorder = createFetchRecorder([
      jsonResponse({ invite: invitePayload() }),
      jsonResponse({
        invite: invitePayload({
          joinAvailability: 'viewer_already_joined',
          playerCount: 2,
        }),
        lobby: lobbyPayload({
          game: safeGamePayload({ players: bothJoinedPlayers() }),
          viewer: {
            isHost: false,
            playerId: 'player-b',
            side: 'b',
          },
        }),
      }),
    ]);
    const runtimeApiClient = createDuelWordsRuntimeApiClient({
      fetchImpl: recorder.fetch,
      runtimeConfig: {
        apiBaseUrl: 'https://api.test',
        disabledReason: null,
        provider: 'apps_av_api',
      },
    });
    const controller = createWordDuelLobbyController({ mode: 'runtime', runtimeApiClient });

    const preview = await controller.previewInviteByToken({
      inviteToken: 'dwr_room_1',
      nowMs: NOW_MS,
    });

    expect(preview).toMatchObject({
      lobby: {
        canJoin: true,
        status: 'invite_review',
        viewerRole: 'recipient',
      },
      session: {
        actor: null,
        gameId: null,
        inviteToken: 'dwr_room_1',
        playerId: null,
        side: 'b',
      },
      source: 'apps_av_api',
    });
    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]).toMatchObject({
      body: undefined,
      method: 'GET',
      url: 'https://api.test/v1/apps/duelwords/invites/dwr_room_1',
    });

    const joined = await controller.joinInvite({
      nowMs: NOW_MS + 1_000,
      player,
      state: preview,
    });

    expect(joined.lobby.status).toBe('lobby');
    expect(joined.lobby.viewerRole).toBe('recipient');
    expect(recorder.calls).toHaveLength(2);
    expect(recorder.calls[1]).toMatchObject({
      body: { player },
      method: 'POST',
      url: 'https://api.test/v1/apps/duelwords/invites/dwr_room_1/join',
    });
  });

  it('keeps the issued realtime session while refreshing the lobby', async () => {
    const realtime = {
      realtimeSessionId: 'dwrs_session_a',
      roomToken: 'dwr_room_1',
      side: 'a' as const,
    };
    const recorder = createFetchRecorder([
      jsonResponse({ invite: invitePayload(), lobby: lobbyPayload(), realtime }),
      jsonResponse({ lobby: lobbyPayload() }),
    ]);
    const controller = createWordDuelLobbyController({
      mode: 'runtime',
      runtimeApiClient: createDuelWordsRuntimeApiClient({
        fetchImpl: recorder.fetch,
        runtimeConfig: {
          apiBaseUrl: 'https://api.test',
          disabledReason: null,
          provider: 'apps_av_api',
        },
      }),
    });
    const created = await controller.createHostInvite({
      gameLanguage: 'en',
      host: HOST_ACTOR,
      nowMs: NOW_MS,
    });

    const refreshed = await controller.refreshLobby({
      nowMs: NOW_MS + 1_000,
      state: created,
    });

    expect(refreshed.realtime).toEqual(realtime);
    expect(recorder.calls.at(-1)?.method).toBe('GET');
  });

  it('resolves a room code to the same safe invite-review state', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({ invite: invitePayload() }),
    ]);
    const runtimeApiClient = createDuelWordsRuntimeApiClient({
      fetchImpl: recorder.fetch,
      runtimeConfig: {
        apiBaseUrl: 'https://api.test',
        disabledReason: null,
        provider: 'apps_av_api',
      },
    });
    const controller = createWordDuelLobbyController({ mode: 'runtime', runtimeApiClient });

    const preview = await controller.previewInviteByRoomCode({
      nowMs: NOW_MS,
      roomCode: 'ABCD-1234',
    });

    expect(preview.lobby).toMatchObject({
      canJoin: true,
      status: 'invite_review',
    });
    expect(recorder.calls).toEqual([
      expect.objectContaining({
        method: 'GET',
        url: 'https://api.test/v1/apps/duelwords/room-codes/ABCD-1234',
      }),
    ]);
  });

  it('keeps Ready and start commands behind Apps AV API authority', async () => {
    const countdownEndsAt = '2026-07-05T10:00:08.000Z';
    const recorder = createFetchRecorder([
      jsonResponse({
        invite: invitePayload({ joinAvailability: 'viewer_already_joined', playerCount: 2 }),
        lobby: lobbyPayload({
          game: safeGamePayload({
            players: bothJoinedPlayers(),
          }),
        }),
      }),
      jsonResponse({
        game: safeGamePayload({
          countdownEndsAt,
          players: bothReadyPlayers(),
          status: 'countdown',
        }),
      }),
      jsonResponse({
        game: safeGamePayload({
          currentRound: 1,
          players: bothReadyPlayers(),
          roundDeadlineAt: '2026-07-05T10:01:08.000Z',
          status: 'active_round',
        }),
      }),
    ]);
    const runtimeApiClient = createDuelWordsRuntimeApiClient({
      fetchImpl: recorder.fetch,
      runtimeConfig: {
        apiBaseUrl: 'https://api.test',
        disabledReason: null,
        provider: 'apps_av_api',
      },
    });
    const controller = createWordDuelLobbyController({
      mode: 'runtime',
      runtimeApiClient,
    });
    const lobby = await controller.createHostInvite({
      gameLanguage: 'en',
      host: HOST_ACTOR,
      nowMs: NOW_MS,
    });
    const ready = await controller.markReady({
      nowMs: NOW_MS + 1_000,
      state: lobby,
    });
    const active = await controller.openFirstRoundIfDue({
      nowMs: Date.parse(countdownEndsAt),
      state: ready,
    });

    expect(ready.lobby).toMatchObject({
      readyBySide: {
        a: true,
        b: true,
      },
      status: 'countdown',
    });
    expect(ready.lobby.countdown).toMatchObject({
      endsAtMs: Date.parse(countdownEndsAt),
      remainingSeconds: 7,
      serverNowMs: NOW_MS + 1_000,
    });
    expect(active.lobby.status).toBe('active_round');
    expect(recorder.calls.map((call) => call.url)).toEqual([
      'https://api.test/v1/apps/duelwords/invites',
      'https://api.test/v1/apps/duelwords/games/game-1/ready',
      'https://api.test/v1/apps/duelwords/games/game-1/start',
    ]);
  });

  it('throws typed controller errors for unsupported API lobby states', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        invite: invitePayload(),
        lobby: lobbyPayload({
          game: safeGamePayload({
            status: 'finalized',
          }),
        }),
      }),
    ]);
    const runtimeApiClient = createDuelWordsRuntimeApiClient({
      fetchImpl: recorder.fetch,
      runtimeConfig: {
        apiBaseUrl: 'https://api.test',
        disabledReason: null,
        provider: 'apps_av_api',
      },
    });
    const controller = createWordDuelLobbyController({
      mode: 'runtime',
      runtimeApiClient,
    });

    const result = controller.createHostInvite({
      gameLanguage: 'en',
      host: HOST_ACTOR,
      nowMs: NOW_MS,
    });

    await expect(result).rejects.toBeInstanceOf(WordDuelLobbyControllerError);
    await expect(result).rejects.toMatchObject({
      code: 'unsupported_api_lobby_state',
    });
  });

  it('builds a next lobby runtime state from an accepted rematch proposal', () => {
    const state = createWordDuelLobbyControllerStateFromAcceptedRematchProposal({
      actor: {
        actorType: 'guest_session',
        guestSessionId: 'guest-b',
      },
      nowMs: NOW_MS,
      proposal: rematchProposalPayload({
        nextGame: acceptedRematchNextGamePayload(),
        status: 'accepted',
        viewer: {
          canAccept: false,
          canCancel: false,
          canDecline: false,
          playerId: 'player-b-previous',
          role: 'recipient',
          side: 'b',
        },
      }),
    });

    expect(state).toMatchObject({
      realtime: null,
      session: {
        actor: {
          actorType: 'guest_session',
          guestSessionId: 'guest-b',
        },
        gameId: 'game-2',
        inviteToken: 'dwr_room_2',
        playerId: 'player-b-next',
        side: 'b',
      },
      source: 'apps_av_api',
    });
    expect(state.lobby).toMatchObject({
      canPressReady: true,
      canShareInvite: false,
      invitePreview: {
        roomCode: null,
      },
      status: 'lobby',
      viewerRole: 'recipient',
      viewerSide: 'b',
    });
    expect(state.lobby.players.find((player) => player.side === 'b')).toMatchObject({
      isViewer: true,
      safeDisplayName: 'Rival',
      state: 'joined',
    });
    expect(JSON.stringify(state.lobby).toLowerCase()).not.toContain('player-b-next');
    expect(JSON.stringify(state.lobby).toLowerCase()).not.toContain('game-2');
    expect(JSON.stringify(state.lobby).toLowerCase()).not.toContain('target');
    expect(JSON.stringify(state.lobby).toLowerCase()).not.toContain('dictionary');
    expect(JSON.stringify(state.lobby).toLowerCase()).not.toContain('dwr_room_2');
  });

  it('maps a rematch owner to the next host even when they were side b before', () => {
    const state = createWordDuelLobbyControllerStateFromAcceptedRematchProposal({
      actor: {
        actorType: 'guest_session',
        guestSessionId: 'guest-owner',
      },
      nowMs: NOW_MS,
      proposal: rematchProposalPayload({
        nextGame: acceptedRematchNextGamePayload(),
        status: 'accepted',
        viewer: {
          canAccept: false,
          canCancel: false,
          canDecline: false,
          playerId: 'player-b-previous',
          role: 'owner',
          side: 'b',
        },
      }),
    });

    expect(state).toMatchObject({
      lobby: {
        viewerRole: 'host',
        viewerSide: 'a',
      },
      session: {
        playerId: 'player-a-next',
        side: 'a',
      },
    });
  });

  it('rejects accepted rematch lobby handoffs without an accepted next game', () => {
    expect(() =>
      createWordDuelLobbyControllerStateFromAcceptedRematchProposal({
        actor: {
          actorType: 'guest_session',
          guestSessionId: 'guest-b',
        },
        nowMs: NOW_MS,
        proposal: rematchProposalPayload({
          nextGame: null,
          status: 'sent',
        }),
      }),
    ).toThrow(WordDuelLobbyControllerError);
  });
});

type FetchCall = {
  body: unknown;
  headers: Record<string, string>;
  method: string;
  url: string;
};

function createFetchRecorder(responses: Response[]) {
  const calls: FetchCall[] = [];
  let index = 0;
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({
      body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
      headers: headersToRecord(init?.headers),
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

function headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
  return Object.fromEntries(new Headers(headers).entries());
}

function invitePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...baseInvitePayload(),
    ...overrides,
  };
}

function baseInvitePayload() {
  return {
    challengeName: 'Word Duel',
    expiresAt: '2026-07-05T10:10:00.000Z',
    gameLanguage: 'en',
    gameName: 'DuelWords AV',
    hostSafeDisplayName: 'Host',
    inviteToken: 'dwr_room_1',
    joinAvailability: 'joinable',
    maxAttempts: 6,
    mode: 'human_duel',
    playerCount: 1,
    roomCode: 'ABCD-1234',
    roomState: 'waiting_for_opponent',
    settingsLocked: true,
    solutionSelected: false,
    wordLength: 5,
  } as const;
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
    ...baseSafeGamePayload(),
    ...overrides,
  };
}

function baseSafeGamePayload() {
  return {
    countdownEndsAt: null,
    currentRound: 0,
    dictionaryVersionId: 'private-version-filtered',
    gameId: 'game-1',
    language: 'en',
    maxAttempts: 6,
    mode: 'human_duel',
    players: [
      {
        joinedAt: '2026-07-05T10:00:00.000Z',
        playerId: 'player-a',
        readyAt: null,
        safeDisplayName: 'Host',
        side: 'a',
        status: 'joined',
      },
    ],
    roomToken: 'dwr_room_1',
    roundDeadlineAt: null,
    status: 'lobby',
    targetWordId: 'target-filtered',
    wordLength: 5,
  } as const;
}

function bothJoinedPlayers() {
  return [
    {
      joinedAt: '2026-07-05T10:00:00.000Z',
      playerId: 'player-a',
      readyAt: null,
      safeDisplayName: 'Host',
      side: 'a',
      status: 'joined',
    },
    {
      joinedAt: '2026-07-05T10:00:05.000Z',
      playerId: 'player-b',
      readyAt: null,
      safeDisplayName: 'Rival',
      side: 'b',
      status: 'joined',
    },
  ] as const;
}

function bothReadyPlayers() {
  return [
    {
      joinedAt: '2026-07-05T10:00:00.000Z',
      playerId: 'player-a',
      readyAt: '2026-07-05T10:00:01.000Z',
      safeDisplayName: 'Host',
      side: 'a',
      status: 'ready',
    },
    {
      joinedAt: '2026-07-05T10:00:05.000Z',
      playerId: 'player-b',
      readyAt: '2026-07-05T10:00:01.000Z',
      safeDisplayName: 'Rival',
      side: 'b',
      status: 'ready',
    },
  ] as const;
}

function rematchProposalPayload(overrides: Partial<DuelWordsApiRematchProposal> = {}): DuelWordsApiRematchProposal {
  return {
    createdAt: '2026-07-05T10:02:00.000Z',
    expiresAt: '2026-07-05T10:03:00.000Z',
    nextGame: null,
    owner: {
      playerId: 'player-a-previous',
      safeDisplayName: 'Host',
      side: 'a',
    },
    previousGameId: 'game-1',
    proposalId: 'dwrp-proposal-1',
    recipient: {
      playerId: 'player-b-previous',
      safeDisplayName: 'Rival',
      side: 'b',
    },
    remainingSeconds: null,
    respondedAt: '2026-07-05T10:02:30.000Z',
    settings: {
      language: 'en',
      maxAttempts: 6,
      wordLength: 5,
    },
    status: 'accepted',
    viewer: {
      canAccept: false,
      canCancel: false,
      canDecline: false,
      playerId: 'player-b-previous',
      role: 'recipient',
      side: 'b',
    },
    ...overrides,
  };
}

function acceptedRematchNextGamePayload(): DuelWordsApiSafeGame {
  return {
    countdownEndsAt: null,
    currentRound: 0,
    gameId: 'game-2',
    language: 'en',
    maxAttempts: 6,
    mode: 'human_duel',
    players: [
      {
        joinedAt: '2026-07-05T10:02:30.000Z',
        playerId: 'player-a-next',
        readyAt: null,
        safeDisplayName: 'Host',
        side: 'a',
        status: 'joined',
      },
      {
        joinedAt: '2026-07-05T10:02:30.000Z',
        playerId: 'player-b-next',
        readyAt: null,
        safeDisplayName: 'Rival',
        side: 'b',
        status: 'joined',
      },
    ],
    roomToken: 'dwr_room_2',
    roundDeadlineAt: null,
    status: 'lobby',
    wordLength: 5,
  };
}
