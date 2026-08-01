import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDuelWordsProPurchase } from './use-duelwords-pro-purchase';

const purchaseMocks = vi.hoisted(() => ({
  available: true,
  loadMonthlyOffer: vi.fn(),
  purchase: vi.fn(),
  refreshRevenueCat: vi.fn(),
  reconcile: vi.fn(),
  restore: vi.fn(),
}));

vi.mock('@/account/account-av-config', () => ({
  getDuelWordsAccountAvConfig: () => ({ accountApiBaseUrl: 'https://account.example.test' }),
}));

vi.mock('@/account/account-api-client', () => ({
  DuelWordsPromotionCodeError: class DuelWordsPromotionCodeError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  },
  redeemDuelWordsPromotionCode: vi.fn(),
  refreshDuelWordsRevenueCatSubscription: purchaseMocks.refreshRevenueCat,
}));

vi.mock('./expo-revenuecat-config', () => ({
  getDuelWordsRevenueCatConfig: () => ({
    apiKey: 'appl_public',
    entitlementId: 'pro',
    monthlyPackageId: '$rc_monthly',
    offeringId: 'default',
    productId: 'duelwordsav_pro_monthly',
  }),
}));

vi.mock('./pro-access-reconciliation', () => ({
  reconcileDuelWordsProAccess: purchaseMocks.reconcile,
}));

vi.mock('./revenuecat-purchases', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./revenuecat-purchases')>();
  return {
    ...actual,
    DuelWordsRevenueCatPurchases: class DuelWordsRevenueCatPurchases {
      get available() {
        return purchaseMocks.available;
      }

      loadMonthlyOffer = purchaseMocks.loadMonthlyOffer;
      purchase = purchaseMocks.purchase;
      restore = purchaseMocks.restore;
    },
  };
});

const monthlyPackage = {
  identifier: '$rc_monthly',
  product: { identifier: 'duelwordsav_pro_monthly', priceString: '€2.99' },
};
const activeCustomerInfo = {
  entitlements: { active: { pro: { isActive: true } } },
};
const inactiveCustomerInfo = {
  entitlements: { active: {} },
};

type HookInput = Parameters<typeof useDuelWordsProPurchase>[0];
type HookResult = ReturnType<typeof useDuelWordsProPurchase>;

