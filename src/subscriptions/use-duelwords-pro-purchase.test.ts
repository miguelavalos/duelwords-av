import { describe, expect, it, vi } from 'vitest';

import { reconcileDuelWordsProAccess } from './pro-access-reconciliation';

describe('reconcileDuelWordsProAccess', () => {
  it('retries account access while a RevenueCat webhook is still propagating', async () => {
    let isPro = false;
    const refreshAccount = vi.fn(async () => {
      if (refreshAccount.mock.calls.length === 3) isPro = true;
    });
    const wait = vi.fn(async () => undefined);

    await expect(reconcileDuelWordsProAccess({
      isPro: () => isPro,
      refreshAccount,
      shouldContinue: () => true,
      wait,
    })).resolves.toBe(true);

    expect(refreshAccount).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(2);
  });

  it('stops retrying when the account or mounted purchase flow changes', async () => {
    let active = true;
    const refreshAccount = vi.fn(async () => {
      active = false;
    });

    await expect(reconcileDuelWordsProAccess({
      isPro: () => false,
      refreshAccount,
      shouldContinue: () => active,
      wait: async () => undefined,
    })).resolves.toBe(false);

    expect(refreshAccount).toHaveBeenCalledTimes(1);
  });

  it('treats temporary account refresh failures as delayed reconciliation', async () => {
    const refreshAccount = vi.fn(async () => {
      throw new Error('temporary network failure');
    });

    await expect(reconcileDuelWordsProAccess({
      isPro: () => false,
      refreshAccount,
      shouldContinue: () => true,
      wait: async () => undefined,
    })).resolves.toBe(false);

    expect(refreshAccount).toHaveBeenCalledTimes(5);
  });
});
