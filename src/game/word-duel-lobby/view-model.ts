import type { DuelMaxAttempts } from '../duel-rules';
import type { DuelWordLength, GameLanguage } from '../word-duel-engine';
import { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH } from '../word-duel-engine';

export type WordDuelLobbySide = 'a' | 'b';
export type WordDuelLobbyViewerRole = 'host' | 'recipient';
export type WordDuelLobbyStatus =
  | 'invite_review'
  | 'waiting_for_player'
  | 'lobby'
  | 'countdown'
  | 'active_round'
  | 'cancelled_before_first_round'
  | 'expired';
export type WordDuelLobbyPlayerState = 'waiting' | 'joined' | 'ready';
export type WordDuelLobbyJoinAvailability =
  | 'joinable'
  | 'viewer_already_joined'
  | 'full'
  | 'expired'
  | 'cancelled'
  | 'started'
  | 'unavailable';

export type WordDuelLobbyPlayer = {
  isViewer: boolean;
  role: WordDuelLobbyViewerRole;
  safeDisplayName: string;
  side: WordDuelLobbySide;
  state: WordDuelLobbyPlayerState;
};

export type WordDuelInvitePreview = {
  expiresAtMs: number;
  gameLanguage: GameLanguage;
  gameName: 'Word Duel';
  inviteUrl: string | null;
  joinAvailability: WordDuelLobbyJoinAvailability;
  maxAttempts: DuelMaxAttempts;
  mode: 'human_duel';
  roomCode: string | null;
  roomState: WordDuelLobbyStatus;
  solutionSelected: false;
  wordLength: DuelWordLength;
};

export type WordDuelLobbyCountdown = {
  endsAtMs: number;
  remainingSeconds: number;
  serverNowMs: number;
} | null;

export type WordDuelLobbyActiveRound = {
  roundNumber: 1;
  roundOpenedAtMs: number;
} | null;

export type WordDuelLobbyViewModel = {
  activeRound: WordDuelLobbyActiveRound;
  canCancel: boolean;
  canExpire: boolean;
  canJoin: boolean;
  canLeave: boolean;
  canOpenActiveDuel: boolean;
  canOpenRound: boolean;
  canPressReady: boolean;
  canShareInvite: boolean;
  countdown: WordDuelLobbyCountdown;
  invitePreview: WordDuelInvitePreview;
  players: WordDuelLobbyPlayer[];
  readyBySide: Record<WordDuelLobbySide, boolean>;
  sharePayload: string;
  status: WordDuelLobbyStatus;
  viewerRole: WordDuelLobbyViewerRole;
  viewerSide: WordDuelLobbySide;
};

export type WordDuelLobbySafeState = Omit<
  WordDuelLobbyViewModel,
  | 'canCancel'
  | 'canExpire'
  | 'canJoin'
  | 'canLeave'
  | 'canOpenActiveDuel'
  | 'canOpenRound'
  | 'canPressReady'
  | 'canShareInvite'
  | 'sharePayload'
>;

export type WordDuelLobbyErrorCode =
  | 'invite_not_joinable'
  | 'ready_requires_both_players'
  | 'ready_not_available'
  | 'cancel_not_available'
  | 'open_round_not_available'
  | 'countdown_not_elapsed';

export class WordDuelLobbyError extends Error {
  readonly code: WordDuelLobbyErrorCode;

  constructor(code: WordDuelLobbyErrorCode, message: string) {
    super(message);
    this.name = 'WordDuelLobbyError';
    this.code = code;
  }
}

const DEFAULT_INVITE_URL = 'https://app.duelwords-av.avalsys.com/i/c/demo-duel';
const DEFAULT_ROOM_CODE = 'DUEL-WORD';
const COUNTDOWN_DURATION_MS = 3_000;
const INVITE_TTL_MS = 10 * 60_000;

export function createLocalInviteLobbyViewModel(input: {
  gameLanguage: GameLanguage;
  maxAttempts?: DuelMaxAttempts;
  nowMs: number;
  wordLength?: DuelWordLength;
}): WordDuelLobbyViewModel {
  return withDerivedControls({
    activeRound: null,
    countdown: null,
    invitePreview: {
      expiresAtMs: input.nowMs + INVITE_TTL_MS,
      gameLanguage: input.gameLanguage,
      gameName: 'Word Duel',
      inviteUrl: DEFAULT_INVITE_URL,
      joinAvailability: 'viewer_already_joined',
      maxAttempts: input.maxAttempts ?? WORD_DUEL_MAX_ATTEMPTS,
      mode: 'human_duel',
      roomCode: DEFAULT_ROOM_CODE,
      roomState: 'waiting_for_player',
      solutionSelected: false,
      wordLength: input.wordLength ?? WORD_DUEL_WORD_LENGTH,
    },
    players: [
      {
        isViewer: true,
        role: 'host',
        safeDisplayName: 'You',
        side: 'a',
        state: 'joined',
      },
      {
        isViewer: false,
        role: 'recipient',
        safeDisplayName: 'Waiting',
        side: 'b',
        state: 'waiting',
      },
    ],
    readyBySide: {
      a: false,
      b: false,
    },
    status: 'waiting_for_player',
    viewerRole: 'host',
    viewerSide: 'a',
  }, input.nowMs);
}

