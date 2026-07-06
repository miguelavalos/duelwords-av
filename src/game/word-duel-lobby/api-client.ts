import type { DuelWordsActorIdentity } from '../word-duel-active/api-adapter';
import {
  readDuelWordsRealtimeSessionFromApiPayload,
  type DuelWordsBackendRealtimeSession,
  type DuelWordsRealtimeSessionParseErrorCode,
} from '../word-duel-active/realtime-session';
import type { GameLanguage } from '../word-duel-engine';
import type {
  WordDuelLobbyJoinAvailability,
  WordDuelLobbySide,
  WordDuelLobbyStatus,
} from './view-model';

export const DUELWORDS_APPS_AV_APP_ID = 'duelwordsav';

export type DuelWordsApiPlatform = 'android' | 'ios' | 'web';

export type DuelWordsApiActor =
  | {
      actorType: 'guest_session';
      guestSessionId: string;
      safeDisplayName: string;
    }
  | {
      actorType: 'account_user';
      safeDisplayName?: string;
    };

export type DuelWordsApiSafePlayer = {
  joinedAt: string;
  playerId: string;
  readyAt: string | null;
  safeDisplayName: string;
  side: WordDuelLobbySide;
  status: 'abandoned' | 'finalized' | 'joined' | 'left' | 'ready';
};

export type DuelWordsApiSafeGame = {
  countdownEndsAt: string | null;
  currentRound: number;
  gameId: string;
  language: GameLanguage;
  maxAttempts: number;
  mode: 'human_duel';
  players: DuelWordsApiSafePlayer[];
  roomToken: string;
  roundDeadlineAt: string | null;
  status: DuelWordsApiRoomStatus;
  wordLength: number;
};

export type DuelWordsApiRoomStatus =
  | WordDuelLobbyStatus
  | 'pending_invite'
  | 'ready_locked'
  | 'round_resolving'
  | 'finalized'
  | 'technical_error';

export type DuelWordsApiInviteAvailability =
  | WordDuelLobbyJoinAvailability
  | 'already_started'
  | 'finalized';

export type DuelWordsApiInvitePreview = {
  challengeName: 'Word Duel';
  expiresAt: string | null;
  gameLanguage: GameLanguage;
  gameName: 'DuelWords AV';
  hostSafeDisplayName: string;
  inviteToken: string;
  joinAvailability: DuelWordsApiInviteAvailability;
  maxAttempts: number;
  mode: 'human_duel';
  playerCount: number;
  roomCode: string;
  roomState: DuelWordsApiRoomStatus | 'waiting_for_opponent';
  settingsLocked: true;
  solutionSelected: boolean;
  wordLength: number;
};

export type DuelWordsApiLobbyView = {
  game: DuelWordsApiSafeGame;
  invite: DuelWordsApiInvitePreview;
  viewer: {
    isHost: boolean;
    playerId: string;
    side: WordDuelLobbySide;
  } | null;
};

export type DuelWordsApiLobbyResponse = {
  invite: DuelWordsApiInvitePreview;
  lobby: DuelWordsApiLobbyView;
  realtime: DuelWordsBackendRealtimeSession | null;
};

export type DuelWordsApiGameResponse = {
  game: DuelWordsApiSafeGame;
};

export type DuelWordsApiRoundTransition = {
  feedbackAvailable: boolean;
  gameFinalized: boolean;
  resultReason: string | null;
  roundNumber: number;
  status: 'open' | 'resolved';
  waitingForOpponent: boolean;
  winnerSide: WordDuelLobbySide | 'draw' | null;
};

export type DuelWordsApiSubmitGuessResponse = {
  game: DuelWordsApiSafeGame;
  round: DuelWordsApiRoundTransition;
  submission: {
    accepted: true;
    roundNumber: number;
    side: WordDuelLobbySide;
    submittedAt: string;
  };
};

export type DuelWordsApiTimeoutRoundResponse = {
  game: DuelWordsApiSafeGame;
  round: DuelWordsApiRoundTransition;
  timeout: {
    roundNumber: number;
    side: WordDuelLobbySide;
    status: 'already_submitted' | 'timed_out';
    timedOutAt: string | null;
  };
};

export type DuelWordsApiFeedbackState = 'absent' | 'correct' | 'present';

export type DuelWordsApiGuessFeedback = {
  isCorrect: boolean;
  states: DuelWordsApiFeedbackState[];
  version: 'duelwords-feedback-v1';
  wordLength: number;
};

