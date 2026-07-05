import { describe, expect, it } from 'vitest';

import { resolveDuelWordsAppsApiRuntimeConfig } from './apps-api';

describe('DuelWords Apps AV API runtime config', () => {
  it('defaults to disabled when no client-safe API config is present', () => {
    expect(resolveDuelWordsAppsApiRuntimeConfig(undefined)).toEqual({
      apiBaseUrl: null,
      disabledReason: 'disabled_by_config',
      provider: 'disabled',
    });
  });

  it('enables the Apps AV API provider only with an explicit flag and HTTPS base URL', () => {
    expect(
      resolveDuelWordsAppsApiRuntimeConfig({
        duelWordsAv: {
          apiBaseUrl: ' https://api-account-av-preview.avalsys.com/ ',
          apiDisabled: false,
        },
      }),
    ).toEqual({
      apiBaseUrl: 'https://api-account-av-preview.avalsys.com',
      disabledReason: null,
      provider: 'apps_av_api',
    });

    expect(
      resolveDuelWordsAppsApiRuntimeConfig({
        duelWordsAv: {
          apiBaseUrl: 'https://api-account-av-preview.avalsys.com',
          apiDisabled: 'false',
        },
      }),
    ).toMatchObject({
      provider: 'apps_av_api',
    });
  });

  it('fails closed when enabled without a valid HTTPS API base URL', () => {
    expect(
      resolveDuelWordsAppsApiRuntimeConfig({
        duelWordsAv: {
          apiDisabled: false,
        },
      }),
    ).toMatchObject({
      disabledReason: 'missing_api_base_url',
      provider: 'disabled',
    });

    for (const apiBaseUrl of [
      'not-a-url',
      'http://api-account-av-preview.avalsys.com',
      'https://api-account-av-preview.avalsys.com?token=secret',
      'https://user:pass@api-account-av-preview.avalsys.com',
    ]) {
      expect(
        resolveDuelWordsAppsApiRuntimeConfig({
          duelWordsAv: {
            apiBaseUrl,
            apiDisabled: false,
          },
        }),
      ).toMatchObject({
        disabledReason: 'invalid_api_base_url',
        provider: 'disabled',
      });
    }
  });

  it('does not expose backend-only credentials or auth fields', () => {
    const config = resolveDuelWordsAppsApiRuntimeConfig({
      duelWordsAv: {
        apiBaseUrl: 'https://api-account-av-preview.avalsys.com',
        apiBearerToken: 'backend-only-token',
        apiDisabled: false,
        apiSecret: 'backend-only-secret',
        cloudflareDeployToken: 'backend-only-deploy-token',
      },
    });

    const serialized = JSON.stringify(config).toLowerCase();
    expect(serialized).not.toContain('backend-only');
    expect(serialized).not.toContain('token');
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('deploy');
  });
});
