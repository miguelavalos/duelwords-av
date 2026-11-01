import { describe, expect, it, vi } from 'vitest';

import { resolveDuelWordsRevenueCatConfig } from './revenuecat-config';
import {
  DuelWordsRevenueCatPurchases,
  hasActiveRevenueCatEntitlement,
  isPurchaseCancellation,
  RevenueCatConfigurationError,
} from './revenuecat-purchases';

function fixture() {
  const monthlyPackage = {
    identifier: '$rc_monthly',
    product: { identifier: 'duelwordsav_pro_monthly', priceString: '€2.99' },
  };
  const customerInfo = {
    entitlements: {
      active: {
        pro: { identifier: 'pro', isActive: true },
      },
    },
  };
  const sdk = {
    configure: vi.fn(),
    getAppUserID: vi.fn(async () => 'apps-av-user'),
    getOfferings: vi.fn(async () => ({
      all: {
        default: { availablePackages: [monthlyPackage], identifier: 'default' },
      },
      current: null,
    })),
    isConfigured: vi.fn(async () => false),
    logIn: vi.fn(async () => ({})),
    purchasePackage: vi.fn(async () => ({ customerInfo })),
    restorePurchases: vi.fn(async () => customerInfo),
    setAllowSharingStoreAccount: vi.fn(async () => undefined),
  };
  const purchases = new DuelWordsRevenueCatPurchases(
    resolveDuelWordsRevenueCatConfig({ apiKey: 'appl_public' }),
    async () => sdk as never,
  );
  return { customerInfo, monthlyPackage, purchases, sdk };
}

describe('DuelWordsRevenueCatPurchases', () => {
  it('configures only with the internal Apps AV user and disables attribution identifiers', async () => {
    const { purchases, sdk } = fixture();
    await purchases.loadMonthlyOffer('apps-av-user');
    expect(sdk.configure).toHaveBeenCalledWith({
      apiKey: 'appl_public',
      appUserID: 'apps-av-user',
      automaticDeviceIdentifierCollectionEnabled: false,
    });
    expect(sdk.setAllowSharingStoreAccount).toHaveBeenCalledWith(false);
  });

  it('loads the priced offer anonymously for guests and logs in once an account exists', async () => {
    const { purchases, sdk } = fixture();
    sdk.getAppUserID.mockResolvedValue('$RCAnonymousID:abc');
    await expect(purchases.loadMonthlyOffer(null)).resolves.toMatchObject({ price: '€2.99' });
    expect(sdk.configure).toHaveBeenCalledWith({
      apiKey: 'appl_public',
      automaticDeviceIdentifierCollectionEnabled: false,
    });
    expect(sdk.logIn).not.toHaveBeenCalled();

    sdk.isConfigured.mockResolvedValue(true);
    await purchases.loadMonthlyOffer('apps-av-user');
    expect(sdk.logIn).toHaveBeenCalledWith('apps-av-user');
    expect(sdk.configure).toHaveBeenCalledTimes(1);
  });

  it('refuses to purchase or restore without the internal Apps AV user', async () => {
    const { monthlyPackage, purchases, sdk } = fixture();
    await expect(purchases.purchase('', monthlyPackage as never)).rejects.toEqual(
      new RevenueCatConfigurationError('account_user_required'),
    );
    await expect(purchases.restore(' ')).rejects.toEqual(
      new RevenueCatConfigurationError('account_user_required'),
    );
    expect(sdk.purchasePackage).not.toHaveBeenCalled();
    expect(sdk.restorePurchases).not.toHaveBeenCalled();
  });

  it('requires the canonical product in the configured monthly package', async () => {
    const { purchases, sdk } = fixture();
    sdk.getOfferings.mockResolvedValueOnce({
      all: { default: { availablePackages: [], identifier: 'default' } },
      current: null,
    });
    await expect(purchases.loadMonthlyOffer('apps-av-user')).rejects.toMatchObject({
      code: 'monthly_offer_unavailable',
    });
  });

  it('recognizes user-cancelled StoreKit purchases without presenting an error', () => {
    expect(isPurchaseCancellation({ code: '1' })).toBe(true);
    expect(isPurchaseCancellation({ userCancelled: true })).toBe(true);
    expect(isPurchaseCancellation({ code: '2' })).toBe(false);
  });

  it('returns the post-purchase and restored customer information', async () => {
    const { customerInfo, monthlyPackage, purchases } = fixture();

    await expect(purchases.purchase('apps-av-user', monthlyPackage as never)).resolves.toBe(customerInfo);
    await expect(purchases.restore('apps-av-user')).resolves.toBe(customerInfo);
  });

  it('requires the configured entitlement to be explicitly active', () => {
    const { customerInfo } = fixture();

    expect(hasActiveRevenueCatEntitlement(customerInfo as never, 'pro')).toBe(true);
    expect(hasActiveRevenueCatEntitlement(customerInfo as never, 'another')).toBe(false);
    expect(hasActiveRevenueCatEntitlement({ entitlements: { active: {} } } as never, 'pro')).toBe(false);
  });
});
