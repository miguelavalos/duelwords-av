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
  challenge: string;
  challengeDetail: string;
  playAvi: string;
  playAviDetail: string;
  practice: string;
  practiceDetail: string;
  daily: string;
  dailyDetail: string;
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
  onboardingPages: readonly { eyebrow: string; title: string; detail: string }[];
};

const en: ExperienceCopy = {
  home: 'Home', homeTitle: 'Word duels with friends.', homeDetail: 'Warm up locally, play Avi, or share a live challenge.',
  rivals: 'Rivals', stats: 'Stats', avi: 'Avi', account: 'Account', settings: 'Settings',
  challenge: 'Challenge a Friend', challengeDetail: 'Create a private room, share the invite, and solve the same word round by round.',
  playAvi: 'Play Avi', playAviDetail: 'A complete local duel against Avi. No account or connection needed.',
  practice: 'Practice', practiceDetail: 'Untimed local rounds using the bundled word list.',
  daily: 'Daily', dailyDetail: 'The only mode that will fetch its official word from the server. Not available yet.',
  gameLanguage: 'Game language', gameSettings: 'Game settings', aviBriefTitle: 'Avi has the rules covered', aviBriefDetail: 'Learn the ink marks, compare modes, or start a fair local duel.',
  aviTitle: 'Your word-duel companion', aviDetail: 'I can explain the game and play as your local rival. I never give hints.',
  aviRulesTitle: 'Read the ink', aviRulesDetail: 'Exact means right letter and place. Present means the letter belongs elsewhere. Out means it is not in the word.',
  aviModesTitle: 'Pick the right mode', aviModesDetail: 'Practice is untimed, Play Avi follows duel rhythm, and Challenge a Friend is synchronized online.',
  aviAccountTitle: 'Guest first, account when useful', aviAccountDetail: 'Play locally as a guest. Account AV adds durable continuity, rivals, and Pro access.',
  openPractice: 'Open practice', openSettings: 'Open settings', onboardingSkip: 'Skip', onboardingContinue: 'Continue',
  onboardingCreate: 'Create account', onboardingSignIn: 'Sign in', onboardingGuest: 'Continue as guest',
  accountSignInFailed: 'Account AV could not complete sign-in. Please try again.',
  onboardingPages: [
    { eyebrow: 'DuelWords AV', title: 'Words, written head to head.', detail: 'A warm paper-and-ink word game built around fair live duels.' },
    { eyebrow: 'Meet Avi', title: 'Learn the rhythm with Avi.', detail: 'Avi explains every mark and can be your deterministic local opponent.' },
    { eyebrow: 'Your choice', title: 'Start now. Keep more later.', detail: 'Skip straight to guest play, or use Account AV for durable continuity and Pro.' },
  ],
};

const es: ExperienceCopy = {
  home: 'Inicio', homeTitle: 'Duelos de palabras con amigos.', homeDetail: 'Practica en local, juega con Avi o comparte un reto en directo.',
  rivals: 'Rivales', stats: 'Estadísticas', avi: 'Avi', account: 'Cuenta', settings: 'Ajustes',
  challenge: 'Retar a alguien', challengeDetail: 'Crea una sala privada, comparte la invitación y resolved la misma palabra ronda a ronda.',
  playAvi: 'Jugar con Avi', playAviDetail: 'Un duelo local completo contra Avi. Sin cuenta ni conexión.',
  practice: 'Práctica', practiceDetail: 'Rondas locales sin tiempo con la lista incluida.',
  daily: 'Diario', dailyDetail: 'El único modo que obtendrá su palabra oficial del servidor. Aún no está activo.',
  gameLanguage: 'Idioma de juego', gameSettings: 'Ajustes de partida', aviBriefTitle: 'Avi conoce las reglas', aviBriefDetail: 'Aprende las marcas de tinta, compara modos o empieza un duelo local justo.',
  aviTitle: 'Tu compañero de duelos', aviDetail: 'Puedo explicar el juego y ser tu rival local. Nunca doy pistas.',
  aviRulesTitle: 'Lee la tinta', aviRulesDetail: 'Exacta es letra y posición correctas. Presente significa que va en otro lugar. Fuera indica que no aparece.',
  aviModesTitle: 'Elige el modo adecuado', aviModesDetail: 'Práctica no tiene tiempo, Jugar con Avi sigue el ritmo de duelo y Retar sincroniza a dos jugadores.',
  aviAccountTitle: 'Primero invitado, cuenta cuando aporte', aviAccountDetail: 'Juega en local como invitado. Account AV añade continuidad, rivales y acceso Pro.',
  openPractice: 'Abrir práctica', openSettings: 'Abrir ajustes', onboardingSkip: 'Omitir', onboardingContinue: 'Continuar',
  onboardingCreate: 'Crear cuenta', onboardingSignIn: 'Iniciar sesión', onboardingGuest: 'Continuar como invitado',
  accountSignInFailed: 'Account AV no ha podido completar el inicio de sesión. Inténtalo de nuevo.',
  onboardingPages: [
    { eyebrow: 'DuelWords AV', title: 'Palabras, frente a frente.', detail: 'Un juego cálido de papel y tinta centrado en duelos en directo justos.' },
    { eyebrow: 'Conoce a Avi', title: 'Aprende el ritmo con Avi.', detail: 'Avi explica cada marca y puede ser tu rival local determinista.' },
    { eyebrow: 'Tú eliges', title: 'Empieza ya. Conserva más después.', detail: 'Entra como invitado o usa Account AV para continuidad y Pro.' },
  ],
};

