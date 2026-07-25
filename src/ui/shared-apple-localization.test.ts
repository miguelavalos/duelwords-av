import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs') as {
  readFileSync(path: string, encoding: 'utf8'): string;
};
const path = require('node:path') as {
  resolve(...paths: string[]): string;
};

const projectRoot = process.cwd();
const experienceSource = fs.readFileSync(
  path.resolve(projectRoot, 'native/shared-apple/DuelWordsAppExperience.swift'),
  'utf8',
);
const surfaceSource = fs.readFileSync(
  path.resolve(projectRoot, 'native/shared-apple/DuelWordsSharedSurfaces.swift'),
  'utf8',
);
const localizationSource = fs.readFileSync(
  path.resolve(projectRoot, 'native/shared-apple/DuelWordsNativeL10n.swift'),
  'utf8',
);
const pluginSource = fs.readFileSync(
  path.resolve(projectRoot, 'plugins/with-duelwords-shared-apple.js'),
  'utf8',
);
const splashSource = fs.readFileSync(
  path.resolve(projectRoot, 'src/features/launch/product-splash-screen.tsx'),
  'utf8',
);
const tabLayoutSource = fs.readFileSync(
  path.resolve(projectRoot, 'src/app/(tabs)/_layout.tsx'),
  'utf8',
);

function localizedSourceKeys(source: string): string[] {
  return [...source.matchAll(/(?:localized|text|markdown)\("([^"]+)"\)/g)].map((match) => match[1]);
}

function dictionaryKeys(name: string): Set<string> {
  const match = localizationSource.match(
    new RegExp(`private static let ${name}: \\[String: String\\] = \\[([\\s\\S]*?)\\n    \\]`),
  );
  expect(match, `${name} dictionary must exist`).not.toBeNull();
  return new Set([...match![1].matchAll(/^\s*"([^"]+)":/gm)].map((entry) => entry[1]));
}

describe('shared Apple localization contract', () => {
  it('ships and registers the app-local Swift catalog', () => {
    expect(pluginSource).toContain("'DuelWordsNativeL10n.swift'");
    expect(localizationSource).toContain('static let supportedLanguageCodes = ["en", "es", "ca", "fr", "de"]');
  });

  it('covers every localized Swift source string in ES, CA, FR, and DE', () => {
    const expected = new Set([
      ...localizedSourceKeys(experienceSource),
      ...localizedSourceKeys(surfaceSource),
    ]);

    for (const dictionaryName of ['spanish', 'catalan', 'french', 'german']) {
      const actual = dictionaryKeys(dictionaryName);
      expect([...expected].filter((key) => !actual.has(key)), dictionaryName).toEqual([]);
    }
  });

  it('drives the Swift experience and splash from the explicit app preferences', () => {
    expect(experienceSource).toContain('experience(interfaceLocale: String)');
    expect(surfaceSource).toContain('.environment(\\.locale, locale)');
    expect(surfaceSource).toContain('props.localized(props.authError)');
    expect(splashSource).toContain('appearance={appearance}');
    expect(splashSource).toContain('interfaceLocale={interfaceLocale}');
    expect(tabLayoutSource).toContain('interfaceLocale={interfaceLocale}');
  });
});
