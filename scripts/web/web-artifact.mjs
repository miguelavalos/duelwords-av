import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(import.meta.dirname, '../..');
const distRoot = resolve(repoRoot, 'dist');
const stampPath = resolve(repoRoot, '.web-artifact.json');
const mode = process.argv[2];

if (mode !== '--write' && mode !== '--verify') {
  throw new Error('Usage: web-artifact.mjs --write|--verify');
}

const worktreeStatus = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], {
  cwd: repoRoot,
  encoding: 'utf8',
});
if (worktreeStatus.trim()) {
  throw new Error('The web artifact must be built and verified from a clean worktree.');
}

const artifactSha256 = await hashDirectory(distRoot);
const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: repoRoot,
  encoding: 'utf8',
}).trim();

if (mode === '--write') {
  await writeFile(stampPath, `${JSON.stringify({ artifactSha256, commit }, null, 2)}\n`, {
    mode: 0o600,
  });
  process.stdout.write(`Artifact SHA-256: ${artifactSha256}\nCommit: ${commit}\n`);
} else {
  const expected = JSON.parse(await readFile(stampPath, 'utf8'));
  if (expected.artifactSha256 !== artifactSha256) {
    throw new Error('dist changed after the approved web artifact was built.');
  }
  if (expected.commit !== commit) {
    throw new Error('HEAD changed after the approved web artifact was built.');
  }
  process.stdout.write(`Verified artifact SHA-256: ${artifactSha256}\nCommit: ${commit}\n`);
}

async function hashDirectory(root) {
  const files = await walk(root);
  const hash = createHash('sha256');
  for (const file of files) {
    const path = relative(root, file).replaceAll('\\', '/');
    hash.update(`${path}\0`);
    hash.update(await readFile(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && (await stat(path)).isFile()) files.push(path);
  }
  return files;
}
