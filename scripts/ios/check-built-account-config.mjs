#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appArgument = process.argv[2];
const environment = process.argv[3];

if (!appArgument || !['dev', 'preview', 'prod'].includes(environment)) {
  fail('usage: check-built-account-config.mjs <path-to-app> <dev|preview|prod>');
}

const appPath = resolve(appArgument);
const configPath = resolve(appPath, 'EXConstants.bundle', 'app.config');
if (!existsSync(configPath)) fail('EXConstants.bundle/app.config is missing');

let config;
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'));
} catch {
  fail('EXConstants.bundle/app.config is not valid JSON');
}

const expo = config.expo ?? config;
const account = expo.extra?.accountAv;
const duelWords = expo.extra?.duelWordsAv;
const expectedApi = environment === 'prod'
  ? 'https://api-account-av.avalsys.com'
  : 'https://api-account-av-preview.avalsys.com';
const expectedKeyPrefix = environment === 'prod' ? 'pk_live_' : 'pk_test_';
const expectedVariant = environment === 'dev' ? 'development' : 'release';
const expectedBundle = environment === 'dev'
  ? 'com.avalsys.duelwordsav.dev'
  : 'com.avalsys.duelwordsav';

expect('Account AV config object', account && typeof account === 'object');
expect(
  'Account AV publishable-key profile',
  typeof account?.publishableKey === 'string' && account.publishableKey.startsWith(expectedKeyPrefix),
);
expect('Account AV API target', normalizeUrl(account?.apiBaseUrl) === expectedApi);
expect('Account AV keychain service', account?.keychainService === 'com.avalsys.duelwordsav.account');
expect('Account AV keychain access group', account?.keychainAccessGroup === `935PM55U6R.${expectedBundle}`);
expect('DuelWords iOS build variant', duelWords?.iosBuildVariant === expectedVariant);
expect('DuelWords Apps AV API enabled', duelWords?.apiDisabled === false);
expect('DuelWords Convex realtime enabled', duelWords?.convexRealtimeDisabled === false);
expect(
  'DuelWords Convex cloud target',
  typeof duelWords?.convexUrl === 'string' && /^https:\/\/[^/]+\.convex\.cloud\/?$/.test(duelWords.convexUrl),
);

console.log(`DuelWords AV built Account AV config passed for ${environment}.`);

function normalizeUrl(value) {
  return typeof value === 'string' ? value.replace(/\/$/, '') : '';
}

function expect(label, condition) {
  if (!condition) fail(`${label} is missing or mismatched`);
}

function fail(message) {
  console.error(`DuelWords AV built Account AV config failed: ${message}`);
  process.exit(1);
}
