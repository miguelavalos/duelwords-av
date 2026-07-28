import { describe, expect, it } from 'vitest';

import {
  DUELWORDS_PRO_ENTITLEMENT_ID,
  DUELWORDS_PRO_PRODUCT_ID,
  resolveDuelWordsRevenueCatConfig,
} from './revenuecat-config';

describe('resolveDuelWordsRevenueCatConfig', () => {
  it('uses the canonical DuelWords product contract and safe package defaults', () => {
    expect(resolveDuelWordsRevenueCatConfig({ apiKey: 'appl_public' })).toEqual({
      apiKey: 'appl_public',
      entitlementId: DUELWORDS_PRO_ENTITLEMENT_ID,
      monthlyPackageId: '$rc_monthly',
      offeringId: 'default',
      productId: DUELWORDS_PRO_PRODUCT_ID,
    });
  });

  it('rejects secret or malformed keys from the public client runtime', () => {
    expect(resolveDuelWordsRevenueCatConfig({ apiKey: 'sk_secret' }).apiKey).toBeNull();
    expect(resolveDuelWordsRevenueCatConfig({ apiKey: '' }).apiKey).toBeNull();
  });
});
