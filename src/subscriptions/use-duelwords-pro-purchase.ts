import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DuelWordsPromotionCodeError,
  redeemDuelWordsPromotionCode,
} from '@/account/account-api-client';
import { getDuelWordsAccountAvConfig } from '@/account/account-av-config';
import type { SharedSurfaceCopyKey } from '@/i18n/shared-surface-copy';

import { getDuelWordsRevenueCatConfig } from './expo-revenuecat-config';
import { reconcileDuelWordsProAccess } from './pro-access-reconciliation';
import {
  DuelWordsRevenueCatPurchases,
  isPurchaseCancellation,
  type DuelWordsMonthlyOffer,
} from './revenuecat-purchases';

export type DuelWordsProPurchaseState =
  | 'active'
  | 'loading'
  | 'pending_reconciliation'
  | 'reconciliation_delayed'
  | 'ready'
  | 'unavailable';

export function useDuelWordsProPurchase(input: {
  getToken: () => Promise<string | null>;
  isPro: boolean;
  refreshAccount: () => Promise<void>;
  userId: string | null;
}) {
  const { getToken, isPro, refreshAccount, userId } = input;
  const accountConfig = useMemo(() => getDuelWordsAccountAvConfig(), []);
  const config = useMemo(() => getDuelWordsRevenueCatConfig(), []);
  const purchases = useMemo(() => new DuelWordsRevenueCatPurchases(config), [config]);
  const isProRef = useRef(isPro);
  const operationInFlightRef = useRef(false);
  const reconciliationGenerationRef = useRef(0);
  const userIdRef = useRef(userId);
  const [offer, setOffer] = useState<DuelWordsMonthlyOffer | null>(null);
  const [state, setState] = useState<DuelWordsProPurchaseState>(
    isPro ? 'active' : userId && purchases.available ? 'loading' : 'unavailable',
  );
  const [error, setError] = useState<SharedSurfaceCopyKey | null>(null);

  useEffect(() => {
    isProRef.current = isPro;
    userIdRef.current = userId;
  }, [isPro, userId]);

  useEffect(() => {
    reconciliationGenerationRef.current += 1;
    operationInFlightRef.current = false;
    return () => {
      reconciliationGenerationRef.current += 1;
      operationInFlightRef.current = false;
    };
  }, [userId]);

  useEffect(() => {
    if (isPro) return;
    if (!userId || !purchases.available) {
      setOffer(null);
      setState('unavailable');
      return;
    }

    let cancelled = false;
    setState('loading');
    setError(null);
    void purchases.loadMonthlyOffer(userId)
      .then((nextOffer) => {
        if (cancelled) return;
        setOffer(nextOffer);
        setState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setOffer(null);
        setState('unavailable');
        setError('DuelWords Pro is temporarily unavailable. No purchase was made.');
      });
    return () => { cancelled = true; };
  }, [isPro, purchases, userId]);

  const reconcile = useCallback(async () => {
    const expectedUserId = userId;
    const generation = ++reconciliationGenerationRef.current;
    setState('pending_reconciliation');
    setError(null);
    const reconciled = await reconcileDuelWordsProAccess({
      isPro: () => isProRef.current,
      refreshAccount,
      shouldContinue: () => (
        reconciliationGenerationRef.current === generation
        && userIdRef.current === expectedUserId
      ),
    });
    if (
      !reconciled
      && reconciliationGenerationRef.current === generation
      && userIdRef.current === expectedUserId
      && !isProRef.current
    ) {
      setState('reconciliation_delayed');
      setError('Purchase received, but Pro access is still syncing. Try Restore Purchases in a moment.');
    }
  }, [refreshAccount, userId]);

  const purchase = useCallback(async () => {
    if (!userId || !offer || state !== 'ready' || operationInFlightRef.current) return;
    operationInFlightRef.current = true;
    setState('loading');
    setError(null);
    try {
      await purchases.purchase(userId, offer.package);
    } catch (purchaseError: unknown) {
      setState('ready');
      if (!isPurchaseCancellation(purchaseError)) {
        setError('The purchase could not be completed. You were not charged by DuelWords AV.');
      }
      operationInFlightRef.current = false;
      return;
    }
    await reconcile();
    operationInFlightRef.current = false;
  }, [userId, offer, purchases, reconcile, state]);

  const restore = useCallback(async () => {
    if (!userId || state === 'loading' || operationInFlightRef.current) return;
    operationInFlightRef.current = true;
    setState('loading');
    setError(null);
    try {
      await purchases.restore(userId);
    } catch {
      setState(offer ? 'ready' : 'unavailable');
      setError('Purchases could not be restored right now. No account data was changed.');
      operationInFlightRef.current = false;
      return;
    }
    await reconcile();
    operationInFlightRef.current = false;
  }, [userId, offer, purchases, reconcile, state]);

  const redeemCode = useCallback(async (code: string) => {
    if (!userId || !accountConfig.accountApiBaseUrl || state === 'loading' || state === 'pending_reconciliation' || operationInFlightRef.current) return;
    operationInFlightRef.current = true;
    setState('loading');
    setError(null);
    try {
      await redeemDuelWordsPromotionCode({
        baseUrl: accountConfig.accountApiBaseUrl,
        code,
        getToken,
      });
    } catch (redemptionError: unknown) {
      setState(offer ? 'ready' : 'unavailable');
      setError(promotionCodeErrorMessage(redemptionError));
      operationInFlightRef.current = false;
      return;
    }
    await reconcile();
    operationInFlightRef.current = false;
  }, [accountConfig.accountApiBaseUrl, getToken, offer, reconcile, state, userId]);

  const prepareRedeemCode = useCallback(() => {
    if (state !== 'loading' && state !== 'pending_reconciliation' && state !== 'reconciliation_delayed') setError(null);
  }, [state]);

  return {
    error: isPro ? null : error,
    price: offer?.price ?? null,
    prepareRedeemCode,
    purchase,
    redeemCode,
    restore,
    state: isPro ? 'active' : state,
  };
}

function promotionCodeErrorMessage(error: unknown): SharedSurfaceCopyKey {
  if (error instanceof DuelWordsPromotionCodeError) {
    switch (error.code) {
      case 'promo_code_already_redeemed':
        return 'This promo code was already used on this account.';
      case 'promo_code_expired':
        return 'This promo code is no longer available.';
      case 'promo_code_fully_claimed':
        return 'This promo code has already been fully claimed.';
      case 'promo_code_unavailable':
        return 'This promo code is not available.';
    }
  }
  return 'The promo code could not be redeemed. No purchase was made.';
}
