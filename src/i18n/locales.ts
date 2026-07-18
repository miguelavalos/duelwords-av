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
  | 'absent'
  | 'appearance'
  | 'challengeDescription'
  | 'dark'
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
    appearance: 'Appearance',
    challengeDescription: 'Create or join a live guest challenge. Online play stays unavailable unless the safe runtime is enabled.',
    dark: 'Dark',
    done: 'Done',
    light: 'Light',
    playSubtitle: 'Synchronized word challenges start here.',
    preferencesLocal: 'Preferences stay on this device. Account sync can be added later through the approved Apps AV boundary.',
    practiceDescription: 'Practice five-letter rounds offline with the local training list.',
    selected: 'Selected',
    start: 'Start',
    system: 'System',
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
    appearance: 'Apariencia',
    challengeDescription: 'Crea o únete a un reto en directo como invitado. El juego online no se activa hasta habilitar el runtime seguro.',
    dark: 'Oscuro',
    done: 'Listo',
    light: 'Claro',
    playSubtitle: 'Aquí empiezan los retos de palabras sincronizados.',
    preferencesLocal: 'Las preferencias se guardan en este dispositivo. La sincronización de cuenta podrá añadirse mediante Apps AV.',
    practiceDescription: 'Practica rondas de cinco letras sin conexión con la lista local de entrenamiento.',
    selected: 'Seleccionado',
    start: 'Empezar',
    system: 'Sistema',
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
    appearance: 'Aparença',
    challengeDescription: 'Crea o uneix-te a un repte en directe com a convidat. El joc en línia no s’activa fins que s’habilita el runtime segur.',
    dark: 'Fosc',
    done: 'Fet',
    light: 'Clar',
    playSubtitle: 'Aquí comencen els reptes de paraules sincronitzats.',
    preferencesLocal: 'Les preferències es desen en aquest dispositiu. La sincronització del compte es podrà afegir mitjançant Apps AV.',
    practiceDescription: 'Practica rondes de cinc lletres sense connexió amb la llista local d’entrenament.',
    selected: 'Seleccionat',
    start: 'Començar',
    system: 'Sistema',
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
    appearance: 'Apparence',
    challengeDescription: "Créez ou rejoignez un défi en direct en tant qu’invité. Le jeu en ligne reste désactivé tant que l’environnement sécurisé ne l’est pas.",
    dark: 'Sombre',
    done: 'Terminé',
    light: 'Clair',
    playSubtitle: 'Les défis de mots synchronisés commencent ici.',
    preferencesLocal: 'Les préférences restent sur cet appareil. La synchronisation du compte pourra être ajoutée via Apps AV.',
    practiceDescription: 'Entraînez-vous hors ligne avec des manches de cinq lettres et la liste locale.',
    selected: 'Sélectionné',
    start: 'Commencer',
    system: 'Système',
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
    appearance: 'Darstellung',
    challengeDescription: 'Erstelle eine Live-Herausforderung als Gast oder tritt einer bei. Online-Spiel bleibt aus, bis die sichere Laufzeit aktiviert ist.',
    dark: 'Dunkel',
    done: 'Fertig',
    light: 'Hell',
    playSubtitle: 'Hier beginnen synchronisierte Wortduelle.',
    preferencesLocal: 'Einstellungen bleiben auf diesem Gerät. Kontosynchronisierung kann später über Apps AV ergänzt werden.',
    practiceDescription: 'Übe Fünf-Buchstaben-Runden offline mit der lokalen Trainingsliste.',
    selected: 'Ausgewählt',
    start: 'Starten',
    system: 'System',
  },
};

export function t(locale: InterfaceLocale, key: CopyKey): string {
  return copy[locale][key];
}
