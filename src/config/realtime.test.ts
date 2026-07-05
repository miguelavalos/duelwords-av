import { describe, expect, it } from 'vitest';

import { resolveDuelWordsRealtimeRuntimeConfig } from './realtime';

describe('DuelWords realtime runtime config', () => {
  it('defaults to disabled when no client-safe config is present', () => {
    expect(resolveDuelWordsRealtimeRuntimeConfig(undefined)).toEqual({
      convexUrl: null,
      disabledReason: 'disabled_by_config',
      provider: 'disabled',
    });
  });

  it('enables the Convex provider only with an explicit flag and Convex cloud URL', () => {
    expect(
      resolveDuelWordsRealtimeRuntimeConfig({
        duelWordsAv: {
          convexRealtimeDisabled: false,
          convexUrl: ' https://duelwords-av.convex.cloud ',
        },
      }),
    ).toEqual({
      convexUrl: 'https://duelwords-av.convex.cloud',
      disabledReason: null,
      provider: 'convex',
    });
  });

  it('fails closed when realtime is enabled without a valid Convex URL', () => {
    expect(
      resolveDuelWordsRealtimeRuntimeConfig({
        duelWordsAv: {
          convexRealtimeDisabled: false,
        },
      }),
    ).toMatchObject({
      disabledReason: 'missing_convex_url',
      provider: 'disabled',
    });

    expect(
      resolveDuelWordsRealtimeRuntimeConfig({
        duelWordsAv: {
          convexRealtimeDisabled: false,
          convexUrl: 'https://example.com/not-convex',
        },
      }),
    ).toMatchObject({
      disabledReason: 'invalid_convex_url',
      provider: 'disabled',
    });
  });

  it('does not expose backend-only deploy key fields', () => {
    const config = resolveDuelWordsRealtimeRuntimeConfig({
      duelWordsAv: {
        convexDeployKey: 'backend-only-value',
        convexRealtimeDisabled: false,
        convexUrl: 'https://duelwords-av.convex.cloud',
      },
    });

    const serialized = JSON.stringify(config).toLowerCase();
    expect(serialized).not.toContain('deploy');
    expect(serialized).not.toContain('backend-only-value');
  });
});
