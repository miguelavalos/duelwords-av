export type DuelWordsWebRuntimeConfig = {
  accountApiBaseUrl: string;
  accountPublishableKey: string;
  apiBaseUrl: string;
  convexUrl: string;
  environment: 'preview' | 'production';
};

type RuntimeContainer = typeof globalThis & {
  __DUELWORDSAV_WEB_RUNTIME__?: unknown;
};

export function getDuelWordsWebRuntimeConfig(): DuelWordsWebRuntimeConfig | null {
  const value = (globalThis as RuntimeContainer).__DUELWORDSAV_WEB_RUNTIME__;
  if (!isRecord(value) || value.configured !== true) return null;

  const environment = value.environment;
  const accountPublishableKey = stringValue(value.accountPublishableKey);
  const accountApiBaseUrl = httpsUrl(value.accountApiBaseUrl);
  const apiBaseUrl = httpsUrl(value.apiBaseUrl);
  const convexUrl = convexCloudUrl(value.convexUrl);

  if (
    (environment !== 'preview' && environment !== 'production')
    || !accountPublishableKey?.startsWith(environment === 'preview' ? 'pk_test_' : 'pk_live_')
    || !accountApiBaseUrl
    || !apiBaseUrl
    || !convexUrl
  ) return null;

  return {
    accountApiBaseUrl,
    accountPublishableKey,
    apiBaseUrl,
    convexUrl,
    environment,
  };
}

function convexCloudUrl(value: unknown): string | null {
  const url = httpsUrl(value);
  if (!url) return null;
  return new URL(url).hostname.endsWith('.convex.cloud') ? url : null;
}

function httpsUrl(value: unknown): string | null {
  const normalized = stringValue(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (
      url.protocol !== 'https:'
      || url.username
      || url.password
      || url.search
      || url.hash
    ) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
