import { describe, expect, it, vi } from 'vitest';

import { activateCreatedSession } from './account-session-activation';

describe('activateCreatedSession', () => {
  it('activates the exact session returned by the provider', async () => {
    const setActive = vi.fn(async () => undefined);

    const activatedSessionId = await activateCreatedSession('session_123', setActive);

    expect(setActive).toHaveBeenCalledWith({ session: 'session_123' });
    expect(activatedSessionId).toBe('session_123');
  });

  it('reports an incomplete provider result instead of hiding it as cancellation', async () => {
    await expect(activateCreatedSession(null, undefined)).rejects.toThrow(
      'Account AV did not return an active session.',
    );
  });
});
