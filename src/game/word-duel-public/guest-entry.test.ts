import { describe, expect, it } from 'vitest';

import {
  createWordDuelGuestActor,
  normalizeWordDuelGuestDisplayName,
  normalizeWordDuelRoomCode,
  parseWordDuelInviteEntry,
} from './guest-entry';

describe('public guest Word Duel entry', () => {
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
});
