import { normalizeGuess } from '../word-duel-engine/normalize';
import type { DictionaryProfile, DuelWordLength, GameLanguage } from '../word-duel-engine/types';
import englishDictionary from './generated/en.json';
import spanishDictionary from './generated/es.json';
import catalanDictionary from './generated/ca.json';
import frenchDictionary from './generated/fr.json';
import germanDictionary from './generated/de.json';

export type WordEntry = {
  id: string;
  language: GameLanguage;
  displayWord: string;
  normalizedWord: string;
  length: number;
  isValidGuess: boolean;
  isTarget: boolean;
  difficulty: 'starter' | 'normal';
  frequencyScore: number;
};

type BundledDictionary = { validGuesses: string[]; targets: [string, string][] };

const FIVE_LETTER_DICTIONARIES: Record<GameLanguage, BundledDictionary> = {
  en: englishDictionary as unknown as BundledDictionary,
  es: spanishDictionary as unknown as BundledDictionary,
  ca: catalanDictionary as unknown as BundledDictionary,
  fr: frenchDictionary as unknown as BundledDictionary,
  de: germanDictionary as unknown as BundledDictionary,
};

export const LOCAL_FIXTURE_NOTICE =
  'Bundled offline dictionaries. See THIRD_PARTY_NOTICES.md for sources and licenses.';

export const LOCAL_WORD_FIXTURES: Record<GameLanguage, readonly WordEntry[]> = {
  en: targetEntries('en'),
  es: targetEntries('es'),
  ca: targetEntries('ca'),
  fr: targetEntries('fr'),
  de: targetEntries('de'),
};

export function getLocalDictionary(language: GameLanguage, wordLength: DuelWordLength = 5): DictionaryProfile {
  const bundled = bundledDictionary(language, wordLength);

  return {
    language,
    validGuesses: bundled.validGuesses,
    targetWords: bundled.targets.map(([, normalizedWord]) => normalizedWord),
  };
}

export function getPracticeTarget(language: GameLanguage, seed: number, wordLength: DuelWordLength = 5): WordEntry {
  if (wordLength !== 5) return targetEntries(language, wordLength)[Math.abs(seed) % getLocalTargetCount(language, wordLength)];
  const targets = LOCAL_WORD_FIXTURES[language].filter((entry) => entry.isTarget);
  return targets[Math.abs(seed) % targets.length];
}

export function getLocalTargetCount(language: GameLanguage, wordLength: DuelWordLength = 5): number {
  return bundledDictionary(language, wordLength).targets.length;
}

function word(
  id: string,
  language: GameLanguage,
  displayWord: string,
  isValidGuess: boolean,
  isTarget: boolean,
  frequencyScore: number,
): WordEntry {
  const normalizedWord = normalizeGuess(displayWord, language);

  return {
    id,
    language,
    displayWord,
    normalizedWord,
    length: Array.from(normalizedWord).length,
    isValidGuess,
    isTarget,
    difficulty: isTarget ? 'starter' : 'normal',
    frequencyScore,
  };
}

function targetEntries(language: GameLanguage, wordLength: DuelWordLength = 5): WordEntry[] {
  return bundledDictionary(language, wordLength).targets.map(([displayWord], index) =>
    word(`${language}-target-${index}`, language, displayWord, true, true, 50));
}

function bundledDictionary(language: GameLanguage, wordLength: DuelWordLength): BundledDictionary {
  if (wordLength === 5) return FIVE_LETTER_DICTIONARIES[language];

  switch (`${language}-${wordLength}`) {
    case 'en-6': return require('./generated/en-6.json') as BundledDictionary;
    case 'en-7': return require('./generated/en-7.json') as BundledDictionary;
    case 'es-6': return require('./generated/es-6.json') as BundledDictionary;
    case 'es-7': return require('./generated/es-7.json') as BundledDictionary;
    case 'ca-6': return require('./generated/ca-6.json') as BundledDictionary;
    case 'ca-7': return require('./generated/ca-7.json') as BundledDictionary;
    case 'fr-6': return require('./generated/fr-6.json') as BundledDictionary;
    case 'fr-7': return require('./generated/fr-7.json') as BundledDictionary;
    case 'de-6': return require('./generated/de-6.json') as BundledDictionary;
    case 'de-7': return require('./generated/de-7.json') as BundledDictionary;
    default: throw new Error(`Unsupported local dictionary ${language}/${wordLength}.`);
  }
}
