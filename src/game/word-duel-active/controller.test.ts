import { describe, expect, it } from 'vitest';

import type {
  DuelWordsApiClient,
  DuelWordsApiOwnRoundSnapshot,
  DuelWordsApiSafeGame,
} from '../word-duel-lobby/api-client';
import { createWordDuelActiveController, WordDuelActiveControllerError } from './controller';
import { createWordDuelActiveDemoHandoff } from './handoff';
import { createLocalDuelWordsRealtimeProjectionClient } from './realtime-projection';

const NOW_MS = Date.parse('2026-07-05T08:00:00.000Z');
const RUNTIME_SESSION = {
  actor: {
    actorType: 'guest_session',
    guestSessionId: 'guest-a',
  },
  gameId: 'game-1',
  playerId: 'player-a',
  realtime: {
    realtimeSessionId: 'dwrs_session_a',
    roomToken: 'dwr_room_1',
    side: 'a',
  },
} as const;

describe('Word Duel active controller', () => {
  it('owns the local active demo session details outside the UI surface', async () => {
    const controller = createWordDuelActiveController({
      handoff: createWordDuelActiveDemoHandoff({ gameLanguage: 'es' }),
      now: () => new Date('2026-07-05T08:00:00.000Z'),
      realtimeNow: () => Date.parse('2026-07-05T08:00:00.000Z'),
    });
    const receivedStatuses: (string | null)[] = [];
    const unsubscribe = controller.subscribeActiveRoomView((view) => {
      receivedStatuses.push(view?.room.status ?? null);
    });

    expect(controller.source).toBe('local_mock');
    expect(controller.getViewModel().gameLanguage).toBe('es');
    expect(JSON.stringify(controller).toLowerCase()).not.toContain('local-active-demo');
    expect(JSON.stringify(controller).toLowerCase()).not.toContain('local-player-a');
    expect(JSON.stringify(controller).toLowerCase()).not.toContain('local-active-room');
    expect(JSON.stringify(controller).toLowerCase()).not.toContain('local-realtime-session');
    await expect(controller.sendPresenceHeartbeat()).resolves.toEqual({ ok: true });

    const submitted = await controller.submitGuess({
      clientRequestId: 'request-1',
      guess: 'adore',
      roundNumber: 2,
    });
    controller.publishLocalPlayerSubmittedProjection({
      roundNumber: submitted.submission.roundNumber,
    });

    expect(submitted.viewModel.ownRoundState).toBe('waiting_for_rival');
    expect(receivedStatuses.at(0)).toBe('active_round');
    expect(receivedStatuses.at(-1)).toBe('round_resolving');
    expect(JSON.stringify(controller.getViewModel()).toLowerCase()).not.toContain('target');
    expect(JSON.stringify(controller.getViewModel()).toLowerCase()).not.toContain('dictionary');
    expect(JSON.stringify(controller.getViewModel()).toLowerCase()).not.toContain('feedback_json');
    unsubscribe();
  });

  it('sends active reactions through the same local realtime session boundary', async () => {
    const controller = createWordDuelActiveController({
      handoff: createWordDuelActiveDemoHandoff(),
      realtimeNow: () => Date.parse('2026-07-05T08:00:00.000Z'),
    });

    await expect(controller.sendReaction({
      clientRequestId: 'reaction-1',
      reaction: 'tick_tock',
    })).resolves.toEqual({ ok: true });
    await expect(controller.sendReaction({
      clientRequestId: 'reaction-1',
      reaction: 'tick_tock',
    })).resolves.toEqual({ duplicate: true, ok: true });
  });

  it('fails closed when asked for runtime before Apps AV API and Convex are enabled', async () => {
    const controller = createWordDuelActiveController({
      handoff: createWordDuelActiveDemoHandoff({ gameLanguage: 'es' }),
      mode: 'runtime',
    });

    expect(controller.source).toBe('disabled_runtime');
    expect(controller.getViewModel().gameLanguage).toBe('es');
    await expect(controller.sendPresenceHeartbeat()).resolves.toEqual({
      ok: false,
      reason: 'room_unavailable',
    });
    await expect(controller.submitGuess({
      clientRequestId: 'request-1',
      guess: 'adore',
      roundNumber: 2,
    })).rejects.toBeInstanceOf(WordDuelActiveControllerError);
  });

  it('uses injected Apps AV API and realtime clients for runtime active commands', async () => {
    const apiCalls: unknown[] = [];
    const apiClient = createApiClientStub({
      async submitGuess(input) {
        apiCalls.push(input);
        return {
          game: apiGamePayload({
            currentRound: 2,
            roundDeadlineAt: '2026-07-05T08:00:37.000Z',
            status: 'active_round',
          }),
          round: {
            feedbackAvailable: false,
            gameFinalized: false,
            resultReason: null,
            roundNumber: 2,
            status: 'open',
            waitingForOpponent: true,
            winnerSide: null,
          },
          submission: {
            accepted: true,
            roundNumber: 2,
            side: 'a',
            submittedAt: '2026-07-05T08:00:02.000Z',
          },
        };
      },
    });
    const realtimeClient = createLocalDuelWordsRealtimeProjectionClient({
      gameLanguage: 'en',
      now: () => NOW_MS,
      ownSide: 'a',
      realtimeSessionId: RUNTIME_SESSION.realtime.realtimeSessionId,
      remainingMs: 37_000,
      roomToken: RUNTIME_SESSION.realtime.roomToken,
      roundNumber: 2,
    });
    const controller = createWordDuelActiveController({
      handoff: createWordDuelActiveDemoHandoff(),
      mode: 'runtime',
      realtimeNow: () => NOW_MS,
      runtime: {
        apiClient,
        realtimeClient,
        session: RUNTIME_SESSION,
      },
    });
    const receivedStatuses: (string | null)[] = [];
    const unsubscribe = controller.subscribeActiveRoomView((view) => {
      receivedStatuses.push(view?.room.status ?? null);
    });

    expect(controller.source).toBe('apps_av_api');
    await expect(controller.sendPresenceHeartbeat()).resolves.toEqual({ ok: true });
    await expect(controller.sendReaction({
      clientRequestId: 'reaction-1',
      reaction: 'tick_tock',
    })).resolves.toEqual({ ok: true });

    const submitted = await controller.submitGuess({
      clientRequestId: 'submit-a-001',
      guess: 'adore',
      roundNumber: 2,
    });

    expect(apiCalls).toEqual([
      {
        actor: RUNTIME_SESSION.actor,
        clientRequestId: 'submit-a-001',
        gameId: 'game-1',
        guess: 'adore',
        playerId: 'player-a',
        roundNumber: 2,
      },
    ]);
    expect(submitted).toMatchObject({
      requestPath: '/v1/apps/duelwords/games/game-1/rounds/2/submit',
      submission: {
        acceptedAt: '2026-07-05T08:00:02.000Z',
        clientRequestId: 'submit-a-001',
        letterCount: 5,
        playerId: 'player-a',
        roundNumber: 2,
      },
      viewModel: {
        ownRoundState: 'waiting_for_rival',
      },
    });
    expect(receivedStatuses.at(0)).toBe('active_round');
    expect(JSON.stringify(controller).toLowerCase()).not.toContain('game-1');
    expect(JSON.stringify(controller).toLowerCase()).not.toContain('player-a');
    expect(JSON.stringify(controller).toLowerCase()).not.toContain('dwr_room_1');
    expect(JSON.stringify(controller.getViewModel()).toLowerCase()).not.toContain('target');
    expect(JSON.stringify(controller.getViewModel()).toLowerCase()).not.toContain('dictionary');
    unsubscribe();
  });

  it('refreshes own snapshot through Apps AV API without exposing opponent letters', async () => {
    const snapshotCalls: unknown[] = [];
    const apiClient = createApiClientStub({
      async getOwnRoundSnapshot(input) {
        snapshotCalls.push(input);
        return ownSnapshotPayload();
      },
    });
    const controller = createWordDuelActiveController({
      handoff: createWordDuelActiveDemoHandoff(),
      mode: 'runtime',
      runtime: {
        apiClient,
        realtimeClient: createLocalDuelWordsRealtimeProjectionClient({
          realtimeSessionId: RUNTIME_SESSION.realtime.realtimeSessionId,
          roomToken: RUNTIME_SESSION.realtime.roomToken,
        }),
        session: RUNTIME_SESSION,
      },
    });

    const result = await controller.refreshOwnRoundSnapshot({
      roundNumber: 2,
    });

    expect(snapshotCalls).toEqual([
      {
        actor: RUNTIME_SESSION.actor,
        gameId: 'game-1',
        playerId: 'player-a',
        roundNumber: 2,
      },
    ]);
    expect(result).toMatchObject({
      feedbackAvailable: true,
      opponentStatus: 'submitted',
      ownStatus: 'accepted',
      roundNumber: 2,
      viewModel: {
        ownRoundState: 'resolving',
      },
    });
    expect(result.viewModel.ownBoardRows[1]).toMatchObject({
      cells: [
        { feedback: 'exact', letter: 'C' },
        { feedback: 'absent', letter: 'I' },
        { feedback: 'absent', letter: 'V' },
        { feedback: 'absent', letter: 'I' },
        { feedback: 'absent', letter: 'C' },
      ],
      state: 'revealed',
    });
    expect(result.viewModel.ownKeyboardFeedback.c).toBe('exact');
    expect(JSON.stringify(result.viewModel.opponent).toLowerCase()).not.toContain('arose');
    expect(JSON.stringify(result.viewModel.opponent).toLowerCase()).not.toContain('feedback');
    expect(JSON.stringify(result).toLowerCase()).not.toContain('target');
  });
});

