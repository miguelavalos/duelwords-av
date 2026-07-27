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

const interiorScreens = [
  'src/app/+not-found.tsx',
  'src/features/account/account-deletion-screen.tsx',
  'src/features/account/account-screen.tsx',
  'src/features/account/pro-screen.tsx',
  'src/features/avi/avi-screen.tsx',
  'src/features/rivals/rivals-screen.tsx',
  'src/features/settings/settings-screen.tsx',
  'src/features/stats/stats-screen.tsx',
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
  it('uses the same icon-only back header on every product-facing interior screen', () => {
    for (const relativePath of interiorScreens) {
      const screen = source(relativePath);
      expect(screen, relativePath).toContain('InteriorScreenHeader');
      expect(screen, relativePath).not.toContain('DuelWordsWordmark');
    }

    const navigation = source('src/ui/screen-navigation.tsx');
    expect(navigation).toContain('accessibilityRole="button"');
    expect(navigation).toContain('width: 44');
    expect(navigation).toContain('height: 44');
    expect(navigation).not.toContain('Done');
    expect(navigation).not.toContain('Close');
  });

  it('keeps the active Daily header compact and reveals secondary information on demand', () => {
    const daily = source('src/features/word-duel/daily-screen.tsx');
    expect(daily).toContain('sessionDetail');
    expect(daily).toContain('ScreenInfoButton');
    expect(daily).toContain('showGameInfo');
    expect(daily).not.toContain('styles.statusRow');
  });

  it('uses the shared back header for the in-flow live duel result', () => {
    const challenge = source('src/features/word-duel/public-challenge-screen.tsx');
    const resultSource = challenge.slice(challenge.indexOf('function ConnectedResultPanel'));
    expect(resultSource).toContain('<InteriorScreenHeader');
    expect(resultSource).not.toContain('style={styles.closeButton}');
  });
});
