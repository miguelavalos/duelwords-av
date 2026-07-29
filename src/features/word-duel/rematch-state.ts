import type { DuelWordsApiRematchProposal } from '@/game/word-duel-lobby/api-client';

export const REMATCH_PROPOSAL_POLL_INTERVAL_MS = 1_000;

type RematchProposalPollingInput = {
  load: () => Promise<DuelWordsApiRematchProposal | null>;
  onProposal: (proposal: DuelWordsApiRematchProposal | null) => void;
  onError?: () => void;
  intervalMs?: number;
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
}: RematchProposalPollingInput): () => void {
  let stopped = false;
  let inFlight = false;

  const poll = async () => {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      const proposal = await load();
      if (!stopped) onProposal(proposal);
    } catch {
      if (!stopped) onError?.();
    } finally {
      inFlight = false;
    }
  };

  void poll();
  const interval = setInterval(() => {
    void poll();
  }, intervalMs);

  return () => {
    stopped = true;
    clearInterval(interval);
  };
}