export type DuelWordsApiOwnRoundSnapshot = {
  feedbackAvailable: boolean;
  game: DuelWordsApiSafeGame;
  opponent: {
    status: 'submitted' | 'timed_out' | 'waiting';
  };
  own:
    | {
        status: 'waiting';
      }
    | {
        status: 'submitted_pending';
        submittedAt: string;
      }
    | {
        status: 'timeout';
      }
    | {
        displayWord: string;
        feedback: DuelWordsApiGuessFeedback;
        status: 'accepted';
        submittedAt: string;
      };
  roundNumber: number;
  roundStatus: 'open' | 'resolved';
  side: WordDuelLobbySide;
};

export type DuelWordsApiFinalResultGuess =
  | {
      roundNumber: number;
      status: 'timeout';
    }
  | {
      displayWord: string;
      feedback: DuelWordsApiGuessFeedback;
      roundNumber: number;
      status: 'accepted';
      submittedAt: string;
    };

export type DuelWordsApiFinalResultParticipant = {
  attemptsUsed: number;
  guesses: DuelWordsApiFinalResultGuess[];
  safeDisplayName: string;
  side: WordDuelLobbySide;
  solved: boolean;
};

export type DuelWordsApiFinalResult = {
  game: DuelWordsApiSafeGame;
  opponent: DuelWordsApiFinalResultParticipant;
  own: DuelWordsApiFinalResultParticipant;
  result: {
    finalizedAt: string;
    resultReason: string;
    targetDisplayWord: string;
    winnerSide: WordDuelLobbySide | 'draw';
  };
  viewer: {
    outcome: 'draw' | 'loss' | 'no_winner' | 'win';
    playerId: string;
    side: WordDuelLobbySide;
  };
};

export type DuelWordsApiRematchProposalStatus = 'accepted' | 'cancelled' | 'declined' | 'expired' | 'sent';

export type DuelWordsApiRematchProposalPlayer = {
  playerId: string;
  safeDisplayName: string;
  side: WordDuelLobbySide;
};

export type DuelWordsApiRematchProposal = {
  createdAt: string;
  expiresAt: string;
  nextGame: DuelWordsApiSafeGame | null;
  owner: DuelWordsApiRematchProposalPlayer;
  previousGameId: string;
  proposalId: string;
  recipient: DuelWordsApiRematchProposalPlayer;
  remainingSeconds: number | null;
  respondedAt: string | null;
  settings: {
    language: GameLanguage;
    maxAttempts: number;
    wordLength: number;
  };
  status: DuelWordsApiRematchProposalStatus;
  viewer: {
    canAccept: boolean;
    canCancel: boolean;
    canDecline: boolean;
    playerId: string;
    role: 'owner' | 'recipient';
    side: WordDuelLobbySide;
  };
};

export type DuelWordsApiRealtimeSessionResult =
  | {
      ok: true;
      realtime: DuelWordsBackendRealtimeSession;
    }
  | {
      ok: false;
      reason: DuelWordsApiRealtimeUnavailableReason;
    };

export type DuelWordsApiRealtimeUnavailableReason =
  | DuelWordsRealtimeSessionParseErrorCode
  | 'realtime_unavailable';

export type DuelWordsApiClient = {
  cancelInvite(input: { actor: DuelWordsActorIdentity; inviteToken: string }): Promise<DuelWordsApiLobbyResponse>;
  createInvite(input: {
    dictionaryRelease?: string;
    host: DuelWordsApiActor;
    language: GameLanguage;
    maxAttempts?: number;
  }): Promise<DuelWordsApiLobbyResponse>;
  createRealtimeSession(input: {
    actor: DuelWordsActorIdentity;
    gameId: string;
    playerId: string;
  }): Promise<DuelWordsApiRealtimeSessionResult>;
  getCurrentRematchProposal(input: {
    actor: DuelWordsActorIdentity;
    gameId: string;
    playerId: string;
  }): Promise<DuelWordsApiRematchProposal | null>;
  createRematchProposal(input: {
    actor: DuelWordsActorIdentity;
    gameId: string;
    language: GameLanguage;
    playerId: string;
  }): Promise<DuelWordsApiRematchProposal>;
  acceptRematchProposal(input: {
    actor: DuelWordsActorIdentity;
    gameId: string;
    playerId: string;
    proposalId: string;
  }): Promise<DuelWordsApiRematchProposal>;
  declineRematchProposal(input: {
    actor: DuelWordsActorIdentity;
    gameId: string;
    playerId: string;
    proposalId: string;
  }): Promise<DuelWordsApiRematchProposal>;
  cancelRematchProposal(input: {
    actor: DuelWordsActorIdentity;
    gameId: string;
    playerId: string;
    proposalId: string;
  }): Promise<DuelWordsApiRematchProposal>;
  getInvitePreview(input: { inviteToken: string }): Promise<{ invite: DuelWordsApiInvitePreview }>;
  getLobby(input: {
    actor: DuelWordsActorIdentity;
    gameId: string;
    playerId: string;
  }): Promise<{ lobby: DuelWordsApiLobbyView }>;
  getOwnRoundSnapshot(input: {
    actor: DuelWordsActorIdentity;
    gameId: string;
    playerId: string;
    roundNumber: number;
  }): Promise<DuelWordsApiOwnRoundSnapshot>;
  getFinalResult(input: {
    actor: DuelWordsActorIdentity;
    gameId: string;
    playerId: string;
  }): Promise<DuelWordsApiFinalResult>;
  getRoomCodePreview(input: { roomCode: string }): Promise<{ invite: DuelWordsApiInvitePreview }>;
  joinInvite(input: {
    inviteToken: string;
    player: DuelWordsApiActor;
  }): Promise<DuelWordsApiLobbyResponse>;
  markReady(input: {
    actor: DuelWordsActorIdentity;
    gameId: string;
    playerId: string;
  }): Promise<DuelWordsApiGameResponse>;
  openNextRoundIfDue(input: { gameId: string; roundNumber: number }): Promise<DuelWordsApiGameResponse>;
  openFirstRoundIfDue(input: { gameId: string }): Promise<DuelWordsApiGameResponse>;
  submitGuess(input: {
    actor: DuelWordsActorIdentity;
    clientRequestId: string;
    gameId: string;
    guess: string;
    playerId: string;
    roundNumber: number;
  }): Promise<DuelWordsApiSubmitGuessResponse>;
  timeoutRound(input: {
    actor: DuelWordsActorIdentity;
    gameId: string;
    playerId: string;
    roundNumber: number;
  }): Promise<DuelWordsApiTimeoutRoundResponse>;
};

