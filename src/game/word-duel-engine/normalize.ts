import type { GameLanguage } from './types';

const SPANISH_ENYE_MARKER = '__duelwords_enye__';
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const ENGLISH_LETTER = /^[a-z]$/;
const SPANISH_LETTER = /^[a-zñ]$/;

export function normalizeGuess(input: string, language: GameLanguage): string {
  const lower = input.trim().toLowerCase();
  const accentFolded =
    language === 'es'
      ? lower
          .replaceAll('ñ', SPANISH_ENYE_MARKER)
          .normalize('NFD')
          .replace(COMBINING_MARKS, '')
          .replaceAll(SPANISH_ENYE_MARKER, 'ñ')
      : lower.normalize('NFD').replace(COMBINING_MARKS, '');

  return Array.from(accentFolded)
    .filter((letter) => isAllowedLetter(letter, language))
    .join('');
}

export function isAllowedLetter(letter: string, language: GameLanguage): boolean {
  if (language === 'es') {
    return SPANISH_LETTER.test(letter);
  }

  return ENGLISH_LETTER.test(letter);
}
