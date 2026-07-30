import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appJson = JSON.parse(readFileSync(resolve(repoRoot, 'app.json'), 'utf8'));
const easJson = JSON.parse(readFileSync(resolve(repoRoot, 'eas.json'), 'utf8'));
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));
const iosConfigGenerator = readFileSync(resolve(repoRoot, 'scripts/ios/generate-local-xcconfig.sh'), 'utf8');
const sharedApplePlugin = require(resolve(repoRoot, 'plugins/with-duelwords-shared-apple.js'));
const development = process.argv.includes('--development');
const expoConfig = require(resolve(repoRoot, 'app.config.js'))();
const failures = [];
const expectedBundleIdentifier = development
  ? 'com.avalsys.duelwordsav.dev'
  : 'com.avalsys.duelwordsav';
const expectedKeychainAccessGroup = `935PM55U6R.${expectedBundleIdentifier}`;

function expectEqual(label, actual, expected) {
  if (actual !== expected) {
    failures.push(`${label} must be ${JSON.stringify(expected)}.`);
  }
}

function expectAssetSha256(assetPath, expected) {
  const absolutePath = resolve(repoRoot, assetPath);
  if (!existsSync(absolutePath)) {
    failures.push(`Canonical brand asset is missing: ${assetPath}.`);
    return;
  }

  const actual = createHash('sha256').update(readFileSync(absolutePath)).digest('hex');
  if (actual !== expected) {
    failures.push(`Canonical brand asset changed without promotion: ${assetPath}.`);
  }
}

function hasExpoPlugin(name) {
  return expoConfig.plugins?.some(
    (plugin) => plugin === name || (Array.isArray(plugin) && plugin[0] === name),
  ) ?? false;
}

function expoPluginOptions(name) {
  const plugin = expoConfig.plugins?.find(
    (entry) => entry === name || (Array.isArray(entry) && entry[0] === name),
  );
  return Array.isArray(plugin) ? plugin[1] : undefined;
}

