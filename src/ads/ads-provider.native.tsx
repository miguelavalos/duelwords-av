import {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  MaxAdContentRating,
  default as mobileAds,
} from 'react-native-google-mobile-ads';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { DuelWordsAdsContext } from './ads-context';
import { getDuelWordsAdsConfig } from './ads-config';
import { canRequestDuelWordsAds } from './ads-policy';

export function DuelWordsAdsProvider({ children }: { children: ReactNode }) {
  const account = useDuelWordsAccount();
  const config = useMemo(() => getDuelWordsAdsConfig(), []);
  const initializationStarted = useRef(false);
  const mounted = useRef(false);
  const [canShowAds, setCanShowAds] = useState(false);
  const [homePlacementActive, setHomePlacementActive] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  const accountEligible = canRequestDuelWordsAds(config.mode, {
    planTier: account.access.planTier,
    status: account.status,
  });
  const eligible = accountEligible && homePlacementActive;

  const activateHomePlacement = useCallback(() => {
    setHomePlacementActive(true);
    return () => { setHomePlacementActive(false); };
  }, []);

  const refreshConsentState = useCallback(async () => {
    const consentInfo = await AdsConsent.getConsentInfo();
    setPrivacyOptionsRequired(
      consentInfo.privacyOptionsRequirementStatus
        === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    );
    return consentInfo.canRequestAds;
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!eligible) return;
    if (initializationStarted.current) return;
    initializationStarted.current = true;

    const start = async () => {
      try {
        await AdsConsent.gatherConsent();
      } catch {
        // UMP may still retain a valid choice from a previous session.
      }

      const mayRequest = await refreshConsentState().catch(() => false);
      if (!mayRequest) return;

      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.G,
        ...(config.mode === 'test' ? { testDeviceIdentifiers: ['EMULATOR'] } : {}),
      });
      await mobileAds().initialize();
      if (mounted.current) setCanShowAds(true);
    };

    void start().catch(() => {
      if (mounted.current) setCanShowAds(false);
    });
  }, [config.mode, eligible, refreshConsentState]);

  const showPrivacyOptions = useCallback(async () => {
    try {
      await AdsConsent.showPrivacyOptionsForm();
      await refreshConsentState();
    } catch {
      // Keep Settings usable if UMP has no configured form or is offline.
    }
  }, [refreshConsentState]);

  const value = useMemo(() => ({
    activateHomePlacement,
    canShowAds: eligible && canShowAds,
    homeBannerAdUnitId: config.homeBannerAdUnitId,
    mode: config.mode,
    privacyOptionsRequired,
    showPrivacyOptions,
  }), [activateHomePlacement, canShowAds, config.homeBannerAdUnitId, config.mode, eligible, privacyOptionsRequired, showPrivacyOptions]);

  return <DuelWordsAdsContext.Provider value={value}>{children}</DuelWordsAdsContext.Provider>;
}
