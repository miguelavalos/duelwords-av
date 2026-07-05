import { describe, expect, it } from 'vitest';

import {
  createDuelWordsApiClient,
  DUELWORDS_APPS_AV_APP_ID,
  DuelWordsApiError,
} from './api-client';

const GUEST_ACTOR = {
  actorType: 'guest_session',
  guestSessionId: 'guest-a',
  safeDisplayName: 'Host',
} as const;

const GUEST_IDENTITY = {
  actorType: 'guest_session',
  guestSessionId: 'guest-a',
} as const;

describe('DuelWords Apps AV API client', () => {
  it('creates invites through the approved Apps AV route with canonical headers', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        invite: invitePayload(),
        lobby: lobbyPayload(),
        targetWordId: 'forbidden-target',
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api-account-av-preview.avalsys.com/',
      fetchImpl: recorder.fetch,
      getAuthToken: () => 'account-token',
      platform: 'ios',
    });

    const result = await client.createInvite({
      host: GUEST_ACTOR,
      language: 'en',
      maxAttempts: 6,
    });

    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]).toMatchObject({
      body: {
        host: GUEST_ACTOR,
        language: 'en',
        maxAttempts: 6,
      },
      method: 'POST',
      url: 'https://api-account-av-preview.avalsys.com/v1/apps/duelwords/invites',
    });
    expect(recorder.calls[0].headers).toMatchObject({
      accept: 'application/json',
      authorization: 'Bearer account-token',
      'content-type': 'application/json',
      'x-appsav-app-id': DUELWORDS_APPS_AV_APP_ID,
      'x-appsav-platform': 'ios',
    });
    expect(result.lobby.viewer).toEqual({
      isHost: true,
      playerId: 'player-a',
      side: 'a',
    });
    expect(JSON.stringify(result).toLowerCase()).not.toContain('forbidden-target');
    expect(JSON.stringify(result).toLowerCase()).not.toContain('dictionaryversionid');
  });

  it('joins invites explicitly and parses an optional backend-issued realtime session', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        invite: {
          ...invitePayload(),
          joinAvailability: 'full',
          playerCount: 2,
        },
        lobby: {
          ...lobbyPayload(),
          viewer: {
            isHost: false,
            playerId: 'player-b',
            side: 'b',
          },
        },
        realtime: {
          realtimeSessionId: 'dwrs_session_b',
          roomToken: 'dwr_room_1',
          side: 'b',
        },
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: recorder.fetch,
      platform: 'android',
    });

    const result = await client.joinInvite({
      inviteToken: 'dwr_room/with spaces',
      player: {
        actorType: 'guest_session',
        guestSessionId: 'guest-b',
        safeDisplayName: 'Rival',
      },
    });

    expect(recorder.calls[0].url).toBe('https://api.test/v1/apps/duelwords/invites/dwr_room%2Fwith%20spaces/join');
    expect(result.realtime).toEqual({
      realtimeSessionId: 'dwrs_session_b',
      roomToken: 'dwr_room_1',
      side: 'b',
    });
  });

  it('loads lobby state with player-scoped actor query parameters', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        lobby: lobbyPayload(),
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: recorder.fetch,
    });

    await client.getLobby({
      actor: GUEST_IDENTITY,
      gameId: 'game 1',
      playerId: 'player-a',
    });

    expect(recorder.calls[0].method).toBe('GET');
    expect(recorder.calls[0].url).toBe(
      'https://api.test/v1/apps/duelwords/games/game%201/lobby?actorType=guest_session&guestSessionId=guest-a&playerId=player-a',
    );
    expect(recorder.calls[0].body).toBeUndefined();
  });

  it('marks Ready, opens the first round, and requests realtime sessions through API authority', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        game: {
          ...safeGamePayload(),
          status: 'countdown',
        },
      }),
      jsonResponse({
        game: {
          ...safeGamePayload(),
          currentRound: 1,
          roundDeadlineAt: '2026-07-05T10:01:30.000Z',
          status: 'active_round',
        },
      }),
      jsonResponse({
        realtime: {
          realtimeSessionId: 'dwrs_session_a',
          roomToken: 'dwr_room_1',
          side: 'a',
        },
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: recorder.fetch,
    });

    const ready = await client.markReady({
      actor: GUEST_IDENTITY,
      gameId: 'game-1',
      playerId: 'player-a',
    });
    const started = await client.openFirstRoundIfDue({ gameId: 'game-1' });
    const realtime = await client.createRealtimeSession({
      actor: GUEST_IDENTITY,
      gameId: 'game-1',
      playerId: 'player-a',
    });

    expect(ready.game.status).toBe('countdown');
    expect(started.game.status).toBe('active_round');
    expect(realtime).toEqual({
      ok: true,
      realtime: {
        realtimeSessionId: 'dwrs_session_a',
        roomToken: 'dwr_room_1',
        side: 'a',
      },
    });
    expect(recorder.calls.map((call) => call.url)).toEqual([
      'https://api.test/v1/apps/duelwords/games/game-1/ready',
      'https://api.test/v1/apps/duelwords/games/game-1/start',
      'https://api.test/v1/apps/duelwords/games/game-1/realtime-sessions',
    ]);
  });

  it('submits active guesses through the approved round-scoped Apps AV route without leaking hidden words', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        game: {
          ...safeGamePayload(),
          currentRound: 1,
          roundDeadlineAt: '2026-07-05T10:01:30.000Z',
          status: 'active_round',
          targetWordId: 'cigar',
        },
        round: roundTransitionPayload({
          waitingForOpponent: true,
        }),
        submission: {
          accepted: true,
          roundNumber: 1,
          side: 'a',
          submittedAt: '2026-07-05T10:00:45.000Z',
          normalizedWord: 'civic',
        },
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: recorder.fetch,
      platform: 'ios',
    });

    const result = await client.submitGuess({
      actor: GUEST_IDENTITY,
      clientRequestId: 'submit-a-001',
      gameId: 'game/1',
      guess: 'civic',
      playerId: 'player-a',
      roundNumber: 1,
    });

    expect(recorder.calls[0]).toMatchObject({
      body: {
        actor: GUEST_IDENTITY,
        clientRequestId: 'submit-a-001',
        guess: 'civic',
        playerId: 'player-a',
      },
      method: 'POST',
      url: 'https://api.test/v1/apps/duelwords/games/game%2F1/rounds/1/submit',
    });
    expect(result).toMatchObject({
      round: {
        feedbackAvailable: false,
        roundNumber: 1,
        status: 'open',
        waitingForOpponent: true,
      },
      submission: {
        accepted: true,
        roundNumber: 1,
        side: 'a',
      },
    });
    expect(JSON.stringify(result).toLowerCase()).not.toContain('cigar');
    expect(JSON.stringify(result).toLowerCase()).not.toContain('civic');
    expect(JSON.stringify(result).toLowerCase()).not.toContain('normalizedword');
    expect(JSON.stringify(result).toLowerCase()).not.toContain('targetwordid');
  });

  it('records active timeouts and opens the next round through round-scoped Apps AV routes', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        game: {
          ...safeGamePayload(),
          currentRound: 1,
          roundDeadlineAt: '2026-07-05T10:01:30.000Z',
          status: 'active_round',
        },
        round: roundTransitionPayload({
          waitingForOpponent: true,
        }),
        timeout: {
          roundNumber: 1,
          side: 'a',
          status: 'timed_out',
          timedOutAt: '2026-07-05T10:01:30.001Z',
          feedbackJson: {
            states: ['absent', 'present', 'correct'],
          },
        },
      }),
      jsonResponse({
        game: {
          ...safeGamePayload(),
          currentRound: 2,
          roundDeadlineAt: '2026-07-05T10:02:51.000Z',
          status: 'active_round',
          targetWordId: 'cigar',
        },
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: recorder.fetch,
    });

    const timeout = await client.timeoutRound({
      actor: GUEST_IDENTITY,
      gameId: 'game-1',
      playerId: 'player-a',
      roundNumber: 1,
    });
    const next = await client.openNextRoundIfDue({
      gameId: 'game-1',
      roundNumber: 1,
    });

    expect(recorder.calls.map((call) => call.url)).toEqual([
      'https://api.test/v1/apps/duelwords/games/game-1/rounds/1/timeout',
      'https://api.test/v1/apps/duelwords/games/game-1/rounds/1/open-next-if-due',
    ]);
    expect(recorder.calls[0].body).toEqual({
      actor: GUEST_IDENTITY,
      playerId: 'player-a',
    });
    expect(recorder.calls[1].body).toEqual({});
    expect(timeout.timeout).toEqual({
      roundNumber: 1,
      side: 'a',
      status: 'timed_out',
      timedOutAt: '2026-07-05T10:01:30.001Z',
    });
    expect(next.game).toMatchObject({
      currentRound: 2,
      roundDeadlineAt: '2026-07-05T10:02:51.000Z',
      status: 'active_round',
    });
    expect(JSON.stringify(timeout).toLowerCase()).not.toContain('feedbackjson');
    expect(JSON.stringify(next).toLowerCase()).not.toContain('targetwordid');
    expect(JSON.stringify(next).toLowerCase()).not.toContain('cigar');
  });

  it('loads own round snapshots with own feedback only after round resolution', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        feedbackAvailable: true,
        game: {
          ...safeGamePayload(),
          currentRound: 1,
          roundDeadlineAt: '2026-07-05T10:01:30.000Z',
          status: 'round_resolving',
          targetWordId: 'cigar',
        },
        opponent: {
          displayWord: 'arose',
          status: 'submitted',
        },
        own: {
          displayWord: 'civic',
          feedback: {
            isCorrect: false,
            states: ['correct', 'absent', 'absent', 'absent', 'absent'],
            targetWordId: 'cigar',
            version: 'duelwords-feedback-v1',
            wordLength: 5,
          },
          status: 'accepted',
          submittedAt: '2026-07-05T10:00:45.000Z',
        },
        roundNumber: 1,
        roundStatus: 'resolved',
        side: 'a',
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: recorder.fetch,
    });

    const snapshot = await client.getOwnRoundSnapshot({
      actor: GUEST_IDENTITY,
      gameId: 'game-1',
      playerId: 'player-a',
      roundNumber: 1,
    });

    expect(recorder.calls[0]).toMatchObject({
      body: undefined,
      method: 'GET',
      url: 'https://api.test/v1/apps/duelwords/games/game-1/rounds/1/own-snapshot?actorType=guest_session&guestSessionId=guest-a&playerId=player-a',
    });
    expect(snapshot).toMatchObject({
      feedbackAvailable: true,
      opponent: {
        status: 'submitted',
      },
      own: {
        displayWord: 'civic',
        feedback: {
          isCorrect: false,
          states: ['correct', 'absent', 'absent', 'absent', 'absent'],
          version: 'duelwords-feedback-v1',
          wordLength: 5,
        },
        status: 'accepted',
      },
      roundNumber: 1,
      roundStatus: 'resolved',
      side: 'a',
    });
    expect(JSON.stringify(snapshot).toLowerCase()).not.toContain('arose');
    expect(JSON.stringify(snapshot).toLowerCase()).not.toContain('cigar');
    expect(JSON.stringify(snapshot).toLowerCase()).not.toContain('targetwordid');
  });

  it('fails closed when own snapshot feedback shape is malformed', async () => {
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: createFetchRecorder([
        jsonResponse({
          feedbackAvailable: true,
          game: safeGamePayload(),
          opponent: {
            status: 'submitted',
          },
          own: {
            displayWord: 'civic',
            feedback: {
              isCorrect: false,
              states: ['correct'],
              version: 'duelwords-feedback-v1',
              wordLength: 5,
            },
            status: 'accepted',
            submittedAt: '2026-07-05T10:00:45.000Z',
          },
          roundNumber: 1,
          roundStatus: 'resolved',
          side: 'a',
        }),
      ]).fetch,
    });

    await expect(
      client.getOwnRoundSnapshot({
        actor: GUEST_IDENTITY,
        gameId: 'game-1',
        playerId: 'player-a',
        roundNumber: 1,
      }),
    ).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('fails closed when realtime is unavailable or malformed', async () => {
    const unavailable = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: createFetchRecorder([
        jsonResponse({
          error: {
            code: 'realtime_unavailable',
            message: 'DuelWords realtime is temporarily unavailable.',
          },
        }, { status: 503 }),
      ]).fetch,
    });

    await expect(
      unavailable.createRealtimeSession({
        actor: GUEST_IDENTITY,
        gameId: 'game-1',
        playerId: 'player-a',
      }),
    ).resolves.toEqual({ ok: false, reason: 'realtime_unavailable' });

    const malformed = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: createFetchRecorder([
        jsonResponse({
          realtime: {
            realtimeSessionId: 'plain-session',
            roomToken: 'dwr_room_1',
            side: 'a',
          },
        }),
      ]).fetch,
    });

    await expect(
      malformed.createRealtimeSession({
        actor: GUEST_IDENTITY,
        gameId: 'game-1',
        playerId: 'player-a',
      }),
    ).resolves.toEqual({ ok: false, reason: 'invalid_realtime_session' });
  });

  it('throws typed API errors without exposing failed payload internals', async () => {
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: createFetchRecorder([
        jsonResponse({
          error: {
            code: 'player_actor_mismatch',
            message: 'Private mismatch text',
          },
          targetWordId: 'target-secret',
        }, { status: 403 }),
      ]).fetch,
    });

    await expect(
      client.markReady({
        actor: GUEST_IDENTITY,
        gameId: 'game-1',
        playerId: 'player-a',
      }),
    ).rejects.toMatchObject({
      code: 'player_actor_mismatch',
      status: 403,
    });
  });

  it('rejects sensitive fields in the realtime envelope returned with lobby payloads', async () => {
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: createFetchRecorder([
        jsonResponse({
          invite: invitePayload(),
          lobby: lobbyPayload(),
          realtime: {
            guestSessionId: 'guest-secret',
            realtimeSessionId: 'dwrs_session',
            roomToken: 'dwr_room',
            side: 'a',
          },
        }),
      ]).fetch,
    });

    await expect(
      client.createInvite({
        host: GUEST_ACTOR,
        language: 'en',
      }),
    ).rejects.toMatchObject({
      code: 'blocked_sensitive_payload',
    });
  });
});

type FetchCall = {
  body: unknown;
  headers: Record<string, string>;
  method: string;
  url: string;
};

type RoundTransitionPayload = {
  feedbackAvailable: boolean;
  gameFinalized: boolean;
  resultReason: string | null;
  roundNumber: number;
  status: 'open' | 'resolved';
  waitingForOpponent: boolean;
  winnerSide: 'a' | 'b' | 'draw' | null;
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

function invitePayload() {
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
  };
}

function lobbyPayload() {
  return {
    game: safeGamePayload(),
    invite: invitePayload(),
    viewer: {
      isHost: true,
      playerId: 'player-a',
      side: 'a',
    },
  };
}

function safeGamePayload() {
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
  };
}

function roundTransitionPayload(overrides: Partial<RoundTransitionPayload> = {}): RoundTransitionPayload {
  return {
    feedbackAvailable: false,
    gameFinalized: false,
    resultReason: null,
    roundNumber: 1,
    status: 'open',
    waitingForOpponent: false,
    winnerSide: null,
    ...overrides,
  };
}
