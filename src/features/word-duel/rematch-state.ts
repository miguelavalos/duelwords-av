import type { DuelWordsApiRematchProposal } from '@/game/word-duel-lobby/api-client';

export const REMATCH_PROPOSAL_POLL_INTERVAL_MS = 2_000;
export const REMATCH_PROPOSAL_MAX_POLL_INTERVAL_MS = 5_000;

type RematchProposalPollingInput = {
  load: () => Promise<DuelWordsApiRematchProposal | null>;
  onProposal: (proposal: DuelWordsApiRematchProposal | null) => void;
  onError?: () => void;
  intervalMs?: number;
  maxIntervalMs?: number;
};

export function canRequestRematch(proposal: DuelWordsApiRematchProposal | null): boolean {
  return proposal === null || proposal.status === 'cancelled' || proposal.status === 'declined' || proposal.status === 'expired';
}

export function rematchProposalRevisionKey(proposal: DuelWordsApiRematchProposal | null): string {
  if (!proposal) return 'none';
  return [
    proposal.proposalId,
    proposal.status,
    proposal.viewer.canAccept,
    proposal.viewer.canCancel,
    proposal.viewer.canDecline,
    proposal.nextGame?.gameId ?? '',
  ].join(':');
}

export function startRematchProposalPolling({
  load,
  onProposal,
  onError,
  intervalMs = REMATCH_PROPOSAL_POLL_INTERVAL_MS,
  maxIntervalMs = REMATCH_PROPOSAL_MAX_POLL_INTERVAL_MS,
}: RematchProposalPollingInput): () => void {
  let stopped = false;
  let lastRevision: string | null = null;
  let nextDelayMs = intervalMs;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const scheduleNextPoll = (delayMs: number) => {
    if (stopped) return;
    timeout = setTimeout(() => {
      void poll();
    }, delayMs);
  };

  const poll = async () => {
    if (stopped) return;
    try {
      const proposal = await load();
      if (stopped) return;
      const revision = rematchProposalRevisionKey(proposal);
      const isFirstRevision = lastRevision === null;
      const changed = lastRevision !== null && revision !== lastRevision;
      lastRevision = revision;
      nextDelayMs = isFirstRevision || changed
        ? intervalMs
        : Math.min(maxIntervalMs, Math.max(intervalMs, nextDelayMs * 2));
      onProposal(proposal);
    } catch {
      if (stopped) return;
      nextDelayMs = Math.min(maxIntervalMs, Math.max(intervalMs, nextDelayMs * 2));
      onError?.();
    } finally {
      scheduleNextPoll(nextDelayMs);
    }
  };

  void poll();

  return () => {
    stopped = true;
    if (timeout !== null) clearTimeout(timeout);
  };
}
