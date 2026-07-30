const appJson = require('./app.json');

function createExpoConfig({ config } = { config: appJson.expo }) {
  const baseConfig = config ?? appJson.expo;
  const iosBuildVariant = normalizeIosBuildVariant(process.env.DUELWORDSAV_IOS_BUILD_VARIANT);
  const iosBundleIdentifier = iosBuildVariant === 'development'
    ? 'com.avalsys.duelwordsav.dev'
    : baseConfig.ios.bundleIdentifier;
  const apiBaseUrl = normalizedOptionalString(process.env.EXPO_PUBLIC_DUELWORDSAV_API_BASE_URL);
  const apiDisabled = isRuntimeDisabled(process.env.EXPO_PUBLIC_DUELWORDSAV_API_DISABLED);
  const convexUrl = normalizedOptionalString(process.env.EXPO_PUBLIC_DUELWORDSAV_CONVEX_URL);
  const convexRealtimeDisabled = isRuntimeDisabled(process.env.EXPO_PUBLIC_DUELWORDSAV_CONVEX_REALTIME_DISABLED);
  const sentryDsn = normalizedOptionalString(process.env.EXPO_PUBLIC_DUELWORDSAV_SENTRY_DSN);
  const revenueCatPublicApiKey = normalizedOptionalString(
    process.env.DUELWORDSAV_REVENUECAT_PUBLIC_API_KEY
      ?? process.env.EXPO_PUBLIC_DUELWORDSAV_REVENUECAT_PUBLIC_API_KEY,
  );
  const revenueCatOfferingId = normalizedOptionalString(
    process.env.DUELWORDSAV_REVENUECAT_OFFERING_ID
      ?? process.env.EXPO_PUBLIC_DUELWORDSAV_REVENUECAT_OFFERING_ID,
  ) ?? 'default';
  const revenueCatMonthlyPackageId = normalizedOptionalString(
    process.env.DUELWORDSAV_REVENUECAT_MONTHLY_PACKAGE_ID
      ?? process.env.EXPO_PUBLIC_DUELWORDSAV_REVENUECAT_MONTHLY_PACKAGE_ID,
  ) ?? '$rc_monthly';
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

  return {
    ...baseConfig,
    scheme: iosBundleIdentifier,
    ios: {
      ...baseConfig.ios,
      associatedDomains: [
        'applinks:app.duelwords-av-preview.avalsys.com',
        'applinks:app.duelwords-av.avalsys.com',
      ],
      bundleIdentifier: iosBundleIdentifier,
      entitlements: {
        ...(baseConfig.ios?.entitlements ?? {}),
        'com.apple.developer.applesignin': ['Default'],
        'keychain-access-groups': ['$(ACCOUNTAV_KEYCHAIN_ACCESS_GROUP)'],
      },
      infoPlist: {
        ...(baseConfig.ios?.infoPlist ?? {}),
        ACCOUNTAV_KEYCHAIN_ACCESS_GROUP: '$(ACCOUNTAV_KEYCHAIN_ACCESS_GROUP)',
        ACCOUNTAV_KEYCHAIN_SERVICE: '$(ACCOUNTAV_KEYCHAIN_SERVICE)',
        ACCOUNTAV_PUBLISHABLE_KEY: '$(ACCOUNTAV_PUBLISHABLE_KEY)',
      },
      privacyManifests: {
        NSPrivacyCollectedDataTypes: [
          collectedDataType('NSPrivacyCollectedDataTypeName', true),
          collectedDataType('NSPrivacyCollectedDataTypeEmailAddress', true),
          collectedDataType('NSPrivacyCollectedDataTypeUserID', true),
          collectedDataType('NSPrivacyCollectedDataTypeGameplayContent', true),
          collectedDataType('NSPrivacyCollectedDataTypePurchases', true),
          collectedDataType('NSPrivacyCollectedDataTypeCoarseLocation', false),
        ],
        NSPrivacyTracking: false,
        NSPrivacyTrackingDomains: [],
      },
    },
    extra: {
      ...(baseConfig.extra ?? {}),
      accountAv: {
        apiBaseUrl,
        keychainAccessGroup: accountKeychainAccessGroup,
        keychainService: accountKeychainService,
        publishableKey: accountPublishableKey,
      },
      duelWordsAv: {
        ...(baseConfig.extra?.duelWordsAv ?? {}),
        apiBaseUrl,
        apiDisabled,
        convexRealtimeDisabled,
        convexUrl,
        iosBuildVariant,
        revenueCat: {
          apiKey: revenueCatPublicApiKey,
          entitlementId: 'pro',
          monthlyPackageId: revenueCatMonthlyPackageId,
          offeringId: revenueCatOfferingId,
          productId: 'duelwordsav_pro_monthly',
        },
        sentry: {
          dsn: sentryDsn,
          environment: sentryEnvironment,
        },
      },
    },
  };
}

function collectedDataType(type, linked) {
  return {
    NSPrivacyCollectedDataType: type,
    NSPrivacyCollectedDataTypeLinked: linked,
    NSPrivacyCollectedDataTypePurposes: [
      'NSPrivacyCollectedDataTypePurposeAppFunctionality',
    ],
    NSPrivacyCollectedDataTypeTracking: false,
  };
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