export function deriveWordDuelLobbyViewModel(
  state: WordDuelLobbySafeState,
  nowMs: number,
): WordDuelLobbyViewModel {
  return withDerivedControls(state, nowMs);
}

export function viewInviteReview(lobby: WordDuelLobbyViewModel, nowMs: number): WordDuelLobbyViewModel {
  if (isTerminal(lobby.status)) {
    return withDerivedControls({
      ...lobby,
      viewerRole: 'recipient',
      viewerSide: 'b',
    }, nowMs);
  }

  return withDerivedControls({
    ...lobby,
    status: 'invite_review',
    viewerRole: 'recipient',
    viewerSide: 'b',
  }, nowMs);
}

export function viewLobbyAsHost(lobby: WordDuelLobbyViewModel, nowMs: number): WordDuelLobbyViewModel {
  return withDerivedControls({
    ...lobby,
    viewerRole: 'host',
    viewerSide: 'a',
  }, nowMs);
}

export function viewLobbyAsRecipient(lobby: WordDuelLobbyViewModel, nowMs: number): WordDuelLobbyViewModel {
  return withDerivedControls({
    ...lobby,
    viewerRole: 'recipient',
    viewerSide: 'b',
  }, nowMs);
}

export function joinInvite(input: {
  lobby: WordDuelLobbyViewModel;
  nowMs: number;
  safeDisplayName?: string;
}): WordDuelLobbyViewModel {
  const lobby = withDerivedControls(input.lobby, input.nowMs);
  if (!lobby.canJoin) {
    throw new WordDuelLobbyError('invite_not_joinable', 'The local invite review is not joinable.');
  }

  return withDerivedControls({
    ...lobby,
    players: lobby.players.map((player) =>
      player.side === 'b'
        ? {
            ...player,
            isViewer: true,
            safeDisplayName: safeDisplayName(input.safeDisplayName ?? 'Guest'),
            state: 'joined',
          }
        : {
            ...player,
            isViewer: false,
          },
    ),
    status: 'lobby',
    viewerRole: 'recipient',
    viewerSide: 'b',
  }, input.nowMs);
}

export function pressReady(input: {
  lobby: WordDuelLobbyViewModel;
  nowMs: number;
}): WordDuelLobbyViewModel {
  const lobby = withDerivedControls(input.lobby, input.nowMs);
  if (!hasBothPlayers(lobby)) {
    throw new WordDuelLobbyError('ready_requires_both_players', 'Ready requires both seats to be joined.');
  }
  if (!lobby.canPressReady) {
    throw new WordDuelLobbyError('ready_not_available', 'Ready is not available for this local lobby state.');
  }

  return readySide(lobby, lobby.viewerSide, input.nowMs);
}

export function simulateOpponentReady(input: {
  lobby: WordDuelLobbyViewModel;
  nowMs: number;
}): WordDuelLobbyViewModel {
  const lobby = withDerivedControls(input.lobby, input.nowMs);
  if (!hasBothPlayers(lobby)) {
    throw new WordDuelLobbyError('ready_requires_both_players', 'Ready requires both seats to be joined.');
  }

  return readySide(lobby, oppositeSide(lobby.viewerSide), input.nowMs);
}

export function cancelInvite(input: {
  lobby: WordDuelLobbyViewModel;
  nowMs: number;
}): WordDuelLobbyViewModel {
  const lobby = withDerivedControls(input.lobby, input.nowMs);
  if (!lobby.canCancel) {
    throw new WordDuelLobbyError('cancel_not_available', 'Only the host can cancel before any player is Ready.');
  }

  return withDerivedControls({
    ...lobby,
    countdown: null,
    status: 'cancelled_before_first_round',
  }, input.nowMs);
}

export function expireInvite(input: {
  lobby: WordDuelLobbyViewModel;
  nowMs: number;
}): WordDuelLobbyViewModel {
  const lobby = withDerivedControls(input.lobby, input.nowMs);
  if (!lobby.canExpire) {
    return lobby;
  }

  return withDerivedControls({
    ...lobby,
    countdown: null,
    status: 'expired',
  }, input.nowMs);
}

export function openRoundIfDue(input: {
  lobby: WordDuelLobbyViewModel;
  nowMs: number;
}): WordDuelLobbyViewModel {
  const lobby = withDerivedControls(input.lobby, input.nowMs);
  if (lobby.status !== 'countdown' || lobby.countdown === null) {
    throw new WordDuelLobbyError('open_round_not_available', 'Round 1 can only open from countdown.');
  }
  if (input.nowMs < lobby.countdown.endsAtMs) {
    throw new WordDuelLobbyError('countdown_not_elapsed', 'Round 1 cannot open before the countdown ends.');
  }

  return withDerivedControls({
    ...lobby,
    activeRound: {
      roundNumber: 1,
      roundOpenedAtMs: input.nowMs,
    },
    countdown: null,
    status: 'active_round',
  }, input.nowMs);
}

