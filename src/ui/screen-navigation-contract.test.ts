import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs') as {
  readFileSync(path: string, encoding: 'utf8'): string;
};
const path = require('node:path') as {
  resolve(...paths: string[]): string;
};

const projectRoot = process.cwd();

function source(relativePath: string) {
  return fs.readFileSync(path.resolve(projectRoot, relativePath), 'utf8');
}

const duelWordsInteriorScreens = [
  'src/app/+not-found.tsx',
  'src/features/account/account-deletion-screen.tsx',
  'src/features/account/pro-screen.tsx',
  'src/features/word-duel/active-duel-screen.tsx',
  'src/features/word-duel/connected-runtime-screen.tsx',
  'src/features/word-duel/daily-screen.tsx',
  'src/features/word-duel/lobby-screen.tsx',
  'src/features/word-duel/play-avi-screen.tsx',
  'src/features/word-duel/practice-screen.tsx',
  'src/features/word-duel/public-challenge-screen.tsx',
  'src/features/word-duel/result-screen.tsx',
  'src/features/word-duel/solo-daily-screen.tsx',
];

describe('interior screen navigation contract', () => {
  it('uses the same icon-only back header on every DuelWords-specific interior screen', () => {
    for (const relativePath of duelWordsInteriorScreens) {
      const screen = source(relativePath);
      expect(screen, relativePath).toContain('InteriorScreenHeader');
      expect(screen, relativePath).not.toContain('DuelWordsWordmark');
    }

    const navigation = source('src/ui/screen-navigation.tsx');
    expect(navigation).toContain('accessibilityRole="button"');
    expect(navigation).toContain('width: 44');
    expect(navigation).toContain('height: 44');
    expect(navigation).toContain('testID="header.back"');
    expect(navigation).toContain('testID="header.info"');
    expect(navigation).not.toContain('Done');
    expect(navigation).not.toContain('Close');
  });

  it('keeps Back out of common Account, Settings, and footer screens', () => {
    const nativeSurfaces = source('native/shared-apple/DuelWordsSharedSurfaces.swift');
    const commonProfileScreens = [
      'src/features/account/account-screen.tsx',
      'src/features/settings/settings-screen.tsx',
    ];
    const footerScreens = [
      'src/features/avi/avi-screen.tsx',
      'src/features/rivals/rivals-screen.tsx',
      'src/features/stats/stats-screen.tsx',
    ];

    for (const relativePath of commonProfileScreens) {
      const screen = source(relativePath);
      expect(screen, relativePath).toContain('AppChromeHeader');
      expect(screen, relativePath).not.toContain('InteriorScreenHeader');
    }

    for (const relativePath of footerScreens) {
      const screen = source(relativePath);
      expect(screen, relativePath).not.toContain('InteriorScreenHeader');
      expect(screen, relativePath).not.toContain('header.back');
    }

    expect(nativeSurfaces.match(/AVAppShellTab\(id: "play"/g)).toHaveLength(1);
    expect(nativeSurfaces.match(/AVAppShellTab\(id: "rivals"/g)).toHaveLength(1);
    expect(nativeSurfaces.match(/AVAppShellTab\(id: "stats"/g)).toHaveLength(1);
    expect(nativeSurfaces).toContain('assistantID: "avi"');
    expect(nativeSurfaces).not.toContain('private struct DuelWordsBackHeader');
    expect(nativeSurfaces).not.toContain('.accessibilityIdentifier("header.back")');
    expect(nativeSurfaces).toContain('closeSystemImage: "chevron.left"');
    expect(nativeSurfaces.match(/DuelWordsHeaderSurface\(props: props, action: action\)/g)).toHaveLength(3);
    expect(nativeSurfaces.match(/showsChrome: !isTabletLayout/g)).toHaveLength(2);
  });

  it('uses the shared product chrome on Home, Account, and Settings', () => {
    const tabLayout = source('src/app/(tabs)/_layout.tsx');
    const nativeSurfaces = source('native/shared-apple/DuelWordsSharedSurfaces.swift');

    expect(tabLayout).toContain("selectedRoute === 'play'");
    expect(nativeSurfaces).toContain('if props.selectedTab == "play"');
    expect(source('src/features/play/play-screen.tsx')).toContain('AppChromeHeader');
    expect(source('src/features/account/account-screen.tsx')).toContain('selected="account"');
    expect(source('src/features/settings/settings-screen.tsx')).toContain('selected="settings"');
    expect(source('src/features/launch/product-splash-screen.tsx')).toContain('DuelWordsWordmark');
    expect(source('src/features/onboarding/onboarding-screen.tsx')).toContain('DuelWordsWordmark');
  });

  it('pushes every DuelWords flow from the right and reverses on Back', () => {
    const rootLayout = source('src/app/_layout.tsx');
    expect(rootLayout).toContain("animation: 'slide_from_right'");
    expect(rootLayout).toContain("gestureDirection: 'horizontal'");

    for (const route of [
      'word-duel/active-demo',
      'word-duel/challenge',
      'word-duel/connected-runtime',
      'word-duel/lobby-demo',
      'word-duel/play-avi',
      'word-duel/play-avi-demo',
      'word-duel/practice',
      'word-duel/daily',
      'word-duel/result-demo',
      'word-duel/solo-daily-demo',
    ]) {
      const declaration = rootLayout.slice(rootLayout.indexOf(`name="${route}"`), rootLayout.indexOf(`name="${route}"`) + 180);
      expect(declaration, route).toContain('duelWordsFlowScreenOptions');
    }

    const challenge = source('src/features/word-duel/public-challenge-screen.tsx');
    const challengeHeader = challenge.slice(challenge.indexOf('<InteriorScreenHeader'), challenge.indexOf('<InteriorScreenHeader') + 520);
    expect(challengeHeader).toContain('router.canGoBack()');
    expect(challengeHeader).toContain('router.back()');
  });

  it('orders Home by product priority before secondary modes and Avi help', () => {
    const home = source('src/features/play/play-screen.tsx');
    const daily = home.indexOf('title={copy.daily}');
    const challenge = home.indexOf('title={copy.challenge}');
    const playAvi = home.indexOf('title={copy.playAvi}');
    const practice = home.indexOf('title={copy.practice}');
    const aviHelp = home.indexOf("router.push('/avi' as Href)");

    expect(daily).toBeGreaterThan(-1);
    expect(daily).toBeLessThan(challenge);
    expect(challenge).toBeLessThan(playAvi);
    expect(playAvi).toBeLessThan(aviHelp);
    expect(practice).toBeLessThan(aviHelp);
  });

  it('keeps the active Daily header compact and shows date and language without a redundant info toggle', () => {
    const daily = source('src/features/word-duel/daily-screen.tsx');
    expect(daily).toContain('sessionDetail');
    expect(daily).not.toContain('ScreenInfoButton');
    expect(daily).not.toContain('showGameInfo');
    expect(daily).toContain('session.dailyDate');
    expect(daily).toContain('gameLanguageLabel(session.language)');
    expect(daily).not.toContain('styles.statusRow');
  });

  it('uses the shared back header for the in-flow live duel result', () => {
    const challenge = source('src/features/word-duel/public-challenge-screen.tsx');
    const resultSource = challenge.slice(challenge.indexOf('function ConnectedResultPanel'));
    expect(resultSource).toContain('<InteriorScreenHeader');
    expect(resultSource).not.toContain('style={styles.closeButton}');
  });
});
