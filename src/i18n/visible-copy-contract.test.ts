import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs') as {
  readdirSync(path: string, options: { withFileTypes: true }): { isDirectory(): boolean; name: string }[];
  readFileSync(path: string, encoding: 'utf8'): string;
};
const path = require('node:path') as { join(...parts: string[]): string; relative(from: string, to: string): string };

const roots = ['src/app', 'src/features', 'src/ui'];
const excludedFiles = new Set([
  'src/features/word-duel/connected-runtime-screen.tsx',
]);
const allowedLiteralPatterns = [
  /^Avi(?: · DuelWords AV)?$/u,
  /^DuelWords (?:AV|Pro)$/u,
  /^Word Duel — DuelWords AV$/u,
  /^(?:G|i|vs|×)$/u,
  /^(?:AB3F|DELETE)$/u,
];

describe('visible interface copy contract', () => {
  it('keeps public JSX text behind localized copy catalogs', () => {
    const findings: string[] = [];
    for (const file of roots.flatMap(walkTsx)) {
      const relative = path.relative(process.cwd(), file);
      if (excludedFiles.has(relative) || relative.endsWith('.test.tsx')) continue;
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(/<(?:InkEyebrow|Text|title)\b[^>]*>\s*([A-Za-zÀ-ÿ][^<{\n]*?)\s*<\/(?:InkEyebrow|Text|title)>/gu)) {
        recordFinding(findings, relative, source, match.index ?? 0, match[1]);
      }
      for (const match of source.matchAll(/\b(?:accessibilityLabel|detail|label|message|placeholder|subtitle|title)=(["'])([A-Za-zÀ-ÿ][^"']*)\1/gu)) {
        recordFinding(findings, relative, source, match.index ?? 0, match[2]);
      }
    }
    expect(findings, findings.join('\n')).toEqual([]);
  });
});

function walkTsx(root: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkTsx(target));
    else if (entry.name.endsWith('.tsx')) files.push(target);
  }
  return files;
}

function recordFinding(findings: string[], file: string, source: string, index: number, literal: string) {
  const normalized = literal.trim();
  if (allowedLiteralPatterns.some((pattern) => pattern.test(normalized))) return;
  const line = source.slice(0, index).split('\n').length;
  findings.push(`${file}:${line}: ${JSON.stringify(normalized)}`);
}