function readySide(
  lobby: WordDuelLobbyViewModel,
  side: WordDuelLobbySide,
  nowMs: number,
): WordDuelLobbyViewModel {
  const readyBySide = {
    ...lobby.readyBySide,
    [side]: true,
  };
  const bothReady = readyBySide.a && readyBySide.b;
  const countdown = bothReady
    ? {
        endsAtMs: nowMs + COUNTDOWN_DURATION_MS,
        remainingSeconds: COUNTDOWN_DURATION_MS / 1000,
        serverNowMs: nowMs,
      }
    : null;

  return withDerivedControls({
    ...lobby,
    countdown,
    players: lobby.players.map((player) =>
      player.side === side
        ? {
            ...player,
            state: 'ready',
          }
        : player,
    ),
    readyBySide,
    status: bothReady ? 'countdown' : 'lobby',
  }, nowMs);
}

function withDerivedControls(
  lobby: WordDuelLobbySafeState,
  nowMs: number,
): WordDuelLobbyViewModel {
  const ownPlayer = lobby.players.find((player) => player.side === lobby.viewerSide);
  const bothPlayers = hasBothPlayers(lobby);
  const anyReady = lobby.readyBySide.a || lobby.readyBySide.b;
  const ownReady = lobby.readyBySide[lobby.viewerSide];
  const joinAvailability = joinAvailabilityFor(lobby);
  const status = lobby.status;
  const countdown = status === 'countdown' && lobby.countdown !== null
    ? {
        ...lobby.countdown,
        remainingSeconds: Math.max(0, Math.ceil((lobby.countdown.endsAtMs - nowMs) / 1000)),
        serverNowMs: nowMs,
      }
    : lobby.countdown;
  const invitePreview = {
    ...lobby.invitePreview,
    joinAvailability,
    roomState: status,
  };

  return {
    ...lobby,
    canCancel: lobby.viewerRole === 'host' && !anyReady && (status === 'waiting_for_player' || status === 'lobby'),
    canExpire: status === 'waiting_for_player' || status === 'invite_review' || status === 'lobby',
    canJoin: status === 'invite_review' && joinAvailability === 'joinable',
    canLeave: (ownPlayer?.state === 'joined' || ownPlayer?.state === 'ready') && status !== 'active_round',
    canOpenActiveDuel: status === 'active_round' && lobby.activeRound !== null,
    canOpenRound: status === 'countdown' && countdown !== null && countdown.remainingSeconds === 0,
    canPressReady: bothPlayers && !ownReady && status === 'lobby',
    canShareInvite: lobby.viewerRole === 'host'
      && !anyReady
      && (status === 'waiting_for_player' || (status === 'lobby' && !bothPlayers)),
    countdown,
    invitePreview,
    sharePayload: createSharePayload(invitePreview),
  };
}

function joinAvailabilityFor(lobby: Pick<WordDuelLobbyViewModel, 'players' | 'status' | 'viewerSide'>): WordDuelLobbyJoinAvailability {
  if (lobby.status === 'expired') {
    return 'expired';
  }
  if (lobby.status === 'cancelled_before_first_round') {
    return 'cancelled';
  }
  if (lobby.status === 'countdown' || lobby.status === 'active_round') {
    return 'started';
  }

  const ownPlayer = lobby.players.find((player) => player.side === lobby.viewerSide);
  if (ownPlayer?.state === 'joined' || ownPlayer?.state === 'ready') {
    return 'viewer_already_joined';
  }

  const recipient = lobby.players.find((player) => player.side === 'b');
  if (recipient?.state === 'waiting') {
    return 'joinable';
  }

  return 'full';
}

function hasBothPlayers(lobby: Pick<WordDuelLobbyViewModel, 'players'>): boolean {
  return lobby.players.every((player) => player.state === 'joined' || player.state === 'ready');
}

function isTerminal(status: WordDuelLobbyStatus): boolean {
  return status === 'cancelled_before_first_round' || status === 'expired';
}

function oppositeSide(side: WordDuelLobbySide): WordDuelLobbySide {
  return side === 'a' ? 'b' : 'a';
}

function safeDisplayName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length === 0) {
    return 'Guest';
  }

  return trimmed.slice(0, 24);
}

function createSharePayload(preview: WordDuelInvitePreview): string {
  return [
    'DuelWords AV',
    'Word Duel challenge',
    preview.inviteUrl ? `Join: ${preview.inviteUrl}` : null,
    preview.roomCode ? `Code: ${preview.roomCode}` : null,
  ].filter((line): line is string => line !== null).join('\n');
}
