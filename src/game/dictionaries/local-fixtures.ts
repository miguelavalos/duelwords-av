import { normalizeGuess } from '../word-duel-engine/normalize';
import type { DictionaryProfile, GameLanguage } from '../word-duel-engine/types';

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

const ENGLISH_FIXTURES: readonly WordEntry[] = [
  word('en-crane', 'en', 'crane', true, true, 92),
  word('en-flame', 'en', 'flame', true, true, 88),
  word('en-civic', 'en', 'civic', true, true, 76),
  word('en-sling', 'en', 'sling', true, true, 72),
  word('en-brave', 'en', 'brave', true, true, 84),
  word('en-cocoa', 'en', 'cocoa', true, false, 60),
  word('en-belle', 'en', 'belle', true, false, 55),
  word('en-level', 'en', 'level', true, false, 66),
  word('en-zesty', 'en', 'zesty', true, false, 48),
  word('en-pride', 'en', 'pride', true, false, 78),
  word('en-sound', 'en', 'sound', true, false, 80),
  word('en-humor', 'en', 'humor', true, false, 62),
];

const SPANISH_FIXTURES: readonly WordEntry[] = [
  word('es-canon-target', 'es', 'cañón', true, true, 74),
  word('es-perla', 'es', 'perla', true, true, 82),
  word('es-nieve', 'es', 'nieve', true, true, 84),
  word('es-canto', 'es', 'canto', true, true, 80),
  word('es-silla', 'es', 'silla', true, true, 78),
  word('es-canon-plain', 'es', 'canon', true, false, 40),
  word('es-piano', 'es', 'piano', true, false, 86),
  word('es-salto', 'es', 'salto', true, false, 76),
  word('es-brisa', 'es', 'brisa', true, false, 70),
  word('es-ninos', 'es', 'niños', true, false, 66),
  word('es-nandu', 'es', 'ñandú', true, false, 44),
  word('es-arbol', 'es', 'árbol', true, false, 82),
];

export const LOCAL_FIXTURE_NOTICE =
  'Tiny hand-authored non-production fixtures for local practice and tests only.';

export const LOCAL_WORD_FIXTURES: Record<GameLanguage, readonly WordEntry[]> = {
  en: ENGLISH_FIXTURES,
  es: SPANISH_FIXTURES,
};

export function getLocalDictionary(language: GameLanguage): DictionaryProfile {
  const entries = LOCAL_WORD_FIXTURES[language];

  return {
    language,
    validGuesses: entries.filter((entry) => entry.isValidGuess).map((entry) => entry.normalizedWord),
    targetWords: entries.filter((entry) => entry.isTarget).map((entry) => entry.normalizedWord),
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