describe('useDuelWordsProPurchase lifecycle', () => {
  beforeEach(() => {
    purchaseMocks.available = true;
    purchaseMocks.loadMonthlyOffer.mockReset().mockResolvedValue({
      package: monthlyPackage,
      price: '€2.99',
    });
    purchaseMocks.purchase.mockReset().mockResolvedValue(activeCustomerInfo);
    purchaseMocks.restore.mockReset().mockResolvedValue(activeCustomerInfo);
    purchaseMocks.refreshRevenueCat.mockReset().mockResolvedValue(true);
    purchaseMocks.reconcile.mockReset().mockResolvedValue(true);
  });

  it('moves a confirmed purchase through reconciliation into visible Pro', async () => {
    const harness = await renderPurchaseHook();

    expect(harness.current.state).toBe('ready');
    expect(harness.current.price).toBe('€2.99');

    await act(async () => {
      await harness.current.purchase();
    });

    expect(purchaseMocks.purchase).toHaveBeenCalledTimes(1);
    expect(purchaseMocks.reconcile).toHaveBeenCalledTimes(1);
    expect(harness.current.state).toBe('pending_reconciliation');

    await harness.update({ isPro: true });
    expect(harness.current.state).toBe('active');
    expect(harness.current.error).toBeNull();

    harness.unmount();
  });

  it('restores an active receipt and returns to Free-ready after later expiry', async () => {
    const harness = await renderPurchaseHook();

    await act(async () => {
      await harness.current.restore();
    });

    expect(purchaseMocks.restore).toHaveBeenCalledTimes(1);
    expect(purchaseMocks.refreshRevenueCat).toHaveBeenCalledWith(expect.objectContaining({
      baseUrl: 'https://account.example.test',
    }));
    expect(purchaseMocks.reconcile).toHaveBeenCalledTimes(1);
    expect(harness.current.state).toBe('pending_reconciliation');

    await harness.update({ isPro: true });
    expect(harness.current.state).toBe('active');

    await harness.update({ isPro: false });
    expect(harness.current.state).toBe('ready');
    expect(harness.current.price).toBe('€2.99');

    harness.unmount();
  });

  it('does not claim Pro and distinguishes purchase recovery from an inactive Restore', async () => {
    purchaseMocks.purchase.mockResolvedValueOnce(inactiveCustomerInfo);
    const harness = await renderPurchaseHook();

    await act(async () => {
      await harness.current.purchase();
    });

    expect(harness.current.state).toBe('ready');
    expect(harness.current.error).toBe(
      'Apple did not confirm active Pro access. Do not purchase again. Check your App Store account, then try Restore Purchases.',
    );
    expect(purchaseMocks.reconcile).not.toHaveBeenCalled();

    purchaseMocks.restore.mockResolvedValueOnce(inactiveCustomerInfo);
    await act(async () => {
      await harness.current.restore();
    });

    expect(harness.current.state).toBe('ready');
    expect(harness.current.error).toBe(
      'No active DuelWords Pro subscription was found for this App Store account. Subscribe to start Pro.',
    );
    expect(purchaseMocks.reconcile).not.toHaveBeenCalled();

    harness.unmount();
  });

  it('distinguishes cancellation, interrupted purchase failure, and Restore failure', async () => {
    purchaseMocks.purchase.mockRejectedValueOnce({ code: '1', userCancelled: true });
    const harness = await renderPurchaseHook();

    await act(async () => {
      await harness.current.purchase();
    });
    expect(harness.current.state).toBe('ready');
    expect(harness.current.error).toBeNull();

    purchaseMocks.purchase.mockRejectedValueOnce({ code: '2' });
    await act(async () => {
      await harness.current.purchase();
    });
    expect(harness.current.error).toBe(
      'The purchase could not be completed. You were not charged by DuelWords AV.',
    );

    purchaseMocks.restore.mockRejectedValueOnce(new Error('sandbox unavailable'));
    await act(async () => {
      await harness.current.restore();
    });
    expect(harness.current.error).toBe(
      'Purchases could not be restored right now. No account data was changed.',
    );

    harness.unmount();
  });

  it('keeps an active Restore visibly pending without inviting another subscription', async () => {
    purchaseMocks.reconcile.mockResolvedValueOnce(false);
    const harness = await renderPurchaseHook();

    await act(async () => {
      await harness.current.restore();
    });

    expect(harness.current.state).toBe('reconciliation_delayed');
    expect(harness.current.error).toBe(
      'Restore found an active subscription, but Pro confirmation is taking longer than expected. Do not subscribe again.',
    );
    harness.unmount();
  });

  it('keeps a completed purchase pending with source-specific anti-repurchase copy', async () => {
    purchaseMocks.reconcile.mockResolvedValueOnce(false);
    const harness = await renderPurchaseHook();

    await act(async () => {
      await harness.current.purchase();
    });

    expect(harness.current.state).toBe('reconciliation_delayed');
    expect(harness.current.error).toBe(
      'Purchase received, but Pro confirmation is taking longer than expected. Do not purchase again.',
    );
    harness.unmount();
  });

  it('suppresses a second purchase tap while StoreKit is unresolved', async () => {
    let completePurchase: ((value: typeof activeCustomerInfo) => void) | undefined;
    purchaseMocks.purchase.mockImplementationOnce(() => new Promise((resolve) => {
      completePurchase = resolve;
    }));
    const harness = await renderPurchaseHook();

    let firstPurchase: Promise<void> | undefined;
    await act(async () => {
      firstPurchase = harness.current.purchase();
      void harness.current.purchase();
      await Promise.resolve();
    });

    expect(purchaseMocks.purchase).toHaveBeenCalledTimes(1);

    await act(async () => {
      completePurchase?.(activeCustomerInfo);
      await firstPurchase;
    });

    expect(purchaseMocks.reconcile).toHaveBeenCalledTimes(1);
    harness.unmount();
  });
});

async function renderPurchaseHook(overrides: Partial<HookInput> = {}) {
  let current: HookResult | undefined;
  let renderer: ReactTestRenderer;
  let input: HookInput = {
    getToken: async () => 'account-token',
    isPro: false,
    refreshAccount: async () => undefined,
    userId: 'apps-av-user',
    ...overrides,
  };

  function Probe(props: HookInput) {
    current = useDuelWordsProPurchase(props);
    return null;
  }

  await act(async () => {
    renderer = create(<Probe {...input} />);
  });

  await flushEffects();

  return {
    get current() {
      if (!current) throw new Error('purchase hook did not render');
      return current;
    },
    unmount() {
      act(() => renderer.unmount());
    },
    async update(next: Partial<HookInput>) {
      input = { ...input, ...next };
      await act(async () => {
        renderer.update(<Probe {...input} />);
      });
      await flushEffects();
    },
  };
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}
