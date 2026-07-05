import type { GameLanguage } from '@/game/word-duel-engine';

export type InterfaceLocale = 'en' | 'es' | 'ca' | 'fr' | 'de';

export const INTERFACE_LOCALES: readonly { code: InterfaceLocale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'ca', label: 'Català' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
];

export const GAME_LANGUAGES: readonly { code: GameLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

type CopyKey =
  | 'appName'
  | 'play'
  | 'rivals'
  | 'stats'
  | 'settings'
  | 'wordDuel'
  | 'practice'
  | 'challengeFriend'
  | 'playAvi'
  | 'daily'
  | 'comingLater'
  | 'startPractice'
  | 'gameLanguage'
  | 'interfaceLanguage'
  | 'localOnly'
  | 'attempts'
  | 'invalidWord'
  | 'notEnoughLetters'
  | 'tooManyLetters'
  | 'won'
  | 'lost'
  | 'newGame'
  | 'enter'
  | 'delete'
  | 'exact'
  | 'present'
  | 'absent';

export const copy: Record<InterfaceLocale, Record<CopyKey, string>> = {
  en: {
    appName: 'DuelWords AV',
    play: 'Play',
    rivals: 'Rivals',
    stats: 'Stats',
    settings: 'Settings',
    wordDuel: 'Word Duel',
    practice: 'Practice',
    challengeFriend: 'Challenge a Friend',
    playAvi: 'Play Avi',
    daily: 'Daily',
    comingLater: 'Coming later',
    startPractice: 'Start practice',
    gameLanguage: 'Game language',
    interfaceLanguage: 'Interface language',
    localOnly: 'Local practice only',
    attempts: 'Attempts',
    invalidWord: 'Not in the local practice list',
    notEnoughLetters: 'Use five letters',
    tooManyLetters: 'Five letters only',
    won: 'Solved',
    lost: 'Attempts used',
    newGame: 'New game',
    enter: 'Enter',
    delete: 'Delete',
    exact: 'Exact',
    present: 'Present',
    absent: 'Out',
  },
  es: {
    appName: 'DuelWords AV',
    play: 'Jugar',
    rivals: 'Rivales',
    stats: 'Stats',
    settings: 'Ajustes',
    wordDuel: 'Word Duel',
    practice: 'Práctica',
    challengeFriend: 'Retar a alguien',
    playAvi: 'Jugar con Avi',
    daily: 'Diario',
    comingLater: 'Más adelante',
    startPractice: 'Empezar práctica',
    gameLanguage: 'Idioma de juego',
    interfaceLanguage: 'Idioma de interfaz',
    localOnly: 'Solo práctica local',
    attempts: 'Intentos',
    invalidWord: 'No está en la lista local',
    notEnoughLetters: 'Usa cinco letras',
    tooManyLetters: 'Solo cinco letras',
    won: 'Resuelto',
    lost: 'Intentos usados',
    newGame: 'Nueva partida',
    enter: 'Enviar',
    delete: 'Borrar',
    exact: 'Exacta',
    present: 'Presente',
    absent: 'Fuera',
  },
  ca: {
    appName: 'DuelWords AV',
    play: 'Jugar',
    rivals: 'Rivals',
    stats: 'Stats',
    settings: 'Ajustos',
    wordDuel: 'Word Duel',
    practice: 'Pràctica',
    challengeFriend: 'Reptar algú',
    playAvi: 'Jugar amb Avi',
    daily: 'Diari',
    comingLater: 'Més endavant',
    startPractice: 'Començar pràctica',
    gameLanguage: 'Idioma de joc',
    interfaceLanguage: 'Idioma de la interfície',
    localOnly: 'Només pràctica local',
    attempts: 'Intents',
    invalidWord: 'No és a la llista local',
    notEnoughLetters: 'Usa cinc lletres',
    tooManyLetters: 'Només cinc lletres',
    won: 'Resolt',
    lost: 'Intents usats',
    newGame: 'Nova partida',
    enter: 'Enviar',
    delete: 'Esborrar',
    exact: 'Exacta',
    present: 'Present',
    absent: 'Fora',
  },
  fr: {
    appName: 'DuelWords AV',
    play: 'Jouer',
    rivals: 'Rivaux',
    stats: 'Stats',
    settings: 'Réglages',
    wordDuel: 'Word Duel',
    practice: 'Entraînement',
    challengeFriend: 'Défier un ami',
    playAvi: 'Jouer avec Avi',
    daily: 'Quotidien',
    comingLater: 'Plus tard',
    startPractice: "Lancer l'entraînement",
    gameLanguage: 'Langue du jeu',
    interfaceLanguage: "Langue de l'interface",
    localOnly: 'Entraînement local',
    attempts: 'Essais',
    invalidWord: 'Absent de la liste locale',
    notEnoughLetters: 'Utilise cinq lettres',
    tooManyLetters: 'Cinq lettres seulement',
    won: 'Résolu',
    lost: 'Essais utilisés',
    newGame: 'Nouvelle partie',
    enter: 'Valider',
    delete: 'Effacer',
    exact: 'Exacte',
    present: 'Présente',
    absent: 'Hors jeu',
  },
  de: {
    appName: 'DuelWords AV',
    play: 'Spielen',
    rivals: 'Rivalen',
    stats: 'Stats',
    settings: 'Einstellungen',
    wordDuel: 'Word Duel',
    practice: 'Training',
    challengeFriend: 'Freund fordern',
    playAvi: 'Mit Avi spielen',
    daily: 'Täglich',
    comingLater: 'Später',
    startPractice: 'Training starten',
    gameLanguage: 'Spiel-Sprache',
    interfaceLanguage: 'App-Sprache',
    localOnly: 'Nur lokales Training',
    attempts: 'Versuche',
    invalidWord: 'Nicht in der lokalen Liste',
    notEnoughLetters: 'Fünf Buchstaben nutzen',
    tooManyLetters: 'Nur fünf Buchstaben',
    won: 'Gelöst',
    lost: 'Versuche genutzt',
    newGame: 'Neues Spiel',
    enter: 'Senden',
    delete: 'Löschen',
    exact: 'Exakt',
    present: 'Dabei',
    absent: 'Nicht dabei',
  },
};

export function t(locale: InterfaceLocale, key: CopyKey): string {
  return copy[locale][key];
}
