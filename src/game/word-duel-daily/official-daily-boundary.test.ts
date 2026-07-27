import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs') as { readFileSync(path: string, encoding: 'utf8'): string };
const path = require('node:path') as { resolve(...parts: string[]): string };
const projectRoot = process.cwd();

describe('official Daily request boundary', () => {
  it('keeps Convex, polling, heartbeat, and direct API calls out of the screen', () => {
    const screen = source('src/features/word-duel/daily-screen.tsx');
    const runtime = source('src/game/word-duel-daily/official-daily.ts');
    const combined = `${screen}\n${runtime}`.toLowerCase();

    expect(combined).not.toContain('setinterval');
    expect(combined).not.toContain('heartbeat');
    expect(combined).not.toContain('convex');
    expect(screen).not.toContain('.getDailyTarget(');
    expect(runtime.match(/\.getDailyTarget\(/g)).toHaveLength(1);
  });

  it('keeps guesses, completion, stats, and sharing inside the device runtime', () => {
    const runtime = source('src/game/word-duel-daily/official-daily.ts');

    expect(runtime).toContain('applyGuess(');
    expect(runtime).toContain('persistOfficialDailyProgress(');
    expect(runtime).toContain('createSafeOfficialDailyShare');
    expect(runtime).not.toContain('/guesses');
    expect(runtime).not.toContain('/results');
  });
});

function source(relativePath: string): string {
  return fs.readFileSync(path.resolve(projectRoot, relativePath), 'utf8');
}
