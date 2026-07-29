import { describe, expect, it } from 'vitest';

import {
  createWordDuelDefaultGuestDisplayName,
  createWordDuelGuestActor,
  getOrCreateWordDuelGuestSessionId,
  normalizeWordDuelGuestDisplayName,
  normalizeWordDuelRoomCode,
  parseWordDuelInviteEntry,
  sanitizeWordDuelRoomCodePart,
  splitWordDuelRoomCode,
} from './guest-entry';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe('public guest Word Duel entry', () => {
  it('keeps one opaque guest session across screens on the same device', () => {
    const storage = memoryStorage();
    const first = getOrCreateWordDuelGuestSessionId(
      () => '12345678-1234-1234-1234-123456789abc',
      storage,
    );
    const second = getOrCreateWordDuelGuestSessionId(
      () => 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      storage,
    );
    expect(second).toBe(first);
    expect(first).toBe('dwg_12345678-1234-1234-1234-123456789abc');
  });
  it('creates a local editable guest alias without establishing identity', () => {
    expect(createWordDuelDefaultGuestDisplayName(
      () => '12345678-1234-1234-1234-123456789abc',
    )).toBe('Guest 1234');
    expect(createWordDuelDefaultGuestDisplayName(() => 'x')).toBe('Guest');
  });

  it('normalizes a room-scoped guest display name and enforces the backend length boundary', () => {
    expect(normalizeWordDuelGuestDisplayName('  María   Sol  ')).toEqual({
      ok: true,
      value: 'María Sol',
    });
    expect(normalizeWordDuelGuestDisplayName('')).toEqual({ ok: false, reason: 'empty' });
    expect(normalizeWordDuelGuestDisplayName('a'.repeat(33))).toEqual({
      ok: false,
      reason: 'too_long',
    });
    expect(normalizeWordDuelGuestDisplayName('Player\u0000Name')).toEqual({
      ok: false,
      reason: 'unsupported_character',
    });
  });

  it('creates a non-provider guest actor without turning the display name into identity', () => {
    expect(createWordDuelGuestActor({
      displayName: '  Rival  ',
      randomUuid: () => '12345678-1234-1234-1234-123456789abc',
    })).toEqual({
      actorType: 'guest_session',
      guestSessionId: 'dwg_12345678-1234-1234-1234-123456789abc',
      safeDisplayName: 'Rival',
    });
  });

  it('accepts direct tokens and canonical HTTPS invite links only', () => {
    expect(parseWordDuelInviteEntry('dwr_1234567890abcdef')).toEqual({
      ok: true,
      source: 'invite_token',
      value: 'dwr_1234567890abcdef',
    });
    expect(parseWordDuelInviteEntry(
      'https://app.duelwords-av.avalsys.com/i/c/dwr_1234567890abcdef?lang=es',
    )).toEqual({
      ok: true,
      source: 'invite_token',
      value: 'dwr_1234567890abcdef',
    });
    expect(parseWordDuelInviteEntry('https://evil.example/i/c/dwr_1234567890abcdef')).toEqual({
      ok: false,
      reason: 'unsupported_host',
    });
    expect(parseWordDuelInviteEntry('https://app.duelwords-av.avalsys.com/other/token')).toEqual({
      ok: false,
      reason: 'invalid_invite',
    });
    expect(parseWordDuelInviteEntry('https://app.duelwords-av.avalsys.com/i/c/%E0%A4%A')).toEqual({
      ok: false,
      reason: 'invalid_invite',
    });
  });

  it('normalizes the eight hexadecimal room-code fallback', () => {
    expect(normalizeWordDuelRoomCode('abcd 1234')).toEqual({
      ok: true,
      value: 'ABCD-1234',
    });
    expect(normalizeWordDuelRoomCode('DUEL-WORD')).toEqual({
      ok: false,
      reason: 'invalid_room_code',
    });
  });

  it('formats room-code entry as two hexadecimal groups without typing the separator', () => {
    expect(sanitizeWordDuelRoomCodePart('a-b 19z')).toBe('AB19');
    expect(sanitizeWordDuelRoomCodePart('abcdef')).toBe('ABCD');
    expect(splitWordDuelRoomCode('ab3f-12c4')).toEqual({ first: 'AB3F', second: '12C4' });
    expect(splitWordDuelRoomCode('bad')).toEqual({ first: 'BAD', second: '' });
  });
});
