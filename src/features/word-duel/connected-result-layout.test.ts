import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs') as {
  readFileSync(path: string, encoding: 'utf8'): string;
};
const path = require('node:path') as {
  join(...paths: string[]): string;
};

describe('connected result layout contract', () => {
  it('identifies both player roles and keeps rematch actions before completed boards', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/features/word-duel/public-challenge-screen.tsx'),
      'utf8',
    );
    const panelStart = source.indexOf('function ConnectedResultPanel');
    const panelEnd = source.indexOf('function PublicLobbyPanel');
    const panel = source.slice(panelStart, panelEnd);

    expect(panel).toContain("copy('you')");
    expect(panel).toContain("copy('rival')");
    expect(panel).toContain("const ownIsWinner = result.outcome === 'win';");
    expect(panel).toContain("const rivalIsWinner = result.outcome === 'loss';");
    expect(panel).toContain('ownIsWinner && styles.resultPlayerCardWinner');
    expect(panel).toContain('rivalIsWinner && styles.resultPlayerCardWinner');
    expect(source).toContain('resultPlayerCardWinner: { borderWidth: 2, borderColor: colors.accentPressed, backgroundColor: colors.accent }');
    expect(source).toContain('resultWinnerText: { color: colors.onAccent }');
    expect(panel.indexOf('<ConnectedRematchActions')).toBeGreaterThan(0);
    expect(panel.indexOf('<ConnectedRematchActions')).toBeLessThan(panel.indexOf("copy('yourFinalBoard')"));
  });
});
