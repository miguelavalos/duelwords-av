import { afterEach, describe, expect, it, vi } from 'vitest';

import { showAbandonChallengeConfirmation } from './confirm-abandon-challenge.web';

const originalWindow = globalThis.window;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
});

describe('web abandon challenge confirmation', () => {
  it('keeps the challenge open when the player cancels', () => {
    const onConfirm = vi.fn();
    const confirm = vi.fn(() => false);
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { confirm },
    });

    showAbandonChallengeConfirmation({
      cancelLabel: 'Stay',
      confirmLabel: 'Leave',
      detail: 'The active duel will be abandoned.',
      onConfirm,
      title: 'Leave this duel?',
    });

    expect(confirm).toHaveBeenCalledWith('Leave this duel?\n\nThe active duel will be abandoned.');
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('runs the destructive action only after explicit confirmation', () => {
    const onConfirm = vi.fn();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { confirm: vi.fn(() => true) },
    });

    showAbandonChallengeConfirmation({
      cancelLabel: 'Stay',
      confirmLabel: 'Leave',
      detail: 'The rematch opportunity will be lost.',
      onConfirm,
      title: 'Leave the result?',
    });

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
