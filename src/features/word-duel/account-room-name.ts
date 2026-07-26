import type { AccountAvInternalUser } from '../../account/account-api-client';
import { normalizeWordDuelGuestDisplayName } from '../../game/word-duel-public/guest-entry';

export function accountRoomDisplayName(
  user: AccountAvInternalUser,
  localizedFallback: string,
): string {
  const preferred = user.displayName
    ? normalizeWordDuelGuestDisplayName(user.displayName)
    : null;

  if (preferred?.ok) {
    return preferred.value;
  }

  const fallback = normalizeWordDuelGuestDisplayName(localizedFallback);
  return fallback.ok ? fallback.value : 'Player';
}
