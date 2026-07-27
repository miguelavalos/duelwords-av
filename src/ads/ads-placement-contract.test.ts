import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs') as { readFileSync(path: string, encoding: 'utf8'): string };
const path = require('node:path') as { resolve(...paths: string[]): string };

function source(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('DuelWords advertising placement', () => {
  it('keeps one optional banner below every mode and before Avi help', () => {
    const home = source('src/features/play/play-screen.tsx');
    const daily = home.indexOf('title={copy.daily}');
    const challenge = home.indexOf('title={copy.challenge}');
    const secondaryModes = home.indexOf('<View style={[styles.modeGrid');
    const banner = home.indexOf('<HomeBannerAd />');
    const aviHelp = home.indexOf("router.push('/avi'");

    expect(daily).toBeGreaterThan(-1);
    expect(challenge).toBeGreaterThan(daily);
    expect(secondaryModes).toBeGreaterThan(challenge);
    expect(banner).toBeGreaterThan(secondaryModes);
    expect(aviHelp).toBeGreaterThan(banner);
    expect(home.match(/<HomeBannerAd \/>/g)).toHaveLength(1);
  });

  it('requests contextual inventory only', () => {
    const banner = source('src/ads/home-banner-ad.native.tsx');
    expect(banner).toContain('activateHomePlacement()');
    expect(banner).toContain('requestNonPersonalizedAdsOnly: true');
  });

  it('does not activate consent or the SDK until the Home placement mounts', () => {
    const provider = source('src/ads/ads-provider.native.tsx');
    expect(provider).toContain('const eligible = accountEligible && homePlacementActive');
    expect(provider).toContain('if (!eligible) return;');
  });

  it('does not put advertising inside any game board', () => {
    for (const relativePath of [
      'src/features/word-duel/connected-runtime-screen.tsx',
      'src/features/word-duel/play-avi-screen.tsx',
      'src/features/word-duel/practice-screen.tsx',
      'src/features/word-duel/solo-daily-screen.tsx',
    ]) {
      expect(source(relativePath), relativePath).not.toContain('HomeBannerAd');
      expect(source(relativePath), relativePath).not.toContain('react-native-google-mobile-ads');
    }
  });
});
