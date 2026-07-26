import { describe, expect, it } from 'vitest';

import { accountRoomDisplayName } from './account-room-name';

describe('Account AV room display name', () => {
  it('uses the normalized Account AV display name without exposing provider identity', () => {
    expect(accountRoomDisplayName({
      displayName: '  Maria   Soler  ',
      email: 'private@example.test',
      id: 'internal-account-id',
    }, 'Jugadora')).toBe('Maria Soler');
  });

  it('uses a localized player label when Account AV has no usable display name', () => {
    expect(accountRoomDisplayName({
      displayName: null,
      email: 'private@example.test',
      id: 'internal-account-id',
    }, 'Jugador')).toBe('Jugador');
  });

  it('rejects unsafe account copy and keeps the fallback bounded', () => {
    expect(accountRoomDisplayName({
      displayName: 'Player\u0000Name',
      email: null,
      id: 'internal-account-id',
    }, 'Joueur')).toBe('Joueur');
  });
});