expectEqual('expo.name', expoConfig.name, 'DuelWords AV');
expectEqual('expo.slug', expoConfig.slug, 'duelwords-av');
expectEqual('expo.version', expoConfig.version, '0.1.0');
expectEqual('expo.orientation', expoConfig.orientation, 'portrait');
expectEqual('expo.ios.bundleIdentifier', expoConfig.ios?.bundleIdentifier, expectedBundleIdentifier);
expectEqual('expo.ios.buildNumber', expoConfig.ios?.buildNumber, '6');
expectEqual('expo.ios.supportsTablet', expoConfig.ios?.supportsTablet, true);
expectEqual('expo.ios.requireFullScreen', expoConfig.ios?.requireFullScreen, true);
expectEqual(
  'expo.ios.config.usesNonExemptEncryption',
  expoConfig.ios?.config?.usesNonExemptEncryption,
  false,
);
expectEqual('expo.ios.privacyManifests.NSPrivacyTracking', expoConfig.ios?.privacyManifests?.NSPrivacyTracking, false);
expectEqual(
  'expo.ios.privacyManifests.NSPrivacyTrackingDomains',
  JSON.stringify(expoConfig.ios?.privacyManifests?.NSPrivacyTrackingDomains),
  JSON.stringify([]),
);
const collectedDataTypes = expoConfig.ios?.privacyManifests?.NSPrivacyCollectedDataTypes ?? [];
const expectedCollectedDataTypes = [
  ['NSPrivacyCollectedDataTypeName', true],
  ['NSPrivacyCollectedDataTypeEmailAddress', true],
  ['NSPrivacyCollectedDataTypeUserID', true],
  ['NSPrivacyCollectedDataTypeGameplayContent', true],
  ['NSPrivacyCollectedDataTypePurchases', true],
  ['NSPrivacyCollectedDataTypeCoarseLocation', false],
];
for (const [dataType, linked] of expectedCollectedDataTypes) {
  const declaration = collectedDataTypes.find(
    (entry) => entry.NSPrivacyCollectedDataType === dataType,
  );
  expectEqual(`privacy manifest ${dataType} exists`, Boolean(declaration), true);
  expectEqual(`privacy manifest ${dataType} linked`, declaration?.NSPrivacyCollectedDataTypeLinked, linked);
  expectEqual(`privacy manifest ${dataType} tracking`, declaration?.NSPrivacyCollectedDataTypeTracking, false);
  expectEqual(
    `privacy manifest ${dataType} purpose`,
    JSON.stringify(declaration?.NSPrivacyCollectedDataTypePurposes),
    JSON.stringify(['NSPrivacyCollectedDataTypePurposeAppFunctionality']),
  );
}
expectEqual('expo.scheme', expoConfig.scheme, expectedBundleIdentifier);
expectEqual(
  'expo.extra.duelWordsAv.iosBuildVariant',
  expoConfig.extra?.duelWordsAv?.iosBuildVariant,
  development ? 'development' : 'release',
);
expectEqual('expo.plugins @clerk/expo', hasExpoPlugin('@clerk/expo'), true);
expectEqual(
  'expo.plugins @clerk/expo keychainService',
  expoPluginOptions('@clerk/expo')?.keychainService,
  'com.avalsys.duelwordsav.account',
);
expectEqual('expo.plugins expo-apple-authentication', hasExpoPlugin('expo-apple-authentication'), true);
expectEqual('expo.plugins expo-secure-store', hasExpoPlugin('expo-secure-store'), true);
expectEqual('expo.plugins expo-web-browser', hasExpoPlugin('expo-web-browser'), true);
expectEqual('expo.plugins @sentry/react-native/expo', hasExpoPlugin('@sentry/react-native/expo'), true);
expectEqual(
  'expo.plugins @sentry/react-native/expo organization',
  expoPluginOptions('@sentry/react-native/expo')?.organization,
  'avalsys',
);
expectEqual(
  'expo.plugins @sentry/react-native/expo project',
  expoPluginOptions('@sentry/react-native/expo')?.project,
  'duelwordsav-ios',
);
expectEqual(
  'expo.plugins @sentry/react-native/expo URL',
  expoPluginOptions('@sentry/react-native/expo')?.url,
  'https://sentry.io/',
);
expectEqual(
  'expo-splash-screen backgroundColor',
  expoPluginOptions('expo-splash-screen')?.backgroundColor,
  '#FBF7EB',
);
expectEqual(
  'expo-splash-screen full product lockup',
  expoPluginOptions('expo-splash-screen')?.image,
  './assets/images/brand/duelwords-logo-lockup.png',
);
expectEqual(
  'expo-splash-screen lockup width',
  expoPluginOptions('expo-splash-screen')?.imageWidth,
  280,
);
const expectedSharedAppleAssets = {
  AviFooterIcon: 'avi-footer.png',
  AviV2LoginSheetPeek: 'avi-login-sheet-peek.png',
  AviV2OnboardingCTA: 'avi-onboarding.png',
  DuelWordsHeaderLogo: {
    light: 'duelwords-wordmark.png',
    dark: 'duelwords-wordmark-dark.png',
  },
  DuelWordsOnboardingBrand: {
    light: 'duelwords-logo-lockup.png',
    dark: 'duelwords-logo-lockup-dark.png',
  },
  DuelWordsOnboardingHero: 'duelwords-onboarding-hero.png',
  DuelWordsSplashHero: 'duelwords-splash-hero.png',
  DuelWordsSplashLogo: {
    light: 'duelwords-logo-lockup.png',
    dark: 'duelwords-logo-lockup-dark.png',
  },
};
expectEqual(
  'shared Apple approved asset catalog mapping',
  JSON.stringify(sharedApplePlugin.ASSETS),
  JSON.stringify(expectedSharedAppleAssets),
);
expectEqual(
  'expo.ios.entitlements com.apple.developer.applesignin',
  JSON.stringify(expoConfig.ios?.entitlements?.['com.apple.developer.applesignin']),
  JSON.stringify(['Default']),
);
expectEqual(
  'expo.ios.associatedDomains',
  JSON.stringify(expoConfig.ios?.associatedDomains),
  JSON.stringify([
    'applinks:app.duelwords-av-preview.avalsys.com',
    'applinks:app.duelwords-av.avalsys.com',
  ]),
);
expectEqual(
  'expo.ios.entitlements keychain-access-groups template',
  JSON.stringify(expoConfig.ios?.entitlements?.['keychain-access-groups']),
  JSON.stringify(['$(ACCOUNTAV_KEYCHAIN_ACCESS_GROUP)']),
);
expectEqual(
  'expo.ios.infoPlist ACCOUNTAV_KEYCHAIN_SERVICE template',
  expoConfig.ios?.infoPlist?.ACCOUNTAV_KEYCHAIN_SERVICE,
  '$(ACCOUNTAV_KEYCHAIN_SERVICE)',
);
expectEqual(
  'expo.ios.infoPlist ACCOUNTAV_KEYCHAIN_ACCESS_GROUP template',
  expoConfig.ios?.infoPlist?.ACCOUNTAV_KEYCHAIN_ACCESS_GROUP,
  '$(ACCOUNTAV_KEYCHAIN_ACCESS_GROUP)',
);
expectEqual(
  'expo.ios.infoPlist ACCOUNTAV_PUBLISHABLE_KEY template',
  expoConfig.ios?.infoPlist?.ACCOUNTAV_PUBLISHABLE_KEY,
  '$(ACCOUNTAV_PUBLISHABLE_KEY)',
);
const expoRouterPlugin = expoConfig.plugins?.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-router',
);
expectEqual(
  'expo-router origin',
  expoRouterPlugin?.[1]?.origin,
  'https://app.duelwords-av.avalsys.com',
);
expectEqual('eas.cli.appVersionSource', easJson.cli?.appVersionSource, 'local');
expectEqual('eas.cli.requireCommit', easJson.cli?.requireCommit, true);
expectEqual('eas.build.simulator.ios.simulator', easJson.build?.simulator?.ios?.simulator, true);
expectEqual(
  'eas.build.simulator.env.DUELWORDSAV_IOS_BUILD_VARIANT',
  easJson.build?.simulator?.env?.DUELWORDSAV_IOS_BUILD_VARIANT,
  'development',
);
expectEqual('eas.build.testflight.distribution', easJson.build?.testflight?.distribution, 'store');
expectEqual(
  'eas.build.testflight.env.DUELWORDSAV_IOS_BUILD_VARIANT',
  easJson.build?.testflight?.env?.DUELWORDSAV_IOS_BUILD_VARIANT,
  'release',
);
expectEqual('eas.build.testflight.ios.autoIncrement', easJson.build?.testflight?.ios?.autoIncrement, false);
expectEqual('package @clerk/expo', packageJson.dependencies?.['@clerk/expo'], '4.0.3');
expectEqual('package @sentry/react-native', packageJson.dependencies?.['@sentry/react-native'], '~7.11.0');
expectEqual('package react-native-purchases', packageJson.dependencies?.['react-native-purchases'], '10.4.4');
expectEqual('RevenueCat entitlement', expoConfig.extra?.duelWordsAv?.revenueCat?.entitlementId, 'pro');
expectEqual('RevenueCat offering', expoConfig.extra?.duelWordsAv?.revenueCat?.offeringId, 'default');
expectEqual('RevenueCat monthly package', expoConfig.extra?.duelWordsAv?.revenueCat?.monthlyPackageId, '$rc_monthly');
expectEqual('RevenueCat product', expoConfig.extra?.duelWordsAv?.revenueCat?.productId, 'duelwordsav_pro_monthly');
expectEqual(
  'local Xcode Sentry upload is explicit opt-in',
  iosConfigGenerator.includes('if [ -z "${SENTRY_DISABLE_AUTO_UPLOAD:-}" ]; then'),
  true,
);

