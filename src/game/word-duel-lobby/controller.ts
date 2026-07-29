import type {
  DuelWordsActorIdentity,
} from '../word-duel-active/api-adapter';
import type { DuelWordsBackendRealtimeSession } from '../word-duel-active/realtime-session';
import type { GameLanguage } from '../word-duel-engine';
import {
  WORD_DUEL_MAX_ATTEMPTS,
  WORD_DUEL_WORD_LENGTH,
} from '../word-duel-engine';
import type {
  DuelWordsApiActor,
  DuelWordsApiClient,
  DuelWordsApiInviteAvailability,
  DuelWordsApiInvitePreview,
  DuelWordsApiLobbyResponse,
  DuelWordsApiLobbyView,
  DuelWordsApiRematchProposal,
  DuelWordsApiRoomStatus,
  DuelWordsApiSafeGame,
} from './api-client';
import {
  cancelInvite as cancelLocalInvite,
  createLocalInviteLobbyViewModel,
  deriveWordDuelLobbyViewModel,
  expireInvite as expireLocalInvite,
  joinInvite as joinLocalInvite,
  openRoundIfDue as openLocalRoundIfDue,
  pressReady as pressLocalReady,
  viewInviteReview,
  viewLobbyAsHost,
  viewLobbyAsRecipient,
  type WordDuelInvitePreview,
  type WordDuelLobbyJoinAvailability,
  type WordDuelLobbyPlayer,
  type WordDuelLobbySide,
  type WordDuelLobbyStatus,
  type WordDuelLobbyViewModel,
} from './view-model';
import {
  createDuelWordsRuntimeApiClient,
  type DuelWordsRuntimeApiClientBundle,
} from './runtime-api-client';

export type WordDuelLobbyControllerSource = 'apps_av_api' | 'disabled_runtime' | 'local_mock';

export type WordDuelLobbyControllerSession = {
  actor: DuelWordsActorIdentity | null;
  apiInvite: DuelWordsApiInvitePreview | null;
  exposesPublicInvite?: boolean;
  gameId: string | null;
  inviteToken: string | null;
  playerId: string | null;
  side: WordDuelLobbySide | null;
};

export type WordDuelLobbyControllerState = {
  lobby: WordDuelLobbyViewModel;
  realtime: DuelWordsBackendRealtimeSession | null;
  session: WordDuelLobbyControllerSession;
  source: WordDuelLobbyControllerSource;
};

export type WordDuelLobbyController = {
  cancelInvite(input: {
    nowMs: number;
    state: WordDuelLobbyControllerState;
  }): Promise<WordDuelLobbyControllerState>;
  createHostInvite(input: {
    gameLanguage: GameLanguage;
    host?: DuelWordsApiActor;
    nowMs: number;
  }): Promise<WordDuelLobbyControllerState>;
  expireInvite(input: {
    nowMs: number;
    state: WordDuelLobbyControllerState;
  }): Promise<WordDuelLobbyControllerState>;
  joinInvite(input: {
    nowMs: number;
    player?: DuelWordsApiActor;
    safeDisplayName?: string;
    state: WordDuelLobbyControllerState;
  }): Promise<WordDuelLobbyControllerState>;
  joinInviteByToken(input: {
    inviteToken: string;
    nowMs: number;
    player?: DuelWordsApiActor;
    safeDisplayName?: string;
  }): Promise<WordDuelLobbyControllerState>;
  markReady(input: {
    nowMs: number;
    state: WordDuelLobbyControllerState;
  }): Promise<WordDuelLobbyControllerState>;
  openFirstRoundIfDue(input: {
    nowMs: number;
    state: WordDuelLobbyControllerState;
  }): Promise<WordDuelLobbyControllerState>;
  previewInviteByRoomCode(input: {
    nowMs: number;
    roomCode: string;
  }): Promise<WordDuelLobbyControllerState>;
  previewInviteByToken(input: {
    inviteToken: string;
    nowMs: number;
  }): Promise<WordDuelLobbyControllerState>;
  refreshLobby(input: {
    nowMs: number;
    state: WordDuelLobbyControllerState;
  }): Promise<WordDuelLobbyControllerState>;
  source: WordDuelLobbyControllerSource;
  viewAsHost(input: {
    nowMs: number;
    state: WordDuelLobbyControllerState;
  }): Promise<WordDuelLobbyControllerState>;
  viewAsRecipient(input: {
    nowMs: number;
    state: WordDuelLobbyControllerState;
  }): Promise<WordDuelLobbyControllerState>;
  viewInviteReview(input: {
    nowMs: number;
    state: WordDuelLobbyControllerState;
  }): Promise<WordDuelLobbyControllerState>;
};

