import { describe, expect, it } from 'vitest';

declare const process: {
  cwd(): string;
};

declare function require(id: string): unknown;

const fs = require('node:fs') as {
  readFileSync(path: string, encoding: 'utf8'): string;
  readdirSync(
    path: string,
    options: { withFileTypes: true },
  ): {
    isDirectory(): boolean;
    isFile(): boolean;
    name: string;
  }[];
};

const path = require('node:path') as {
  join(...parts: string[]): string;
  relative(from: string, to: string): string;
};

describe('DuelWords public Convex SDK boundary', () => {
  it('keeps public source free of generated/private Convex imports and deploy keys', () => {
    const sourceRoot = path.join(process.cwd(), 'src');
    const forbiddenFragments = [
      'convex/_generated',
      '_generated/api',
      'private/avalsys-suite',
      'DUELWORDSAV_CONVEX_DEPLOY_KEY',
      'CONVEX_DEPLOY_KEY',
    ];
    const offenders: string[] = [];

    for (const sourceFile of listSourceFiles(sourceRoot)) {
      if (sourceFile.endsWith('.test.ts') || sourceFile.endsWith('.test.tsx')) {
        continue;
      }
      const source = fs.readFileSync(sourceFile, 'utf8');
      for (const fragment of forbiddenFragments) {
        if (source.includes(fragment)) {
          offenders.push(`${path.relative(process.cwd(), sourceFile)} -> ${fragment}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('keeps demo screens on local mock controllers instead of runtime clients', () => {
    const lobbyScreen = fs.readFileSync(
      path.join(process.cwd(), 'src/features/word-duel/lobby-screen.tsx'),
      'utf8',
    );
    const activeScreen = fs.readFileSync(
      path.join(process.cwd(), 'src/features/word-duel/active-duel-screen.tsx'),
      'utf8',
    );
    const demoRoutes = [
      path.join(process.cwd(), 'src/app/word-duel/lobby-demo.tsx'),
      path.join(process.cwd(), 'src/app/word-duel/active-demo.tsx'),
    ]
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');

    expect(lobbyScreen).toContain("mode: 'local_mock'");
    expect(activeScreen).toContain("mode: 'local_mock'");
    expect(`${lobbyScreen}\n${activeScreen}\n${demoRoutes}`).not.toContain(
      'useDuelWordsRuntimeClients',
    );
    expect(`${lobbyScreen}\n${activeScreen}\n${demoRoutes}`).not.toContain(
      'createDuelWordsRuntimeClientsFromExpoConfig',
    );
  });

  it('keeps the connected runtime route hidden from public play navigation', () => {
    const connectedRoute = fs.readFileSync(
      path.join(process.cwd(), 'src/app/word-duel/connected-runtime.tsx'),
      'utf8',
    );
    const playScreen = fs.readFileSync(
      path.join(process.cwd(), 'src/features/play/play-screen.tsx'),
      'utf8',
    );
    const routeParams = fs.readFileSync(
      path.join(process.cwd(), 'src/features/word-duel/word-duel-route-params.ts'),
      'utf8',
    );
    const rootLayout = fs.readFileSync(
      path.join(process.cwd(), 'src/app/_layout.tsx'),
      'utf8',
    );

    expect(connectedRoute).toContain('ConnectedRuntimeScreen');
    expect(rootLayout).toContain('word-duel/connected-runtime');
    expect(playScreen).not.toContain('connected-runtime');
    expect(routeParams).not.toContain('connected-runtime');
  });
});

function listSourceFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(filePath));
      continue;
    }

    if (
      entry.isFile()
      && (
        filePath.endsWith('.ts')
        || filePath.endsWith('.tsx')
      )
    ) {
      files.push(filePath);
    }
  }

  return files;
}
