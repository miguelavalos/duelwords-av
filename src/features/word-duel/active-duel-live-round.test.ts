import { describe, expect, it } from 'vitest';

import type { DuelWordsRealtimeRoomView } from '@/game/word-duel-active/realtime-projection';
import type { WordDuelActiveController } from '@/game/word-duel-active/controller';
import {
  createRuntimeActiveDuelViewModel,
  markActiveDuelGuessSubmitted,
  revealActiveDuelOwnRoundFeedback,
  synchronizeActiveDuelRound,
} from '../../game/word-duel-active/view-model';

import {
  ACTIVE_DUEL_AUTO_ADVANCE_DELAY_MS,
  ACTIVE_DUEL_CLOCK_TICK_MS,
  activeDuelRemainingSeconds,
  advanceResolvedActiveDuelRound,
  createActiveDuelRoundClock,
  formatActiveDuelSeconds,
  reconcileResolvedActiveDuelRoundTransition,
  resolvedActiveDuelRoundsBeforeProjection,
  shouldAutoAdvanceActiveDuelRound,
  shouldOpenActiveDuelFinalResult,
} from './active-duel-live-round';

const SERVER_NOW_MS = Date.parse('2026-07-29T12:00:00.000Z');
const RECEIVED_AT_MS = Date.parse('2030-01-01T08:15:00.000Z');

describe('active DuelWords live round', () => {
  it('anchors the local clock from the authoritative server delta instead of the device wall clock', () => {
    const clock = createActiveDuelRoundClock(room({
      roundDeadlineAt: SERVER_NOW_MS + 60_000,
      serverNow: SERVER_NOW_MS,
    }), RECEIVED_AT_MS);

    expect(clock).toEqual({
      deadlineAtMs: RECEIVED_AT_MS + 60_000,
      roundNumber: 1,
    });
    expect(activeDuelRemainingSeconds(clock!, RECEIVED_AT_MS)).toBe(60);
    expect(activeDuelRemainingSeconds(clock!, RECEIVED_AT_MS + 1_000)).toBe(59);
    expect(activeDuelRemainingSeconds(clock!, RECEIVED_AT_MS + 59_001)).toBe(1);
    expect(activeDuelRemainingSeconds(clock!, RECEIVED_AT_MS + 60_000)).toBe(0);
  });

  it('does not create a running clock outside an active round', () => {
    expect(createActiveDuelRoundClock(room({ status: 'round_resolving' }), RECEIVED_AT_MS)).toBeNull();
    expect(createActiveDuelRoundClock(room({ roundDeadlineAt: undefined }), RECEIVED_AT_MS)).toBeNull();
  });

  it('formats a fresh round as 1:00 instead of 0:60', () => {
    expect(formatActiveDuelSeconds(60)).toBe('1:00');
    expect(formatActiveDuelSeconds(59)).toBe('0:59');
    expect(formatActiveDuelSeconds(0)).toBe('0:00');
  });

  it('updates a whole-second clock without re-rendering the screen four times per second', () => {
    expect(ACTIVE_DUEL_CLOCK_TICK_MS).toBe(1_000);
  });

  it('advances only an authoritative resolving round after the server pause', () => {
    expect(shouldAutoAdvanceActiveDuelRound('active_round')).toBe(false);
    expect(shouldAutoAdvanceActiveDuelRound('round_resolving')).toBe(true);
    expect(shouldAutoAdvanceActiveDuelRound('finalized')).toBe(false);
    expect(ACTIVE_DUEL_AUTO_ADVANCE_DELAY_MS).toBeGreaterThan(1_000);
  });

  it('opens the final result only from the authoritative finalized state', () => {
    expect(shouldOpenActiveDuelFinalResult('active_round')).toBe(false);
    expect(shouldOpenActiveDuelFinalResult('round_resolving')).toBe(false);
    expect(shouldOpenActiveDuelFinalResult('finalized')).toBe(true);
  });

  it('recovers private feedback before requesting the idempotent next-round transition', async () => {
    const calls: string[] = [];
    const snapshot = {} as Awaited<ReturnType<WordDuelActiveController['refreshOwnRoundSnapshot']>>;
    const nextRound = {} as Awaited<ReturnType<WordDuelActiveController['openNextRoundIfDue']>>;

    await expect(advanceResolvedActiveDuelRound({
      async refreshOwnRoundSnapshot(input) {
        calls.push(`snapshot:${input.roundNumber}`);
        return snapshot;
      },
      async openNextRoundIfDue(input) {
        calls.push(`next:${input.roundNumber}`);
        return nextRound;
      },
    }, 3)).resolves.toEqual({ nextRound, snapshot });
    expect(calls).toEqual(['snapshot:3', 'next:3']);
  });

  it('keeps a newer projected round interactive while merging delayed private feedback', () => {
    const roundFour = createRuntimeActiveDuelViewModel({
      gameLanguage: 'ca',
      ownSide: 'a',
      roundNumber: 4,
    });
    const submitted = markActiveDuelGuessSubmitted(roundFour, ['T', 'A', 'P', 'E', 'S']);
    const snapshotViewModel = revealActiveDuelOwnRoundFeedback(submitted, {
      feedback: ['present', 'absent', 'absent', 'absent', 'absent'],
      letters: ['T', 'A', 'P', 'E', 'S'],
      roundNumber: 4,
    });
    const projectedRoundFive = synchronizeActiveDuelRound(submitted, 5);
    const reconciled = reconcileResolvedActiveDuelRoundTransition(projectedRoundFive, {
      nextRound: {
        advanced: false,
        viewModel: snapshotViewModel,
      } as ActiveDuelRoundTransitionFixture['nextRound'],
      snapshot: {
        viewModel: snapshotViewModel,
      } as ActiveDuelRoundTransitionFixture['snapshot'],
    }, 4);

    expect(reconciled.roundNumber).toBe(5);
    expect(reconciled.ownRoundState).toBe('editing');
    expect(reconciled.ownBoardRows[3]?.state).toBe('revealed');
    expect(reconciled.ownBoardRows[4]?.state).toBe('editing');
  });

  it('recovers every resolved round skipped by a newer projection', () => {
    expect(resolvedActiveDuelRoundsBeforeProjection(4, 5)).toEqual([4]);
    expect(resolvedActiveDuelRoundsBeforeProjection(2, 5)).toEqual([2, 3, 4]);
    expect(resolvedActiveDuelRoundsBeforeProjection(5, 5)).toEqual([]);
    expect(resolvedActiveDuelRoundsBeforeProjection(5, 4)).toEqual([]);
  });
});

type ActiveDuelRoundTransitionFixture = Awaited<ReturnType<typeof advanceResolvedActiveDuelRound>>;

function room(
  overrides: Partial<DuelWordsRealtimeRoomView['room']> = {},
): DuelWordsRealtimeRoomView['room'] {
  return {
    language: 'es',
    maxAttempts: 6,
    mode: 'human_duel',
    roundDeadlineAt: SERVER_NOW_MS + 60_000,
    roundNumber: 1,
    serverNow: SERVER_NOW_MS,
    status: 'active_round',
    wordLength: 5,
    ...overrides,
  };
}