export type WordDuelLobbyControllerInput =
  | {
      mode: 'local_mock';
    }
  | {
      mode: 'runtime';
      runtimeApiClient?: DuelWordsRuntimeApiClientBundle;
    };

export type WordDuelLobbyControllerErrorCode =
  | 'api_invite_required'
  | 'api_player_required'
  | 'accepted_rematch_required'
  | 'controller_not_available'
  | 'missing_api_actor'
  | 'missing_api_session'
  | 'unsupported_api_lobby_state';

export class WordDuelLobbyControllerError extends Error {
  readonly code: WordDuelLobbyControllerErrorCode;

  constructor(code: WordDuelLobbyControllerErrorCode, message: string) {
    super(message);
    this.name = 'WordDuelLobbyControllerError';
    this.code = code;
  }
}

const LOCAL_SESSION: WordDuelLobbyControllerSession = {
  actor: {
    actorType: 'guest_session',
    guestSessionId: 'local-guest-a',
  },
  apiInvite: null,
  gameId: 'local-lobby-demo',
  inviteToken: 'demo-duel',
  playerId: 'local-player-a',
  side: 'a',
};
const DEFAULT_INVITE_BASE_URL = 'https://app.duelwords-av.avalsys.com/i/c/';

export function createLocalMockWordDuelLobbyControllerState(input: {
  gameLanguage: GameLanguage;
  nowMs: number;
}): WordDuelLobbyControllerState {
  return {
    lobby: createLocalInviteLobbyViewModel({
      gameLanguage: input.gameLanguage,
      nowMs: input.nowMs,
    }),
    realtime: null,
    session: createLocalSession(),
    source: 'local_mock',
  };
}

export function createWordDuelLobbyController(
  input: WordDuelLobbyControllerInput = { mode: 'local_mock' },
): WordDuelLobbyController {
  if (input.mode === 'local_mock') {
    return createLocalMockLobbyController();
  }

  const runtimeApiClient = input.runtimeApiClient ?? createDuelWordsRuntimeApiClient();
  if (!runtimeApiClient.ok) {
    return createDisabledRuntimeLobbyController();
  }

  return createAppsApiLobbyController(runtimeApiClient.client);
}

export function createWordDuelLobbyControllerStateFromAcceptedRematchProposal(input: {
  actor: DuelWordsActorIdentity;
  nowMs: number;
  proposal: DuelWordsApiRematchProposal;
}): WordDuelLobbyControllerState {
  if (input.proposal.status !== 'accepted' || input.proposal.nextGame === null) {
    throw new WordDuelLobbyControllerError(
      'accepted_rematch_required',
      'Accepted rematch lobby handoff requires an accepted proposal with a next game.',
    );
  }

  const nextGame = input.proposal.nextGame;
  // A rematch owner always becomes the next game's host, regardless of which
  // side they occupied in the completed game.
  const viewerSide = input.proposal.viewer.role === 'owner' ? 'a' : 'b';
  const viewerPlayer = nextGame.players.find((player) => player.side === viewerSide);
  if (!viewerPlayer) {
    throw new WordDuelLobbyControllerError(
      'api_player_required',
      'Accepted rematch lobby handoff requires a next-game player for the viewer side.',
    );
  }

  const invite = invitePreviewFromAcceptedRematchGame(nextGame);
  return stateFromApiLobby({
    game: nextGame,
    invite,
    viewer: {
      isHost: viewerSide === 'a',
      playerId: viewerPlayer.playerId,
      side: viewerSide,
    },
  }, null, {
    actor: input.actor,
    apiInvite: invite,
    exposesPublicInvite: false,
    gameId: nextGame.gameId,
    inviteToken: invite.inviteToken,
    playerId: viewerPlayer.playerId,
    side: viewerSide,
  }, input.nowMs);
}

