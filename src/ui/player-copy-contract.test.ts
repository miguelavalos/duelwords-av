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
  const playScreenSource = fs.readFileSync(
    path.join(process.cwd(), 'src/features/play/play-screen.tsx'),
    'utf8',
  );
  const publicChallengeSource = fs.readFileSync(
    path.join(process.cwd(), 'src/features/word-duel/public-challenge-screen.tsx'),
    'utf8',
  );
  const developmentRouteSources = [
    'active-demo.tsx',
    'connected-runtime.tsx',
    'lobby-demo.tsx',
    'play-avi-demo.tsx',
    'result-demo.tsx',
    'solo-daily-demo.tsx',
  ].map((fileName) => fs.readFileSync(
    path.join(process.cwd(), 'src/app/word-duel', fileName),
    'utf8',
  ));

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

  it('opens the human challenge hub directly and puts room-code join before create', () => {
    expect(playScreenSource).toContain('WORD_DUEL_ROUTE_PATHS.challenge');
    expect(playScreenSource.match(/WORD_DUEL_ROUTE_PATHS\.setup/g)).toHaveLength(2);

    const entrySource = publicChallengeSource.slice(
      publicChallengeSource.indexOf('{lobbyState === null ? ('),
      publicChallengeSource.indexOf('<PublicLobbyPanel'),
    );
    expect(entrySource.indexOf("copy('joinChallenge')")).toBeLessThan(entrySource.indexOf("copy('createChallenge')"));
    expect(entrySource.indexOf("copy('roomCode')")).toBeLessThan(entrySource.indexOf("copy('inviteLabel')"));
  });

  it('keeps room codes complete and compact iPad mode titles on one line', () => {
    expect(publicChallengeSource).toContain("label={copy('roomCode')} value={lobby.invitePreview.roomCode} selectable wide");
    expect(publicChallengeSource).toContain('numberOfLines={selectable ? undefined : 1}');
    expect(playScreenSource).toContain('adjustsFontSizeToFit={compact}');
    expect(playScreenSource).toContain('numberOfLines={compact ? 1 : undefined}');
  });

  it('keeps engineering preview routes out of non-development builds', () => {
    for (const source of developmentRouteSources) {
      expect(source).toContain('if (!__DEV__) return <Redirect href="/" />;');
    }
  });
});
