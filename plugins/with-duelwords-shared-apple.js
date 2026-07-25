const fs = require('node:fs');
const path = require('node:path');
const { withDangerousMod, withPodfile, withPodfileProperties } = require('expo/config-plugins');

const APP_NAME = 'DuelWordsAV';
const SWIFT_FILES = [
  'DuelWordsAppExperience.swift',
  'DuelWordsSharedAppleViewManager.swift',
  'DuelWordsSharedSurfaces.swift',
  'DuelWordsSharedAppleViewManager.m',
];
const ASSETS = {
  AviFooterIcon: 'avi-footer.png',
  AviV2LoginSheetPeek: 'avi-login-sheet-peek.png',
  AviV2OnboardingCTA: 'avi-onboarding.png',
  DuelWordsHeaderLogo: 'duelwords-wordmark.png',
  DuelWordsOnboardingBrand: 'duelwords-wordmark.png',
  DuelWordsOnboardingHero: 'duelwords-onboarding-hero.png',
  DuelWordsSplashHero: 'duelwords-splash-hero.png',
  DuelWordsSplashLogo: 'duelwords-logo-lockup.png',
};

function withDuelWordsSharedApple(config) {
  config = withPodfileProperties(config, (result) => {
    result.modResults['ios.deploymentTarget'] = '18.0';
    return result;
  });

  config = withPodfile(config, (result) => {
    const requireLine = "require File.expand_path('../scripts/ios/configure-shared-apple', __dir__)";
    const configureCall = [
      '  DuelWordsSharedApple.configure(',
      "    project_path: File.join(__dir__, 'DuelWordsAV.xcodeproj'),",
      "    target_name: 'DuelWordsAV',",
      "    source_root: File.join(__dir__, 'DuelWordsAV', 'SharedApple'),",
      "    apps_av_path: File.expand_path('../../apps-av/apple', __dir__)",
      '  )',
    ].join('\n');
    const screensCompatibilityCall = '    DuelWordsSharedApple.configure_pods(installer.pods_project)';

    let contents = result.modResults.contents;
    if (!contents.includes(requireLine)) {
      contents = `${requireLine}\n${contents}`;
    }
    if (!contents.includes('DuelWordsSharedApple.configure(')) {
      contents = `${contents.trimEnd()}\n\npost_integrate do |_installer|\n${configureCall}\nend\n`;
    }
    if (!contents.includes(screensCompatibilityCall)) {
      const postInstallPattern = /(react_native_post_install\([\s\S]*?\n    \)\n)(  end\nend\n)/;
      if (!postInstallPattern.test(contents)) {
        throw new Error('Unable to add RNScreens Swift compatibility to the Expo Podfile');
      }
      contents = contents.replace(
        postInstallPattern,
        `$1${screensCompatibilityCall}\n$2`,
      );
    }
    result.modResults.contents = contents;
    return result;
  });

  return withDangerousMod(config, ['ios', async (result) => {
    const projectRoot = result.modRequest.projectRoot;
    const iosRoot = result.modRequest.platformProjectRoot;
    const nativeSourceRoot = path.join(projectRoot, 'native', 'shared-apple');
    const generatedSourceRoot = path.join(iosRoot, APP_NAME, 'SharedApple');
    const assetCatalogRoot = path.join(iosRoot, APP_NAME, 'Images.xcassets');

    fs.mkdirSync(generatedSourceRoot, { recursive: true });
    for (const file of SWIFT_FILES) {
      fs.copyFileSync(path.join(nativeSourceRoot, file), path.join(generatedSourceRoot, file));
    }

    for (const [assetName, sourceName] of Object.entries(ASSETS)) {
      const imageSetRoot = path.join(assetCatalogRoot, `${assetName}.imageset`);
      fs.mkdirSync(imageSetRoot, { recursive: true });
      fs.copyFileSync(
        path.join(projectRoot, 'assets', 'images', 'brand', sourceName),
        path.join(imageSetRoot, sourceName),
      );
      fs.writeFileSync(path.join(imageSetRoot, 'Contents.json'), `${JSON.stringify({
        images: [
          { filename: sourceName, idiom: 'universal', scale: '1x' },
          { idiom: 'universal', scale: '2x' },
          { idiom: 'universal', scale: '3x' },
        ],
        info: { author: 'xcode', version: 1 },
      }, null, 2)}\n`);
    }
    return result;
  }]);
}

module.exports = withDuelWordsSharedApple;
