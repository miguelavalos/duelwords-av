import { useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDuelWordsAds, type DuelWordsAdsContextValue } from './ads-context';
import { DuelWordsAdsProvider } from './ads-provider.native';

const testState = vi.hoisted(() => ({
  account: {
    access: { planTier: 'free' as 'free' | 'pro' },
    status: 'guest' as 'guest' | 'loading' | 'signed_in',
  },
  config: {
    homeBannerAdUnitId: null as string | null,
    mode: 'test' as 'disabled' | 'live' | 'test',
  },
}));
const consent = vi.hoisted(() => ({
  gatherConsent: vi.fn(async () => undefined),
  getConsentInfo: vi.fn(async () => ({
    canRequestAds: true,
    privacyOptionsRequirementStatus: 'not-required',
  })),
  showPrivacyOptionsForm: vi.fn(async () => undefined),
}));
const adsSdk = vi.hoisted(() => ({
  initialize: vi.fn(async () => undefined),
  setRequestConfiguration: vi.fn(async () => undefined),
}));

vi.mock('@/account/account-av-provider', () => ({
  useDuelWordsAccount: () => testState.account,
}));

vi.mock('./ads-config', () => ({
  getDuelWordsAdsConfig: () => testState.config,
}));

vi.mock('react-native-google-mobile-ads', () => ({
  AdsConsent: consent,
  AdsConsentPrivacyOptionsRequirementStatus: { REQUIRED: 'required' },
  MaxAdContentRating: { G: 'G' },
  default: () => adsSdk,
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let currentAds: DuelWordsAdsContextValue | undefined;

function AdsProbe() {
  const ads = useDuelWordsAds();
  useEffect(() => {
    currentAds = ads;
  }, [ads]);
  return null;
}

describe('DuelWordsAdsProvider', () => {
  let renderer: ReactTestRenderer | undefined;

  beforeEach(() => {
    testState.account.access.planTier = 'free';
    testState.account.status = 'guest';
    testState.config.homeBannerAdUnitId = null;
    testState.config.mode = 'test';
    consent.gatherConsent.mockClear();
    consent.getConsentInfo.mockClear();
    consent.showPrivacyOptionsForm.mockClear();
    adsSdk.initialize.mockClear();
    adsSdk.setRequestConfiguration.mockClear();
    currentAds = undefined;
  });

  afterEach(async () => {
    if (renderer) await act(async () => renderer?.unmount());
    renderer = undefined;
  });

  it('does not touch consent or ads before Home mounts the placement', async () => {
    await renderProvider();

    expect(currentAds?.canShowAds).toBe(false);
    expect(consent.gatherConsent).not.toHaveBeenCalled();
    expect(adsSdk.initialize).not.toHaveBeenCalled();
  });

  it('initializes once for an eligible Home and hides immediately for Pro', async () => {
    await renderProvider();

    await act(async () => {
      currentAds?.activateHomePlacement();
      await flushPromises();
    });

    expect(consent.gatherConsent).toHaveBeenCalledTimes(1);
    expect(adsSdk.setRequestConfiguration).toHaveBeenCalledWith({
      maxAdContentRating: 'G',
      testDeviceIdentifiers: ['EMULATOR'],
    });
    expect(adsSdk.initialize).toHaveBeenCalledTimes(1);
    expect(currentAds?.canShowAds).toBe(true);

    testState.account.access.planTier = 'pro';
    await act(async () => {
      renderer?.update(<DuelWordsAdsProvider><AdsProbe /></DuelWordsAdsProvider>);
    });

    expect(currentAds?.canShowAds).toBe(false);
    expect(consent.gatherConsent).toHaveBeenCalledTimes(1);
    expect(adsSdk.initialize).toHaveBeenCalledTimes(1);
  });

  it('keeps a Pro Home entirely outside UMP and Google initialization', async () => {
    testState.account.access.planTier = 'pro';
    testState.account.status = 'signed_in';
    await renderProvider();

    await act(async () => {
      currentAds?.activateHomePlacement();
      await flushPromises();
    });

    expect(currentAds?.canShowAds).toBe(false);
    expect(consent.gatherConsent).not.toHaveBeenCalled();
    expect(adsSdk.initialize).not.toHaveBeenCalled();
  });

  async function renderProvider() {
    await act(async () => {
      renderer = create(<DuelWordsAdsProvider><AdsProbe /></DuelWordsAdsProvider>);
      await flushPromises();
    });
  }
});

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
