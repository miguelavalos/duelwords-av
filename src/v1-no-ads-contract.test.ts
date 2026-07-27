import { describe, expect, it } from 'vitest';

declare const process: { cwd(): string };
declare function require(id: string): unknown;

const fs = require('node:fs') as {
  readFileSync(path: string, encoding: 'utf8'): string;
  readdirSync(path: string, options: { withFileTypes: true }): {
    isDirectory(): boolean;
    name: string;
  }[];
};
const path = require('node:path') as {
  join(...parts: string[]): string;
};

const ROOT = process.cwd();

function source(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function collectSourceFiles(relativeDirectory: string): string[] {
  const directory = path.join(ROOT, relativeDirectory);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(relativePath);
    return /\.(?:js|m|swift|ts|tsx)$/.test(entry.name) ? [relativePath] : [];
  });
}

describe('DuelWords AV V1 no-advertising contract', () => {
  it('does not ship Google Mobile Ads or advertising runtime configuration', () => {
    const packageJson = JSON.parse(source('package.json')) as {
      dependencies?: Record<string, string>;
    };
    const appConfig = source('app.config.js');

    expect(packageJson.dependencies).not.toHaveProperty('react-native-google-mobile-ads');
    expect(appConfig).not.toMatch(/AdMob|google-mobile-ads|DUELWORDSAV_ADS_MODE|DUELWORDSAV_ADMOB|GADApplicationIdentifier/);
  });

  it('keeps application and shared native surfaces free of ad slots and consent actions', () => {
    const files = [
      ...collectSourceFiles('src'),
      ...collectSourceFiles('native/shared-apple'),
    ].filter((relativePath) => !relativePath.includes('.test.'));

    for (const relativePath of files) {
      const contents = source(relativePath);
      expect(contents, relativePath).not.toMatch(
        /HomeBannerAd|DuelWordsAdsProvider|adsPrivacyOptionsRequired|openAdsPrivacyOptions|react-native-google-mobile-ads|\badSlot\b/,
      );
    }
  });
});
