import { describe, expect, it } from 'vitest';

import type { WordDuelLobbyStatus } from '@/game/word-duel-lobby/view-model';

import { shouldRearmActiveDuelOpening, shouldShowLobbyRefresh } from './public-challenge-flow';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs') as {
  readFileSync(path: string, encoding: 'utf8'): string;
};
const path = require('node:path') as {
  resolve(...paths: string[]): string;
};

describe('public Challenge recovery flow', () => {
  it('does not cancel active-duel opening on its own busy-state render', () => {
    const screen = fs.readFileSync(
      path.resolve(process.cwd(), 'src/features/word-duel/public-challenge-screen.tsx'),
      'utf8',
    );
    const openingStart = screen.indexOf("void runAction('open-duel'");
    const openingEndMarker = '}, [activeController, busyAction, lobbyState, runtime]);';
    const openingEnd = screen.indexOf(openingEndMarker, openingStart);
    const openingEffect = screen.slice(openingStart, openingEnd + openingEndMarker.length);

    expect(openingStart).toBeGreaterThan(-1);
    expect(openingEnd).toBeGreaterThan(openingStart);
    expect(openingEffect).toContain('}, { trackBusy: false });');
    expect(openingEffect).toContain('if (cancelled)');
    expect(openingEffect).toContain('cancelled = true');
  });

  it('keeps Refresh available when an active duel still needs to open', () => {
    expect(shouldShowLobbyRefresh('active_round')).toBe(true);
    expect(shouldRearmActiveDuelOpening({
      hasActiveController: false,
      lobbyStatus: 'active_round',
    })).toBe(true);
  });

  it('does not rearm an already open duel', () => {
    expect(shouldRearmActiveDuelOpening({
      hasActiveController: true,
      lobbyStatus: 'active_round',
    })).toBe(false);
  });

  it.each([
    ['invite_review', false],
    ['waiting_for_player', true],
    ['lobby', true],
    ['countdown', true],
    ['active_round', true],
    ['cancelled_before_first_round', false],
    ['expired', false],
  ] satisfies [WordDuelLobbyStatus, boolean][])('sets Refresh visibility for %s', (status, visible) => {
    expect(shouldShowLobbyRefresh(status)).toBe(visible);
  });
});
