import type { DuelWordsApiActor } from '../word-duel-lobby/api-client';

type DuelWordsGuestActor = Extract<DuelWordsApiActor, { actorType: 'guest_session' }>;

const INVITE_HOST = 'app.duelwords-av.avalsys.com';
const INVITE_PATH_PREFIX = '/i/c/';
const INVITE_TOKEN_PATTERN = /^[a-z0-9_-]{8,160}$/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const GUEST_SESSION_STORAGE_KEY = 'duelwords-av:guest-session:v1';

export type DuelWordsGuestSessionStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type WordDuelGuestDisplayNameResult =
  | { ok: true; value: string }
  | { ok: false; reason: 'empty' | 'too_long' | 'unsupported_character' };

export type WordDuelInviteEntryResult =
  | { ok: true; source: 'invite_token'; value: string }
  | { ok: false; reason: 'invalid_invite' | 'unsupported_host' };

export type WordDuelRoomCodeResult =
  | { ok: true; value: string }
  | { ok: false; reason: 'invalid_room_code' };

export function normalizeWordDuelGuestDisplayName(input: string): WordDuelGuestDisplayNameResult {
  const value = input.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (value.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    return { ok: false, reason: 'unsupported_character' };
  }
  if (Array.from(value).length > 32) {
    return { ok: false, reason: 'too_long' };
  }

  return { ok: true, value };
}

export function createWordDuelDefaultGuestDisplayName(randomUuid: () => string): string {
  const suffix = randomUuid().replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
  return suffix.length === 4 ? `Guest ${suffix}` : 'Guest';
}

export function createWordDuelGuestActor(input: {
  displayName: string;
  guestSessionId?: string;
  randomUuid: () => string;
}): DuelWordsGuestActor {
  const displayName = normalizeWordDuelGuestDisplayName(input.displayName);
  if (!displayName.ok) {
    throw new Error(`invalid_guest_display_name:${displayName.reason}`);
  }

  const guestSessionId = input.guestSessionId ?? createGuestSessionId(input.randomUuid);

  return {
    actorType: 'guest_session',
    guestSessionId,
    safeDisplayName: displayName.value,
  };
}

export function getOrCreateWordDuelGuestSessionId(
  randomUuid: () => string,
  storage: DuelWordsGuestSessionStorage | null = deviceStorage(),
): string {
  if (storage) {
    try {
      const existing = storage.getItem(GUEST_SESSION_STORAGE_KEY);
      if (isGuestSessionId(existing)) return existing;
    } catch {
      // Continue with an in-memory identity if device storage is unavailable.
    }
  }
  const created = createGuestSessionId(randomUuid);
  try {
    storage?.setItem(GUEST_SESSION_STORAGE_KEY, created);
  } catch {
    // Guest play remains available; only cross-screen quota continuity degrades.
  }
  return created;
}

function createGuestSessionId(randomUuid: () => string): string {
  const uuid = randomUuid().trim().replace(/[^a-z0-9-]/gi, '').slice(0, 96);
  if (uuid.length < 16) throw new Error('invalid_guest_session_randomness');
  return `dwg_${uuid}`;
}

function isGuestSessionId(value: unknown): value is string {
  return typeof value === 'string' && /^dwg_[a-z0-9-]{16,96}$/i.test(value);
}

function deviceStorage(): DuelWordsGuestSessionStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function parseWordDuelInviteEntry(input: string): WordDuelInviteEntryResult {
  const value = input.trim();
  if (INVITE_TOKEN_PATTERN.test(value)) {
    return { ok: true, source: 'invite_token', value };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: 'invalid_invite' };
  }

  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== INVITE_HOST) {
    return { ok: false, reason: 'unsupported_host' };
  }
  if (!url.pathname.startsWith(INVITE_PATH_PREFIX)) {
    return { ok: false, reason: 'invalid_invite' };
  }

  let token: string;
  try {
    token = decodeURIComponent(url.pathname.slice(INVITE_PATH_PREFIX.length)).trim();
  } catch {
    return { ok: false, reason: 'invalid_invite' };
  }
  if (!INVITE_TOKEN_PATTERN.test(token) || token.includes('/')) {
    return { ok: false, reason: 'invalid_invite' };
  }

  return { ok: true, source: 'invite_token', value: token };
}

export function normalizeWordDuelRoomCode(input: string): WordDuelRoomCodeResult {
  const compact = input.replace(/[^a-z0-9]/gi, '').toUpperCase();
  if (!/^[0-9A-F]{8}$/.test(compact)) {
    return { ok: false, reason: 'invalid_room_code' };
  }

  return { ok: true, value: `${compact.slice(0, 4)}-${compact.slice(4)}` };
}
