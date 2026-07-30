import type {
  DuelWordsRealtimeRoomStatus,
  DuelWordsRealtimeRoomView,
} from '@/game/word-duel-active/realtime-projection';
import type { WordDuelActiveController } from '@/game/word-duel-active/controller';
import {
  reconcileActiveDuelResolvedOwnRow,
  type ActiveDuelViewModel,
} from '../../game/word-duel-active/view-model';

export const ACTIVE_DUEL_CLOCK_TICK_MS = 1_000;
export const ACTIVE_DUEL_AUTO_ADVANCE_DELAY_MS = 1_100;

export type ActiveDuelRoundClock = {
  deadlineAtMs: number;
  roundNumber: number;
};

export function createActiveDuelRoundClock(
  room: DuelWordsRealtimeRoomView['room'],
  receivedAtMs: number,
): ActiveDuelRoundClock | null {
  if (room.status !== 'active_round' || room.roundDeadlineAt === undefined) {
    return null;
  }

  return {
    deadlineAtMs: receivedAtMs + Math.max(0, room.roundDeadlineAt - room.serverNow),
    roundNumber: room.roundNumber,
  };
}

export function activeDuelRemainingSeconds(clock: ActiveDuelRoundClock, nowMs: number): number {
  return Math.max(0, Math.ceil((clock.deadlineAtMs - nowMs) / 1_000));
}

export function formatActiveDuelSeconds(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.trunc(seconds));
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
}

export function shouldAutoAdvanceActiveDuelRound(status: DuelWordsRealtimeRoomStatus): boolean {
  return status === 'round_resolving';
}

export function shouldOpenActiveDuelFinalResult(status: DuelWordsRealtimeRoomStatus): boolean {
  return status === 'finalized';
}

export async function advanceResolvedActiveDuelRound(
  controller: Pick<WordDuelActiveController, 'openNextRoundIfDue' | 'refreshOwnRoundSnapshot'>,
  roundNumber: number,
) {
  const snapshot = await controller.refreshOwnRoundSnapshot({ roundNumber });
  const nextRound = await controller.openNextRoundIfDue({ roundNumber });

  return { nextRound, snapshot };
}

export type ActiveDuelRoundTransition = Awaited<ReturnType<typeof advanceResolvedActiveDuelRound>>;

export function reconcileResolvedActiveDuelRoundTransition(
  current: ActiveDuelViewModel,
  transition: ActiveDuelRoundTransition,
  resolvedRoundNumber: number,
): ActiveDuelViewModel {
  const transitioned = transition.nextRound.advanced
    ? transition.nextRound.viewModel
    : transition.snapshot.viewModel;

  if (current.roundNumber <= resolvedRoundNumber) {
    return transitioned;
  }

  return reconcileActiveDuelResolvedOwnRow(
    current,
    transition.snapshot.viewModel,
    resolvedRoundNumber,
  );
}

export function resolvedActiveDuelRoundsBeforeProjection(
  currentRoundNumber: number,
  projectedRoundNumber: number,
): number[] {
  if (projectedRoundNumber <= currentRoundNumber) {
    return [];
  }

  return Array.from(
    { length: projectedRoundNumber - currentRoundNumber },
    (_, index) => currentRoundNumber + index,
  );
}
