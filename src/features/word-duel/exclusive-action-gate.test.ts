import { describe, expect, it } from 'vitest';

import { createExclusiveActionGate } from './exclusive-action-gate';

describe('exclusive challenge action gate', () => {
  it('rejects a second action until the active action finishes', () => {
    const gate = createExclusiveActionGate();

    expect(gate.tryStart('create')).toBe(true);
    expect(gate.tryStart('create')).toBe(false);
    expect(gate.tryStart('join')).toBe(false);

    gate.finish('create');

    expect(gate.tryStart('join')).toBe(true);
  });

  it('does not let a stale completion release another action', () => {
    const gate = createExclusiveActionGate();

    expect(gate.tryStart('refresh')).toBe(true);
    gate.finish('create');
    expect(gate.tryStart('ready')).toBe(false);

    gate.finish('refresh');
    expect(gate.tryStart('ready')).toBe(true);
  });
});
