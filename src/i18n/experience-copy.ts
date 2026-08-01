import type { InterfaceLocale } from './locales';

export type ExperienceCopy = {
  home: string;
  homeTitle: string;
  homeDetail: string;
  rivals: string;
  stats: string;
  avi: string;
  account: string;
  settings: string;
  close: string;
  challenge: string;
  challengeDetail: string;
  liveOneToOne: string;
  playAvi: string;
  playAviDetail: string;
  playAviBoardLabel: string;
  practice: string;
  practiceDetail: string;
  practiceBoardLabel: string;
  daily: string;
  dailyDetail: string;
  dailyUnavailableTitle: string;
  dailyUnavailableDetail: string;
  dailyFairTitle: string;
  dailyFairDetail: string;
  backHome: string;
  gameLanguage: string;
  gameSettings: string;
  aviBriefTitle: string;
  aviBriefDetail: string;
  aviTitle: string;
  aviDetail: string;
  aviRulesTitle: string;
  aviRulesDetail: string;
  aviModesTitle: string;
  aviModesDetail: string;
  aviAccountTitle: string;
  aviAccountDetail: string;
  openPractice: string;
  openSettings: string;
  onboardingSkip: string;
  onboardingContinue: string;
  onboardingCreate: string;
  onboardingSignIn: string;
  onboardingGuest: string;
  accountSignInFailed: string;
  rivalsPrivacyPills: readonly string[];
  onboardingPages: readonly { eyebrow: string; title: string; detail: string }[];
};

const en: ExperienceCopy = {
  home: 'Home', homeTitle: 'Word duels with friends.', homeDetail: 'Warm up locally, play Avi, or share a live challenge.',
  rivals: 'Rivals', stats: 'Stats', avi: 'Avi', account: 'Account', settings: 'Settings', close: 'Close',
  challenge: 'Challenge a Friend', challengeDetail: 'Create a private room, share one invite, and solve the same word round by round.',
  liveOneToOne: 'Live 1 vs 1',
  playAvi: 'Play Avi', playAviDetail: 'A complete local duel against Avi. No account or connection needed.', playAviBoardLabel: 'Play Avi board',
  practice: 'Practice', practiceDetail: 'Untimed local rounds with five bundled word lists.', practiceBoardLabel: 'Local practice board',
  daily: 'Daily', dailyDetail: 'One official word for everyone in your chosen game language. Six tries, no timer.',
  dailyUnavailableTitle: 'Today’s word is not ready.',
  dailyUnavailableDetail: 'Connect once to collect today’s official word, then finish the challenge on this device.',
  dailyFairTitle: 'One fair word each day',
  dailyFairDetail: 'Daily will only start when the shared daily word is ready. It will never substitute a different word from your device.',
  backHome: 'Back to Home',
  gameLanguage: 'Game language', gameSettings: 'Game settings', aviBriefTitle: 'Avi has the rules covered', aviBriefDetail: 'Learn the ink marks, compare modes, or start a fair local duel.',
  aviTitle: 'Your word-duel companion', aviDetail: 'I can explain the game and play as your local rival. I never give hints.',
  aviRulesTitle: 'Read the ink', aviRulesDetail: 'Exact means right letter and place. Present means the letter belongs elsewhere. Out means it is not in the word.',
  aviModesTitle: 'Pick the right mode', aviModesDetail: 'Practice is untimed, Play Avi follows duel rhythm, and Challenge a Friend is synchronized online.',
  aviAccountTitle: 'Guest first, account when useful', aviAccountDetail: 'Play locally as a guest. Sign in when you want to use DuelWords Pro across your devices.',
  openPractice: 'Open practice', openSettings: 'Open settings', onboardingSkip: 'Skip', onboardingContinue: 'Continue',
  onboardingCreate: 'Create account', onboardingSignIn: 'Sign in', onboardingGuest: 'Continue as guest',
  accountSignInFailed: 'Account AV could not complete sign-in. Please try again.',
  rivalsPrivacyPills: ['Private invites', 'No contact imports', 'No public profiles', 'No exact status'],
  onboardingPages: [
    { eyebrow: 'DuelWords AV', title: 'Words, written head to head.', detail: 'A warm paper-and-ink word game built around fair live duels.' },
    { eyebrow: 'Meet Avi', title: 'Learn the rhythm with Avi.', detail: 'Avi explains every mark and can be your consistent local opponent.' },
    { eyebrow: 'Your choice', title: 'Start now. Keep more later.', detail: 'Continue as a guest, or sign in to use Pro across your devices. Game history and rivals stay on this device.' },
  ],
};

