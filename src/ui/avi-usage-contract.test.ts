import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs') as { readFileSync(path: string, encoding: 'utf8'): string };
const path = require('node:path') as { resolve(...paths: string[]): string };

function source(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

function artworkCount(value: string): number {
  return value.match(/<AviArtwork\b/g)?.length ?? 0;
}

describe('single Avi artwork contract', () => {
  it('allows one content Avi per tab screen independently of the footer icon', () => {
    for (const relativePath of [
      'src/features/play/play-screen.tsx',
      'src/features/avi/avi-screen.tsx',
      'src/features/rivals/rivals-screen.tsx',
      'src/features/account/account-screen.tsx',
    ]) {
      const value = source(relativePath);
      expect(artworkCount(value), relativePath).toBe(1);
    }
  });

  it('keeps every standalone screen to one Avi artwork or fewer', () => {
    for (const relativePath of [
      'src/features/account/account-auth-options-panel.tsx',
      'src/features/account/account-deletion-screen.tsx',
      'src/features/account/pro-screen.tsx',
      'src/features/onboarding/onboarding-screen.tsx',
      'src/features/word-duel/daily-screen.tsx',
      'src/features/word-duel/play-avi-screen.tsx',
      'src/features/word-duel/practice-screen.tsx',
      'src/features/word-duel/public-challenge-screen.tsx',
    ]) {
      expect(artworkCount(source(relativePath)), relativePath).toBeLessThanOrEqual(1);
    }
  });

  it('keeps the footer as a separate cropped navigation treatment, matching Tune AV', () => {
    const tabs = source('src/app/(tabs)/_layout.tsx');
    const sharedApple = source('native/shared-apple/DuelWordsSharedSurfaces.swift');

    expect(tabs).toContain('surface={tablet ? \'sidebar\' : \'footer\'}');
    expect(sharedApple).toContain('assistantAccessibilityIdentifier: "footer.avi"');
    expect(sharedApple).toContain('sidebarButton("Avi", systemImage: "sparkles", route: "avi")');
    expect(source('src/features/play/play-screen.tsx')).not.toMatch(/\bavi\s*=/);
  });
});
