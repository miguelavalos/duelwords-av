import type { GameLanguage } from '../word-duel-engine';
import { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH } from '../word-duel-engine';

export type WordDuelRematchSide = 'a' | 'b';
export type WordDuelRematchViewerRole = 'owner' | 'recipient';
export type WordDuelRematchProposalStatus =
  | 'idle'
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled';

export type WordDuelRematchSettings = {
  gameLanguage: GameLanguage;
  maxAttempts: number;
  wordLength: number;
};

export type WordDuelRematchStartRequest = {
  acceptedBySide: WordDuelRematchSide;
  maxAttempts: number;
  ownerSide: WordDuelRematchSide;
  previousResultRef: string;
  selectedLanguage: GameLanguage;
  wordLength: number;
};

export type WordDuelRematchProposal = {
  canAccept: boolean;
  canCancel: boolean;
  canDecline: boolean;
  canEditSettings: boolean;
  canExpire: boolean;
  canSend: boolean;
  createdAtMs: number | null;
  expiresAtMs: number | null;
  ownerSide: WordDuelRematchSide | null;
  proposalRef: string | null;
  recipientSide: WordDuelRematchSide | null;
  remainingSeconds: number | null;
  settings: WordDuelRematchSettings;
  startRequest: WordDuelRematchStartRequest | null;
  status: WordDuelRematchProposalStatus;
  viewerRole: WordDuelRematchViewerRole;
  viewerSide: WordDuelRematchSide;
};

export type WordDuelRematchErrorCode =
  | 'proposal_not_editable'
  | 'proposal_not_sendable'
  | 'proposal_not_acceptable'
  | 'proposal_not_declinable'
  | 'proposal_not_cancellable'
  | 'proposal_not_expirable';

export class WordDuelRematchError extends Error {
  readonly code: WordDuelRematchErrorCode;

  constructor(code: WordDuelRematchErrorCode, message: string) {
    super(message);
    this.name = 'WordDuelRematchError';
    this.code = code;
  }
}

export function createIdleRematchProposal(input: {
  gameLanguage: GameLanguage;
  viewerRole?: WordDuelRematchViewerRole;
  viewerSide?: WordDuelRematchSide;
}): WordDuelRematchProposal {
  const viewerSide = input.viewerSide ?? 'a';

  return withDerivedControls({
    createdAtMs: null,
    expiresAtMs: null,
    ownerSide: null,
    proposalRef: null,
    recipientSide: null,
    remainingSeconds: null,
    settings: {
      gameLanguage: input.gameLanguage,
      maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
      wordLength: WORD_DUEL_WORD_LENGTH,
    },
    startRequest: null,
    status: 'idle',
    viewerRole: input.viewerRole ?? 'owner',
    viewerSide,
  });
}

export function draftRematchProposal(
  proposal: WordDuelRematchProposal,
  settings: Partial<WordDuelRematchSettings> = {},
): WordDuelRematchProposal {
  const editableProposal = withDerivedControls(proposal);
  if (!editableProposal.canEditSettings) {
    throw new WordDuelRematchError('proposal_not_editable', 'Only idle or draft rematch proposals can be edited.');
  }

  const ownerSide = editableProposal.ownerSide ?? editableProposal.viewerSide;
  return withDerivedControls({
    ...editableProposal,
    ownerSide,
    recipientSide: oppositeSide(ownerSide),
    settings: {
      ...editableProposal.settings,
      ...settings,
      maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
      wordLength: WORD_DUEL_WORD_LENGTH,
    },
    startRequest: null,
    status: 'draft',
    viewerRole: 'owner',
  });
}

export function sendRematchProposal(input: {
  nowMs: number;
  proposal: WordDuelRematchProposal;
  proposalRef?: string;
  ttlMs?: number;
}): WordDuelRematchProposal {
  if (input.proposal.status !== 'draft' || input.proposal.viewerRole !== 'owner') {
    throw new WordDuelRematchError('proposal_not_sendable', 'Only the proposal owner can send a draft rematch.');
  }

  const ttlMs = input.ttlMs ?? 60_000;
  return withDerivedControls({
    ...input.proposal,
    createdAtMs: input.nowMs,
    expiresAtMs: input.nowMs + ttlMs,
    proposalRef: input.proposalRef ?? 'local-rematch-proposal',
    remainingSeconds: Math.ceil(ttlMs / 1000),
    startRequest: null,
    status: 'sent',
  });
}

export function viewRematchProposalAsRecipient(
  proposal: WordDuelRematchProposal,
  nowMs: number,
): WordDuelRematchProposal {
  if (proposal.status !== 'sent') {
    return withDerivedControls({
      ...proposal,
      viewerRole: 'recipient',
      viewerSide: proposal.recipientSide ?? oppositeSide(proposal.viewerSide),
    }, nowMs);
  }

  return withDerivedControls({
    ...proposal,
    viewerRole: 'recipient',
    viewerSide: proposal.recipientSide ?? oppositeSide(proposal.viewerSide),
  }, nowMs);
}