const es: ExperienceCopy = {
  home: 'Inicio', homeTitle: 'Duelos de palabras con amigos.', homeDetail: 'Practica en local, juega con Avi o comparte un reto en directo.',
  rivals: 'Rivales', stats: 'Estadísticas', avi: 'Avi', account: 'Cuenta', settings: 'Ajustes', close: 'Cerrar',
  challenge: 'Retar a alguien', challengeDetail: 'Crea una sala privada, comparte una invitación y resolved la misma palabra ronda a ronda.',
  liveOneToOne: '1 contra 1 en directo',
  playAvi: 'Jugar con Avi', playAviDetail: 'Un duelo local completo contra Avi. Sin cuenta ni conexión.', playAviBoardLabel: 'Tablero contra Avi',
  practice: 'Práctica', practiceDetail: 'Rondas locales sin tiempo con cinco listas de palabras incluidas.', practiceBoardLabel: 'Tablero de práctica local',
  daily: 'Diario', dailyDetail: 'Una palabra oficial para todos en el idioma de juego que elijas. Seis intentos, sin reloj.',
  dailyUnavailableTitle: 'La palabra de hoy no está lista.',
  dailyUnavailableDetail: 'Conéctate una vez para recoger la palabra oficial de hoy y termina el reto en este dispositivo.',
  dailyFairTitle: 'Una palabra justa cada día',
  dailyFairDetail: 'El reto diario solo empezará cuando la palabra compartida esté lista. Nunca usará otra palabra distinta de este dispositivo.',
  backHome: 'Volver a Inicio',
  gameLanguage: 'Idioma de juego', gameSettings: 'Ajustes de partida', aviBriefTitle: 'Avi conoce las reglas', aviBriefDetail: 'Aprende las marcas de tinta, compara modos o empieza un duelo local justo.',
  aviTitle: 'Tu compañero de duelos', aviDetail: 'Puedo explicar el juego y ser tu rival local. Nunca doy pistas.',
  aviRulesTitle: 'Lee la tinta', aviRulesDetail: 'Exacta es letra y posición correctas. Presente significa que va en otro lugar. Fuera indica que no aparece.',
  aviModesTitle: 'Elige el modo adecuado', aviModesDetail: 'Práctica no tiene tiempo, Jugar con Avi sigue el ritmo de duelo y Retar sincroniza a dos jugadores.',
  aviAccountTitle: 'Primero invitado, cuenta cuando aporte', aviAccountDetail: 'Juega en local como invitado. Inicia sesión cuando quieras usar DuelWords Pro en tus dispositivos.',
  openPractice: 'Abrir práctica', openSettings: 'Abrir ajustes', onboardingSkip: 'Omitir', onboardingContinue: 'Continuar',
  onboardingCreate: 'Crear cuenta', onboardingSignIn: 'Iniciar sesión', onboardingGuest: 'Continuar como invitado',
    accountSignInFailed: 'Account AV no ha podido completar el inicio de sesión. Inténtalo de nuevo.',
  rivalsPrivacyPills: ['Invitaciones privadas', 'Sin importar contactos', 'Sin perfiles públicos', 'Sin estado exacto'],
    onboardingPages: [
      { eyebrow: 'DuelWords AV', title: 'Palabras, frente a frente.', detail: 'Un juego cálido de papel y tinta centrado en duelos en directo justos.' },
      { eyebrow: 'Conoce a Avi', title: 'Aprende el ritmo con Avi.', detail: 'Avi explica cada marca y puede ser tu rival local constante.' },
    { eyebrow: 'Tú eliges', title: 'Empieza ya. Conserva más después.', detail: 'Continúa como invitado o inicia sesión para usar Pro en tus dispositivos. El historial y los rivales se guardan en este dispositivo.' },
  ],
};

