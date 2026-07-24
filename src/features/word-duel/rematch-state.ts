import type { DuelWordsApiRematchProposal } from '@/game/word-duel-lobby/api-client';

export function canRequestRematch(proposal: DuelWordsApiRematchProposal | null): boolean {
  return proposal === null || proposal.status === 'cancelled' || proposal.status === 'declined' || proposal.status === 'expired';
}