for (const assetPath of [expoConfig.icon, expoConfig.ios?.icon]) {
  if (typeof assetPath !== 'string' || !existsSync(resolve(repoRoot, assetPath))) {
    failures.push(`Configured release asset is missing: ${String(assetPath)}.`);
  }
}

// These fingerprints pin the owner-directed DuelWords identity and the exact
// Tune AV Avi exports consumed by the shared Apple surfaces. The engraved
// logo/mark family and corrected splash were intentionally promoted on
// 2026-07-28. Updating one is a brand promotion, not an incidental app-code
// change.
const canonicalBrandAssets = {
  'assets/images/icon.png': '8f57e3c14b7877c161e1f9f6a9ab383b152d10c2b7e5b7dc56b1ad8a15b60187',
  'assets/images/splash-icon.png': '000ee15c6091ba2bb3441effeef7afaaff15d1ddfe07f510fa6b6d1358571f6c',
  'assets/images/android-icon-foreground.png': '000ee15c6091ba2bb3441effeef7afaaff15d1ddfe07f510fa6b6d1358571f6c',
  'assets/images/android-icon-monochrome.png': '2b5fce6362c6514f3466174bf43c7cdd5b1ea92e5f5e9b1184e21a618125187e',
  'assets/brand-source/duelwords-symbol.png': '000ee15c6091ba2bb3441effeef7afaaff15d1ddfe07f510fa6b6d1358571f6c',
  'assets/brand-source/duelwords-symbol-monochrome.png': '2b5fce6362c6514f3466174bf43c7cdd5b1ea92e5f5e9b1184e21a618125187e',
  'assets/brand-source/duelwords-logo-lockup.png': '3363c591f905bfd8be380af7f7a7df76caec363a2429d19b81f751b2f62df9aa',
  'assets/brand-source/duelwords-logo-lockup-dark.png': '2e5d8c9a32e0f689e48fe0ba13cf16a24862b4a49486a330ddf0fc4884f7953c',
  'assets/brand-source/duelwords-wordmark.png': 'a8ad3d1fd8581caed349149f888200a6240b0fda06c1bc30d31a27688da3e8e8',
  'assets/brand-source/duelwords-wordmark-dark.png': '0395c16f11e0ef65f7d31dad3264c34335a3a849d7a8ae07313aa0219d4de245',
  'assets/images/brand/duelwords-logo-lockup.png': '3363c591f905bfd8be380af7f7a7df76caec363a2429d19b81f751b2f62df9aa',
  'assets/images/brand/duelwords-logo-lockup-dark.png': '2e5d8c9a32e0f689e48fe0ba13cf16a24862b4a49486a330ddf0fc4884f7953c',
  'assets/images/brand/duelwords-wordmark.png': 'a8ad3d1fd8581caed349149f888200a6240b0fda06c1bc30d31a27688da3e8e8',
  'assets/images/brand/duelwords-wordmark-dark.png': '0395c16f11e0ef65f7d31dad3264c34335a3a849d7a8ae07313aa0219d4de245',
  'assets/images/brand/duelwords-splash-hero.png': 'de31b11eeeb62119f215e3cebdbad8aa495d283e39b9f8780f6d6e2496296542',
  'assets/images/brand/duelwords-onboarding-hero.png': '9c309e9fd5baf66ed636efffa61007a0e65717597c41c4c00c36cb94b66a6975',
  'assets/images/brand/avi-footer.png': 'f7628081859d0208ce8ee5bbeee46e30d3a79c0b8872fd715b751f1eca84d114',
  'assets/images/brand/avi-onboarding.png': '95f7e3c33e2069362a5266ca072344da103609eb33c0efe45d21e04a75704279',
  'assets/images/brand/avi-login-sheet-peek.png': '6b3ac7911b20c8b801023b1921c4a82c5735b2b9bf775e92f485ecbe39ba0b35',
};

