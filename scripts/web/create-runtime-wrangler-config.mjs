import { readFile, writeFile } from 'node:fs/promises';

const [sourcePath, targetPath] = process.argv.slice(2);
if (!sourcePath || !targetPath) {
  throw new Error('Source and target Wrangler config paths are required.');
}

const required = [
  'ACCOUNTAV_PUBLISHABLE_KEY',
  'ACCOUNTAV_API_BASE_URL',
  'DUELWORDSAV_API_BASE_URL',
  'DUELWORDSAV_CONVEX_URL',
  'ENVIRONMENT',
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required.`);
}

const config = JSON.parse(await readFile(sourcePath, 'utf8'));
config.vars = Object.fromEntries(required.map((name) => [name, process.env[name]]));
await writeFile(targetPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
