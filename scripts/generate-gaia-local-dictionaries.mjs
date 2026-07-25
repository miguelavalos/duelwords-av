import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const GAIA_COMMIT = '975a35c0f5010df341e96d6c5ec60217f5347412';
const GAIA_DICTIONARY_ROOT = 'apps/keyboard/js/imes/latin/dictionaries';
const TARGET_COUNT = 500;
const TARGET_EXCLUSIONS = Object.freeze({
  ca: new Set(['merda']),
  fr: new Set(['arabe', 'juifs', 'juive']),
  de: new Set(['adolf', 'juden']),
});

const SOURCES = Object.freeze({
  ca: {
    description: 'Català',
    sha256: '22384fb568fd549c84d7b7664ec950430ad572726f92fccc5bbca2e24dadb5c4',
  },
  fr: {
    description: 'Français',
    sha256: '7a7067c27b863510f6b6be3731a7737219773b5b1c37ec0f2b6470dd3aa80824',
  },
  de: {
    description: 'Deutsch',
    sha256: '33439c83ab4e87a40fa9c1722ce8887c2f24da8d531946080ccf7b8fed7002f0',
  },
});

const argv = process.argv.slice(2).filter((argument) => argument !== '--');
const args = new Map();
for (let index = 0; index < argv.length; index += 2) {
  args.set(argv[index], argv[index + 1]);
}

const outputRoot = args.get('--output') ?? 'src/game/dictionaries/generated';
const sourceRoot = args.get('--source-root');
const requestedLanguages = (args.get('--languages') ?? 'ca,fr,de')
  .split(',')
  .map((language) => language.trim())
  .filter(Boolean);

if (
  requestedLanguages.length === 0
  || requestedLanguages.some((language) => !(language in SOURCES))
) {
  throw new Error('Languages must be a non-empty comma-separated subset of ca,fr,de.');
}

await mkdir(outputRoot, { recursive: true });

for (const language of requestedLanguages) {
  const source = SOURCES[language];
  const fileName = `${language}_wordlist.xml`;
  const xml = sourceRoot
    ? await readFile(path.join(sourceRoot, fileName), 'utf8')
    : await fetchPinnedSource(fileName);

  assertSha256(xml, source.sha256, `${language} Gaia source`);
  const candidates = parseCandidates(xml, language);
  const validGuesses = candidates.map((candidate) => candidate.normalizedWord);
  const targets = candidates
    .filter((candidate) => !TARGET_EXCLUSIONS[language].has(candidate.normalizedWord))
    .slice(0, TARGET_COUNT)
    .map((candidate) => [candidate.displayWord, candidate.normalizedWord]);

  if (targets.length !== TARGET_COUNT) {
    throw new Error(`${language} has only ${targets.length} eligible targets; expected ${TARGET_COUNT}.`);
  }
  assertUnique(validGuesses, `${language} valid guesses`);
  assertUnique(targets.map((target) => target[1]), `${language} targets`);

  const payload = {
    source: {
      commit: GAIA_COMMIT,
      license: 'Apache-2.0',
      path: `${GAIA_DICTIONARY_ROOT}/${fileName}`,
      sha256: source.sha256,
      targetPolicy: `top-${TARGET_COUNT}-eligible-by-source-frequency`,
      targetExclusions: [...TARGET_EXCLUSIONS[language]],
    },
    validGuesses,
    targets,
  };

  await writeFile(path.join(outputRoot, `${language}.json`), `${JSON.stringify(payload)}\n`);
  console.log(`${language}: ${validGuesses.length} valid guesses, ${targets.length} targets`);
}

async function fetchPinnedSource(fileName) {
  const url = `https://raw.githubusercontent.com/mozilla-b2g/gaia/${GAIA_COMMIT}/${GAIA_DICTIONARY_ROOT}/${fileName}`;
  const response = await fetch(url, { redirect: 'error' });
  if (!response.ok) {
    throw new Error(`Could not download pinned Gaia source ${fileName}: HTTP ${response.status}`);
  }
  return response.text();
}

function parseCandidates(xml, language) {
  const candidatesByNormalizedWord = new Map();
  const rowPattern = /<w f="(\d+)" flags="([^"]*)">(.*?)<\/w>/gu;

  for (const match of xml.matchAll(rowPattern)) {
    const [, frequencyText, flags, encodedWord] = match;
    if (flags !== '') continue;

    const displayWord = decodeXml(encodedWord).normalize('NFC');
    if (!isEligibleDisplayWord(displayWord, language)) continue;

    const normalizedWord = normalizeFiveLetterWord(displayWord);
    if (Array.from(normalizedWord).length !== 5) continue;

    const frequency = Number.parseInt(frequencyText, 10);
    const previous = candidatesByNormalizedWord.get(normalizedWord);
    if (
      previous === undefined
      || frequency > previous.frequency
      || (frequency === previous.frequency && displayWord.localeCompare(previous.displayWord, language) < 0)
    ) {
      candidatesByNormalizedWord.set(normalizedWord, { displayWord, frequency, normalizedWord });
    }
  }

  return [...candidatesByNormalizedWord.values()].sort((left, right) =>
    right.frequency - left.frequency
    || left.displayWord.localeCompare(right.displayWord, language));
}

function isEligibleDisplayWord(word, language) {
  if (Array.from(word).length !== 5 || !/^\p{Script=Latin}+$/u.test(word)) return false;
  if (word.includes('ß') || word.includes('ẞ')) return false;

  // Gaia does not mark proper names separately. Catalan and French title-case
  // rows are excluded; German title case is retained because all nouns use it.
  return language === 'de' || word === word.toLocaleLowerCase(language);
}

function normalizeFiveLetterWord(word) {
  return word
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Mark}/gu, '')
    .replaceAll('œ', 'oe')
    .replaceAll('æ', 'ae')
    .replace(/[^a-z]/gu, '');
}

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/&#(\d+);/gu, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 10)))
    .replace(/&#x([\da-f]+);/giu, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)));
}

function assertSha256(value, expected, label) {
  const actual = createHash('sha256').update(value).digest('hex');
  if (actual !== expected) throw new Error(`${label} SHA-256 mismatch: expected ${expected}, got ${actual}.`);
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`${label} contain duplicates.`);
}
