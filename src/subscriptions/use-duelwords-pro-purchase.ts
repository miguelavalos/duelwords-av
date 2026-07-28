import { useCallback, useEffect, useMemo, useState } from 'react';

import { getDuelWordsRevenueCatConfig } from './expo-revenuecat-config';
import {
  DuelWordsRevenueCatPurchases,
  isPurchaseCancellation,
  type DuelWordsMonthlyOffer,
} from './revenuecat-purchases';

export type DuelWordsProPurchaseState =
  | 'active'
  | 'loading'
  | 'pending_reconciliation'
  | 'ready'
  | 'unavailable';

export function useDuelWordsProPurchase(input: {
  isPro: boolean;
  refreshAccount: () => Promise<void>;
  userId: string | null;
}) {
  const { isPro, refreshAccount, userId } = input;
  const config = useMemo(() => getDuelWordsRevenueCatConfig(), []);
  const purchases = useMemo(() => new DuelWordsRevenueCatPurchases(config), [config]);
  const [offer, setOffer] = useState<DuelWordsMonthlyOffer | null>(null);
  const [state, setState] = useState<DuelWordsProPurchaseState>(
    isPro ? 'active' : userId && purchases.available ? 'loading' : 'unavailable',
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPro) {
      setState('active');
      setError(null);
      return;
    }
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
    setState('pending_reconciliation');
    setError(null);
    await refreshAccount();
  }, [refreshAccount]);

  const purchase = useCallback(async () => {
    if (!userId || !offer || state !== 'ready') return;
    setState('loading');
    setError(null);
    try {
      await purchases.purchase(userId, offer.package);
      await reconcile();
    } catch (purchaseError: unknown) {
      setState('ready');
      if (!isPurchaseCancellation(purchaseError)) {
        setError('The purchase could not be completed. You were not charged by DuelWords AV.');
      }
    }
  }, [userId, offer, purchases, reconcile, state]);

  const restore = useCallback(async () => {
    if (!userId || state === 'loading') return;
    setState('loading');
    setError(null);
    try {
      await purchases.restore(userId);
      await reconcile();
    } catch {
      setState(offer ? 'ready' : 'unavailable');
      setError('Purchases could not be restored right now. No account data was changed.');
    }
  }, [userId, offer, purchases, reconcile, state]);

  return {
    error,
    price: offer?.price ?? null,
    purchase,
    restore,
    state,
  };
}
