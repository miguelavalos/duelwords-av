import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const argv = process.argv.slice(2).filter((argument) => argument !== '--');
const args = new Map();
for (let index = 0; index < argv.length; index += 2) {
  args.set(argv[index], argv[index + 1]);
}

const validRoot = args.get('--valid-fixture');
const targetRoot = args.get('--target-fixture');
const outputRoot = args.get('--output') ?? 'src/game/dictionaries/generated';
if (!validRoot || !targetRoot) {
  throw new Error('Usage: node scripts/generate-local-dictionaries.mjs --valid-fixture <dir> --target-fixture <dir> [--output <dir>]');
}

await mkdir(outputRoot, { recursive: true });
for (const language of ['en', 'es']) {
  const validRows = await readJsonLines(path.join(validRoot, language, 'valid-guesses.jsonl'));
  const targetRows = await readJsonLines(path.join(targetRoot, language, 'target-words.jsonl'));
  const validGuesses = validRows.map((row) => row.normalized_word);
  const targets = targetRows.map((row) => [row.display_word, row.normalized_word]);

  assertUnique(validGuesses, `${language} valid guesses`);
  assertUnique(targets.map((target) => target[1]), `${language} targets`);
  const validSet = new Set(validGuesses);
  for (const [, normalizedWord] of targets) {
    if (!validSet.has(normalizedWord)) throw new Error(`${language} target missing from valid guesses: ${normalizedWord}`);
  }

  await writeFile(path.join(outputRoot, `${language}.json`), `${JSON.stringify({ validGuesses, targets })}\n`);
  console.log(`${language}: ${validGuesses.length} valid guesses, ${targets.length} targets`);
}

async function readJsonLines(file) {
  const source = await readFile(file, 'utf8');
  return source.split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line));
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`${label} contain duplicates`);
}
