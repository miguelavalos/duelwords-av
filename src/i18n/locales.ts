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
  { code: 'ca', label: 'Català' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
];

export function gameLanguageLabel(language: GameLanguage): string {
  return GAME_LANGUAGES.find((option) => option.code === language)?.label ?? language.toUpperCase();
}

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
  | 'startPractice'
  | 'gameLanguage'
  | 'interfaceLanguage'
  | 'localOnly'
  | 'attempts'
  | 'invalidWord'
  | 'notEnoughLetters'
  | 'tooManyLetters'
  | 'gameFinished'
  | 'won'
  | 'lost'
  | 'newGame'
  | 'openResult'
  | 'opening'
  | 'enter'
  | 'delete'
  | 'exact'
  | 'present'
  | 'absent'
  | 'appearance'
  | 'challengeDescription'
  | 'dark'
  | 'back'
  | 'done'
  | 'light'
  | 'playSubtitle'
  | 'preferencesLocal'
  | 'practiceDescription'
  | 'selected'
  | 'start'
  | 'system';

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
    startPractice: 'Start practice',
    gameLanguage: 'Game language',
    interfaceLanguage: 'Interface language',
    localOnly: 'Local practice only',
    attempts: 'Attempts',
    invalidWord: 'Not in the local practice list',
    notEnoughLetters: 'Use five letters',
    tooManyLetters: 'Five letters only',
    gameFinished: 'This game is finished',
    won: 'Solved',
    lost: 'Attempts used',
    newGame: 'New game',
    openResult: 'Open result',
    opening: 'Opening…',
    enter: 'Enter',
    delete: 'Delete',
    exact: 'Exact',
    present: 'Present',
    absent: 'Out',
    appearance: 'Appearance',
    challengeDescription: 'Create or join a live guest challenge. A secure live connection is required for online play.',
    dark: 'Dark',
    back: 'Back',
    done: 'Done',
    light: 'Light',
    playSubtitle: 'Synchronized word challenges start here.',
    preferencesLocal: 'Interface language, appearance, and haptics stay on this device.',
    practiceDescription: 'Practice five-letter rounds offline with the local training list.',
    selected: 'Selected',
    start: 'Start',
    system: 'System',
  },
  es: {
    appName: 'DuelWords AV',
    play: 'Jugar',
    rivals: 'Rivales',
    stats: 'Estadísticas',
    settings: 'Ajustes',
    wordDuel: 'Word Duel',
    practice: 'Práctica',
    challengeFriend: 'Retar a alguien',
    playAvi: 'Jugar con Avi',
    daily: 'Diario',
    startPractice: 'Empezar práctica',
    gameLanguage: 'Idioma de juego',
    interfaceLanguage: 'Idioma de interfaz',
    localOnly: 'Solo práctica local',
    attempts: 'Intentos',
    invalidWord: 'No está en la lista local',
    notEnoughLetters: 'Usa cinco letras',
    tooManyLetters: 'Solo cinco letras',
    gameFinished: 'Esta partida ha terminado',
    won: 'Resuelto',
    lost: 'Intentos usados',
    newGame: 'Nueva partida',
    openResult: 'Abrir resultado',
    opening: 'Abriendo…',
    enter: 'Enviar',
    delete: 'Borrar',
    exact: 'Exacta',
    present: 'Presente',
    absent: 'Fuera',
    appearance: 'Apariencia',
    challengeDescription: 'Crea o únete a un reto en directo como invitado. El juego online necesita una conexión segura.',
    dark: 'Oscuro',
    back: 'Volver',
    done: 'Listo',
    light: 'Claro',
    playSubtitle: 'Aquí empiezan los retos de palabras sincronizados.',
    preferencesLocal: 'El idioma de interfaz, la apariencia y la vibración se guardan en este dispositivo.',
    practiceDescription: 'Practica rondas de cinco letras sin conexión con la lista local de entrenamiento.',
    selected: 'Seleccionado',
    start: 'Empezar',
    system: 'Sistema',
  },
  ca: {
    appName: 'DuelWords AV',
    play: 'Jugar',
    rivals: 'Rivals',
    stats: 'Estadístiques',
    settings: 'Ajustos',
    wordDuel: 'Word Duel',
    practice: 'Pràctica',
    challengeFriend: 'Reptar algú',
    playAvi: 'Jugar amb Avi',
    daily: 'Diari',
    startPractice: 'Començar pràctica',
    gameLanguage: 'Idioma de joc',
    interfaceLanguage: 'Idioma de la interfície',
    localOnly: 'Només pràctica local',
    attempts: 'Intents',
    invalidWord: 'No és a la llista local',
    notEnoughLetters: 'Usa cinc lletres',
    tooManyLetters: 'Només cinc lletres',
    gameFinished: 'Aquesta partida ha acabat',
    won: 'Resolt',
    lost: 'Intents usats',
    newGame: 'Nova partida',
    openResult: 'Obrir resultat',
    opening: 'Obrint…',
    enter: 'Enviar',
    delete: 'Esborrar',
    exact: 'Exacta',
    present: 'Present',
    absent: 'Fora',
    appearance: 'Aparença',
    challengeDescription: 'Crea o uneix-te a un repte en directe com a convidat. El joc en línia necessita una connexió segura.',
    dark: 'Fosc',
    back: 'Tornar',
    done: 'Fet',
    light: 'Clar',
    playSubtitle: 'Aquí comencen els reptes de paraules sincronitzats.',
    preferencesLocal: 'L’idioma de la interfície, l’aparença i la vibració es desen en aquest dispositiu.',
    practiceDescription: 'Practica rondes de cinc lletres sense connexió amb la llista local d’entrenament.',
    selected: 'Seleccionat',
    start: 'Començar',
    system: 'Sistema',
  },
  fr: {
    appName: 'DuelWords AV',
    play: 'Jouer',
    rivals: 'Rivaux',
    stats: 'Statistiques',
    settings: 'Réglages',
    wordDuel: 'Word Duel',
    practice: 'Entraînement',
    challengeFriend: 'Défier un ami',
    playAvi: 'Jouer avec Avi',
    daily: 'Quotidien',
    startPractice: "Lancer l'entraînement",
    gameLanguage: 'Langue du jeu',
    interfaceLanguage: "Langue de l'interface",
    localOnly: 'Entraînement local',
    attempts: 'Essais',
    invalidWord: 'Absent de la liste locale',
    notEnoughLetters: 'Utilise cinq lettres',
    tooManyLetters: 'Cinq lettres seulement',
    gameFinished: 'Cette partie est terminée',
    won: 'Résolu',
    lost: 'Essais utilisés',
    newGame: 'Nouvelle partie',
    openResult: 'Ouvrir le résultat',
    opening: 'Ouverture…',
    enter: 'Valider',
    delete: 'Effacer',
    exact: 'Exacte',
    present: 'Présente',
    absent: 'Hors jeu',
    appearance: 'Apparence',
    challengeDescription: "Créez ou rejoignez un défi en direct en tant qu’invité. Le jeu en ligne nécessite une connexion sécurisée.",
    dark: 'Sombre',
    back: 'Retour',
    done: 'Terminé',
    light: 'Clair',
    playSubtitle: 'Les défis de mots synchronisés commencent ici.',
    preferencesLocal: 'Langue de l’interface, apparence et vibrations restent sur cet appareil.',
    practiceDescription: 'Entraînez-vous hors ligne avec des manches de cinq lettres et la liste locale.',
    selected: 'Sélectionné',
    start: 'Commencer',
    system: 'Système',
  },
  de: {
    appName: 'DuelWords AV',
    play: 'Spielen',
    rivals: 'Rivalen',
    stats: 'Statistik',
    settings: 'Einstellungen',
    wordDuel: 'Word Duel',
    practice: 'Training',
    challengeFriend: 'Freund fordern',
    playAvi: 'Mit Avi spielen',
    daily: 'Täglich',
    startPractice: 'Training starten',
    gameLanguage: 'Spiel-Sprache',
    interfaceLanguage: 'App-Sprache',
    localOnly: 'Nur lokales Training',
    attempts: 'Versuche',
    invalidWord: 'Nicht in der lokalen Liste',
    notEnoughLetters: 'Fünf Buchstaben nutzen',
    tooManyLetters: 'Nur fünf Buchstaben',
    gameFinished: 'Dieses Spiel ist beendet',
    won: 'Gelöst',
    lost: 'Versuche genutzt',
    newGame: 'Neues Spiel',
    openResult: 'Ergebnis öffnen',
    opening: 'Wird geöffnet…',
    enter: 'Senden',
    delete: 'Löschen',
    exact: 'Exakt',
    present: 'Dabei',
    absent: 'Nicht dabei',
    appearance: 'Darstellung',
    challengeDescription: 'Erstelle eine Live-Herausforderung als Gast oder tritt einer bei. Online-Spiel benötigt eine sichere Verbindung.',
    dark: 'Dunkel',
    back: 'Zurück',
    done: 'Fertig',
    light: 'Hell',
    playSubtitle: 'Hier beginnen synchronisierte Wortduelle.',
    preferencesLocal: 'App-Sprache, Darstellung und Haptik bleiben auf diesem Gerät.',
    practiceDescription: 'Übe Fünf-Buchstaben-Runden offline mit der lokalen Trainingsliste.',
    selected: 'Ausgewählt',
    start: 'Starten',
    system: 'System',
  },
};

export function t(locale: InterfaceLocale, key: CopyKey): string {
  return copy[locale][key];
}
