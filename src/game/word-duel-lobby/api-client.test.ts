import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createDuelWordsApiClient,
  DUELWORDS_APPS_AV_APP_ID,
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

afterEach(() => {
  vi.useRealTimers();
});

describe('DuelWords Apps AV API client', () => {
  it('bounds stalled requests so gameplay controls can recover', async () => {
    vi.useFakeTimers();
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: (_input, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        }, { once: true });
      }),
      requestTimeoutMs: 50,
    });

    const request = client.getInvitePreview({ inviteToken: 'stalled' });
    const assertion = expect(request).rejects.toMatchObject({
      code: 'request_timeout',
      status: 0,
    });
    await vi.runAllTicks();
    await vi.advanceTimersByTimeAsync(50);

    await assertion;
  });

  it('also bounds an authentication lookup that never completes', async () => {
    vi.useFakeTimers();
    let fetchCalled = false;
    const fetchImpl: typeof fetch = async () => {
      fetchCalled = true;
      return new Response('{}');
    };
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl,
      getAuthToken: () => new Promise(() => undefined),
      requestTimeoutMs: 50,
    });

    const request = client.getInvitePreview({ inviteToken: 'stalled-auth' });
    const assertion = expect(request).rejects.toMatchObject({
      code: 'request_timeout',
      status: 0,
    });
    await vi.advanceTimersByTimeAsync(50);

    await assertion;
    expect(fetchCalled).toBe(false);
  });

  it('preserves caller cancellation separately from a request timeout', async () => {
    const abortController = new AbortController();
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: (_input, init) => new Promise((_resolve, reject) => {
        const rejectAsAborted = () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        };
        if (init?.signal?.aborted) {
          rejectAsAborted();
          return;
        }
        init?.signal?.addEventListener('abort', rejectAsAborted, { once: true });
      }),
      requestTimeoutMs: 1_000,
    });

    const request = client.getDailyTarget({
      actor: GUEST_IDENTITY,
      language: 'ca',
      signal: abortController.signal,
      timeZone: 'Europe/Madrid',
    });
    abortController.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('fetches one official Daily target with only date, language, and rule metadata', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        dailyDate: '2026-07-28',
        timeZone: 'Europe/Madrid',
        language: 'ca',
        wordLength: 5,
        targetWord: 'diari',
        dictionaryVersion: 'five-language-release',
        policyVersion: 'duelwords-daily-v1',
        ruleVersion: 'duelwords-feedback-v1',
        targetWordId: 'must-be-ignored',
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: recorder.fetch,
      platform: 'ios',
    });

    const target = await client.getDailyTarget({
      actor: GUEST_IDENTITY,
      language: 'ca',
      timeZone: 'Europe/Madrid',
    });

    expect(recorder.calls).toEqual([expect.objectContaining({
      body: { actor: GUEST_IDENTITY, language: 'ca', timeZone: 'Europe/Madrid' },
      method: 'POST',
      url: 'https://api.test/v1/apps/duelwords/daily/target',
    })]);
    expect(target).toEqual({
      dailyDate: '2026-07-28',
      timeZone: 'Europe/Madrid',
      language: 'ca',
      wordLength: 5,
      targetWord: 'diari',
      dictionaryVersion: 'five-language-release',
      policyVersion: 'duelwords-daily-v1',
      ruleVersion: 'duelwords-feedback-v1',
    });
    expect(target).not.toHaveProperty('targetWordId');
  });

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
      maxAttempts: 8,
      wordLength: 7,
    });

    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]).toMatchObject({
      body: {
        host: GUEST_ACTOR,
        language: 'en',
        maxAttempts: 8,
        wordLength: 7,
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

  it('fails closed when invite rules are outside the supported duel options', async () => {
    for (const overrides of [{ wordLength: 8 }, { maxAttempts: 5 }]) {
      const client = createDuelWordsApiClient({
        baseUrl: 'https://api.test',
        fetchImpl: createFetchRecorder([
          jsonResponse({ invite: { ...invitePayload(), ...overrides } }),
        ]).fetch,
      });

      await expect(client.getInvitePreview({ inviteToken: 'invalid-rules' })).rejects.toMatchObject({
        code: 'invalid_response',
      });
    }
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

  it('requests backend-verified presence reconciliation without sending presence evidence', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        game: { ...safeGamePayload(), status: 'finalized' },
        reconciliation: { status: 'finalized' },
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: recorder.fetch,
    });

    const result = await client.reconcilePresence({
      actor: GUEST_IDENTITY,
      gameId: 'game 1',
      playerId: 'player-a',
    });

    expect(recorder.calls[0]).toMatchObject({
      body: {
        actor: GUEST_IDENTITY,
        playerId: 'player-a',
      },
      method: 'POST',
      url: 'https://api.test/v1/apps/duelwords/games/game%201/reconcile-presence',
    });
    expect(JSON.stringify(recorder.calls[0].body)).not.toContain('lastHeartbeatAt');
    expect(result.status).toBe('finalized');
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

  it('loads final results with target reveal and completed participant boards only after finalization', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        game: {
          ...safeGamePayload(),
          currentRound: 1,
          players: [
            {
              joinedAt: '2026-07-05T10:00:00.000Z',
              playerId: 'player-a',
              readyAt: '2026-07-05T10:00:20.000Z',
              safeDisplayName: 'Host',
              side: 'a',
              status: 'finalized',
            },
            {
              joinedAt: '2026-07-05T10:00:10.000Z',
              playerId: 'player-b',
              readyAt: '2026-07-05T10:00:21.000Z',
              safeDisplayName: 'Rival',
              side: 'b',
              status: 'finalized',
            },
          ],
          status: 'finalized',
        },
        opponent: {
          attemptsUsed: 1,
          guesses: [
            {
              displayWord: 'arose',
              feedback: {
                isCorrect: false,
                states: ['absent', 'present', 'absent', 'absent', 'correct'],
                version: 'duelwords-feedback-v1',
                wordLength: 5,
              },
              normalizedWord: 'arose',
              roundNumber: 1,
              status: 'accepted',
              submittedAt: '2026-07-05T10:00:50.000Z',
            },
          ],
          safeDisplayName: 'Rival',
          side: 'b',
          solved: false,
        },
        own: {
          attemptsUsed: 1,
          guesses: [
            {
              displayWord: 'civic',
              feedback: {
                isCorrect: false,
                states: ['correct', 'correct', 'absent', 'absent', 'absent'],
                targetWordId: 'target-secret',
                version: 'duelwords-feedback-v1',
                wordLength: 5,
              },
              roundNumber: 1,
              status: 'accepted',
              submittedAt: '2026-07-05T10:00:45.000Z',
            },
          ],
          safeDisplayName: 'Host',
          side: 'a',
          solved: false,
        },
        result: {
          finalizedAt: '2026-07-05T10:00:50.000Z',
          resultReason: 'attempts_exhausted',
          targetDisplayWord: 'cigar',
          winnerSide: 'draw',
        },
        viewer: {
          outcome: 'draw',
          playerId: 'player-a',
          side: 'a',
        },
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: recorder.fetch,
    });

    const finalResult = await client.getFinalResult({
      actor: GUEST_IDENTITY,
      gameId: 'game-1',
      playerId: 'player-a',
    });

    expect(recorder.calls[0]).toMatchObject({
      body: undefined,
      method: 'GET',
      url: 'https://api.test/v1/apps/duelwords/games/game-1/final-result?actorType=guest_session&guestSessionId=guest-a&playerId=player-a',
    });
    expect(finalResult).toMatchObject({
      result: {
        resultReason: 'attempts_exhausted',
        targetDisplayWord: 'cigar',
        winnerSide: 'draw',
      },
      viewer: {
        outcome: 'draw',
        playerId: 'player-a',
        side: 'a',
      },
      own: {
        attemptsUsed: 1,
        guesses: [
          {
            displayWord: 'civic',
            roundNumber: 1,
            status: 'accepted',
          },
        ],
      },
      opponent: {
        attemptsUsed: 1,
        guesses: [
          {
            displayWord: 'arose',
            roundNumber: 1,
            status: 'accepted',
          },
        ],
      },
    });
    const serialized = JSON.stringify(finalResult).toLowerCase();
    expect(serialized).toContain('cigar');
    expect(serialized).toContain('civic');
    expect(serialized).toContain('arose');
    expect(serialized).not.toContain('targetwordid');
    expect(serialized).not.toContain('normalizedword');
  });

  it('loads current rematch proposals through participant-scoped query parameters', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        proposal: null,
      }),
      jsonResponse({
        proposal: rematchProposalPayload({
          targetWordId: 'target-secret',
          viewer: {
            canAccept: true,
            canCancel: false,
            canDecline: true,
            playerId: 'player-b',
            role: 'recipient',
            side: 'b',
          },
        }),
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: recorder.fetch,
    });

    const empty = await client.getCurrentRematchProposal({
      actor: {
        actorType: 'guest_session',
        guestSessionId: 'guest-b',
      },
      gameId: 'game/1',
      playerId: 'player-b',
    });
    const proposal = await client.getCurrentRematchProposal({
      actor: {
        actorType: 'guest_session',
        guestSessionId: 'guest-b',
      },
      gameId: 'game/1',
      playerId: 'player-b',
    });

    expect(recorder.calls.map((call) => call.url)).toEqual([
      'https://api.test/v1/apps/duelwords/games/game%2F1/rematch-proposals/current?actorType=guest_session&guestSessionId=guest-b&playerId=player-b',
      'https://api.test/v1/apps/duelwords/games/game%2F1/rematch-proposals/current?actorType=guest_session&guestSessionId=guest-b&playerId=player-b',
    ]);
    expect(recorder.calls.every((call) => call.method === 'GET')).toBe(true);
    expect(recorder.calls.every((call) => call.body === undefined)).toBe(true);
    expect(empty).toBeNull();
    expect(proposal).toMatchObject({
      proposalId: 'dwrp_proposal_1',
      status: 'sent',
      viewer: {
        role: 'recipient',
        canAccept: true,
        canCancel: false,
        canDecline: true,
      },
    });
    expect(JSON.stringify(proposal).toLowerCase()).not.toContain('targetwordid');
    expect(JSON.stringify(proposal).toLowerCase()).not.toContain('target-secret');
  });

  it('drives rematch proposal actions through participant-scoped Apps AV routes without leaking private fields', async () => {
    const recorder = createFetchRecorder([
      jsonResponse({
        proposal: rematchProposalPayload({
          targetWordId: 'target-secret',
        }),
      }),
      jsonResponse({
        proposal: rematchProposalPayload({
          nextGame: {
            ...safeGamePayload(),
            dictionaryVersionId: 'private-version-filtered',
            gameId: 'game-2',
            roomToken: 'dwr_room_2',
            targetWordId: 'new-target-secret',
          },
          remainingSeconds: null,
          respondedAt: '2026-07-05T10:02:30.000Z',
          status: 'accepted',
          viewer: {
            canAccept: false,
            canCancel: false,
            canDecline: false,
            playerId: 'player-b',
            role: 'recipient',
            side: 'b',
          },
        }),
      }),
      jsonResponse({
        proposal: rematchProposalPayload({
          remainingSeconds: null,
          respondedAt: '2026-07-05T10:02:40.000Z',
          status: 'declined',
        }),
      }),
      jsonResponse({
        proposal: rematchProposalPayload({
          remainingSeconds: null,
          respondedAt: '2026-07-05T10:02:50.000Z',
          status: 'cancelled',
        }),
      }),
    ]);
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: recorder.fetch,
    });

    const created = await client.createRematchProposal({
      actor: GUEST_IDENTITY,
      gameId: 'game/1',
      language: 'es',
      playerId: 'player-a',
    });
    const accepted = await client.acceptRematchProposal({
      actor: {
        actorType: 'guest_session',
        guestSessionId: 'guest-b',
      },
      gameId: 'game/1',
      playerId: 'player-b',
      proposalId: 'dwrp/proposal 1',
    });
    const declined = await client.declineRematchProposal({
      actor: {
        actorType: 'guest_session',
        guestSessionId: 'guest-b',
      },
      gameId: 'game/1',
      playerId: 'player-b',
      proposalId: 'dwrp/proposal 1',
    });
    const cancelled = await client.cancelRematchProposal({
      actor: GUEST_IDENTITY,
      gameId: 'game/1',
      playerId: 'player-a',
      proposalId: 'dwrp/proposal 1',
    });

    expect(recorder.calls).toMatchObject([
      {
        body: {
          actor: GUEST_IDENTITY,
          language: 'es',
          playerId: 'player-a',
        },
        method: 'POST',
        url: 'https://api.test/v1/apps/duelwords/games/game%2F1/rematch-proposals',
      },
      {
        body: {
          actor: {
            actorType: 'guest_session',
            guestSessionId: 'guest-b',
          },
          playerId: 'player-b',
        },
        method: 'POST',
        url: 'https://api.test/v1/apps/duelwords/games/game%2F1/rematch-proposals/dwrp%2Fproposal%201/accept',
      },
      {
        method: 'POST',
        url: 'https://api.test/v1/apps/duelwords/games/game%2F1/rematch-proposals/dwrp%2Fproposal%201/decline',
      },
      {
        method: 'POST',
        url: 'https://api.test/v1/apps/duelwords/games/game%2F1/rematch-proposals/dwrp%2Fproposal%201/cancel',
      },
    ]);
    expect(created).toMatchObject({
      proposalId: 'dwrp_proposal_1',
      remainingSeconds: 60,
      settings: {
        language: 'en',
        maxAttempts: 6,
        wordLength: 5,
      },
      status: 'sent',
      viewer: {
        canAccept: false,
        canCancel: true,
        canDecline: false,
        role: 'owner',
        side: 'a',
      },
    });
    expect(accepted).toMatchObject({
      nextGame: {
        gameId: 'game-2',
        status: 'lobby',
      },
      remainingSeconds: null,
      status: 'accepted',
      viewer: {
        role: 'recipient',
      },
    });
    expect(declined.status).toBe('declined');
    expect(cancelled.status).toBe('cancelled');

    const serialized = JSON.stringify({ accepted, cancelled, created, declined }).toLowerCase();
    expect(serialized).not.toContain('targetwordid');
    expect(serialized).not.toContain('new-target-secret');
    expect(serialized).not.toContain('dictionaryversionid');
    expect(serialized).not.toContain('private-version-filtered');
  });

  it('fails closed when final result feedback does not match the game word length', async () => {
    const client = createDuelWordsApiClient({
      baseUrl: 'https://api.test',
      fetchImpl: createFetchRecorder([
        jsonResponse({
          game: {
            ...safeGamePayload(),
            status: 'finalized',
            wordLength: 5,
          },
          opponent: {
            attemptsUsed: 0,
            guesses: [],
            safeDisplayName: 'Rival',
            side: 'b',
            solved: false,
          },
          own: {
            attemptsUsed: 1,
            guesses: [
              {
                displayWord: 'civic',
                feedback: {
                  isCorrect: false,
                  states: ['correct', 'correct', 'absent', 'absent'],
                  version: 'duelwords-feedback-v1',
                  wordLength: 4,
                },
                roundNumber: 1,
                status: 'accepted',
                submittedAt: '2026-07-05T10:00:45.000Z',
              },
            ],
            safeDisplayName: 'Host',
            side: 'a',
            solved: false,
          },
          result: {
            finalizedAt: '2026-07-05T10:00:50.000Z',
            resultReason: 'attempts_exhausted',
            targetDisplayWord: 'cigar',
            winnerSide: 'draw',
          },
          viewer: {
            outcome: 'draw',
            playerId: 'player-a',
            side: 'a',
          },
        }),
      ]).fetch,
    });

    await expect(
      client.getFinalResult({
        actor: GUEST_IDENTITY,
        gameId: 'game-1',
        playerId: 'player-a',
      }),
    ).rejects.toMatchObject({
      code: 'invalid_response',
    });
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

function rematchProposalPayload(overrides: Record<string, unknown> = {}) {
  return {
    createdAt: '2026-07-05T10:02:00.000Z',
    expiresAt: '2026-07-05T10:03:00.000Z',
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
      canCancel: true,
      canDecline: false,
      playerId: 'player-a',
      role: 'owner',
      side: 'a',
    },
    ...overrides,
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