function createLocalMockLobbyController(): WordDuelLobbyController {
  function withLobby(
    state: WordDuelLobbyControllerState,
    lobby: WordDuelLobbyViewModel,
  ): WordDuelLobbyControllerState {
    return {
      ...state,
      lobby,
      session: {
        ...state.session,
        playerId: lobby.viewerSide === 'a' ? 'local-player-a' : 'local-player-b',
        side: lobby.viewerSide,
      },
    };
  }

  return {
    source: 'local_mock',
    async cancelInvite(input) {
      return withLobby(input.state, cancelLocalInvite({
        lobby: input.state.lobby,
        nowMs: input.nowMs,
      }));
    },
    async createHostInvite(input) {
      return createLocalMockWordDuelLobbyControllerState({
        gameLanguage: input.gameLanguage,
        nowMs: input.nowMs,
      });
    },
    async expireInvite(input) {
      return withLobby(input.state, expireLocalInvite({
        lobby: input.state.lobby,
        nowMs: input.nowMs,
      }));
    },
    async joinInvite(input) {
      return withLobby(input.state, joinLocalInvite({
        lobby: input.state.lobby,
        nowMs: input.nowMs,
        safeDisplayName: input.safeDisplayName ?? input.player?.safeDisplayName,
      }));
    },
    async joinInviteByToken(input) {
      const hostState = createLocalMockWordDuelLobbyControllerState({
        gameLanguage: 'en',
        nowMs: input.nowMs,
      });
      const reviewState = withLobby(hostState, viewInviteReview(hostState.lobby, input.nowMs));

      return withLobby(reviewState, joinLocalInvite({
        lobby: reviewState.lobby,
        nowMs: input.nowMs,
        safeDisplayName: input.safeDisplayName ?? input.player?.safeDisplayName,
      }));
    },
    async markReady(input) {
      return withLobby(input.state, pressLocalReady({
        lobby: input.state.lobby,
        nowMs: input.nowMs,
      }));
    },
    async openFirstRoundIfDue(input) {
      return withLobby(input.state, openLocalRoundIfDue({
        lobby: input.state.lobby,
        nowMs: input.nowMs,
      }));
    },
    async previewInviteByRoomCode(input) {
      return localInviteReviewState(input.nowMs);
    },
    async previewInviteByToken(input) {
      return localInviteReviewState(input.nowMs);
    },
    async refreshLobby(input) {
      return input.state;
    },
    async viewAsHost(input) {
      return withLobby(input.state, viewLobbyAsHost(input.state.lobby, input.nowMs));
    },
    async viewAsRecipient(input) {
      return withLobby(input.state, viewLobbyAsRecipient(input.state.lobby, input.nowMs));
    },
    async viewInviteReview(input) {
      return withLobby(input.state, viewInviteReview(input.state.lobby, input.nowMs));
    },
  };
}

function createLocalSession(): WordDuelLobbyControllerSession {
  return {
    ...LOCAL_SESSION,
    actor: LOCAL_SESSION.actor === null ? null : { ...LOCAL_SESSION.actor },
  };
}

function createDisabledRuntimeLobbyController(): WordDuelLobbyController {
  async function reject(): Promise<WordDuelLobbyControllerState> {
    throw new WordDuelLobbyControllerError(
      'controller_not_available',
      'DuelWords Apps AV API runtime is disabled.',
    );
  }

  return {
    source: 'disabled_runtime',
    cancelInvite: reject,
    createHostInvite: reject,
    expireInvite: reject,
    joinInvite: reject,
    joinInviteByToken: reject,
    markReady: reject,
    openFirstRoundIfDue: reject,
    previewInviteByRoomCode: reject,
    previewInviteByToken: reject,
    refreshLobby: reject,
    viewAsHost: reject,
    viewAsRecipient: reject,
    viewInviteReview: reject,
  };
}

