import { describe, expect, it } from 'vitest';

import {
  acceptRematchProposal,
  cancelRematchProposal,
  createIdleRematchProposal,
  declineRematchProposal,
  draftRematchProposal,
  expireRematchProposal,
  rematchCanStart,
  sendRematchProposal,
  viewRematchProposalAsRecipient,
  WordDuelRematchError,
} from './rematch-proposal';

const NOW_MS = Date.parse('2026-07-05T09:30:00.000Z');

function createSentProposal() {
  const idle = createIdleRematchProposal({
    gameLanguage: 'en',
    maxAttempts: 8,
    viewerRole: 'owner',
    viewerSide: 'a',
    wordLength: 7,
  });
  const draft = draftRematchProposal(idle, { gameLanguage: 'es' });

  return sendRematchProposal({
    nowMs: NOW_MS,
    proposal: draft,
    proposalRef: 'local-test-proposal',
    ttlMs: 60_000,
  });
}

describe('word duel rematch proposal', () => {
  it('lets the owner configure and send supported settings', () => {
    const idle = createIdleRematchProposal({ gameLanguage: 'en', viewerRole: 'owner', viewerSide: 'a' });
    const draft = draftRematchProposal(idle, { gameLanguage: 'es', maxAttempts: 8, wordLength: 7 });
    const sent = sendRematchProposal({ nowMs: NOW_MS, proposal: draft, ttlMs: 60_000 });

    expect(draft.status).toBe('draft');
    expect(draft.canEditSettings).toBe(true);
    expect(draft.canSend).toBe(true);
    expect(draft.ownerSide).toBe('a');
    expect(draft.recipientSide).toBe('b');
    expect(draft.settings).toEqual({
      gameLanguage: 'es',
      maxAttempts: 8,
      wordLength: 7,
    });

    expect(sent.status).toBe('sent');
    expect(sent.canEditSettings).toBe(false);
    expect(sent.canSend).toBe(false);
    expect(sent.remainingSeconds).toBe(60);
    expect(rematchCanStart(sent)).toBe(false);
  });

  it('requires recipient acceptance before creating a start request', () => {
    const sent = createSentProposal();
    const recipient = viewRematchProposalAsRecipient(sent, NOW_MS + 5_000);
    const accepted = acceptRematchProposal({
      nowMs: NOW_MS + 5_000,
      previousResultRef: 'result-preview',
      proposal: recipient,
    });

    expect(sent.startRequest).toBeNull();
    expect(rematchCanStart(sent)).toBe(false);
    expect(recipient.canAccept).toBe(true);
    expect(accepted.status).toBe('accepted');
    expect(rematchCanStart(accepted)).toBe(true);
    expect(accepted.startRequest).toEqual({
      acceptedBySide: 'b',
      maxAttempts: 8,
      ownerSide: 'a',
      previousResultRef: 'result-preview',
      selectedLanguage: 'es',
      wordLength: 7,
    });
    expect(JSON.stringify(accepted).toLowerCase()).not.toContain('newgameid');
    expect(JSON.stringify(accepted).toLowerCase()).not.toContain('new_game_id');
  });

  it('rejects unsupported rematch settings', () => {
    const idle = createIdleRematchProposal({ gameLanguage: 'en' });
    expect(() => draftRematchProposal(idle, { maxAttempts: 9 })).toThrow(WordDuelRematchError);
    expect(() => createIdleRematchProposal({ gameLanguage: 'en', wordLength: 9 })).toThrow(WordDuelRematchError);
  });

  it('does not let the owner accept their own proposal', () => {
    const sent = createSentProposal();

    expect(() =>
      acceptRematchProposal({
        nowMs: NOW_MS + 5_000,
        previousResultRef: 'result-preview',
        proposal: sent,
      }),
    ).toThrow(WordDuelRematchError);
  });

  it('keeps declined, cancelled, and expired proposals from starting', () => {
    const sent = createSentProposal();
    const recipient = viewRematchProposalAsRecipient(sent, NOW_MS + 5_000);
    const declined = declineRematchProposal({ nowMs: NOW_MS + 5_000, proposal: recipient });
    const cancelled = cancelRematchProposal({ nowMs: NOW_MS + 5_000, proposal: sent });
    const expired = expireRematchProposal({ nowMs: NOW_MS + 61_000, proposal: sent });

    for (const proposal of [declined, cancelled, expired]) {
      expect(proposal.startRequest).toBeNull();
      expect(rematchCanStart(proposal)).toBe(false);
    }
  });

  it('blocks acceptance after the proposal timeout', () => {
    const sent = createSentProposal();
    const recipientAfterTimeout = viewRematchProposalAsRecipient(sent, NOW_MS + 61_000);

    expect(recipientAfterTimeout.remainingSeconds).toBe(0);
    expect(recipientAfterTimeout.canAccept).toBe(false);
    expect(recipientAfterTimeout.canExpire).toBe(true);
    expect(() =>
      acceptRematchProposal({
        nowMs: NOW_MS + 61_000,
        previousResultRef: 'result-preview',
        proposal: recipientAfterTimeout,
      }),
    ).toThrow(WordDuelRematchError);
  });

  it('keeps recipient-side views from editing or sending proposals', () => {
    const idle = createIdleRematchProposal({ gameLanguage: 'en', viewerRole: 'owner', viewerSide: 'a' });
    const draft = draftRematchProposal(idle);
    const recipientDraft = viewRematchProposalAsRecipient(draft, NOW_MS);

    expect(recipientDraft.canEditSettings).toBe(false);
    expect(recipientDraft.canSend).toBe(false);
    expect(() => draftRematchProposal(recipientDraft, { gameLanguage: 'es' })).toThrow(WordDuelRematchError);
    expect(() => sendRematchProposal({ nowMs: NOW_MS, proposal: recipientDraft })).toThrow(WordDuelRematchError);
  });
});
