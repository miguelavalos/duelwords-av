import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs') as { readFileSync(path: string, encoding: 'utf8'): string };
const path = require('node:path') as { join(...paths: string[]): string };

describe('player-facing local-game copy contract', () => {
  const practiceSource = fs.readFileSync(
    path.join(process.cwd(), 'src/features/word-duel/practice-screen.tsx'),
    'utf8',
  );
  const playAviSource = fs.readFileSync(
    path.join(process.cwd(), 'src/features/word-duel/play-avi-screen.tsx'),
    'utf8',
  );
  const resultCopySource = fs.readFileSync(
    path.join(process.cwd(), 'src/features/word-duel/result-copy.ts'),
    'utf8',
  );
  const resultScreenSource = fs.readFileSync(
    path.join(process.cwd(), 'src/features/word-duel/result-screen.tsx'),
    'utf8',
  );

  it('passes the selected interface locale to the Practice keyboard', () => {
    expect(practiceSource).toContain('interfaceLocale={interfaceLocale}');
  });

  it('does not hard-code English Practice completion actions', () => {
    expect(practiceSource).not.toContain("'Opening...'");
    expect(practiceSource).not.toContain("'Open result'");
    expect(practiceSource).not.toContain("'This local game is finished'");
  });

  it('keeps placeholder links and duplicate share previews out of player screens', () => {
    expect(playAviSource).not.toContain('viewModel.safeSharePreview');
    expect(resultCopySource).not.toContain('<link>');
  });

  it('stacks result actions on compact phones instead of squeezing translated labels', () => {
    expect(resultScreenSource).toContain('const compactActions = width < 480');
    expect(resultScreenSource).toContain('styles.actionRowCompact');
    expect(resultScreenSource).toContain("width: '100%'");
  });
});