function createAppsApiLobbyController(apiClient: DuelWordsApiClient): WordDuelLobbyController {
  return {
    source: 'apps_av_api',
    async cancelInvite(input) {
      const session = requireApiSession(input.state);
      const payload = await apiClient.cancelInvite({
        actor: session.actor,
        inviteToken: session.inviteToken,
      });

      return stateFromApiPayload(payload, input.state.session, input.nowMs);
    },
    async createHostInvite(input) {
      if (!input.host) {
        throw new WordDuelLobbyControllerError('missing_api_actor', 'Apps AV API invite creation requires an actor.');
      }

      const payload = await apiClient.createInvite({
        host: input.host,
        language: input.gameLanguage,
      });

      return stateFromApiPayload(payload, {
        actor: actorIdentity(input.host),
        apiInvite: null,
        gameId: null,
        inviteToken: null,
        playerId: null,
        side: null,
      }, input.nowMs);
    },
    async expireInvite(input) {
      return input.state;
    },
    async joinInvite(input) {
      const inviteToken = input.state.session.inviteToken;
      if (!inviteToken) {
        throw new WordDuelLobbyControllerError('api_invite_required', 'Apps AV API join requires an invite token.');
      }
      if (!input.player) {
        throw new WordDuelLobbyControllerError('missing_api_actor', 'Apps AV API join requires a player actor.');
      }

      const payload = await apiClient.joinInvite({
        inviteToken,
        player: input.player,
      });

      return stateFromApiPayload(payload, {
        ...input.state.session,
        actor: actorIdentity(input.player),
      }, input.nowMs);
    },
    async joinInviteByToken(input) {
      if (!input.player) {
        throw new WordDuelLobbyControllerError('missing_api_actor', 'Apps AV API join requires a player actor.');
      }

      const payload = await apiClient.joinInvite({
        inviteToken: input.inviteToken,
        player: input.player,
      });

      return stateFromApiPayload(payload, {
        actor: actorIdentity(input.player),
        apiInvite: null,
        gameId: null,
        inviteToken: input.inviteToken,
        playerId: null,
        side: null,
      }, input.nowMs);
    },
    async markReady(input) {
      const session = requireApiPlayerSession(input.state);
      const response = await apiClient.markReady({
        actor: session.actor,
        gameId: session.gameId,
        playerId: session.playerId,
      });

      return stateFromApiGame(response.game, input.state, input.nowMs);
    },
    async openFirstRoundIfDue(input) {
      const gameId = input.state.session.gameId;
      if (!gameId) {
        throw new WordDuelLobbyControllerError('missing_api_session', 'Apps AV API start requires a game id.');
      }

      const response = await apiClient.openFirstRoundIfDue({ gameId });
      return stateFromApiGame(response.game, input.state, input.nowMs);
    },
    async previewInviteByRoomCode(input) {
      const { invite } = await apiClient.getRoomCodePreview({ roomCode: input.roomCode });
      return stateFromApiInvitePreview(invite, input.nowMs);
    },
    async previewInviteByToken(input) {
      const { invite } = await apiClient.getInvitePreview({ inviteToken: input.inviteToken });
      return stateFromApiInvitePreview(invite, input.nowMs);
    },
    async refreshLobby(input) {
      const session = requireApiPlayerSession(input.state);
      const response = await apiClient.getLobby({
        actor: session.actor,
        gameId: session.gameId,
        playerId: session.playerId,
      });

      return stateFromApiLobby(
        response.lobby,
        input.state.realtime,
        input.state.session,
        input.nowMs,
      );
    },
    async viewAsHost(input) {
      return {
        ...input.state,
        lobby: viewLobbyAsHost(input.state.lobby, input.nowMs),
      };
    },
    async viewAsRecipient(input) {
      return {
        ...input.state,
        lobby: viewLobbyAsRecipient(input.state.lobby, input.nowMs),
      };
    },
    async viewInviteReview(input) {
      return {
        ...input.state,
        lobby: viewInviteReview(input.state.lobby, input.nowMs),
      };
    },
  };
}

function localInviteReviewState(nowMs: number): WordDuelLobbyControllerState {
  const hostState = createLocalMockWordDuelLobbyControllerState({
    gameLanguage: 'en',
    nowMs,
  });

  return {
    ...hostState,
    lobby: viewInviteReview(hostState.lobby, nowMs),
    session: {
      ...hostState.session,
      actor: null,
      playerId: null,
      side: 'b',
    },
  };
}

function stateFromApiInvitePreview(
  invite: DuelWordsApiInvitePreview,
  nowMs: number,
): WordDuelLobbyControllerState {
  return {
    lobby: deriveWordDuelLobbyViewModel({
      activeRound: null,
      countdown: null,
      invitePreview: invitePreviewFromApi(invite, 'invite_review', nowMs),
      players: [
        {
          isViewer: false,
          role: 'host',
          safeDisplayName: invite.hostSafeDisplayName,
          side: 'a',
          state: 'joined',
        },
        {
          isViewer: true,
          role: 'recipient',
          safeDisplayName: 'Guest',
          side: 'b',
          state: 'waiting',
        },
      ],
      readyBySide: {
        a: false,
        b: false,
      },
      status: 'invite_review',
      viewerRole: 'recipient',
      viewerSide: 'b',
    }, nowMs),
    realtime: null,
    session: {
      actor: null,
      apiInvite: invite,
      gameId: null,
      inviteToken: invite.inviteToken,
      playerId: null,
      side: 'b',
    },
    source: 'apps_av_api',
  };
}

