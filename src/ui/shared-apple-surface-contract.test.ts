import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs') as {
  existsSync(path: string): boolean;
  readFileSync(path: string, encoding: 'utf8'): string;
};
const path = require('node:path') as {
  resolve(...paths: string[]): string;
};

const projectRoot = process.cwd();

function source(relativePath: string): string {
  return fs.readFileSync(path.resolve(projectRoot, relativePath), 'utf8');
}

function expectGeneratedSourceToMatch(relativePath: string, canonicalSource: string) {
  const generatedPath = path.resolve(projectRoot, relativePath);
  if (fs.existsSync(generatedPath)) {
    expect(fs.readFileSync(generatedPath, 'utf8')).toBe(canonicalSource);
  }
}

const surfaceTypeSource = source('src/ui/shared-apple-surface.types.ts');
const nativeSurfaceSource = source('native/shared-apple/DuelWordsSharedSurfaces.swift');
const experienceSource = source('native/shared-apple/DuelWordsAppExperience.swift');
const nativeViewManagerSource = source('native/shared-apple/DuelWordsSharedAppleViewManager.swift');
const nativeL10nSource = source('native/shared-apple/DuelWordsNativeL10n.swift');

const requiredRouteSurfaces = [
  ['src/features/launch/product-splash-screen.tsx', 'surface="splash"'],
  ['src/features/onboarding/onboarding-screen.tsx', 'surface="onboarding"'],
  ['src/features/settings/settings-screen.tsx', 'surface="settings"'],
  ['src/features/account/account-screen.tsx', 'surface="account"'],
  ['src/features/account/pro-screen.tsx', 'surface="paywall"'],
  ['src/features/account/account-deletion-screen.tsx', 'surface="delete-account"'],
] as const;

describe('shared Apps AV native-surface contract', () => {
  it('keeps every declared bridge surface implemented by the Swift host', () => {
    const declaredSurfaces = [
      ...surfaceTypeSource.matchAll(/^\s*\| '([^']+)'/gm),
    ].map((match) => match[1]);

    expect(declaredSurfaces).toEqual([
      'account',
      'delete-account',
      'footer',
      'header',
      'onboarding',
      'paywall',
      'settings',
      'sidebar',
      'splash',
    ]);

    for (const surface of declaredSurfaces) {
      expect(nativeSurfaceSource, surface).toContain(`case "${surface}":`);
    }
  });

  it('routes every common product screen through its shared Apple surface', () => {
    for (const [relativePath, expectedSurface] of requiredRouteSurfaces) {
      const routeSource = source(relativePath);
      expect(routeSource, relativePath).toContain('isSharedAppleSurfaceAvailable');
      expect(routeSource, relativePath).toContain('<SharedAppleSurface');
      expect(routeSource, relativePath).toContain(expectedSurface);
    }

    const authSource = source('src/features/account/auth-screen.tsx');
    expect(authSource).toContain('<AccountOnboardingExperience');
    expect(authSource).toContain('initialAuthExpanded');
  });

  it('keeps Tune AV common chrome foundations, palette, Avi, and adaptive navigation', () => {
    for (const foundation of [
      'AVAppShellFoundation',
      'AVAviFoundation',
      'AVBrandFoundation',
      'AVPaywallFoundation',
      'AVSettingsFoundation',
    ]) {
      expect(nativeSurfaceSource, foundation).toContain(`import ${foundation}`);
    }

    expect(nativeSurfaceSource).toContain('.avCommonAppExperience(experience)');
    expect(nativeSurfaceSource).toContain('footerConfiguration: .floating');
    expect(experienceSource).toContain('brandPalette: .standard');
    expect(experienceSource).toContain('onboardingAuthPanelCompanionName: "AviV2LoginSheetPeek"');
    expect(experienceSource).toContain('onboardingCTACompanionName: "AviV2OnboardingCTA"');
    expect(experienceSource).toContain('footerAssistantName: "AviFooterIcon"');

    const tabLayoutSource = source('src/app/(tabs)/_layout.tsx');
    expect(tabLayoutSource).toContain("surface={tablet ? 'sidebar' : 'footer'}");
    expect(tabLayoutSource).toContain('backgroundColor: isSharedAppleSurfaceAvailable && !tablet ? \'transparent\'');
    expect(tabLayoutSource).toContain('<Tabs.Screen name="settings" options={{ href: null');
    expect(tabLayoutSource).toContain('<Tabs.Screen name="account" options={{ href: null');
  });

  it('keeps signed-in visual fixtures local to explicitly opted-in iOS simulators', () => {
    expect(nativeViewManagerSource).toContain('#if targetEnvironment(simulator)');
    expect(nativeViewManagerSource).toContain('environment["DUELWORDSAV_UI_TESTS"] == "1"');
    expect(nativeViewManagerSource).toContain('DUELWORDSAV_UI_TESTS_ACCOUNT_MODE');
    expect(nativeViewManagerSource).toContain('DUELWORDSAV_UI_TEST_ACCOUNT_DELETION');
    expect(nativeViewManagerSource).toContain('#else\n        return self\n#endif');
    for (const suppressedAction of [
      'confirmDelete',
      'finalizeDelete',
      'refreshAccount',
      'retry',
      'signInApple',
      'signInGoogle',
    ]) {
      expect(nativeViewManagerSource).toContain(`"${suppressedAction}"`);
    }
    expect(nativeViewManagerSource).not.toContain('fetch(');

    expectGeneratedSourceToMatch(
      'ios/DuelWordsAV/SharedApple/DuelWordsSharedAppleViewManager.swift',
      nativeViewManagerSource,
    );
  });

  it('localizes account-deletion service copy without exposing technical fixture language', () => {
    expect(nativeSurfaceSource).toContain('detail: props.localized(props.deletionError)');
    expect(nativeSurfaceSource).toContain('title: props.localized(item.label)');
    expect(nativeSurfaceSource).toContain('detail: item.detail.map { props.localized($0) }');

    for (const playerFacingCopy of [
      'Account AV needs your review',
      'Open Account AV and resolve the issue before trying again.',
      'Deletion request received',
      'You can now finish the final account deletion step.',
      'Connected Apps AV',
      'Review local game data separately on each device.',
      'We could not check whether the account can be deleted. No account changes were made.',
    ]) {
      expect(nativeViewManagerSource, playerFacingCopy).toContain(playerFacingCopy);
      expect(nativeL10nSource.split(`"${playerFacingCopy}":`).length - 1, playerFacingCopy).toBe(4);
    }

    expectGeneratedSourceToMatch(
      'ios/DuelWordsAV/SharedApple/DuelWordsSharedSurfaces.swift',
      nativeSurfaceSource,
    );
    expectGeneratedSourceToMatch(
      'ios/DuelWordsAV/SharedApple/DuelWordsNativeL10n.swift',
      nativeL10nSource,
    );
  });
});
