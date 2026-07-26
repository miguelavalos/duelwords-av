import type { GameLanguage } from '../../game/word-duel-engine';
import { GAME_LANGUAGES } from '../../i18n/locales';

export const CONNECTED_GAME_LANGUAGES = GAME_LANGUAGES;

export function connectedGameLanguage(language: GameLanguage): GameLanguage {
  return language;
}
