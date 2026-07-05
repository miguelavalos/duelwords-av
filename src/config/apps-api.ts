export type DuelWordsAppsApiDisabledReason =
  | 'disabled_by_config'
  | 'invalid_api_base_url'
  | 'missing_api_base_url';

export type DuelWordsAppsApiRuntimeConfig =
  | {
      apiBaseUrl: null;
      disabledReason: DuelWordsAppsApiDisabledReason;
      provider: 'disabled';
    }
  | {
      apiBaseUrl: string;
      disabledReason: null;
      provider: 'apps_av_api';
    };

type DuelWordsRuntimeExtra = {
  duelWordsAv?: {
    apiBaseUrl?: unknown;
    apiDisabled?: unknown;
  };
};

export function resolveDuelWordsAppsApiRuntimeConfig(extra: unknown): DuelWordsAppsApiRuntimeConfig {
  const appExtra = toDuelWordsRuntimeExtra(extra);
  const apiBaseUrl = normalizedApiBaseUrl(appExtra.duelWordsAv?.apiBaseUrl);

  if (isAppsApiDisabled(appExtra.duelWordsAv?.apiDisabled)) {
    return {
      apiBaseUrl: null,
      disabledReason: 'disabled_by_config',
      provider: 'disabled',
    };
  }

  if (apiBaseUrl === null) {
    return {
      apiBaseUrl: null,
      disabledReason: 'missing_api_base_url',
      provider: 'disabled',
    };
  }

  if (!isHttpsApiBaseUrl(apiBaseUrl)) {
    return {
      apiBaseUrl: null,
      disabledReason: 'invalid_api_base_url',
      provider: 'disabled',
    };
  }

  return {
    apiBaseUrl,
    disabledReason: null,
    provider: 'apps_av_api',
  };
}

function toDuelWordsRuntimeExtra(extra: unknown): DuelWordsRuntimeExtra {
  return isRecord(extra) ? (extra as DuelWordsRuntimeExtra) : {};
}

function isAppsApiDisabled(value: unknown): boolean {
  if (value === false) {
    return false;
  }

  return !(typeof value === 'string' && value.trim().toLowerCase() === 'false');
}

function normalizedApiBaseUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : null;
}

function isHttpsApiBaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:'
      && url.hostname.length > 0
      && url.username.length === 0
      && url.password.length === 0
      && url.search.length === 0
      && url.hash.length === 0
    );
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
