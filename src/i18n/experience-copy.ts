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
  rivalsTitleSignedIn: string;
  rivalsTitleGuest: string;
  rivalsDetailSignedIn: string;
  rivalsDetailGuest: string;
  rivalsEmptyTitleSignedIn: string;
  rivalsEmptyTitleGuest: string;
  rivalsEmptyDetailSignedIn: string;
  rivalsEmptyDetailGuest: string;
  rivalsSignIn: string;
  rivalsPrivacyTitle: string;
  rivalsPrivacyDetail: string;
  rivalsPrivacyPills: readonly string[];
  statsTitle: string;
  statsDetail: string;
  statsPracticeTitle: string;
  statsPracticeDetail: string;
  statsPrivacyTitle: string;
  statsPrivacyDetail: string;
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
  aviAccountTitle: 'Guest first, account when useful', aviAccountDetail: 'Play locally as a guest. Account AV can keep progress across devices, remember rivals, and add Pro access.',
  openPractice: 'Open practice', openSettings: 'Open settings', onboardingSkip: 'Skip', onboardingContinue: 'Continue',
  onboardingCreate: 'Create account', onboardingSignIn: 'Sign in', onboardingGuest: 'Continue as guest',
  accountSignInFailed: 'Account AV could not complete sign-in. Please try again.',
  rivalsTitleSignedIn: 'Ready for another duel.', rivalsTitleGuest: 'Play privately with people you choose.',
  rivalsDetailSignedIn: 'Recent rivals will appear here when saved rival history is available.', rivalsDetailGuest: 'Private invites work without an account. Sign in later if you want to keep rivals and rematches.',
  rivalsEmptyTitleSignedIn: 'No saved rivals yet', rivalsEmptyTitleGuest: 'Challenge someone you know',
  rivalsEmptyDetailSignedIn: 'Start a private challenge now. Rival history will appear here when it becomes available.', rivalsEmptyDetailGuest: 'Share a private invite. DuelWords does not search contacts or publish profiles.',
  rivalsSignIn: 'Sign in to keep rivals', rivalsPrivacyTitle: 'Private by design',
  rivalsPrivacyDetail: 'DuelWords does not import contacts, publish profiles, offer profile search, or reveal exact online status.',
  rivalsPrivacyPills: ['Private invites', 'No contact imports', 'No public profiles', 'No exact status'],
  statsTitle: 'Stats are coming later.', statsDetail: 'Practice, Play Avi, Daily, and friend duels will stay clearly separated.',
  statsPracticeTitle: 'Keep playing now', statsPracticeDetail: 'Practice and Play Avi are ready offline. Your current games are not added to a hidden score.',
  statsPrivacyTitle: 'Built for privacy', statsPrivacyDetail: 'Only finished summaries will count. Full boards and private words will not become a public profile.',
  onboardingPages: [
    { eyebrow: 'DuelWords AV', title: 'Words, written head to head.', detail: 'A warm paper-and-ink word game built around fair live duels.' },
    { eyebrow: 'Meet Avi', title: 'Learn the rhythm with Avi.', detail: 'Avi explains every mark and can be your consistent local opponent.' },
    { eyebrow: 'Your choice', title: 'Start now. Keep more later.', detail: 'Continue as a guest, or use Account AV to keep progress and Pro access across devices.' },
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
  aviAccountTitle: 'Primero invitado, cuenta cuando aporte', aviAccountDetail: 'Juega en local como invitado. Account AV añade continuidad, rivales y acceso Pro.',
  openPractice: 'Abrir práctica', openSettings: 'Abrir ajustes', onboardingSkip: 'Omitir', onboardingContinue: 'Continuar',
  onboardingCreate: 'Crear cuenta', onboardingSignIn: 'Iniciar sesión', onboardingGuest: 'Continuar como invitado',
    accountSignInFailed: 'Account AV no ha podido completar el inicio de sesión. Inténtalo de nuevo.',
  rivalsTitleSignedIn: 'Todo listo para otro duelo.', rivalsTitleGuest: 'Juega en privado con quien tú elijas.',
  rivalsDetailSignedIn: 'Tus rivales recientes aparecerán aquí cuando esté disponible el historial guardado.', rivalsDetailGuest: 'Las invitaciones privadas funcionan sin cuenta. Inicia sesión más adelante si quieres conservar rivales y revanchas.',
  rivalsEmptyTitleSignedIn: 'Todavía no hay rivales guardados', rivalsEmptyTitleGuest: 'Reta a alguien que conoces',
  rivalsEmptyDetailSignedIn: 'Empieza ahora un reto privado. El historial de rivales aparecerá aquí cuando esté disponible.', rivalsEmptyDetailGuest: 'Comparte una invitación privada. DuelWords no busca contactos ni publica perfiles.',
  rivalsSignIn: 'Iniciar sesión para conservar rivales', rivalsPrivacyTitle: 'Privado por diseño',
  rivalsPrivacyDetail: 'DuelWords no importa contactos, publica perfiles, permite buscar personas ni muestra el estado exacto de conexión.',
  rivalsPrivacyPills: ['Invitaciones privadas', 'Sin importar contactos', 'Sin perfiles públicos', 'Sin estado exacto'],
  statsTitle: 'Las estadísticas llegarán más adelante.', statsDetail: 'Práctica, Jugar con Avi, Diario y los duelos con amigos se mantendrán claramente separados.',
  statsPracticeTitle: 'Sigue jugando ahora', statsPracticeDetail: 'Práctica y Jugar con Avi funcionan sin conexión. Tus partidas actuales no se añaden a una puntuación oculta.',
    statsPrivacyTitle: 'Pensado para tu privacidad', statsPrivacyDetail: 'Solo contarán resúmenes terminados. Los tableros completos y las palabras privadas no formarán un perfil público.',
    onboardingPages: [
      { eyebrow: 'DuelWords AV', title: 'Palabras, frente a frente.', detail: 'Un juego cálido de papel y tinta centrado en duelos en directo justos.' },
      { eyebrow: 'Conoce a Avi', title: 'Aprende el ritmo con Avi.', detail: 'Avi explica cada marca y puede ser tu rival local constante.' },
    { eyebrow: 'Tú eliges', title: 'Empieza ya. Conserva más después.', detail: 'Continúa como invitado o usa Account AV para conservar el progreso y el acceso Pro en tus dispositivos.' },
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
    aviAccountTitle: 'Primer convidat, compte quan aporti', aviAccountDetail: 'Juga en local com a convidat. Account AV afegeix continuïtat, rivals i accés Pro.',
    openPractice: 'Obrir pràctica', openSettings: 'Obrir ajustos', onboardingSkip: 'Ometre', onboardingContinue: 'Continuar',
    onboardingCreate: 'Crear compte', onboardingSignIn: 'Iniciar sessió', onboardingGuest: 'Continuar com a convidat',
    accountSignInFailed: 'Account AV no ha pogut completar l’inici de sessió. Torna-ho a provar.',
    rivalsTitleSignedIn: 'Tot a punt per a un altre duel.', rivalsTitleGuest: 'Juga en privat amb qui tu triïs.',
    rivalsDetailSignedIn: 'Els rivals recents apareixeran aquí quan estigui disponible l’historial desat.', rivalsDetailGuest: 'Les invitacions privades funcionen sense compte. Inicia sessió més endavant si vols conservar rivals i revenges.',
    rivalsEmptyTitleSignedIn: 'Encara no hi ha rivals desats', rivalsEmptyTitleGuest: 'Repta algú que coneixes',
    rivalsEmptyDetailSignedIn: 'Comença ara un repte privat. L’historial de rivals apareixerà aquí quan estigui disponible.', rivalsEmptyDetailGuest: 'Comparteix una invitació privada. DuelWords no cerca contactes ni publica perfils.',
    rivalsSignIn: 'Iniciar sessió per conservar rivals', rivalsPrivacyTitle: 'Privat per disseny',
    rivalsPrivacyDetail: 'DuelWords no importa contactes, publica perfils, permet cercar persones ni mostra l’estat exacte de connexió.',
    rivalsPrivacyPills: ['Invitacions privades', 'Sense importar contactes', 'Sense perfils públics', 'Sense estat exacte'],
    statsTitle: 'Les estadístiques arribaran més endavant.', statsDetail: 'Pràctica, Jugar amb l’Avi, Diari i els duels amb amics es mantindran clarament separats.',
    statsPracticeTitle: 'Continua jugant ara', statsPracticeDetail: 'Pràctica i Jugar amb l’Avi funcionen sense connexió. Les partides actuals no s’afegeixen a una puntuació oculta.',
    statsPrivacyTitle: 'Pensat per a la privacitat', statsPrivacyDetail: 'Només comptaran resums acabats. Els taulers complets i les paraules privades no formaran cap perfil públic.',
    onboardingPages: [
      { eyebrow: 'DuelWords AV', title: 'Paraules, cara a cara.', detail: 'Un joc càlid de paper i tinta centrat en duels en directe justos.' },
      { eyebrow: 'Coneix l’Avi', title: 'Aprèn el ritme amb l’Avi.', detail: 'L’Avi explica cada marca i pot ser el teu rival local constant.' },
      { eyebrow: 'Tu tries', title: 'Comença ara. Conserva més després.', detail: 'Continua com a convidat o usa Account AV per conservar el progrés i l’accés Pro als teus dispositius.' },
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
    aviAccountTitle: 'Invité d’abord, compte si utile', aviAccountDetail: 'Jouez hors ligne en invité. Account AV ajoute continuité, rivaux et accès Pro.',
    openPractice: 'Ouvrir l’entraînement', openSettings: 'Ouvrir les réglages', onboardingSkip: 'Passer', onboardingContinue: 'Continuer',
    onboardingCreate: 'Créer un compte', onboardingSignIn: 'Se connecter', onboardingGuest: 'Continuer comme invité',
    accountSignInFailed: 'Account AV n’a pas pu terminer la connexion. Réessayez.',
    rivalsTitleSignedIn: 'Prêt pour un nouveau duel.', rivalsTitleGuest: 'Jouez en privé avec les personnes de votre choix.',
    rivalsDetailSignedIn: 'Vos rivaux récents apparaîtront ici lorsque l’historique enregistré sera disponible.', rivalsDetailGuest: 'Les invitations privées fonctionnent sans compte. Connectez-vous plus tard pour conserver rivaux et revanches.',
    rivalsEmptyTitleSignedIn: 'Aucun rival enregistré', rivalsEmptyTitleGuest: 'Défiez une personne que vous connaissez',
    rivalsEmptyDetailSignedIn: 'Lancez maintenant un défi privé. L’historique des rivaux apparaîtra ici lorsqu’il sera disponible.', rivalsEmptyDetailGuest: 'Partagez une invitation privée. DuelWords ne recherche pas vos contacts et ne publie aucun profil.',
    rivalsSignIn: 'Se connecter pour conserver ses rivaux', rivalsPrivacyTitle: 'Privé par conception',
    rivalsPrivacyDetail: 'DuelWords n’importe pas vos contacts, ne publie pas de profils, ne permet pas la recherche de personnes et ne révèle pas leur statut exact.',
    rivalsPrivacyPills: ['Invitations privées', 'Aucun contact importé', 'Aucun profil public', 'Aucun statut exact'],
    statsTitle: 'Les statistiques arriveront plus tard.', statsDetail: 'Entraînement, Jouer contre Avi, Quotidien et les duels entre amis resteront clairement séparés.',
    statsPracticeTitle: 'Continuez à jouer maintenant', statsPracticeDetail: 'Entraînement et Jouer contre Avi fonctionnent hors ligne. Vos parties actuelles ne sont ajoutées à aucun score caché.',
    statsPrivacyTitle: 'Pensé pour la confidentialité', statsPrivacyDetail: 'Seuls les résumés terminés compteront. Les grilles complètes et les mots privés ne formeront pas un profil public.',
    onboardingPages: [
      { eyebrow: 'DuelWords AV', title: 'Les mots, face à face.', detail: 'Un jeu chaleureux de papier et d’encre, pensé pour des duels en direct équitables.' },
      { eyebrow: 'Voici Avi', title: 'Apprenez le rythme avec Avi.', detail: 'Avi explique chaque marque et peut devenir votre rival local régulier.' },
      { eyebrow: 'À vous de choisir', title: 'Commencez maintenant. Gardez plus ensuite.', detail: 'Jouez en invité ou utilisez Account AV pour conserver votre progression et votre accès Pro sur vos appareils.' },
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
    aviAccountTitle: 'Erst Gast, Konto wenn nützlich', aviAccountDetail: 'Spiele lokal als Gast. Account AV ergänzt dauerhaften Verlauf, Rivalen und Pro-Zugang.',
    openPractice: 'Training öffnen', openSettings: 'Einstellungen öffnen', onboardingSkip: 'Überspringen', onboardingContinue: 'Weiter',
    onboardingCreate: 'Konto erstellen', onboardingSignIn: 'Anmelden', onboardingGuest: 'Als Gast fortfahren',
    accountSignInFailed: 'Account AV konnte die Anmeldung nicht abschließen. Versuche es erneut.',
    rivalsTitleSignedIn: 'Bereit für das nächste Duell.', rivalsTitleGuest: 'Spiele privat mit Menschen deiner Wahl.',
    rivalsDetailSignedIn: 'Deine letzten Rivalen erscheinen hier, sobald der gespeicherte Verlauf verfügbar ist.', rivalsDetailGuest: 'Private Einladungen funktionieren ohne Konto. Melde dich später an, um Rivalen und Revanches zu behalten.',
    rivalsEmptyTitleSignedIn: 'Noch keine Rivalen gespeichert', rivalsEmptyTitleGuest: 'Fordere jemanden heraus, den du kennst',
    rivalsEmptyDetailSignedIn: 'Starte jetzt eine private Herausforderung. Der Rivalenverlauf erscheint hier, sobald er verfügbar ist.', rivalsEmptyDetailGuest: 'Teile eine private Einladung. DuelWords durchsucht keine Kontakte und veröffentlicht keine Profile.',
    rivalsSignIn: 'Anmelden, um Rivalen zu behalten', rivalsPrivacyTitle: 'Von Grund auf privat',
    rivalsPrivacyDetail: 'DuelWords importiert keine Kontakte, veröffentlicht keine Profile, bietet keine Personensuche und zeigt keinen genauen Onlinestatus.',
    rivalsPrivacyPills: ['Private Einladungen', 'Keine Kontaktimporte', 'Keine öffentlichen Profile', 'Kein genauer Status'],
    statsTitle: 'Statistiken kommen später.', statsDetail: 'Training, Gegen Avi, Täglich und Duelle mit Freunden bleiben klar voneinander getrennt.',
    statsPracticeTitle: 'Jetzt weiterspielen', statsPracticeDetail: 'Training und Gegen Avi funktionieren offline. Deine aktuellen Spiele fließen nicht in eine versteckte Wertung ein.',
    statsPrivacyTitle: 'Für Privatsphäre gemacht', statsPrivacyDetail: 'Nur abgeschlossene Zusammenfassungen werden zählen. Vollständige Bretter und private Wörter werden kein öffentliches Profil bilden.',
    onboardingPages: [
      { eyebrow: 'DuelWords AV', title: 'Wörter, Kopf an Kopf.', detail: 'Ein warmes Spiel aus Papier und Tinte für faire Live-Duelle.' },
      { eyebrow: 'Das ist Avi', title: 'Lerne den Rhythmus mit Avi.', detail: 'Avi erklärt jede Markierung und kann dein verlässlicher lokaler Gegner sein.' },
      { eyebrow: 'Du entscheidest', title: 'Jetzt starten. Später mehr behalten.', detail: 'Spiele als Gast oder nutze Account AV, um Fortschritt und Pro-Zugang auf deinen Geräten zu behalten.' },
    ],
  },
};

export function experienceCopy(locale: InterfaceLocale): ExperienceCopy {
  return translations[locale];
}
