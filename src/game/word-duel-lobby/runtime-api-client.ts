import type {
  DuelWordsAppsApiDisabledReason,
  DuelWordsAppsApiRuntimeConfig,
} from '../../config/apps-api';
import {
  createDuelWordsApiClient,
  type DuelWordsApiClient,
  type DuelWordsApiClientConfig,
} from './api-client';

const DEFAULT_DISABLED_APPS_API_RUNTIME_CONFIG: DuelWordsAppsApiRuntimeConfig = {
  apiBaseUrl: null,
  disabledReason: 'disabled_by_config',
  provider: 'disabled',
};

export type DuelWordsRuntimeApiClientBundle =
  | {
      client: null;
      ok: false;
      reason: DuelWordsAppsApiDisabledReason;
      runtimeConfig: Extract<DuelWordsAppsApiRuntimeConfig, { provider: 'disabled' }>;
      source: 'disabled';
    }
  | {
      client: DuelWordsApiClient;
      ok: true;
      reason: null;
      runtimeConfig: Extract<DuelWordsAppsApiRuntimeConfig, { provider: 'apps_av_api' }>;
      source: 'apps_av_api';
    };

export type DuelWordsRuntimeApiClientInput = {
  fetchImpl?: DuelWordsApiClientConfig['fetchImpl'];
  getAuthToken?: DuelWordsApiClientConfig['getAuthToken'];
  platform?: DuelWordsApiClientConfig['platform'];
  runtimeConfig?: DuelWordsAppsApiRuntimeConfig;
};

export function createDuelWordsRuntimeApiClient(
  input: DuelWordsRuntimeApiClientInput = {},
): DuelWordsRuntimeApiClientBundle {
  const runtimeConfig = input.runtimeConfig ?? DEFAULT_DISABLED_APPS_API_RUNTIME_CONFIG;
  if (runtimeConfig.provider === 'disabled') {
    return {
      client: null,
      ok: false,
      reason: runtimeConfig.disabledReason,
      runtimeConfig,
      source: 'disabled',
    };
  }

  return {
    client: createDuelWordsApiClient({
      baseUrl: runtimeConfig.apiBaseUrl,
      fetchImpl: input.fetchImpl,
      getAuthToken: input.getAuthToken,
      platform: input.platform,
    }),
    ok: true,
    reason: null,
    runtimeConfig,
    source: 'apps_av_api',
  };
}
