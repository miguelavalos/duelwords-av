import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourcePath = path.resolve('native/shared-apple/DuelWordsNativeL10n.swift');
const outputPath = path.resolve('src/i18n/generated/shared-surface-copy.json');
const source = await readFile(sourcePath, 'utf8');

const localeBlocks = {
  es: extractDictionary('spanish', 'catalan'),
  ca: extractDictionary('catalan', 'french'),
  fr: extractDictionary('french', 'german'),
  de: extractDictionary('german', null),
};
const englishKeys = Object.keys(localeBlocks.es);
const payload = { en: Object.fromEntries(englishKeys.map((key) => [key, key])) };

for (const [locale, values] of Object.entries(localeBlocks)) {
  const keys = Object.keys(values);
  const missing = englishKeys.filter((key) => !(key in values));
  const extra = keys.filter((key) => !englishKeys.includes(key));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(`${locale} shared-surface copy differs from English keys. Missing: ${missing.join(', ')}. Extra: ${extra.join(', ')}.`);
  }
  payload[locale] = values;
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Generated ${path.relative(process.cwd(), outputPath)} with ${englishKeys.length} strings in five locales.`);

function extractDictionary(name, nextName) {
  const startMarker = `private static let ${name}: [String: String] = [`;
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing Swift localization dictionary: ${name}`);
  const bodyStart = start + startMarker.length;
  const end = nextName === null
    ? source.lastIndexOf('\n    ]')
    : source.indexOf(`\n    private static let ${nextName}:`, bodyStart);
  if (end < 0) throw new Error(`Could not find the end of Swift localization dictionary: ${name}`);

  const values = {};
  const linePattern = /^\s*"((?:\\.|[^"\\])*)":\s*"((?:\\.|[^"\\])*)",\s*$/gmu;
  for (const match of source.slice(bodyStart, end).matchAll(linePattern)) {
    const key = decodeSwiftString(match[1]);
    const value = decodeSwiftString(match[2]);
    if (key in values) throw new Error(`Duplicate ${name} localization key: ${key}`);
    values[key] = value;
  }
  if (Object.keys(values).length === 0) throw new Error(`No entries parsed from Swift localization dictionary: ${name}`);
  return values;
}

function decodeSwiftString(value) {
  return JSON.parse(`"${value.replaceAll('\\(', '\\\\(')}"`).replaceAll('\\(', '\\(');
}
