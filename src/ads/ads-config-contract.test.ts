import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-require-imports */
const createExpoConfig = require('../../app.config.js') as () => {
  extra?: { duelWordsAv?: { ads?: { homeBannerAdUnitId?: string | null; mode?: string } } };
  plugins?: unknown[];
};

const ADS_ENV_NAMES = [
  'DUELWORDSAV_ADMOB_IOS_APP_ID',
  'EXPO_PUBLIC_DUELWORDSAV_ADMOB_IOS_HOME_BANNER_ID',
  'EXPO_PUBLIC_DUELWORDSAV_ADS_MODE',
] as const;
const originalEnvironment = new Map<string, string | undefined>();

beforeEach(() => {
  for (const name of ADS_ENV_NAMES) {
    originalEnvironment.set(name, process.env[name]);
    delete process.env[name];
  }
});

afterEach(() => {
  for (const name of ADS_ENV_NAMES) {
    const value = originalEnvironment.get(name);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  originalEnvironment.clear();
});

describe('DuelWords native advertising config', () => {
  it('is disabled by default while retaining crash-safe native test app IDs', () => {
    const config = createExpoConfig();
    const plugin = findAdsPlugin(config.plugins);

    expect(config.extra?.duelWordsAv?.ads).toEqual({
      homeBannerAdUnitId: null,
      mode: 'disabled',
    });
    expect(plugin).toEqual({
      androidAppId: 'ca-app-pub-3940256099942544~3347511713',
      delayAppMeasurementInit: true,
      iosAppId: 'ca-app-pub-3940256099942544~1458002511',
    });
  });

  it('uses only Google test inventory in test mode', () => {
    process.env.EXPO_PUBLIC_DUELWORDSAV_ADS_MODE = 'test';

    const config = createExpoConfig();

    expect(config.extra?.duelWordsAv?.ads).toEqual({
      homeBannerAdUnitId: null,
      mode: 'test',
    });
    expect(findAdsPlugin(config.plugins)?.delayAppMeasurementInit).toBe(true);
  });

  it('requires the iOS AdMob identifiers before live mode can build', () => {
    process.env.EXPO_PUBLIC_DUELWORDSAV_ADS_MODE = 'live';
    expect(() => createExpoConfig()).toThrow('DUELWORDSAV_ADMOB_IOS_APP_ID');

    process.env.DUELWORDSAV_ADMOB_IOS_APP_ID = 'ca-app-pub-1234567890~1111111111';
    expect(() => createExpoConfig()).toThrow('EXPO_PUBLIC_DUELWORDSAV_ADMOB_IOS_HOME_BANNER_ID');

    process.env.EXPO_PUBLIC_DUELWORDSAV_ADMOB_IOS_HOME_BANNER_ID = 'ca-app-pub-1234567890/3333333333';
    const config = createExpoConfig();
    expect(config.extra?.duelWordsAv?.ads).toEqual({
      homeBannerAdUnitId: 'ca-app-pub-1234567890/3333333333',
      mode: 'live',
    });
    expect(findAdsPlugin(config.plugins)?.androidAppId).toBe(
      'ca-app-pub-3940256099942544~3347511713',
    );
  });

  it('rejects unknown modes instead of silently enabling inventory', () => {
    process.env.EXPO_PUBLIC_DUELWORDSAV_ADS_MODE = 'production';
    expect(() => createExpoConfig()).toThrow('EXPO_PUBLIC_DUELWORDSAV_ADS_MODE');
  });
});

function findAdsPlugin(plugins: unknown[] | undefined): Record<string, unknown> | undefined {
  const entry = plugins?.find((plugin) => (
    Array.isArray(plugin) && plugin[0] === 'react-native-google-mobile-ads'
  ));
  return Array.isArray(entry) && isRecord(entry[1]) ? entry[1] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