export type DuelWordsApiClientConfig = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  getAuthToken?: () => Promise<string | null> | string | null;
  platform?: DuelWordsApiPlatform;
};

export class DuelWordsApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message = 'DuelWords API request failed.') {
    super(`${message} ${status} ${code}`);
    this.name = 'DuelWordsApiError';
    this.code = code;
    this.status = status;
  }
}

export function createDuelWordsApiClient(config: DuelWordsApiClientConfig): DuelWordsApiClient {
  const baseUrl = normalizedBaseUrl(config.baseUrl);
  const fetchImpl = config.fetchImpl ?? fetch;

  async function requestJson(path: string, init: {
    body?: unknown;
    method?: 'GET' | 'POST';
  } = {}): Promise<unknown> {
    const token = await maybeAuthToken(config.getAuthToken);
    const response = await fetchImpl(`${baseUrl}${path}`, {
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      headers: {
        Accept: 'application/json',
        'x-appsav-app-id': DUELWORDS_APPS_AV_APP_ID,
        ...(config.platform ? { 'x-appsav-platform': config.platform } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      method: init.method ?? 'GET',
    });

    if (!response.ok) {
      throw new DuelWordsApiError(response.status, await errorCode(response));
    }

    return response.json();
  }

  return {
    async cancelInvite(input) {
      const payload = await requestJson(`/v1/apps/duelwords/invites/${encodePath(input.inviteToken)}/cancel`, {
        body: {
          actor: input.actor,
        },
        method: 'POST',
      });

      return readLobbyPayload(payload);
    },

    async createInvite(input) {
      const payload = await requestJson('/v1/apps/duelwords/invites', {
        body: stripUndefined({
          dictionaryRelease: input.dictionaryRelease,
          host: input.host,
          language: input.language,
          maxAttempts: input.maxAttempts,
        }),
        method: 'POST',
      });

      return readLobbyPayload(payload);
    },

    async createRealtimeSession(input) {
      let payload: unknown;
      try {
        payload = await requestJson(`/v1/apps/duelwords/games/${encodePath(input.gameId)}/realtime-sessions`, {
          body: {
            actor: input.actor,
            playerId: input.playerId,
          },
          method: 'POST',
        });
      } catch (error) {
        if (error instanceof DuelWordsApiError && error.code === 'realtime_unavailable') {
          return { ok: false, reason: 'realtime_unavailable' };
        }
        throw error;
      }

      return readRealtimeResult(payload);
    },

    async getCurrentRematchProposal(input) {
      const query = actorIdentityQuery(input.actor);
      query.set('playerId', input.playerId);
      const payload = await requestJson(
        `/v1/apps/duelwords/games/${encodePath(input.gameId)}/rematch-proposals/current?${query}`,
      );
      const proposal = readRequiredProperty(payload, 'proposal');
      return proposal === null ? null : readRematchProposal(proposal);
    },

    async createRematchProposal(input) {
      const payload = await requestJson(`/v1/apps/duelwords/games/${encodePath(input.gameId)}/rematch-proposals`, {
        body: {
          actor: input.actor,
          language: input.language,
          playerId: input.playerId,
        },
        method: 'POST',
      });

      return readRematchProposal(readRequiredProperty(payload, 'proposal'));
    },

    async acceptRematchProposal(input) {
      const payload = await requestJson(
        `/v1/apps/duelwords/games/${encodePath(input.gameId)}/rematch-proposals/${encodePath(input.proposalId)}/accept`,
        {
          body: {
            actor: input.actor,
            playerId: input.playerId,
          },
          method: 'POST',
        },
      );

      return readRematchProposal(readRequiredProperty(payload, 'proposal'));
    },

    async declineRematchProposal(input) {
      const payload = await requestJson(
        `/v1/apps/duelwords/games/${encodePath(input.gameId)}/rematch-proposals/${encodePath(input.proposalId)}/decline`,
        {
          body: {
            actor: input.actor,
            playerId: input.playerId,
          },
          method: 'POST',
        },
      );

      return readRematchProposal(readRequiredProperty(payload, 'proposal'));
    },

    async cancelRematchProposal(input) {
      const payload = await requestJson(
        `/v1/apps/duelwords/games/${encodePath(input.gameId)}/rematch-proposals/${encodePath(input.proposalId)}/cancel`,
        {
          body: {
            actor: input.actor,
            playerId: input.playerId,
          },
          method: 'POST',
        },
      );

      return readRematchProposal(readRequiredProperty(payload, 'proposal'));
    },

    async getInvitePreview(input) {
      const payload = await requestJson(`/v1/apps/duelwords/invites/${encodePath(input.inviteToken)}`);
      return {
        invite: readInvitePreview(readRequiredProperty(payload, 'invite')),
      };
    },

    async getLobby(input) {
      const query = actorIdentityQuery(input.actor);
      query.set('playerId', input.playerId);
      const payload = await requestJson(`/v1/apps/duelwords/games/${encodePath(input.gameId)}/lobby?${query}`);

      return {
        lobby: readLobbyView(readRequiredProperty(payload, 'lobby')),
      };
    },

    async getOwnRoundSnapshot(input) {
      const query = actorIdentityQuery(input.actor);
      query.set('playerId', input.playerId);
      const payload = await requestJson(
        `/v1/apps/duelwords/games/${encodePath(input.gameId)}/rounds/${input.roundNumber}/own-snapshot?${query}`,
      );

      return readOwnRoundSnapshot(payload);
    },

    async getFinalResult(input) {
      const query = actorIdentityQuery(input.actor);
      query.set('playerId', input.playerId);
      const payload = await requestJson(`/v1/apps/duelwords/games/${encodePath(input.gameId)}/final-result?${query}`);

      return readFinalResult(payload);
    },

    async getRoomCodePreview(input) {
      const payload = await requestJson(`/v1/apps/duelwords/room-codes/${encodePath(input.roomCode)}`);
      return {
        invite: readInvitePreview(readRequiredProperty(payload, 'invite')),
      };
    },

    async joinInvite(input) {
      const payload = await requestJson(`/v1/apps/duelwords/invites/${encodePath(input.inviteToken)}/join`, {
        body: {
          player: input.player,
        },
        method: 'POST',
      });

      return readLobbyPayload(payload);
    },

    async markReady(input) {
      const payload = await requestJson(`/v1/apps/duelwords/games/${encodePath(input.gameId)}/ready`, {
        body: {
          actor: input.actor,
          playerId: input.playerId,
        },
        method: 'POST',
      });

      return {
        game: readSafeGame(readRequiredProperty(payload, 'game')),
      };
    },

    async openFirstRoundIfDue(input) {
      const payload = await requestJson(`/v1/apps/duelwords/games/${encodePath(input.gameId)}/start`, {
        body: {},
        method: 'POST',
      });

      return {
        game: readSafeGame(readRequiredProperty(payload, 'game')),
      };
    },

    async openNextRoundIfDue(input) {
      const payload = await requestJson(
        `/v1/apps/duelwords/games/${encodePath(input.gameId)}/rounds/${input.roundNumber}/open-next-if-due`,
        {
          body: {},
          method: 'POST',
        },
      );

      return {
        game: readSafeGame(readRequiredProperty(payload, 'game')),
      };
    },

    async submitGuess(input) {
      const payload = await requestJson(
        `/v1/apps/duelwords/games/${encodePath(input.gameId)}/rounds/${input.roundNumber}/submit`,
        {
          body: {
            actor: input.actor,
            clientRequestId: input.clientRequestId,
            guess: input.guess,
            playerId: input.playerId,
          },
          method: 'POST',
        },
      );

      return readSubmitGuessPayload(payload);
    },

    async timeoutRound(input) {
      const payload = await requestJson(
        `/v1/apps/duelwords/games/${encodePath(input.gameId)}/rounds/${input.roundNumber}/timeout`,
        {
          body: {
            actor: input.actor,
            playerId: input.playerId,
          },
          method: 'POST',
        },
      );

      return readTimeoutRoundPayload(payload);
    },
  };
}

function readLobbyPayload(payload: unknown): DuelWordsApiLobbyResponse {
  return {
    invite: readInvitePreview(readRequiredProperty(payload, 'invite')),
    lobby: readLobbyView(readRequiredProperty(payload, 'lobby')),
    realtime: readOptionalRealtime(payload),
  };
}

function readRealtimeResult(payload: unknown): DuelWordsApiRealtimeSessionResult {
  const parsed = readDuelWordsRealtimeSessionFromApiPayload(payload);
  if (!parsed.ok) {
    return { ok: false, reason: parsed.reason };
  }

  return {
    ok: true,
    realtime: parsed.session,
  };
}

function readOptionalRealtime(payload: unknown): DuelWordsBackendRealtimeSession | null {
  const parsed = readDuelWordsRealtimeSessionFromApiPayload(payload);
  if (parsed.ok) {
    return parsed.session;
  }
  if (parsed.reason === 'missing_realtime') {
    return null;
  }

  throw new DuelWordsApiError(0, parsed.reason, 'DuelWords realtime session payload was rejected.');
}

function readLobbyView(value: unknown): DuelWordsApiLobbyView {
  return {
    game: readSafeGame(readRequiredProperty(value, 'game')),
    invite: readInvitePreview(readRequiredProperty(value, 'invite')),
    viewer: readOptionalViewer(readOptionalProperty(value, 'viewer')),
  };
}

function readInvitePreview(value: unknown): DuelWordsApiInvitePreview {
  const input = requireRecord(value);
  return {
    challengeName: requireLiteral(input.challengeName, 'Word Duel'),
    expiresAt: optionalString(input.expiresAt),
    gameLanguage: readLanguage(input.gameLanguage),
    gameName: requireLiteral(input.gameName, 'DuelWords AV'),
    hostSafeDisplayName: requireString(input.hostSafeDisplayName),
    inviteToken: requireString(input.inviteToken),
    joinAvailability: readInviteAvailability(input.joinAvailability),
    maxAttempts: requireNumber(input.maxAttempts),
    mode: requireLiteral(input.mode, 'human_duel'),
    playerCount: requireNumber(input.playerCount),
    roomCode: requireString(input.roomCode),
    roomState: readRoomState(input.roomState),
    settingsLocked: requireLiteral(input.settingsLocked, true),
    solutionSelected: requireBoolean(input.solutionSelected),
    wordLength: requireNumber(input.wordLength),
  };
}

function readSafeGame(value: unknown): DuelWordsApiSafeGame {
  const input = requireRecord(value);
  return {
    countdownEndsAt: optionalString(input.countdownEndsAt),
    currentRound: requireNumber(input.currentRound),
    gameId: requireString(input.gameId),
    language: readLanguage(input.language),
    maxAttempts: requireNumber(input.maxAttempts),
    mode: requireLiteral(input.mode, 'human_duel'),
    players: requireArray(input.players).slice(0, 2).map(readSafePlayer),
    roomToken: requireString(input.roomToken),
    roundDeadlineAt: optionalString(input.roundDeadlineAt),
    status: readRoomStatus(input.status),
    wordLength: requireNumber(input.wordLength),
  };
}

function readSubmitGuessPayload(payload: unknown): DuelWordsApiSubmitGuessResponse {
  return {
    game: readSafeGame(readRequiredProperty(payload, 'game')),
    round: readRoundTransition(readRequiredProperty(payload, 'round')),
    submission: readSubmitGuessSummary(readRequiredProperty(payload, 'submission')),
  };
}

function readTimeoutRoundPayload(payload: unknown): DuelWordsApiTimeoutRoundResponse {
  return {
    game: readSafeGame(readRequiredProperty(payload, 'game')),
    round: readRoundTransition(readRequiredProperty(payload, 'round')),
    timeout: readTimeoutSummary(readRequiredProperty(payload, 'timeout')),
  };
}

function readSafePlayer(value: unknown): DuelWordsApiSafePlayer {
  const input = requireRecord(value);
  return {
    joinedAt: requireString(input.joinedAt),
    playerId: requireString(input.playerId),
    readyAt: optionalString(input.readyAt),
    safeDisplayName: requireString(input.safeDisplayName),
    side: readSide(input.side),
    status: readPlayerStatus(input.status),
  };
}

function readSubmitGuessSummary(value: unknown): DuelWordsApiSubmitGuessResponse['submission'] {
  const input = requireRecord(value);
  return {
    accepted: requireLiteral(input.accepted, true),
    roundNumber: requireNumber(input.roundNumber),
    side: readSide(input.side),
    submittedAt: requireString(input.submittedAt),
  };
}

function readTimeoutSummary(value: unknown): DuelWordsApiTimeoutRoundResponse['timeout'] {
  const input = requireRecord(value);
  return {
    roundNumber: requireNumber(input.roundNumber),
    side: readSide(input.side),
    status: readTimeoutStatus(input.status),
    timedOutAt: optionalString(input.timedOutAt),
  };
}

function readRoundTransition(value: unknown): DuelWordsApiRoundTransition {
  const input = requireRecord(value);
  return {
    feedbackAvailable: requireBoolean(input.feedbackAvailable),
    gameFinalized: requireBoolean(input.gameFinalized),
    resultReason: optionalString(input.resultReason),
    roundNumber: requireNumber(input.roundNumber),
    status: readRoundTransitionStatus(input.status),
    waitingForOpponent: requireBoolean(input.waitingForOpponent),
    winnerSide: readWinnerSide(input.winnerSide),
  };
}

function readOwnRoundSnapshot(value: unknown): DuelWordsApiOwnRoundSnapshot {
  const input = requireRecord(value);
  return {
    feedbackAvailable: requireBoolean(input.feedbackAvailable),
    game: readSafeGame(readRequiredProperty(input, 'game')),
    opponent: readOpponentSnapshot(readRequiredProperty(input, 'opponent')),
    own: readOwnSnapshot(readRequiredProperty(input, 'own')),
    roundNumber: requireNumber(input.roundNumber),
    roundStatus: readRoundTransitionStatus(input.roundStatus),
    side: readSide(input.side),
  };
}

function readFinalResult(value: unknown): DuelWordsApiFinalResult {
  const input = requireRecord(value);
  const game = readSafeGame(readRequiredProperty(input, 'game'));
  return {
    game,
    opponent: readFinalResultParticipant(readRequiredProperty(input, 'opponent'), game.wordLength),
    own: readFinalResultParticipant(readRequiredProperty(input, 'own'), game.wordLength),
    result: readFinalResultSummary(readRequiredProperty(input, 'result')),
    viewer: readFinalResultViewer(readRequiredProperty(input, 'viewer')),
  };
}

function readRematchProposal(value: unknown): DuelWordsApiRematchProposal {
  const input = requireRecord(value);
  return {
    createdAt: requireString(input.createdAt),
    expiresAt: requireString(input.expiresAt),
    nextGame: readOptionalSafeGame(readRequiredProperty(input, 'nextGame')),
    owner: readRematchProposalPlayer(readRequiredProperty(input, 'owner')),
    previousGameId: requireString(input.previousGameId),
    proposalId: requireString(input.proposalId),
    recipient: readRematchProposalPlayer(readRequiredProperty(input, 'recipient')),
    remainingSeconds: optionalNumber(input.remainingSeconds),
    respondedAt: optionalString(input.respondedAt),
    settings: readRematchProposalSettings(readRequiredProperty(input, 'settings')),
    status: readRematchProposalStatus(input.status),
    viewer: readRematchProposalViewer(readRequiredProperty(input, 'viewer')),
  };
}

function readOptionalSafeGame(value: unknown): DuelWordsApiSafeGame | null {
  if (value === null) {
    return null;
  }

  return readSafeGame(value);
}

function readRematchProposalPlayer(value: unknown): DuelWordsApiRematchProposalPlayer {
  const input = requireRecord(value);
  return {
    playerId: requireString(input.playerId),
    safeDisplayName: requireString(input.safeDisplayName),
    side: readSide(input.side),
  };
}

function readRematchProposalSettings(value: unknown): DuelWordsApiRematchProposal['settings'] {
  const input = requireRecord(value);
  return {
    language: readLanguage(input.language),
    maxAttempts: requireNumber(input.maxAttempts),
    wordLength: requireNumber(input.wordLength),
  };
}

function readRematchProposalViewer(value: unknown): DuelWordsApiRematchProposal['viewer'] {
  const input = requireRecord(value);
  return {
    canAccept: requireBoolean(input.canAccept),
    canCancel: requireBoolean(input.canCancel),
    canDecline: requireBoolean(input.canDecline),
    playerId: requireString(input.playerId),
    role: readRematchProposalViewerRole(input.role),
    side: readSide(input.side),
  };
}

function readFinalResultParticipant(value: unknown, wordLength: number): DuelWordsApiFinalResultParticipant {
  const input = requireRecord(value);
  const guesses = requireArray(input.guesses).map((guess) => readFinalResultGuess(guess, wordLength));
  const attemptsUsed = requireNumber(input.attemptsUsed);
  if (attemptsUsed !== guesses.length) {
    throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords final result attempts are invalid.');
  }

  return {
    attemptsUsed,
    guesses,
    safeDisplayName: requireString(input.safeDisplayName),
    side: readSide(input.side),
    solved: requireBoolean(input.solved),
  };
}

function readFinalResultGuess(value: unknown, wordLength: number): DuelWordsApiFinalResultGuess {
  const input = requireRecord(value);
  const status = readFinalResultGuessStatus(input.status);
  const roundNumber = requireNumber(input.roundNumber);
  if (status === 'timeout') {
    return {
      roundNumber,
      status,
    };
  }

  const feedback = readGuessFeedback(readRequiredProperty(input, 'feedback'));
  if (feedback.wordLength !== wordLength) {
    throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords final result feedback length is invalid.');
  }

  return {
    displayWord: requireString(input.displayWord),
    feedback,
    roundNumber,
    status,
    submittedAt: requireString(input.submittedAt),
  };
}

function readFinalResultSummary(value: unknown): DuelWordsApiFinalResult['result'] {
  const input = requireRecord(value);
  return {
    finalizedAt: requireString(input.finalizedAt),
    resultReason: requireString(input.resultReason),
    targetDisplayWord: requireString(input.targetDisplayWord),
    winnerSide: readWinnerSideRequired(input.winnerSide),
  };
}

function readFinalResultViewer(value: unknown): DuelWordsApiFinalResult['viewer'] {
  const input = requireRecord(value);
  return {
    outcome: readFinalResultOutcome(input.outcome),
    playerId: requireString(input.playerId),
    side: readSide(input.side),
  };
}

function readOpponentSnapshot(value: unknown): DuelWordsApiOwnRoundSnapshot['opponent'] {
  const input = requireRecord(value);
  return {
    status: readOpponentSnapshotStatus(input.status),
  };
}

function readOwnSnapshot(value: unknown): DuelWordsApiOwnRoundSnapshot['own'] {
  const input = requireRecord(value);
  const status = readOwnSnapshotStatus(input.status);
  if (status === 'waiting' || status === 'timeout') {
    return { status };
  }
  if (status === 'submitted_pending') {
    return {
      status,
      submittedAt: requireString(input.submittedAt),
    };
  }

  return {
    displayWord: requireString(input.displayWord),
    feedback: readGuessFeedback(readRequiredProperty(input, 'feedback')),
    status,
    submittedAt: requireString(input.submittedAt),
  };
}

function readGuessFeedback(value: unknown): DuelWordsApiGuessFeedback {
  const input = requireRecord(value);
  const wordLength = requireNumber(input.wordLength);
  const states = requireArray(input.states).map(readFeedbackState);
  if (states.length !== wordLength) {
    throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API feedback length is invalid.');
  }

  return {
    isCorrect: requireBoolean(input.isCorrect),
    states,
    version: requireLiteral(input.version, 'duelwords-feedback-v1'),
    wordLength,
  };
}

function readOptionalViewer(value: unknown): DuelWordsApiLobbyView['viewer'] {
  if (value === null || value === undefined) {
    return null;
  }

  const input = requireRecord(value);
  return {
    isHost: requireBoolean(input.isHost),
    playerId: requireString(input.playerId),
    side: readSide(input.side),
  };
}

async function maybeAuthToken(getAuthToken: DuelWordsApiClientConfig['getAuthToken']) {
  if (!getAuthToken) {
    return null;
  }

  const token = await getAuthToken();
  return typeof token === 'string' && token.trim().length > 0 ? token.trim() : null;
}

async function errorCode(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    const error = readOptionalProperty(payload, 'error');
    if (isRecord(error) && typeof error.code === 'string' && error.code.trim().length > 0) {
      return error.code.trim();
    }
  } catch {
    return `http_${response.status}`;
  }

  return `http_${response.status}`;
}

function actorIdentityQuery(actor: DuelWordsActorIdentity): URLSearchParams {
  const query = new URLSearchParams({
    actorType: actor.actorType,
  });

  if (actor.actorType === 'guest_session') {
    query.set('guestSessionId', actor.guestSessionId);
  }

  return query;
}

function normalizedBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new DuelWordsApiError(0, 'missing_base_url', 'DuelWords API base URL is required.');
  }

  return trimmed;
}

