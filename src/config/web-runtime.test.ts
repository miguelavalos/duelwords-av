import { afterEach, describe, expect, it } from 'vitest';

import { getDuelWordsWebRuntimeConfig } from './web-runtime';

type RuntimeGlobal = typeof globalThis & { __DUELWORDSAV_WEB_RUNTIME__?: unknown };

afterEach(() => {
  delete (globalThis as RuntimeGlobal).__DUELWORDSAV_WEB_RUNTIME__;
});

describe('DuelWords web runtime config', () => {
  it('accepts bounded client-safe preview configuration', () => {
    (globalThis as RuntimeGlobal).__DUELWORDSAV_WEB_RUNTIME__ = {
      configured: true,
      environment: 'preview',
      accountPublishableKey: 'pk_test_public-browser-key',
      accountApiBaseUrl: 'https://api-account-av-preview.avalsys.com',
      apiBaseUrl: 'https://api-account-av-preview.avalsys.com',
      convexUrl: 'https://duelwords-preview.convex.cloud',
    };

    expect(getDuelWordsWebRuntimeConfig()).toEqual({
      environment: 'preview',
      accountPublishableKey: 'pk_test_public-browser-key',
      accountApiBaseUrl: 'https://api-account-av-preview.avalsys.com',
      apiBaseUrl: 'https://api-account-av-preview.avalsys.com',
      convexUrl: 'https://duelwords-preview.convex.cloud',
    });
  });

  it('fails closed for wrong key classes, non-HTTPS APIs, or non-Convex realtime', () => {
    for (const override of [
      { accountPublishableKey: 'pk_live_wrong-environment' },
      { apiBaseUrl: 'http://api.example.test' },
      { convexUrl: 'https://convex.example.test' },
    ]) {
      (globalThis as RuntimeGlobal).__DUELWORDSAV_WEB_RUNTIME__ = {
        configured: true,
        environment: 'preview',
        accountPublishableKey: 'pk_test_public-browser-key',
        accountApiBaseUrl: 'https://api-account-av-preview.avalsys.com',
        apiBaseUrl: 'https://api-account-av-preview.avalsys.com',
        convexUrl: 'https://duelwords-preview.convex.cloud',
        ...override,
      };
      expect(getDuelWordsWebRuntimeConfig()).toBeNull();
    }
  });
});