const translations: Record<InterfaceLocale, ExperienceCopy> = {
  en,
  es,
  ca: {
    home: 'Inici', homeTitle: 'Duels de paraules amb amics.', homeDetail: 'Practica en local, juga amb l’Avi o comparteix un repte en directe.',
    rivals: 'Rivals', stats: 'Estadístiques', avi: 'Avi', account: 'Compte', settings: 'Ajustos',
    challenge: 'Reptar algú', challengeDetail: 'Crea una sala privada, comparteix la invitació i resoleu la mateixa paraula ronda a ronda.',
    playAvi: 'Jugar amb l’Avi', playAviDetail: 'Un duel local complet contra l’Avi. Sense compte ni connexió.',
    practice: 'Pràctica', practiceDetail: 'Rondes locals sense temps amb la llista inclosa.',
    daily: 'Diari', dailyDetail: 'L’únic mode que obtindrà la paraula oficial del servidor. Encara no està actiu.',
    gameLanguage: 'Idioma de joc', gameSettings: 'Ajustos de partida', aviBriefTitle: 'L’Avi coneix les regles', aviBriefDetail: 'Aprèn les marques de tinta, compara modes o comença un duel local just.',
    aviTitle: 'El teu company de duels', aviDetail: 'Puc explicar el joc i ser el teu rival local. Mai no dono pistes.',
    aviRulesTitle: 'Llegeix la tinta', aviRulesDetail: 'Exacta vol dir lletra i posició correctes. Present indica que va en un altre lloc. Fora vol dir que no hi és.',
    aviModesTitle: 'Tria el mode adequat', aviModesDetail: 'Pràctica no té temps, Jugar amb l’Avi segueix el ritme de duel i Reptar sincronitza dos jugadors.',
    aviAccountTitle: 'Primer convidat, compte quan aporti', aviAccountDetail: 'Juga en local com a convidat. Account AV afegeix continuïtat, rivals i accés Pro.',
    openPractice: 'Obrir pràctica', openSettings: 'Obrir ajustos', onboardingSkip: 'Ometre', onboardingContinue: 'Continuar',
    onboardingCreate: 'Crear compte', onboardingSignIn: 'Iniciar sessió', onboardingGuest: 'Continuar com a convidat',
    accountSignInFailed: 'Account AV no ha pogut completar l’inici de sessió. Torna-ho a provar.',
    onboardingPages: [
      { eyebrow: 'DuelWords AV', title: 'Paraules, cara a cara.', detail: 'Un joc càlid de paper i tinta centrat en duels en directe justos.' },
      { eyebrow: 'Coneix l’Avi', title: 'Aprèn el ritme amb l’Avi.', detail: 'L’Avi explica cada marca i pot ser el teu rival local determinista.' },
      { eyebrow: 'Tu tries', title: 'Comença ara. Conserva més després.', detail: 'Entra com a convidat o usa Account AV per tenir continuïtat i Pro.' },
    ],
  },
  fr: {
    home: 'Accueil', homeTitle: 'Des duels de mots entre amis.', homeDetail: 'Entraînez-vous hors ligne, jouez contre Avi ou partagez un défi en direct.',
    rivals: 'Rivaux', stats: 'Statistiques', avi: 'Avi', account: 'Compte', settings: 'Réglages',
    challenge: 'Défier un ami', challengeDetail: 'Créez une salle privée, partagez l’invitation et résolvez le même mot tour après tour.',
    playAvi: 'Jouer contre Avi', playAviDetail: 'Un duel local complet contre Avi. Aucun compte ni connexion requis.',
    practice: 'Entraînement', practiceDetail: 'Parties locales sans chronomètre avec la liste intégrée.',
    daily: 'Quotidien', dailyDetail: 'Le seul mode qui recevra son mot officiel du serveur. Pas encore disponible.',
    gameLanguage: 'Langue du jeu', gameSettings: 'Réglages de la partie', aviBriefTitle: 'Avi connaît les règles', aviBriefDetail: 'Découvrez les marques d’encre, comparez les modes ou lancez un duel local équitable.',
    aviTitle: 'Votre compagnon de duel', aviDetail: 'Je peux expliquer le jeu et devenir votre rival local. Je ne donne jamais d’indice.',
    aviRulesTitle: 'Lisez l’encre', aviRulesDetail: 'Exact signifie bonne lettre et bonne place. Présent indique une autre place. Absent signifie que la lettre n’est pas dans le mot.',
    aviModesTitle: 'Choisissez le bon mode', aviModesDetail: 'Entraînement est sans chrono, Jouer contre Avi suit le rythme d’un duel et Défier synchronise deux joueurs.',
    aviAccountTitle: 'Invité d’abord, compte si utile', aviAccountDetail: 'Jouez hors ligne en invité. Account AV ajoute continuité, rivaux et accès Pro.',
    openPractice: 'Ouvrir l’entraînement', openSettings: 'Ouvrir les réglages', onboardingSkip: 'Passer', onboardingContinue: 'Continuer',
    onboardingCreate: 'Créer un compte', onboardingSignIn: 'Se connecter', onboardingGuest: 'Continuer comme invité',
    accountSignInFailed: 'Account AV n’a pas pu terminer la connexion. Réessayez.',
    onboardingPages: [
      { eyebrow: 'DuelWords AV', title: 'Les mots, face à face.', detail: 'Un jeu chaleureux de papier et d’encre, pensé pour des duels en direct équitables.' },
      { eyebrow: 'Voici Avi', title: 'Apprenez le rythme avec Avi.', detail: 'Avi explique chaque marque et peut devenir votre rival local déterministe.' },
      { eyebrow: 'À vous de choisir', title: 'Commencez maintenant. Gardez plus ensuite.', detail: 'Jouez en invité ou utilisez Account AV pour la continuité et Pro.' },
    ],
  },
  de: {
    home: 'Start', homeTitle: 'Wortduelle mit Freunden.', homeDetail: 'Übe offline, spiele gegen Avi oder teile eine Live-Herausforderung.',
    rivals: 'Rivalen', stats: 'Statistik', avi: 'Avi', account: 'Konto', settings: 'Einstellungen',
    challenge: 'Freund herausfordern', challengeDetail: 'Erstelle einen privaten Raum, teile die Einladung und löst Runde für Runde dasselbe Wort.',
    playAvi: 'Gegen Avi spielen', playAviDetail: 'Ein vollständiges lokales Duell gegen Avi. Kein Konto und keine Verbindung nötig.',
    practice: 'Training', practiceDetail: 'Lokale Runden ohne Zeitlimit mit der enthaltenen Wortliste.',
    daily: 'Täglich', dailyDetail: 'Der einzige Modus, der sein offizielles Wort vom Server erhält. Noch nicht aktiv.',
    gameLanguage: 'Spielsprache', gameSettings: 'Spieleinstellungen', aviBriefTitle: 'Avi kennt die Regeln', aviBriefDetail: 'Lerne die Tintenmarkierungen, vergleiche Modi oder starte ein faires lokales Duell.',
    aviTitle: 'Dein Begleiter im Wortduell', aviDetail: 'Ich erkläre das Spiel und kann dein lokaler Gegner sein. Hinweise gebe ich nie.',
    aviRulesTitle: 'Lies die Tinte', aviRulesDetail: 'Exakt bedeutet richtiger Buchstabe und richtige Stelle. Vorhanden heißt: andere Stelle. Raus heißt: nicht im Wort.',
    aviModesTitle: 'Wähle den passenden Modus', aviModesDetail: 'Training läuft ohne Zeitlimit, Gegen Avi folgt dem Duellrhythmus und Herausforderung synchronisiert zwei Spieler.',
    aviAccountTitle: 'Erst Gast, Konto wenn nützlich', aviAccountDetail: 'Spiele lokal als Gast. Account AV ergänzt dauerhaften Verlauf, Rivalen und Pro-Zugang.',
    openPractice: 'Training öffnen', openSettings: 'Einstellungen öffnen', onboardingSkip: 'Überspringen', onboardingContinue: 'Weiter',
    onboardingCreate: 'Konto erstellen', onboardingSignIn: 'Anmelden', onboardingGuest: 'Als Gast fortfahren',
    accountSignInFailed: 'Account AV konnte die Anmeldung nicht abschließen. Versuche es erneut.',
    onboardingPages: [
      { eyebrow: 'DuelWords AV', title: 'Wörter, Kopf an Kopf.', detail: 'Ein warmes Spiel aus Papier und Tinte für faire Live-Duelle.' },
      { eyebrow: 'Das ist Avi', title: 'Lerne den Rhythmus mit Avi.', detail: 'Avi erklärt jede Markierung und kann dein deterministischer lokaler Gegner sein.' },
      { eyebrow: 'Du entscheidest', title: 'Jetzt starten. Später mehr behalten.', detail: 'Spiele als Gast oder nutze Account AV für Kontinuität und Pro.' },
    ],
  },
};

export function experienceCopy(locale: InterfaceLocale): ExperienceCopy {
  return translations[locale];
}
