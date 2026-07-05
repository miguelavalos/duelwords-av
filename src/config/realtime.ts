export type DuelWordsRealtimeDisabledReason =
  | 'disabled_by_config'
  | 'invalid_convex_url'
  | 'missing_convex_url';

export type DuelWordsRealtimeRuntimeConfig =
  | {
      convexUrl: null;
      disabledReason: DuelWordsRealtimeDisabledReason;
      provider: 'disabled';
    }
  | {
      convexUrl: string;
      disabledReason: null;
      provider: 'convex';
    };

type DuelWordsRuntimeExtra = {
  duelWordsAv?: {
    convexRealtimeDisabled?: unknown;
    convexUrl?: unknown;
  };
};

export function resolveDuelWordsRealtimeRuntimeConfig(extra: unknown): DuelWordsRealtimeRuntimeConfig {
  const appExtra = toDuelWordsRuntimeExtra(extra);
  const convexUrl = normalizedConvexUrl(appExtra.duelWordsAv?.convexUrl);

  if (isRealtimeDisabled(appExtra.duelWordsAv?.convexRealtimeDisabled)) {
    return {
      convexUrl: null,
      disabledReason: 'disabled_by_config',
      provider: 'disabled',
    };
  }

  if (convexUrl === null) {
    return {
      convexUrl: null,
      disabledReason: 'missing_convex_url',
      provider: 'disabled',
    };
  }

  if (!isConvexCloudUrl(convexUrl)) {
    return {
      convexUrl: null,
      disabledReason: 'invalid_convex_url',
      provider: 'disabled',
    };
  }

  return {
    convexUrl,
    disabledReason: null,
    provider: 'convex',
  };
}

function toDuelWordsRuntimeExtra(extra: unknown): DuelWordsRuntimeExtra {
  return isRecord(extra) ? (extra as DuelWordsRuntimeExtra) : {};
}

function isRealtimeDisabled(value: unknown): boolean {
  if (value === false) {
    return false;
  }

  return !(typeof value === 'string' && value.trim().toLowerCase() === 'false');
}

function normalizedConvexUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isConvexCloudUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.convex.cloud');
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
