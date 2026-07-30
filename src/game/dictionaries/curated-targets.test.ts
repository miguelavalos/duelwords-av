import { describe, expect, it } from 'vitest';

import ca5Generated from './generated/ca.json';
import ca6Generated from './generated/ca-6.json';
import ca7Generated from './generated/ca-7.json';
import de5Generated from './generated/de.json';
import de6Generated from './generated/de-6.json';
import de7Generated from './generated/de-7.json';
import en5Generated from './generated/en.json';
import en6Generated from './generated/en-6.json';
import en7Generated from './generated/en-7.json';
import es5Generated from './generated/es.json';
import es6Generated from './generated/es-6.json';
import es7Generated from './generated/es-7.json';
import fr5Generated from './generated/fr.json';
import fr6Generated from './generated/fr-6.json';
import fr7Generated from './generated/fr-7.json';
import ca5Targets from './curated-targets/ca-5.json';
import ca6Targets from './curated-targets/ca-6.json';
import ca7Targets from './curated-targets/ca-7.json';
import de5Targets from './curated-targets/de-5.json';
import de6Targets from './curated-targets/de-6.json';
import de7Targets from './curated-targets/de-7.json';
import en5Targets from './curated-targets/en-5.json';
import en6Targets from './curated-targets/en-6.json';
import en7Targets from './curated-targets/en-7.json';
import es5Targets from './curated-targets/es-5.json';
import es6Targets from './curated-targets/es-6.json';
import es7Targets from './curated-targets/es-7.json';
import fr5Targets from './curated-targets/fr-5.json';
import fr6Targets from './curated-targets/fr-6.json';
import fr7Targets from './curated-targets/fr-7.json';

type GeneratedDictionary = {
  source: { targetDeckPath: string; targetDeckSha256: string; targetPolicy: string };
  targets: [string, string][];
};

const TARGET_COUNT = 750;
const CASES = [
  ['ca-5', ca5Targets, ca5Generated], ['ca-6', ca6Targets, ca6Generated], ['ca-7', ca7Targets, ca7Generated],
  ['de-5', de5Targets, de5Generated], ['de-6', de6Targets, de6Generated], ['de-7', de7Targets, de7Generated],
  ['en-5', en5Targets, en5Generated], ['en-6', en6Targets, en6Generated], ['en-7', en7Targets, en7Generated],
  ['es-5', es5Targets, es5Generated], ['es-6', es6Targets, es6Generated], ['es-7', es7Targets, es7Generated],
  ['fr-5', fr5Targets, fr5Generated], ['fr-6', fr6Targets, fr6Generated], ['fr-7', fr7Targets, fr7Generated],
] as const;

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

describe('curated solution decks', () => {
  it.each(CASES)('%s keeps the editorial source and generated deck identical', async (deckName, displayWords, generatedSource) => {
    const generated = generatedSource as unknown as GeneratedDictionary;

    expect(displayWords).toHaveLength(TARGET_COUNT);
    expect(new Set(displayWords).size).toBe(TARGET_COUNT);
    expect(generated.targets.map(([displayWord]) => displayWord)).toEqual(displayWords);
    expect(generated.source.targetPolicy).toBe('curated-750-common-noun-adjective-solutions');
    expect(generated.source.targetDeckPath).toBe(`src/game/dictionaries/curated-targets/${deckName}.json`);
    expect(generated.source.targetDeckSha256).toBe(
      await sha256(`${JSON.stringify(displayWords, null, 2)}\n`),
    );
  });
});
