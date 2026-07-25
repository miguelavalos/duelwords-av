import { normalizeGuess } from '../word-duel-engine/normalize';
import type { DictionaryProfile, GameLanguage } from '../word-duel-engine/types';
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

const BUNDLED_DICTIONARIES: Record<GameLanguage, BundledDictionary> = {
  en: englishDictionary as BundledDictionary,
  es: spanishDictionary as BundledDictionary,
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

export function getLocalDictionary(language: GameLanguage): DictionaryProfile {
  const bundled = BUNDLED_DICTIONARIES[language];

  return {
    language,
    validGuesses: bundled.validGuesses,
    targetWords: bundled.targets.map(([, normalizedWord]) => normalizedWord),
  };
}

export function getPracticeTarget(language: GameLanguage, seed: number): WordEntry {
  const targets = LOCAL_WORD_FIXTURES[language].filter((entry) => entry.isTarget);
  return targets[Math.abs(seed) % targets.length];
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

function targetEntries(language: GameLanguage): WordEntry[] {
  return BUNDLED_DICTIONARIES[language].targets.map(([displayWord], index) =>
    word(`${language}-target-${index}`, language, displayWord, true, true, 50));
}