const translations: Record<InterfaceLocale, ExperienceCopy> = {
  en,
  es,
  ca: {
    home: 'Inici', homeTitle: 'Duels de paraules amb amics.', homeDetail: 'Practica en local, juga amb l’Avi o comparteix un repte en directe.',
    rivals: 'Rivals', stats: 'Estadístiques', avi: 'Avi', account: 'Compte', settings: 'Ajustos', close: 'Tancar',
    challenge: 'Reptar algú', challengeDetail: 'Crea una sala privada, comparteix una invitació i resoleu la mateixa paraula ronda a ronda.',
    liveOneToOne: '1 contra 1 en directe',
    playAvi: 'Jugar amb l’Avi', playAviDetail: 'Un duel local complet contra l’Avi. Sense compte ni connexió.', playAviBoardLabel: 'Tauler contra l’Avi',
    practice: 'Pràctica', practiceDetail: 'Rondes locals sense temps amb cinc llistes de paraules incloses.', practiceBoardLabel: 'Tauler de pràctica local',
    daily: 'Diari', dailyDetail: 'Una paraula oficial per a tothom en l’idioma de joc que triïs. Sis intents, sense rellotge.',
    dailyUnavailableTitle: 'La paraula d’avui no està preparada.',
    dailyUnavailableDetail: 'Connecta’t una vegada per recollir la paraula oficial d’avui i acaba el repte en aquest dispositiu.',
    dailyFairTitle: 'Una paraula justa cada dia',
    dailyFairDetail: 'El repte diari només començarà quan la paraula compartida estigui preparada. Mai no la substituirà per una paraula diferent del dispositiu.',
    backHome: 'Tornar a Inici',
    gameLanguage: 'Idioma de joc', gameSettings: 'Ajustos de partida', aviBriefTitle: 'L’Avi coneix les regles', aviBriefDetail: 'Aprèn les marques de tinta, compara modes o comença un duel local just.',
    aviTitle: 'El teu company de duels', aviDetail: 'Puc explicar el joc i ser el teu rival local. Mai no dono pistes.',
    aviRulesTitle: 'Llegeix la tinta', aviRulesDetail: 'Exacta vol dir lletra i posició correctes. Present indica que va en un altre lloc. Fora vol dir que no hi és.',
    aviModesTitle: 'Tria el mode adequat', aviModesDetail: 'Pràctica no té temps, Jugar amb l’Avi segueix el ritme de duel i Reptar sincronitza dos jugadors.',
    aviAccountTitle: 'Primer convidat, compte quan aporti', aviAccountDetail: 'Juga en local com a convidat. Inicia sessió quan vulguis usar DuelWords Pro als teus dispositius.',
    openPractice: 'Obrir pràctica', openSettings: 'Obrir ajustos', onboardingSkip: 'Ometre', onboardingContinue: 'Continuar',
    onboardingCreate: 'Crear compte', onboardingSignIn: 'Iniciar sessió', onboardingGuest: 'Continuar com a convidat',
    accountSignInFailed: 'Account AV no ha pogut completar l’inici de sessió. Torna-ho a provar.',
    rivalsPrivacyPills: ['Invitacions privades', 'Sense importar contactes', 'Sense perfils públics', 'Sense estat exacte'],
    onboardingPages: [
      { eyebrow: 'DuelWords AV', title: 'Paraules, cara a cara.', detail: 'Un joc càlid de paper i tinta centrat en duels en directe justos.' },
      { eyebrow: 'Coneix l’Avi', title: 'Aprèn el ritme amb l’Avi.', detail: 'L’Avi explica cada marca i pot ser el teu rival local constant.' },
      { eyebrow: 'Tu tries', title: 'Comença ara. Conserva més després.', detail: 'Continua com a convidat o inicia sessió per usar Pro als teus dispositius. L’historial i els rivals es desen en aquest dispositiu.' },
    ],
  },
  fr: {
    home: 'Accueil', homeTitle: 'Des duels de mots entre amis.', homeDetail: 'Entraînez-vous hors ligne, jouez contre Avi ou partagez un défi en direct.',
    rivals: 'Rivaux', stats: 'Statistiques', avi: 'Avi', account: 'Compte', settings: 'Réglages', close: 'Fermer',
    challenge: 'Défier un ami', challengeDetail: 'Créez une salle privée, partagez une invitation et résolvez le même mot tour après tour.',
    liveOneToOne: '1 contre 1 en direct',
    playAvi: 'Jouer contre Avi', playAviDetail: 'Un duel local complet contre Avi. Aucun compte ni connexion requis.', playAviBoardLabel: 'Grille contre Avi',
    practice: 'Entraînement', practiceDetail: 'Parties locales sans chronomètre avec cinq listes de mots intégrées.', practiceBoardLabel: 'Grille d’entraînement locale',
    daily: 'Quotidien', dailyDetail: 'Un mot officiel pour tout le monde dans la langue de jeu choisie. Six essais, sans chrono.',
    dailyUnavailableTitle: 'Le mot du jour n’est pas prêt.',
    dailyUnavailableDetail: 'Connectez-vous une fois pour récupérer le mot officiel du jour, puis terminez le défi sur cet appareil.',
    dailyFairTitle: 'Un mot équitable chaque jour',
    dailyFairDetail: 'Le défi quotidien ne commencera que lorsque le mot partagé sera prêt. Il ne le remplacera jamais par un autre mot de votre appareil.',
    backHome: 'Retour à l’accueil',
    gameLanguage: 'Langue du jeu', gameSettings: 'Réglages de la partie', aviBriefTitle: 'Avi connaît les règles', aviBriefDetail: 'Découvrez les marques d’encre, comparez les modes ou lancez un duel local équitable.',
    aviTitle: 'Votre compagnon de duel', aviDetail: 'Je peux expliquer le jeu et devenir votre rival local. Je ne donne jamais d’indice.',
    aviRulesTitle: 'Lisez l’encre', aviRulesDetail: 'Exact signifie bonne lettre et bonne place. Présent indique une autre place. Absent signifie que la lettre n’est pas dans le mot.',
    aviModesTitle: 'Choisissez le bon mode', aviModesDetail: 'Entraînement est sans chrono, Jouer contre Avi suit le rythme d’un duel et Défier synchronise deux joueurs.',
    aviAccountTitle: 'Invité d’abord, compte si utile', aviAccountDetail: 'Jouez hors ligne en invité. Connectez-vous pour utiliser DuelWords Pro sur vos appareils.',
    openPractice: 'Ouvrir l’entraînement', openSettings: 'Ouvrir les réglages', onboardingSkip: 'Passer', onboardingContinue: 'Continuer',
    onboardingCreate: 'Créer un compte', onboardingSignIn: 'Se connecter', onboardingGuest: 'Continuer comme invité',
    accountSignInFailed: 'Account AV n’a pas pu terminer la connexion. Réessayez.',
    rivalsPrivacyPills: ['Invitations privées', 'Aucun contact importé', 'Aucun profil public', 'Aucun statut exact'],
    onboardingPages: [
      { eyebrow: 'DuelWords AV', title: 'Les mots, face à face.', detail: 'Un jeu chaleureux de papier et d’encre, pensé pour des duels en direct équitables.' },
      { eyebrow: 'Voici Avi', title: 'Apprenez le rythme avec Avi.', detail: 'Avi explique chaque marque et peut devenir votre rival local régulier.' },
      { eyebrow: 'À vous de choisir', title: 'Commencez maintenant. Gardez plus ensuite.', detail: 'Jouez en invité ou connectez-vous pour utiliser Pro sur vos appareils. L’historique et les rivaux restent sur cet appareil.' },
    ],
  },
  de: {
    home: 'Start', homeTitle: 'Wortduelle mit Freunden.', homeDetail: 'Übe offline, spiele gegen Avi oder teile eine Live-Herausforderung.',
    rivals: 'Rivalen', stats: 'Statistik', avi: 'Avi', account: 'Konto', settings: 'Einstellungen', close: 'Schließen',
    challenge: 'Freund herausfordern', challengeDetail: 'Erstelle einen privaten Raum, teile eine Einladung und löst Runde für Runde dasselbe Wort.',
    liveOneToOne: 'Live 1 gegen 1',
    playAvi: 'Gegen Avi spielen', playAviDetail: 'Ein vollständiges lokales Duell gegen Avi. Kein Konto und keine Verbindung nötig.', playAviBoardLabel: 'Brett gegen Avi',
    practice: 'Training', practiceDetail: 'Lokale Runden ohne Zeitlimit mit fünf enthaltenen Wortlisten.', practiceBoardLabel: 'Lokales Trainingsbrett',
    daily: 'Täglich', dailyDetail: 'Ein offizielles Wort für alle in deiner gewählten Spielsprache. Sechs Versuche, ohne Zeitlimit.',
    dailyUnavailableTitle: 'Das heutige Wort ist noch nicht bereit.',
    dailyUnavailableDetail: 'Verbinde dich einmal, um das offizielle Wort des Tages zu holen, und beende die Runde auf diesem Gerät.',
    dailyFairTitle: 'Jeden Tag ein faires Wort',
    dailyFairDetail: 'Die tägliche Herausforderung startet erst, wenn das gemeinsame Wort bereit ist. Sie ersetzt es nie durch ein anderes Wort vom Gerät.',
    backHome: 'Zurück zum Start',
    gameLanguage: 'Spielsprache', gameSettings: 'Spieleinstellungen', aviBriefTitle: 'Avi kennt die Regeln', aviBriefDetail: 'Lerne die Tintenmarkierungen, vergleiche Modi oder starte ein faires lokales Duell.',
    aviTitle: 'Dein Begleiter im Wortduell', aviDetail: 'Ich erkläre das Spiel und kann dein lokaler Gegner sein. Hinweise gebe ich nie.',
    aviRulesTitle: 'Lies die Tinte', aviRulesDetail: 'Exakt bedeutet richtiger Buchstabe und richtige Stelle. Vorhanden heißt: andere Stelle. Raus heißt: nicht im Wort.',
    aviModesTitle: 'Wähle den passenden Modus', aviModesDetail: 'Training läuft ohne Zeitlimit, Gegen Avi folgt dem Duellrhythmus und Herausforderung synchronisiert zwei Spieler.',
    aviAccountTitle: 'Erst Gast, Konto wenn nützlich', aviAccountDetail: 'Spiele lokal als Gast. Melde dich an, wenn du DuelWords Pro auf deinen Geräten nutzen möchtest.',
    openPractice: 'Training öffnen', openSettings: 'Einstellungen öffnen', onboardingSkip: 'Überspringen', onboardingContinue: 'Weiter',
    onboardingCreate: 'Konto erstellen', onboardingSignIn: 'Anmelden', onboardingGuest: 'Als Gast fortfahren',
    accountSignInFailed: 'Account AV konnte die Anmeldung nicht abschließen. Versuche es erneut.',
    rivalsPrivacyPills: ['Private Einladungen', 'Keine Kontaktimporte', 'Keine öffentlichen Profile', 'Kein genauer Status'],
    onboardingPages: [
      { eyebrow: 'DuelWords AV', title: 'Wörter, Kopf an Kopf.', detail: 'Ein warmes Spiel aus Papier und Tinte für faire Live-Duelle.' },
      { eyebrow: 'Das ist Avi', title: 'Lerne den Rhythmus mit Avi.', detail: 'Avi erklärt jede Markierung und kann dein verlässlicher lokaler Gegner sein.' },
      { eyebrow: 'Du entscheidest', title: 'Jetzt starten. Später mehr behalten.', detail: 'Spiele als Gast oder melde dich an, um Pro auf deinen Geräten zu nutzen. Spielverlauf und Rivalen bleiben auf diesem Gerät.' },
    ],
  },
};

export function experienceCopy(locale: InterfaceLocale): ExperienceCopy {
  return translations[locale];
}