export function viewRematchProposalAsOwner(
  proposal: WordDuelRematchProposal,
  nowMs: number,
): WordDuelRematchProposal {
  return withDerivedControls({
    ...proposal,
    viewerRole: 'owner',
    viewerSide: proposal.ownerSide ?? proposal.viewerSide,
  }, nowMs);
}

export function acceptRematchProposal(input: {
  nowMs: number;
  proposal: WordDuelRematchProposal;
  previousResultRef: string;
}): WordDuelRematchProposal {
  const proposal = withDerivedControls(input.proposal, input.nowMs);
  if (!proposal.canAccept || proposal.ownerSide === null || proposal.recipientSide === null) {
    throw new WordDuelRematchError('proposal_not_acceptable', 'Only the recipient can accept an active rematch proposal.');
  }

  return withDerivedControls({
    ...proposal,
    remainingSeconds: null,
    startRequest: {
      acceptedBySide: proposal.viewerSide,
      maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
      ownerSide: proposal.ownerSide,
      previousResultRef: input.previousResultRef,
      selectedLanguage: proposal.settings.gameLanguage,
      wordLength: WORD_DUEL_WORD_LENGTH,
    },
    status: 'accepted',
  }, input.nowMs);
}

export function declineRematchProposal(input: {
  nowMs: number;
  proposal: WordDuelRematchProposal;
}): WordDuelRematchProposal {
  const proposal = withDerivedControls(input.proposal, input.nowMs);
  if (!proposal.canDecline) {
    throw new WordDuelRematchError('proposal_not_declinable', 'Only the recipient can decline an active rematch proposal.');
  }

  return withDerivedControls({
    ...proposal,
    remainingSeconds: null,
    startRequest: null,
    status: 'declined',
  }, input.nowMs);
}

export function cancelRematchProposal(input: {
  nowMs: number;
  proposal: WordDuelRematchProposal;
}): WordDuelRematchProposal {
  const proposal = withDerivedControls(input.proposal, input.nowMs);
  if (!proposal.canCancel) {
    throw new WordDuelRematchError('proposal_not_cancellable', 'Only the owner can cancel an active rematch proposal.');
  }

  return withDerivedControls({
    ...proposal,
    remainingSeconds: null,
    startRequest: null,
    status: 'cancelled',
  }, input.nowMs);
}

export function expireRematchProposal(input: {
  nowMs: number;
  proposal: WordDuelRematchProposal;
}): WordDuelRematchProposal {
  const proposal = withDerivedControls(input.proposal, input.nowMs);
  if (!proposal.canExpire) {
    throw new WordDuelRematchError('proposal_not_expirable', 'Only an active sent rematch proposal can expire.');
  }

  return withDerivedControls({
    ...proposal,
    remainingSeconds: null,
    startRequest: null,
    status: 'expired',
  }, input.nowMs);
}

export function rematchCanStart(proposal: WordDuelRematchProposal): boolean {
  return proposal.status === 'accepted' && proposal.startRequest !== null;
}

function withDerivedControls(
  proposal: Omit<
    WordDuelRematchProposal,
    'canAccept' | 'canCancel' | 'canDecline' | 'canEditSettings' | 'canExpire' | 'canSend'
  >,
  nowMs?: number,
): WordDuelRematchProposal {
  const remainingSeconds = remainingSecondsFromExpiry(proposal.expiresAtMs, nowMs);
  const status = proposal.status;
  const activeSent = status === 'sent';
  const activeSentWithTime = activeSent && (remainingSeconds === null || remainingSeconds > 0);
  const isOwner = proposal.viewerRole === 'owner';
  const isRecipient = proposal.viewerRole === 'recipient';

  return {
    ...proposal,
    remainingSeconds: activeSent ? (remainingSeconds ?? proposal.remainingSeconds) : proposal.remainingSeconds,
    status,
    canAccept: activeSentWithTime && isRecipient,
    canCancel: (status === 'draft' || activeSentWithTime) && isOwner,
    canDecline: activeSentWithTime && isRecipient,
    canEditSettings: (status === 'idle' || status === 'draft') && isOwner,
    canExpire: status === 'sent' && remainingSeconds === 0,
    canSend: status === 'draft' && isOwner,
  };
}

function remainingSecondsFromExpiry(expiresAtMs: number | null, nowMs?: number): number | null {
  if (expiresAtMs === null || nowMs === undefined) {
    return null;
  }
  return Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1000));
}

function oppositeSide(side: WordDuelRematchSide): WordDuelRematchSide {
  return side === 'a' ? 'b' : 'a';
}