function encodePath(value: string): string {
  return encodeURIComponent(value);
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined)) as Partial<T>;
}

function readRequiredProperty(value: unknown, key: string): unknown {
  const input = requireRecord(value);
  if (!(key in input)) {
    throw new DuelWordsApiError(0, 'invalid_response', `DuelWords API response is missing ${key}.`);
  }

  return input[key];
}

function readOptionalProperty(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API response shape is invalid.');
  }

  return value;
}

function requireArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API response array is invalid.');
  }

  return value;
}

function requireString(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API response string is invalid.');
  }

  return value;
}

function optionalString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return requireString(value);
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return requireNumber(value);
}

function requireNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API response number is invalid.');
  }

  return value;
}

function requireBoolean(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API response boolean is invalid.');
  }

  return value;
}

function requireLiteral<T extends boolean | number | string>(value: unknown, expected: T): T {
  if (value !== expected) {
    throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API response literal is invalid.');
  }

  return expected;
}

function readLanguage(value: unknown): GameLanguage {
  if (value === 'en' || value === 'es') {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API language is invalid.');
}

function readSide(value: unknown): WordDuelLobbySide {
  if (value === 'a' || value === 'b') {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API side is invalid.');
}

function readInviteAvailability(value: unknown): DuelWordsApiInviteAvailability {
  if (
    value === 'already_started'
    || value === 'cancelled'
    || value === 'expired'
    || value === 'finalized'
    || value === 'full'
    || value === 'joinable'
    || value === 'unavailable'
    || value === 'viewer_already_joined'
  ) {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API invite availability is invalid.');
}

function readRoomState(value: unknown): DuelWordsApiInvitePreview['roomState'] {
  if (value === 'waiting_for_opponent') {
    return value;
  }

  return readRoomStatus(value);
}

function readRoomStatus(value: unknown): DuelWordsApiRoomStatus {
  if (
    value === 'active_round'
    || value === 'cancelled_before_first_round'
    || value === 'countdown'
    || value === 'expired'
    || value === 'finalized'
    || value === 'invite_review'
    || value === 'lobby'
    || value === 'pending_invite'
    || value === 'ready_locked'
    || value === 'round_resolving'
    || value === 'technical_error'
    || value === 'waiting_for_player'
  ) {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API room status is invalid.');
}

function readRoundTransitionStatus(value: unknown): DuelWordsApiRoundTransition['status'] {
  if (value === 'open' || value === 'resolved') {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API round status is invalid.');
}

function readOpponentSnapshotStatus(value: unknown): DuelWordsApiOwnRoundSnapshot['opponent']['status'] {
  if (value === 'submitted' || value === 'timed_out' || value === 'waiting') {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API opponent snapshot status is invalid.');
}

function readOwnSnapshotStatus(value: unknown): DuelWordsApiOwnRoundSnapshot['own']['status'] {
  if (
    value === 'accepted'
    || value === 'submitted_pending'
    || value === 'timeout'
    || value === 'waiting'
  ) {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API own snapshot status is invalid.');
}

function readFeedbackState(value: unknown): DuelWordsApiFeedbackState {
  if (value === 'absent' || value === 'correct' || value === 'present') {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API feedback state is invalid.');
}

function readFinalResultGuessStatus(value: unknown): DuelWordsApiFinalResultGuess['status'] {
  if (value === 'accepted' || value === 'timeout') {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API final result guess status is invalid.');
}

function readFinalResultOutcome(value: unknown): DuelWordsApiFinalResult['viewer']['outcome'] {
  if (value === 'draw' || value === 'loss' || value === 'no_winner' || value === 'win') {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API final result outcome is invalid.');
}

function readRematchProposalStatus(value: unknown): DuelWordsApiRematchProposalStatus {
  if (
    value === 'accepted'
    || value === 'cancelled'
    || value === 'declined'
    || value === 'expired'
    || value === 'sent'
  ) {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API rematch proposal status is invalid.');
}

function readRematchProposalViewerRole(value: unknown): DuelWordsApiRematchProposal['viewer']['role'] {
  if (value === 'owner' || value === 'recipient') {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API rematch proposal viewer role is invalid.');
}

function readTimeoutStatus(value: unknown): DuelWordsApiTimeoutRoundResponse['timeout']['status'] {
  if (value === 'already_submitted' || value === 'timed_out') {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API timeout status is invalid.');
}

function readWinnerSide(value: unknown): DuelWordsApiRoundTransition['winnerSide'] {
  if (value === null || value === undefined) {
    return null;
  }
  if (value === 'draw') {
    return value;
  }

  return readSide(value);
}

function readWinnerSideRequired(value: unknown): WordDuelLobbySide | 'draw' {
  if (value === 'draw') {
    return value;
  }

  return readSide(value);
}

function readPlayerStatus(value: unknown): DuelWordsApiSafePlayer['status'] {
  if (
    value === 'abandoned'
    || value === 'finalized'
    || value === 'joined'
    || value === 'left'
    || value === 'ready'
  ) {
    return value;
  }

  throw new DuelWordsApiError(0, 'invalid_response', 'DuelWords API player status is invalid.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