function stateFromApiPayload(
  payload: DuelWordsApiLobbyResponse,
  previousSession: WordDuelLobbyControllerSession,
  nowMs: number,
): WordDuelLobbyControllerState {
  return stateFromApiLobby(payload.lobby, payload.realtime, {
    ...previousSession,
    apiInvite: payload.invite,
    inviteToken: payload.invite.inviteToken,
  }, nowMs);
}

function stateFromApiGame(
  game: DuelWordsApiSafeGame,
  previousState: WordDuelLobbyControllerState,
  nowMs: number,
): WordDuelLobbyControllerState {
  const apiInvite = previousState.session.apiInvite;
  if (apiInvite === null) {
    throw new WordDuelLobbyControllerError('api_invite_required', 'Apps AV API game update requires invite context.');
  }

  return stateFromApiLobby({
    game,
    invite: apiInvite,
    viewer: previousState.session.playerId && previousState.session.side
      ? {
          isHost: previousState.session.side === 'a',
          playerId: previousState.session.playerId,
          side: previousState.session.side,
        }
      : null,
  }, previousState.realtime, previousState.session, nowMs);
}

function stateFromApiLobby(
  lobby: DuelWordsApiLobbyView,
  realtime: DuelWordsBackendRealtimeSession | null,
  previousSession: WordDuelLobbyControllerSession,
  nowMs: number,
): WordDuelLobbyControllerState {
  const viewerSide = lobby.viewer?.side ?? previousSession.side ?? 'a';
  const viewerRole = viewerSide === 'a' ? 'host' : 'recipient';
  const status = mapApiStatus(lobby.game.status);
  const players = apiPlayersToLobbyPlayers(lobby.game, viewerSide);
  const readyBySide = readyBySideFromPlayers(players);
  const countdownEndsAtMs = parseOptionalTime(lobby.game.countdownEndsAt);
  const activeRound = status === 'active_round'
    ? {
        roundNumber: 1 as const,
        roundOpenedAtMs: nowMs,
      }
    : null;
  const countdown = status === 'countdown' && countdownEndsAtMs !== null
    ? {
        endsAtMs: countdownEndsAtMs,
        remainingSeconds: Math.max(0, Math.ceil((countdownEndsAtMs - nowMs) / 1000)),
        serverNowMs: nowMs,
      }
    : null;

  return {
    lobby: deriveWordDuelLobbyViewModel({
      activeRound,
      countdown,
      invitePreview: invitePreviewFromApi(
        lobby.invite,
        status,
        nowMs,
        previousSession.exposesPublicInvite !== false,
      ),
      players,
      readyBySide,
      status,
      viewerRole,
      viewerSide,
    }, nowMs),
    realtime,
    session: {
      ...previousSession,
      apiInvite: lobby.invite,
      gameId: lobby.game.gameId,
      inviteToken: lobby.invite.inviteToken,
      playerId: lobby.viewer?.playerId ?? previousSession.playerId,
      side: viewerSide,
    },
    source: 'apps_av_api',
  };
}

function actorIdentity(actor: DuelWordsApiActor): DuelWordsActorIdentity {
  if (actor.actorType === 'guest_session') {
    return {
      actorType: 'guest_session',
      guestSessionId: actor.guestSessionId,
    };
  }

  return {
    actorType: 'account_user',
  };
}

function requireApiSession(state: WordDuelLobbyControllerState): RequiredApiInviteSession {
  const actor = state.session.actor;
  const inviteToken = state.session.inviteToken;
  if (actor === null || inviteToken === null) {
    throw new WordDuelLobbyControllerError('missing_api_session', 'Apps AV API command requires session context.');
  }

  return {
    actor,
    inviteToken,
  };
}

function requireApiPlayerSession(state: WordDuelLobbyControllerState): RequiredApiPlayerSession {
  const actor = state.session.actor;
  const gameId = state.session.gameId;
  const playerId = state.session.playerId;
  if (actor === null || gameId === null || playerId === null) {
    throw new WordDuelLobbyControllerError('missing_api_session', 'Apps AV API player command requires session context.');
  }

  return {
    actor,
    gameId,
    playerId,
  };
}

