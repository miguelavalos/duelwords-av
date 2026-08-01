const ACCOUNT_EXPIRY_REFRESH_GRACE_MS = 1_000;
const MAX_ACCOUNT_EXPIRY_TIMER_MS = 2_147_000_000;

export function accountExpiryRefreshDelay(expiresAt: string | null | undefined, nowMs = Date.now()): number | null {
  if (!expiresAt) return null;
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMs)) return null;
  return Math.min(
    Math.max(0, expiresAtMs - nowMs + ACCOUNT_EXPIRY_REFRESH_GRACE_MS),
    MAX_ACCOUNT_EXPIRY_TIMER_MS,
  );
}
