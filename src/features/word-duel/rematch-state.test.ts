import { afterEach, describe, expect, test, vi } from 'vitest';

import type { DuelWordsApiRematchProposal } from '@/game/word-duel-lobby/api-client';

import {
  canRequestRematch,
  rematchProposalRevisionKey,
  startRematchProposalPolling,
} from './rematch-state';

afterEach(() => {
  vi.useRealTimers();
});

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

describe('startRematchProposalPolling', () => {
  test('loads immediately, backs off while unchanged, and stops cleanly', async () => {
    vi.useFakeTimers();
    const proposal = proposalWithStatus('sent');
    const load = vi.fn().mockResolvedValue(proposal);
    const onProposal = vi.fn();

    const stop = startRematchProposalPolling({ load, onProposal });
    await vi.runAllTicks();
    expect(load).toHaveBeenCalledTimes(1);
    expect(onProposal).toHaveBeenLastCalledWith(proposal);

    await vi.advanceTimersByTimeAsync(2_000);
    expect(load).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(4_000);
    expect(load).toHaveBeenCalledTimes(3);

    stop();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(load).toHaveBeenCalledTimes(3);
  });

  test('returns to the responsive interval when the proposal revision changes', async () => {
    vi.useFakeTimers();
    const sent = proposalWithStatus('sent');
    const accepted = {
      ...sent,
      nextGame: { gameId: 'next-game' },
      status: 'accepted',
    } as DuelWordsApiRematchProposal;
    const load = vi.fn()
      .mockResolvedValueOnce(sent)
      .mockResolvedValueOnce(sent)
      .mockResolvedValue(accepted);

    const stop = startRematchProposalPolling({ load, onProposal: vi.fn() });
    await vi.runAllTicks();
    await vi.advanceTimersByTimeAsync(2_000);
    await vi.advanceTimersByTimeAsync(4_000);
    expect(load).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(2_000);
    expect(load).toHaveBeenCalledTimes(4);
    stop();
  });

  test('does not publish an in-flight response after stopping', async () => {
    vi.useFakeTimers();
    let resolveLoad!: (proposal: DuelWordsApiRematchProposal | null) => void;
    const load = vi.fn(() => new Promise<DuelWordsApiRematchProposal | null>((resolve) => {
      resolveLoad = resolve;
    }));
    const onProposal = vi.fn();

    const stop = startRematchProposalPolling({ load, onProposal });
    stop();
    resolveLoad(proposalWithStatus('sent'));
    await vi.runAllTicks();

    expect(onProposal).not.toHaveBeenCalled();
  });
});

test('rematch proposal revision changes when acceptance opens the next game', () => {
  const sent = proposalWithStatus('sent');
  const accepted = {
    ...sent,
    status: 'accepted',
    nextGame: { gameId: 'next-game' },
  } as DuelWordsApiRematchProposal;
  expect(rematchProposalRevisionKey(sent)).not.toBe(rematchProposalRevisionKey(accepted));
});

function proposalWithStatus(status: DuelWordsApiRematchProposal['status']): DuelWordsApiRematchProposal {
  return {
    nextGame: null,
    proposalId: 'proposal-1',
    status,
    viewer: {
      canAccept: status === 'sent',
      canCancel: false,
      canDecline: status === 'sent',
    },
  } as DuelWordsApiRematchProposal;
}
