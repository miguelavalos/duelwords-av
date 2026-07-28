export const DUELWORDS_PRO_ENTITLEMENT_ID = 'pro' as const;
export const DUELWORDS_PRO_PRODUCT_ID = 'duelwordsav_pro_monthly' as const;

export type DuelWordsRevenueCatConfig = {
  apiKey: string | null;
  entitlementId: typeof DUELWORDS_PRO_ENTITLEMENT_ID;
  monthlyPackageId: string;
  offeringId: string;
  productId: typeof DUELWORDS_PRO_PRODUCT_ID;
};

type RevenueCatExtra = {
  apiKey?: unknown;
  monthlyPackageId?: unknown;
  offeringId?: unknown;
};

export function resolveDuelWordsRevenueCatConfig(input: unknown): DuelWordsRevenueCatConfig {
  const revenueCat = isRecord(input) ? input as RevenueCatExtra : {};
  return {
    apiKey: publicSdkKey(revenueCat.apiKey),
    entitlementId: DUELWORDS_PRO_ENTITLEMENT_ID,
    monthlyPackageId: stringValue(revenueCat.monthlyPackageId) ?? '$rc_monthly',
    offeringId: stringValue(revenueCat.offeringId) ?? 'default',
    productId: DUELWORDS_PRO_PRODUCT_ID,
  };
}

function publicSdkKey(value: unknown): string | null {
  const normalized = stringValue(value);
  return normalized?.startsWith('appl_') ? normalized : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