function createApiClientStub(overrides: Partial<DuelWordsApiClient>): DuelWordsApiClient {
  async function unexpectedCall(): Promise<never> {
    throw new Error('Unexpected Apps AV API call.');
  }

  return {
    cancelInvite: unexpectedCall,
    createInvite: unexpectedCall,
    createRealtimeSession: unexpectedCall,
    getInvitePreview: unexpectedCall,
    getLobby: unexpectedCall,
    getOwnRoundSnapshot: unexpectedCall,
    getRoomCodePreview: unexpectedCall,
    joinInvite: unexpectedCall,
    markReady: unexpectedCall,
    openFirstRoundIfDue: unexpectedCall,
    openNextRoundIfDue: unexpectedCall,
    submitGuess: unexpectedCall,
    timeoutRound: unexpectedCall,
    ...overrides,
  };
}

function apiGamePayload(overrides: Partial<DuelWordsApiSafeGame> = {}): DuelWordsApiSafeGame {
  return {
    countdownEndsAt: null,
    currentRound: 2,
    gameId: 'game-1',
    language: 'en',
    maxAttempts: 6,
    mode: 'human_duel',
    players: [
      {
        joinedAt: '2026-07-05T08:00:00.000Z',
        playerId: 'player-a',
        readyAt: '2026-07-05T08:00:00.000Z',
        safeDisplayName: 'You',
        side: 'a',
        status: 'ready',
      },
      {
        joinedAt: '2026-07-05T08:00:00.000Z',
        playerId: 'player-b',
        readyAt: '2026-07-05T08:00:00.000Z',
        safeDisplayName: 'Rival',
        side: 'b',
        status: 'ready',
      },
    ],
    roomToken: 'dwr_room_1',
    roundDeadlineAt: '2026-07-05T08:00:37.000Z',
    status: 'active_round',
    wordLength: 5,
    ...overrides,
  };
}

function ownSnapshotPayload(): DuelWordsApiOwnRoundSnapshot {
  return {
    feedbackAvailable: true,
    game: apiGamePayload({
      status: 'round_resolving',
    }),
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
      submittedAt: '2026-07-05T08:00:02.000Z',
    },
    roundNumber: 2,
    roundStatus: 'resolved',
    side: 'a',
  };
}
