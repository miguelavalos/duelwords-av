import { describe, expect, test } from 'vitest';

import type { DuelWordsApiRematchProposal } from '@/game/word-duel-lobby/api-client';

import { canRequestRematch } from './rematch-state';

describe('canRequestRematch', () => {
  test.each(['cancelled', 'declined', 'expired'] as const)(
    'allows a new request after a %s proposal',
    (status) => {
      expect(canRequestRematch(proposalWithStatus(status))).toBe(true);
    },
  );

  test.each(['accepted', 'sent'] as const)('keeps %s proposals single-use', (status) => {
    expect(canRequestRematch(proposalWithStatus(status))).toBe(false);
  });

  test('allows the first request', () => {
    expect(canRequestRematch(null)).toBe(true);
  });
});

function proposalWithStatus(status: DuelWordsApiRematchProposal['status']): DuelWordsApiRematchProposal {
  return { status } as DuelWordsApiRematchProposal;
}
