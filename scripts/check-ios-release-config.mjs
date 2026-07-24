import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appJson = JSON.parse(readFileSync(resolve(repoRoot, 'app.json'), 'utf8'));
const easJson = JSON.parse(readFileSync(resolve(repoRoot, 'eas.json'), 'utf8'));
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

function hasExpoPlugin(name) {
  return expoConfig.plugins?.some(
    (plugin) => plugin === name || (Array.isArray(plugin) && plugin[0] === name),
  ) ?? false;
}

expectEqual('expo.name', expoConfig.name, 'DuelWords AV');
expectEqual('expo.slug', expoConfig.slug, 'duelwords-av');
expectEqual('expo.version', expoConfig.version, '0.1.0');
expectEqual('expo.orientation', expoConfig.orientation, 'portrait');
expectEqual('expo.ios.bundleIdentifier', expoConfig.ios?.bundleIdentifier, expectedBundleIdentifier);
expectEqual('expo.ios.buildNumber', expoConfig.ios?.buildNumber, '1');
expectEqual('expo.ios.supportsTablet', expoConfig.ios?.supportsTablet, true);
expectEqual('expo.ios.requireFullScreen', expoConfig.ios?.requireFullScreen, true);
expectEqual(
  'expo.ios.config.usesNonExemptEncryption',
  expoConfig.ios?.config?.usesNonExemptEncryption,
  false,
);
expectEqual('expo.scheme', expoConfig.scheme, 'duelwordsav');
expectEqual(
  'expo.extra.duelWordsAv.iosBuildVariant',
  expoConfig.extra?.duelWordsAv?.iosBuildVariant,
  development ? 'development' : 'release',
);
expectEqual('expo.plugins @clerk/expo', hasExpoPlugin('@clerk/expo'), true);
expectEqual('expo.plugins expo-apple-authentication', hasExpoPlugin('expo-apple-authentication'), true);
expectEqual('expo.plugins expo-secure-store', hasExpoPlugin('expo-secure-store'), true);
expectEqual('expo.plugins expo-web-browser', hasExpoPlugin('expo-web-browser'), true);
expectEqual(
  'expo.ios.entitlements com.apple.developer.applesignin',
  JSON.stringify(expoConfig.ios?.entitlements?.['com.apple.developer.applesignin']),
  JSON.stringify(['Default']),
);
expectEqual(
  'expo.ios.entitlements keychain-access-groups',
  JSON.stringify(expoConfig.ios?.entitlements?.['keychain-access-groups']),
  JSON.stringify([expectedKeychainAccessGroup]),
);
expectEqual(
  'expo.ios.infoPlist ACCOUNTAV_KEYCHAIN_SERVICE',
  expoConfig.ios?.infoPlist?.ACCOUNTAV_KEYCHAIN_SERVICE,
  'com.avalsys.duelwordsav.account',
);
expectEqual(
  'expo.ios.infoPlist ACCOUNTAV_KEYCHAIN_ACCESS_GROUP',
  expoConfig.ios?.infoPlist?.ACCOUNTAV_KEYCHAIN_ACCESS_GROUP,
  expectedKeychainAccessGroup,
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

for (const assetPath of [expoConfig.icon, expoConfig.ios?.icon]) {
  if (typeof assetPath !== 'string' || !existsSync(resolve(repoRoot, assetPath))) {
    failures.push(`Configured release asset is missing: ${String(assetPath)}.`);
  }
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
    typeof expoConfig.extra?.accountAv?.publishableKey !== 'string'
    || expoConfig.extra.accountAv.publishableKey.trim().length === 0
  ) {
    failures.push('ACCOUNTAV_PUBLISHABLE_KEY must resolve to a non-empty value.');
  }

  expectEqual(
    'Account AV keychain service mirror',
    expoConfig.extra?.accountAv?.keychainService,
    expoConfig.ios?.infoPlist?.ACCOUNTAV_KEYCHAIN_SERVICE,
  );
  expectEqual(
    'Account AV keychain access-group mirror',
    expoConfig.extra?.accountAv?.keychainAccessGroup,
    expoConfig.ios?.infoPlist?.ACCOUNTAV_KEYCHAIN_ACCESS_GROUP,
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
