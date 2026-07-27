import type { InterfaceLocale } from '@/i18n/locales';

export type DailyCopy = {
  aviDetail: string;
  aviTitle: string;
  best: string;
  boardLabel: string;
  completed: string;
  detail: string;
  done: string;
  eyebrow: string;
  failed: string;
  failedDetail: string;
  failedTitle: string;
  loading: string;
  practice: string;
  privacy: string;
  resume: string;
  share: string;
  sharingError: string;
  solved: string;
  solvedDetail: string;
  solvedTitle: string;
  start: string;
  statsTitle: string;
  streak: string;
  targetLabel: string;
  title: string;
  today: string;
  tryAgain: string;
  unavailableDetail: string;
  unavailableTitle: string;
};

export const DAILY_COPY: Record<InterfaceLocale, DailyCopy> = {
  en: {
    aviDetail: 'The word is collected once. Every guess stays on this device.',
    aviTitle: 'Avi keeps it fair',
    best: 'Best',
    boardLabel: 'Official Daily word board',
    completed: 'Played',
    detail: 'The same official five-letter word for everyone playing this language today. Six tries, no timer.',
    done: 'Done',
    eyebrow: 'Official Daily',
    failed: 'Missed',
    failedDetail: 'That was today’s word. Completing the challenge still keeps your streak going.',
    failedTitle: 'Today is complete',
    loading: 'Preparing today’s word…',
    practice: 'Keep playing in Practice',
    privacy: 'Your guesses, result, and streak stay on this device.',
    resume: 'Resume today’s Daily',
    share: 'Share result',
    sharingError: 'Your result could not be shared. Try again.',
    solved: 'Solved',
    solvedDetail: 'Nicely played. Come back tomorrow for a new official word.',
    solvedTitle: 'Daily solved',
    start: 'Start today’s Daily',
    statsTitle: 'Your Daily record',
    streak: 'Day streak',
    targetLabel: 'Today’s word',
    title: 'One word. One chance today.',
    today: 'Today',
    tryAgain: 'Try again',
    unavailableDetail: 'Connect once to collect today’s official word. A saved challenge can still be resumed without a connection.',
    unavailableTitle: 'Today’s word is not ready',
  },
  es: {
    aviDetail: 'La palabra se recoge una sola vez. Cada intento se queda en este dispositivo.',
    aviTitle: 'Avi mantiene el juego justo',
    best: 'Mejor',
    boardLabel: 'Tablero de la palabra diaria oficial',
    completed: 'Jugados',
    detail: 'La misma palabra oficial de cinco letras para todos los que juegan hoy en este idioma. Seis intentos, sin reloj.',
    done: 'Listo',
    eyebrow: 'Diario oficial',
    failed: 'Fallados',
    failedDetail: 'Esa era la palabra de hoy. Completar el reto también mantiene tu racha.',
    failedTitle: 'El reto de hoy está completo',
    loading: 'Preparando la palabra de hoy…',
    practice: 'Seguir jugando en Práctica',
    privacy: 'Tus intentos, resultado y racha se guardan en este dispositivo.',
    resume: 'Continuar el Diario de hoy',
    share: 'Compartir resultado',
    sharingError: 'No se ha podido compartir el resultado. Inténtalo de nuevo.',
    solved: 'Resueltos',
    solvedDetail: 'Muy bien jugado. Vuelve mañana para una nueva palabra oficial.',
    solvedTitle: 'Diario resuelto',
    start: 'Empezar el Diario de hoy',
    statsTitle: 'Tu historial diario',
    streak: 'Días de racha',
    targetLabel: 'Palabra de hoy',
    title: 'Una palabra. Una oportunidad hoy.',
    today: 'Hoy',
    tryAgain: 'Reintentar',
    unavailableDetail: 'Conéctate una vez para recoger la palabra oficial de hoy. Un reto guardado puede continuar sin conexión.',
    unavailableTitle: 'La palabra de hoy no está lista',
  },
  ca: {
    aviDetail: 'La paraula es recull una sola vegada. Cada intent es queda en aquest dispositiu.',
    aviTitle: 'L’Avi manté el joc just',
    best: 'Millor',
    boardLabel: 'Tauler de la paraula diària oficial',
    completed: 'Jugats',
    detail: 'La mateixa paraula oficial de cinc lletres per a tothom que juga avui en aquest idioma. Sis intents, sense rellotge.',
    done: 'Fet',
    eyebrow: 'Diari oficial',
    failed: 'Fallats',
    failedDetail: 'Aquesta era la paraula d’avui. Completar el repte també manté la ratxa.',
    failedTitle: 'El repte d’avui està complet',
    loading: 'Preparant la paraula d’avui…',
    practice: 'Continuar jugant a Pràctica',
    privacy: 'Els teus intents, resultat i ratxa es desen en aquest dispositiu.',
    resume: 'Continuar el Diari d’avui',
    share: 'Compartir resultat',
    sharingError: 'No s’ha pogut compartir el resultat. Torna-ho a provar.',
    solved: 'Resolts',
    solvedDetail: 'Molt ben jugat. Torna demà per una nova paraula oficial.',
    solvedTitle: 'Diari resolt',
    start: 'Començar el Diari d’avui',
    statsTitle: 'El teu historial diari',
    streak: 'Dies de ratxa',
    targetLabel: 'Paraula d’avui',
    title: 'Una paraula. Una oportunitat avui.',
    today: 'Avui',
    tryAgain: 'Tornar-ho a provar',
    unavailableDetail: 'Connecta’t una vegada per recollir la paraula oficial d’avui. Un repte desat pot continuar sense connexió.',
    unavailableTitle: 'La paraula d’avui no està preparada',
  },
  fr: {
    aviDetail: 'Le mot est récupéré une seule fois. Chaque essai reste sur cet appareil.',
    aviTitle: 'Avi veille à l’équité',
    best: 'Meilleur',
    boardLabel: 'Grille du mot quotidien officiel',
    completed: 'Joués',
    detail: 'Le même mot officiel de cinq lettres pour toutes les personnes qui jouent aujourd’hui dans cette langue. Six essais, sans chrono.',
    done: 'Terminé',
    eyebrow: 'Quotidien officiel',
    failed: 'Manqués',
    failedDetail: 'C’était le mot du jour. Terminer le défi maintient aussi votre série.',
    failedTitle: 'Le défi du jour est terminé',
    loading: 'Préparation du mot du jour…',
    practice: 'Continuer en Entraînement',
    privacy: 'Vos essais, votre résultat et votre série restent sur cet appareil.',
    resume: 'Reprendre le Quotidien',
    share: 'Partager le résultat',
    sharingError: 'Impossible de partager votre résultat. Réessayez.',
    solved: 'Résolus',
    solvedDetail: 'Bien joué. Revenez demain pour un nouveau mot officiel.',
    solvedTitle: 'Quotidien résolu',
    start: 'Commencer le Quotidien',
    statsTitle: 'Votre bilan quotidien',
    streak: 'Jours de série',
    targetLabel: 'Mot du jour',
    title: 'Un mot. Une chance aujourd’hui.',
    today: 'Aujourd’hui',
    tryAgain: 'Réessayer',
    unavailableDetail: 'Connectez-vous une fois pour récupérer le mot officiel du jour. Un défi enregistré reste jouable hors connexion.',
    unavailableTitle: 'Le mot du jour n’est pas prêt',
  },
  de: {
    aviDetail: 'Das Wort wird einmal geholt. Jeder Versuch bleibt auf diesem Gerät.',
    aviTitle: 'Avi sorgt für Fairness',
    best: 'Bestwert',
    boardLabel: 'Brett für das offizielle Wort des Tages',
    completed: 'Gespielt',
    detail: 'Dasselbe offizielle Wort mit fünf Buchstaben für alle, die heute in dieser Sprache spielen. Sechs Versuche, ohne Zeitlimit.',
    done: 'Fertig',
    eyebrow: 'Offizielles Tageswort',
    failed: 'Verfehlt',
    failedDetail: 'Das war das heutige Wort. Ein abgeschlossener Versuch erhält trotzdem deine Serie.',
    failedTitle: 'Heute ist abgeschlossen',
    loading: 'Das heutige Wort wird vorbereitet…',
    practice: 'Im Training weiterspielen',
    privacy: 'Deine Versuche, dein Ergebnis und deine Serie bleiben auf diesem Gerät.',
    resume: 'Heutiges Tageswort fortsetzen',
    share: 'Ergebnis teilen',
    sharingError: 'Dein Ergebnis konnte nicht geteilt werden. Versuche es erneut.',
    solved: 'Gelöst',
    solvedDetail: 'Gut gespielt. Morgen wartet ein neues offizielles Wort.',
    solvedTitle: 'Tageswort gelöst',
    start: 'Heutiges Tageswort starten',
    statsTitle: 'Deine Tagesbilanz',
    streak: 'Tagesserie',
    targetLabel: 'Heutiges Wort',
    title: 'Ein Wort. Eine Chance heute.',
    today: 'Heute',
    tryAgain: 'Erneut versuchen',
    unavailableDetail: 'Verbinde dich einmal, um das offizielle Wort des Tages zu holen. Eine gespeicherte Runde bleibt offline spielbar.',
    unavailableTitle: 'Das heutige Wort ist noch nicht bereit',
  },
};

export function dailyCopy(locale: InterfaceLocale): DailyCopy {
  return DAILY_COPY[locale];
}
