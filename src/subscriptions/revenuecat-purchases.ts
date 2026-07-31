import type {
  CustomerInfo,
  MakePurchaseResult,
  PurchasesError,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';

import type { DuelWordsRevenueCatConfig } from './revenuecat-config';

type PurchasesSdk = {
  configure: (configuration: {
    apiKey: string;
    appUserID: string;
    automaticDeviceIdentifierCollectionEnabled: boolean;
  }) => void;
  getAppUserID: () => Promise<string>;
  getOfferings: () => Promise<PurchasesOfferings>;
  isConfigured: () => Promise<boolean>;
  logIn: (appUserID: string) => Promise<unknown>;
  purchasePackage: (aPackage: PurchasesPackage) => Promise<MakePurchaseResult>;
  restorePurchases: () => Promise<CustomerInfo>;
  setAllowSharingStoreAccount: (allowSharing: boolean) => Promise<void>;
};

export type DuelWordsMonthlyOffer = {
  package: PurchasesPackage;
  price: string;
};

export class DuelWordsRevenueCatPurchases {
  private preparation: Promise<PurchasesSdk> | null = null;

  constructor(
    private readonly config: DuelWordsRevenueCatConfig,
    private readonly loadSdk: () => Promise<PurchasesSdk> = loadRevenueCatSdk,
  ) {}

  get available(): boolean {
    return this.config.apiKey !== null;
  }

  async loadMonthlyOffer(appUserId: string): Promise<DuelWordsMonthlyOffer> {
    const sdk = await this.prepare(appUserId);
    const offerings = await sdk.getOfferings();
    const offering = offerings.all[this.config.offeringId]
      ?? (offerings.current?.identifier === this.config.offeringId ? offerings.current : null);
    const monthlyPackage = offering?.availablePackages.find(
      (candidate) => candidate.identifier === this.config.monthlyPackageId,
    );
    if (!monthlyPackage || monthlyPackage.product.identifier !== this.config.productId) {
      throw new RevenueCatConfigurationError('monthly_offer_unavailable');
    }
    return { package: monthlyPackage, price: monthlyPackage.product.priceString };
  }

  async purchase(appUserId: string, monthlyPackage: PurchasesPackage): Promise<CustomerInfo> {
    const sdk = await this.prepare(appUserId);
    const result = await sdk.purchasePackage(monthlyPackage);
    return result.customerInfo;
  }

  async restore(appUserId: string): Promise<CustomerInfo> {
    const sdk = await this.prepare(appUserId);
    return sdk.restorePurchases();
  }

  private async prepare(appUserId: string): Promise<PurchasesSdk> {
    if (!this.config.apiKey) throw new RevenueCatConfigurationError('public_sdk_key_missing');
    if (!appUserId.trim()) throw new RevenueCatConfigurationError('account_user_required');

    this.preparation ??= this.configureOrIdentify(appUserId).finally(() => {
      this.preparation = null;
    });
    const sdk = await this.preparation;
    const currentUserId = await sdk.getAppUserID();
    if (currentUserId !== appUserId) await sdk.logIn(appUserId);
    return sdk;
  }

  private async configureOrIdentify(appUserId: string): Promise<PurchasesSdk> {
    const sdk = await this.loadSdk();
    if (!await sdk.isConfigured()) {
      sdk.configure({
        apiKey: this.config.apiKey!,
        appUserID: appUserId,
        automaticDeviceIdentifierCollectionEnabled: false,
      });
      await sdk.setAllowSharingStoreAccount(false);
      return sdk;
    }
    if (await sdk.getAppUserID() !== appUserId) await sdk.logIn(appUserId);
    return sdk;
  }
}

export class RevenueCatConfigurationError extends Error {
  constructor(readonly code: 'account_user_required' | 'monthly_offer_unavailable' | 'public_sdk_key_missing') {
    super(code);
    this.name = 'RevenueCatConfigurationError';
  }
}

export function isPurchaseCancellation(error: unknown): boolean {
  const candidate = error as Partial<PurchasesError> | null;
  return candidate?.userCancelled === true || candidate?.code === '1';
}

export function hasActiveRevenueCatEntitlement(
  customerInfo: CustomerInfo,
  entitlementId: string,
): boolean {
  return customerInfo.entitlements.active[entitlementId]?.isActive === true;
}

async function loadRevenueCatSdk(): Promise<PurchasesSdk> {
  const module = await import('react-native-purchases');
  return module.default;
}
