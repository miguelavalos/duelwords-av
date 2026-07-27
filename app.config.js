const appJson = require('./app.json');

const GOOGLE_TEST_ADMOB_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};

function createExpoConfig() {
  const iosBuildVariant = normalizeIosBuildVariant(process.env.DUELWORDSAV_IOS_BUILD_VARIANT);
  const iosBundleIdentifier = iosBuildVariant === 'development'
    ? 'com.avalsys.duelwordsav.dev'
    : appJson.expo.ios.bundleIdentifier;
  const apiBaseUrl = normalizedOptionalString(process.env.EXPO_PUBLIC_DUELWORDSAV_API_BASE_URL);
  const apiDisabled = isRuntimeDisabled(process.env.EXPO_PUBLIC_DUELWORDSAV_API_DISABLED);
  const convexUrl = normalizedOptionalString(process.env.EXPO_PUBLIC_DUELWORDSAV_CONVEX_URL);
  const convexRealtimeDisabled = isRuntimeDisabled(process.env.EXPO_PUBLIC_DUELWORDSAV_CONVEX_REALTIME_DISABLED);
  const sentryDsn = normalizedOptionalString(process.env.EXPO_PUBLIC_DUELWORDSAV_SENTRY_DSN);
  const sentryEnvironment = normalizeSentryEnvironment(
    process.env.EXPO_PUBLIC_DUELWORDSAV_SENTRY_ENVIRONMENT,
    iosBuildVariant,
  );
  const accountPublishableKey = normalizedOptionalString(
    process.env.ACCOUNTAV_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_ACCOUNTAV_PUBLISHABLE_KEY,
  );
  const accountKeychainService = normalizedOptionalString(process.env.ACCOUNTAV_KEYCHAIN_SERVICE)
    ?? 'com.avalsys.duelwordsav.account';
  const accountKeychainAccessGroup = normalizedOptionalString(process.env.ACCOUNTAV_KEYCHAIN_ACCESS_GROUP)
    ?? `935PM55U6R.${iosBundleIdentifier}`;
  const adsMode = normalizeAdsMode(process.env.EXPO_PUBLIC_DUELWORDSAV_ADS_MODE);
  const adsConfig = resolveAdsConfig(adsMode);

  return {
    ...appJson.expo,
    plugins: [
      ...(appJson.expo.plugins ?? []),
      adsConfig.plugin,
    ],
    scheme: iosBundleIdentifier,
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: iosBundleIdentifier,
      entitlements: {
        ...(appJson.expo.ios?.entitlements ?? {}),
        'com.apple.developer.applesignin': ['Default'],
        'keychain-access-groups': ['$(ACCOUNTAV_KEYCHAIN_ACCESS_GROUP)'],
      },
      infoPlist: {
        ...(appJson.expo.ios?.infoPlist ?? {}),
        ACCOUNTAV_KEYCHAIN_ACCESS_GROUP: '$(ACCOUNTAV_KEYCHAIN_ACCESS_GROUP)',
        ACCOUNTAV_KEYCHAIN_SERVICE: '$(ACCOUNTAV_KEYCHAIN_SERVICE)',
        ACCOUNTAV_PUBLISHABLE_KEY: '$(ACCOUNTAV_PUBLISHABLE_KEY)',
      },
    },
    extra: {
      ...(appJson.expo.extra ?? {}),
      accountAv: {
        apiBaseUrl,
        keychainAccessGroup: accountKeychainAccessGroup,
        keychainService: accountKeychainService,
        publishableKey: accountPublishableKey,
      },
      duelWordsAv: {
        ...(appJson.expo.extra?.duelWordsAv ?? {}),
        apiBaseUrl,
        apiDisabled,
        convexRealtimeDisabled,
        convexUrl,
        iosBuildVariant,
        sentry: {
          dsn: sentryDsn,
          environment: sentryEnvironment,
        },
        ads: {
          homeBannerAdUnitId: adsConfig.homeBannerAdUnitId,
          mode: adsMode,
        },
      },
    },
  };
}

function resolveAdsConfig(mode) {
  const iosAppId = mode !== 'live'
    ? GOOGLE_TEST_ADMOB_APP_IDS.ios
    : requireAdMobAppId('DUELWORDSAV_ADMOB_IOS_APP_ID');
  const androidAppId = GOOGLE_TEST_ADMOB_APP_IDS.android;
  const homeBannerAdUnitId = mode !== 'live'
    ? null
    : requireAdMobBannerUnitId('EXPO_PUBLIC_DUELWORDSAV_ADMOB_IOS_HOME_BANNER_ID');

  return {
    homeBannerAdUnitId,
    plugin: [
      'react-native-google-mobile-ads',
      {
        androidAppId,
        delayAppMeasurementInit: true,
        iosAppId,
      },
    ],
  };
}

function normalizeAdsMode(value) {
  const normalized = normalizedOptionalString(value) ?? 'disabled';
  if (!['disabled', 'test', 'live'].includes(normalized)) {
    throw new Error('EXPO_PUBLIC_DUELWORDSAV_ADS_MODE must be "disabled", "test", or "live".');
  }
  return normalized;
}

function requireAdMobAppId(name) {
  const value = normalizedOptionalString(process.env[name]);
  if (!value || !/^ca-app-pub-\d+~\d+$/.test(value)) {
    throw new Error(`${name} must be a valid public AdMob application ID when live ads are enabled.`);
  }
  return value;
}

function requireAdMobBannerUnitId(name) {
  const value = normalizedOptionalString(process.env[name]);
  if (!value || !/^ca-app-pub-\d+\/\d+$/.test(value)) {
    throw new Error(`${name} must be a valid public AdMob banner unit ID when live ads are enabled.`);
  }
  return value;
}

function normalizeSentryEnvironment(value, iosBuildVariant) {
  const normalized = normalizedOptionalString(value)
    ?? (iosBuildVariant === 'development' ? 'debug' : 'preview');
  if (!['debug', 'preview', 'production'].includes(normalized)) {
    throw new Error('EXPO_PUBLIC_DUELWORDSAV_SENTRY_ENVIRONMENT must be "debug", "preview", or "production".');
  }
  return normalized;
}

function normalizeIosBuildVariant(value) {
  const normalized = normalizedOptionalString(value) ?? 'release';
  if (normalized !== 'development' && normalized !== 'release') {
    throw new Error('DUELWORDSAV_IOS_BUILD_VARIANT must be "development" or "release".');
  }
  return normalized;
}

function normalizedOptionalString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRuntimeDisabled(value) {
  return !(typeof value === 'string' && value.trim().toLowerCase() === 'false');
}

module.exports = createExpoConfig;
