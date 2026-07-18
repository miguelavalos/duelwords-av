import { describe, expect, it, vi } from 'vitest';

import {
  ACTIVE_DUEL_HEARTBEAT_INTERVAL_MS,
  startActiveDuelPresenceHeartbeat,
} from './presence-heartbeat';

describe('active duel presence heartbeat', () => {
  it('starts immediately, stays bounded to one in-flight request, and stops cleanly', async () => {
    const scheduledTicks: (() => void)[] = [];
    const heartbeatResolvers: (() => void)[] = [];
    const sendHeartbeat = vi.fn(() => new Promise<{ ok: true }>((resolve) => {
      heartbeatResolvers.push(() => resolve({ ok: true }));
    }));
    const clearInterval = vi.fn();
    const setInterval = vi.fn((callback: () => void, intervalMs: number) => {
      scheduledTicks.push(callback);
      expect(intervalMs).toBe(ACTIVE_DUEL_HEARTBEAT_INTERVAL_MS);
      return 42 as unknown as ReturnType<typeof globalThis.setInterval>;
    });

    const stop = startActiveDuelPresenceHeartbeat({
      clearInterval,
      sendHeartbeat,
      setInterval,
    });

    expect(sendHeartbeat).toHaveBeenCalledTimes(1);
    scheduledTicks[0]?.();
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);

    heartbeatResolvers[0]?.();
    await Promise.resolve();
    await Promise.resolve();
    scheduledTicks[0]?.();
    expect(sendHeartbeat).toHaveBeenCalledTimes(2);

    stop();
    expect(clearInterval).toHaveBeenCalledOnce();
    scheduledTicks[0]?.();
    expect(sendHeartbeat).toHaveBeenCalledTimes(2);
  });

  it('keeps the loop alive after a rejected heartbeat', async () => {
    const scheduledTicks: (() => void)[] = [];
    const sendHeartbeat = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ ok: true });

    startActiveDuelPresenceHeartbeat({
      clearInterval: () => undefined,
      sendHeartbeat,
      setInterval: (callback) => {
        scheduledTicks.push(callback);
        return 7 as unknown as ReturnType<typeof globalThis.setInterval>;
      },
    });

    await Promise.resolve();
    await Promise.resolve();
    scheduledTicks[0]?.();
    expect(sendHeartbeat).toHaveBeenCalledTimes(2);
  });
});