for (const [assetPath, expectedSha256] of Object.entries(canonicalBrandAssets)) {
  expectAssetSha256(assetPath, expectedSha256);
}

if (appJson.expo?.ios?.appleTeamId !== undefined) {
  failures.push('expo.ios.appleTeamId must not be persisted in the public repository.');
}

if (process.argv.includes('--require-preview-runtime')) {
  const runtimeChecks = [
    ['EXPO_PUBLIC_DUELWORDSAV_API_BASE_URL', process.env.EXPO_PUBLIC_DUELWORDSAV_API_BASE_URL],
    ['EXPO_PUBLIC_DUELWORDSAV_CONVEX_URL', process.env.EXPO_PUBLIC_DUELWORDSAV_CONVEX_URL],
  ];

  for (const [name, value] of runtimeChecks) {
    if (typeof value !== 'string' || !value.startsWith('https://')) {
      failures.push(`${name} must resolve to a non-empty HTTPS URL.`);
    }
  }

  if (
    typeof expoConfig.extra?.duelWordsAv?.revenueCat?.apiKey !== 'string'
    || !expoConfig.extra.duelWordsAv.revenueCat.apiKey.startsWith('appl_')
  ) {
    failures.push('DUELWORDSAV_REVENUECAT_PUBLIC_API_KEY must resolve to an Apple public SDK key.');
  }

  if (
    typeof expoConfig.extra?.accountAv?.publishableKey !== 'string'
    || expoConfig.extra.accountAv.publishableKey.trim().length === 0
  ) {
    failures.push('ACCOUNTAV_PUBLISHABLE_KEY must resolve to a non-empty value.');
  }

  expectEqual('Account AV keychain service', expoConfig.extra?.accountAv?.keychainService, 'com.avalsys.duelwordsav.account');
  expectEqual(
    'Account AV keychain access group',
    expoConfig.extra?.accountAv?.keychainAccessGroup,
    expectedKeychainAccessGroup,
  );

  expectEqual(
    'EXPO_PUBLIC_DUELWORDSAV_API_DISABLED',
    process.env.EXPO_PUBLIC_DUELWORDSAV_API_DISABLED?.trim().toLowerCase(),
    'false',
  );
  expectEqual(
    'EXPO_PUBLIC_DUELWORDSAV_CONVEX_REALTIME_DISABLED',
    process.env.EXPO_PUBLIC_DUELWORDSAV_CONVEX_REALTIME_DISABLED?.trim().toLowerCase(),
    'false',
  );
}

if (failures.length > 0) {
  console.error('DuelWords AV iOS release config is not ready:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`DuelWords AV iOS ${development ? 'development' : 'release'} config check passed.`);
}
