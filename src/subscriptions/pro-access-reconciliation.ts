const RECONCILIATION_RETRY_DELAYS_MS = [0, 500, 1_500, 3_000, 5_000] as const;

export async function reconcileDuelWordsProAccess(input: {
  isPro: () => boolean;
  refreshAccount: () => Promise<void>;
  shouldContinue: () => boolean;
  wait?: (delayMs: number) => Promise<void>;
}): Promise<boolean> {
  const wait = input.wait ?? waitMilliseconds;

  for (const delayMs of RECONCILIATION_RETRY_DELAYS_MS) {
    if (!input.shouldContinue()) return false;
    if (input.isPro()) return true;
    if (delayMs > 0) await wait(delayMs);
    if (!input.shouldContinue()) return false;
    if (input.isPro()) return true;
    try {
      await input.refreshAccount();
    } catch {
      // A transient Account AV failure must not turn a completed StoreKit
      // transaction into a false purchase-failed message. Keep the bounded
      // retry loop and finish in the recoverable delayed state instead.
    }
  }

  return input.isPro();
}

function waitMilliseconds(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
