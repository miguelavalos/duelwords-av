import type { DuelWordsRealtimeMutationResult } from './realtime-projection';

export const ACTIVE_DUEL_HEARTBEAT_INTERVAL_MS = 10_000;

type IntervalHandle = ReturnType<typeof setInterval>;

export function startActiveDuelPresenceHeartbeat(input: {
  clearInterval?: (handle: IntervalHandle) => void;
  intervalMs?: number;
  sendHeartbeat: () => Promise<DuelWordsRealtimeMutationResult>;
  setInterval?: (callback: () => void, intervalMs: number) => IntervalHandle;
}): () => void {
  const schedule = input.setInterval ?? setInterval;
  const cancel = input.clearInterval ?? clearInterval;
  const intervalMs = input.intervalMs ?? ACTIVE_DUEL_HEARTBEAT_INTERVAL_MS;
  let inFlight = false;
  let stopped = false;

  const tick = () => {
    if (stopped || inFlight) {
      return;
    }

    inFlight = true;
    void input.sendHeartbeat()
      .catch(() => undefined)
      .finally(() => {
        inFlight = false;
      });
  };

  tick();
  const handle = schedule(tick, intervalMs);

  return () => {
    stopped = true;
    cancel(handle);
  };
}