type RequiredApiInviteSession = {
  actor: DuelWordsActorIdentity;
  inviteToken: string;
};

type RequiredApiPlayerSession = {
  actor: DuelWordsActorIdentity;
  gameId: string;
  playerId: string;
};

function invitePreviewFromApi(
  invite: DuelWordsApiInvitePreview,
  status: WordDuelLobbyStatus,
  nowMs: number,
  exposesPublicInvite = true,
): WordDuelInvitePreview {
  return {
    expiresAtMs: parseOptionalTime(invite.expiresAt) ?? nowMs,
    gameLanguage: invite.gameLanguage,
    gameName: 'Word Duel',
    inviteUrl: exposesPublicInvite
      ? `${DEFAULT_INVITE_BASE_URL}${encodeURIComponent(invite.inviteToken)}`
      : null,
    joinAvailability: mapApiJoinAvailability(invite.joinAvailability),
    maxAttempts: invite.maxAttempts || WORD_DUEL_MAX_ATTEMPTS,
    mode: 'human_duel',
    roomCode: exposesPublicInvite ? invite.roomCode : null,
    roomState: status,
    solutionSelected: false,
    wordLength: invite.wordLength || WORD_DUEL_WORD_LENGTH,
  };
}

function invitePreviewFromAcceptedRematchGame(game: DuelWordsApiSafeGame): DuelWordsApiInvitePreview {
  const host = game.players.find((player) => player.side === 'a') ?? null;
  return {
    challengeName: 'Word Duel',
    expiresAt: null,
    gameLanguage: game.language,
    gameName: 'DuelWords AV',
    hostSafeDisplayName: host?.safeDisplayName ?? 'Host',
    inviteToken: game.roomToken,
    joinAvailability: 'viewer_already_joined',
    maxAttempts: game.maxAttempts,
    mode: 'human_duel',
    playerCount: game.players.length,
    roomCode: game.roomToken,
    roomState: game.status,
    settingsLocked: true,
    solutionSelected: game.status !== 'lobby',
    wordLength: game.wordLength,
  };
}

function apiPlayersToLobbyPlayers(
  game: DuelWordsApiSafeGame,
  viewerSide: WordDuelLobbySide,
): WordDuelLobbyPlayer[] {
  const bySide = new Map(game.players.map((player) => [player.side, player]));

  return (['a', 'b'] as const).map((side) => {
    const player = bySide.get(side);
    return {
      isViewer: side === viewerSide,
      role: side === 'a' ? 'host' : 'recipient',
      safeDisplayName: player?.safeDisplayName ?? (side === 'a' ? 'Host' : 'Waiting'),
      side,
      state: player ? mapApiPlayerStatus(player.status) : 'waiting',
    };
  });
}

function readyBySideFromPlayers(players: WordDuelLobbyPlayer[]): Record<WordDuelLobbySide, boolean> {
  return {
    a: players.some((player) => player.side === 'a' && player.state === 'ready'),
    b: players.some((player) => player.side === 'b' && player.state === 'ready'),
  };
}

function mapApiPlayerStatus(status: DuelWordsApiSafeGame['players'][number]['status']): WordDuelLobbyPlayer['state'] {
  if (status === 'ready' || status === 'finalized') {
    return 'ready';
  }
  if (status === 'joined') {
    return 'joined';
  }

  return 'waiting';
}

function mapApiJoinAvailability(value: DuelWordsApiInviteAvailability): WordDuelLobbyJoinAvailability {
  if (value === 'already_started' || value === 'finalized') {
    return 'started';
  }

  return value;
}

function mapApiStatus(status: DuelWordsApiRoomStatus): WordDuelLobbyStatus {
  if (status === 'pending_invite' || status === 'waiting_for_player') {
    return 'waiting_for_player';
  }
  if (status === 'lobby' || status === 'ready_locked') {
    return 'lobby';
  }
  if (status === 'countdown') {
    return 'countdown';
  }
  if (status === 'active_round' || status === 'round_resolving') {
    return 'active_round';
  }
  if (status === 'cancelled_before_first_round' || status === 'technical_error') {
    return 'cancelled_before_first_round';
  }
  if (status === 'expired') {
    return 'expired';
  }

  throw new WordDuelLobbyControllerError(
    'unsupported_api_lobby_state',
    `Unsupported Apps AV API lobby status: ${status}.`,
  );
}

function parseOptionalTime(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}
