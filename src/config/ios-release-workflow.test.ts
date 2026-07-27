import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs') as { readFileSync(path: string, encoding: 'utf8'): string };
const path = require('node:path') as { join(...paths: string[]): string };

const root = process.cwd();
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')) as {
  expo: { plugins: (string | [string, Record<string, unknown>])[] };
};
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  devDependencies?: Record<string, string>;
};
const archiveScript = fs.readFileSync(path.join(root, 'scripts/ios/archive-release.sh'), 'utf8');
const archiveCheck = fs.readFileSync(path.join(root, 'scripts/ios/check-release-archive.sh'), 'utf8');
const sentryDsymRepair = fs.readFileSync(
  path.join(root, 'scripts/ios/repair-release-archive-sentry-dsym.sh'),
  'utf8',
);
const builtConfigCheck = fs.readFileSync(path.join(root, 'scripts/ios/check-built-account-config.mjs'), 'utf8');
const configGenerator = fs.readFileSync(path.join(root, 'scripts/ios/generate-local-xcconfig.sh'), 'utf8');

describe('iOS release and Sentry workflow', () => {
  it('pins the official Sentry Expo plugin without an auth token', () => {
    const entry = appJson.expo.plugins.find(
      (plugin): plugin is [string, Record<string, unknown>] => Array.isArray(plugin) && plugin[0] === '@sentry/react-native/expo',
    );

    expect(entry?.[1]).toEqual({
      organization: 'avalsys',
      project: 'duelwordsav-ios',
      url: 'https://sentry.io/',
    });
    expect(entry?.[1]).not.toHaveProperty('authToken');
    expect(packageJson.devDependencies?.['@sentry/cli']).toBe('2.58.4');
  });

  it('keeps routine local builds provider-silent and makes Sentry upload explicit', () => {
    expect(configGenerator).toContain('DUELWORDSAV_IOS_SENTRY_DSN is missing for prod.');
    expect(configGenerator).toContain('DUELWORDSAV_IOS_SENTRY_DSN is malformed');
    expect(configGenerator).toContain('SENTRY_DISABLE_AUTO_UPLOAD');
    expect(archiveScript).toContain('--sentry-upload');
    expect(archiveScript).toContain('SENTRY_AUTH_TOKEN');
    expect(archiveScript).toContain('export SENTRY_DISABLE_AUTO_UPLOAD=false');
    expect(archiveScript).toContain('export SENTRY_DISABLE_AUTO_UPLOAD=true');
  });

  it('creates and validates an archive without containing an App Store upload path', () => {
    expect(archiveScript).toContain('xcodebuild archive');
    expect(archiveScript).toContain('chmod 600 "$build_log"');
    expect(archiveScript).toContain('> "$build_log" 2>&1');
    expect(archiveScript).toContain('Protected log: $build_log');
    expect(archiveScript).toContain('repair-release-archive-sentry-dsym.sh');
    expect(archiveScript).toContain('check-release-archive.sh');
    expect(archiveScript).not.toMatch(/-exportArchive|altool|notarytool|eas\s+submit/);
  });

  it('requires production identity, symbols, runtime, and Sentry in the final archive', () => {
    expect(archiveCheck).toContain('expected_build="2"');
    expect(archiveCheck).toContain('expected_bundle_id="com.avalsys.duelwordsav"');
    expect(archiveCheck).toContain('app dSYM UUID does not match app binary');
    expect(sentryDsymRepair).toContain('xcrun dsymutil');
    expect(sentryDsymRepair).toContain('Sentry.framework.dSYM');
    expect(archiveCheck).toContain('check-built-account-config.mjs');
    expect(builtConfigCheck).toContain("'DuelWords Sentry environment'");
    expect(builtConfigCheck).toContain("'DuelWords Sentry DSN'");
  });
});
