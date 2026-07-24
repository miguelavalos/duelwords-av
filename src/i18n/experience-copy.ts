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
  onboardingPages: readonly { eyebrow: string; title: string; detail: string }[];
};

const en: ExperienceCopy = {
  home: 'Home', homeTitle: 'Word duels with friends.', homeDetail: 'Choose a language, warm up locally, or share a live challenge.',
  rivals: 'Rivals', stats: 'Stats', avi: 'Avi', account: 'Account', settings: 'Settings',
  challenge: 'Challenge a Friend', challengeDetail: 'Create a private room, share the invite, and solve the same word round by round.',
  playAvi: 'Play Avi', playAviDetail: 'A complete local duel against Avi. No account or connection needed.',
  practice: 'Practice', practiceDetail: 'Untimed local rounds using the bundled word list.',
  daily: 'Daily', dailyDetail: 'The only mode that will fetch its official word from the server. Not active in this build.',
  gameLanguage: 'Game language', aviBriefTitle: 'Avi has the rules covered', aviBriefDetail: 'Learn the ink marks, compare modes, or start a fair local duel.',
  aviTitle: 'Your word-duel companion', aviDetail: 'I can explain the game and play as your local rival. I never give hints.',
  aviRulesTitle: 'Read the ink', aviRulesDetail: 'Exact means right letter and place. Present means the letter belongs elsewhere. Out means it is not in the word.',
  aviModesTitle: 'Pick the right mode', aviModesDetail: 'Practice is untimed, Play Avi follows duel rhythm, and Challenge a Friend is synchronized online.',
  aviAccountTitle: 'Guest first, account when useful', aviAccountDetail: 'Play locally as a guest. Account AV adds durable continuity, rivals, and Pro access.',
  openPractice: 'Open practice', openSettings: 'Open settings', onboardingSkip: 'Skip', onboardingContinue: 'Continue',
  onboardingCreate: 'Create account', onboardingSignIn: 'Sign in', onboardingGuest: 'Continue as guest',
  onboardingPages: [
    { eyebrow: 'DuelWords AV', title: 'Words, written head to head.', detail: 'A warm paper-and-ink word game built around fair live duels.' },
    { eyebrow: 'Meet Avi', title: 'Learn the rhythm with Avi.', detail: 'Avi explains every mark and can be your deterministic local opponent.' },
    { eyebrow: 'Your choice', title: 'Start now. Keep more later.', detail: 'Skip straight to guest play, or use Account AV for durable continuity and Pro.' },
  ],
};

const es: ExperienceCopy = {
  home: 'Inicio', homeTitle: 'Duelos de palabras con amigos.', homeDetail: 'Elige idioma, practica en local o comparte un reto en directo.',
  rivals: 'Rivales', stats: 'Estadísticas', avi: 'Avi', account: 'Cuenta', settings: 'Ajustes',
  challenge: 'Retar a alguien', challengeDetail: 'Crea una sala privada, comparte la invitación y resolved la misma palabra ronda a ronda.',
  playAvi: 'Jugar con Avi', playAviDetail: 'Un duelo local completo contra Avi. Sin cuenta ni conexión.',
  practice: 'Práctica', practiceDetail: 'Rondas locales sin tiempo con la lista incluida.',
  daily: 'Diario', dailyDetail: 'El único modo que obtendrá su palabra oficial del servidor. Aún no está activo.',
  gameLanguage: 'Idioma de juego', aviBriefTitle: 'Avi conoce las reglas', aviBriefDetail: 'Aprende las marcas de tinta, compara modos o empieza un duelo local justo.',
  aviTitle: 'Tu compañero de duelos', aviDetail: 'Puedo explicar el juego y ser tu rival local. Nunca doy pistas.',
  aviRulesTitle: 'Lee la tinta', aviRulesDetail: 'Exacta es letra y posición correctas. Presente significa que va en otro lugar. Fuera indica que no aparece.',
  aviModesTitle: 'Elige el modo adecuado', aviModesDetail: 'Práctica no tiene tiempo, Jugar con Avi sigue el ritmo de duelo y Retar sincroniza a dos jugadores.',
  aviAccountTitle: 'Primero invitado, cuenta cuando aporte', aviAccountDetail: 'Juega en local como invitado. Account AV añade continuidad, rivales y acceso Pro.',
  openPractice: 'Abrir práctica', openSettings: 'Abrir ajustes', onboardingSkip: 'Omitir', onboardingContinue: 'Continuar',
  onboardingCreate: 'Crear cuenta', onboardingSignIn: 'Iniciar sesión', onboardingGuest: 'Continuar como invitado',
  onboardingPages: [
    { eyebrow: 'DuelWords AV', title: 'Palabras, frente a frente.', detail: 'Un juego cálido de papel y tinta centrado en duelos en directo justos.' },
    { eyebrow: 'Conoce a Avi', title: 'Aprende el ritmo con Avi.', detail: 'Avi explica cada marca y puede ser tu rival local determinista.' },
    { eyebrow: 'Tú eliges', title: 'Empieza ya. Conserva más después.', detail: 'Entra como invitado o usa Account AV para continuidad y Pro.' },
  ],
};

const translations: Record<InterfaceLocale, ExperienceCopy> = {
  en,
  es,
  ca: { ...en, home: 'Inici', rivals: 'Rivals', stats: 'Estadístiques', settings: 'Ajustos', challenge: 'Reptar algú', practice: 'Pràctica', daily: 'Diari', onboardingSkip: 'Ometre', onboardingContinue: 'Continuar', onboardingCreate: 'Crear compte', onboardingSignIn: 'Iniciar sessió', onboardingGuest: 'Continuar com a convidat' },
  fr: { ...en, home: 'Accueil', rivals: 'Rivaux', stats: 'Statistiques', settings: 'Réglages', challenge: 'Défier un ami', practice: 'Entraînement', daily: 'Quotidien', onboardingSkip: 'Passer', onboardingContinue: 'Continuer', onboardingCreate: 'Créer un compte', onboardingSignIn: 'Se connecter', onboardingGuest: 'Continuer comme invité' },
  de: { ...en, home: 'Start', rivals: 'Rivalen', stats: 'Statistik', settings: 'Einstellungen', challenge: 'Freund fordern', practice: 'Training', daily: 'Täglich', onboardingSkip: 'Überspringen', onboardingContinue: 'Weiter', onboardingCreate: 'Konto erstellen', onboardingSignIn: 'Anmelden', onboardingGuest: 'Als Gast fortfahren' },
};

export function experienceCopy(locale: InterfaceLocale): ExperienceCopy {
  return translations[locale];
}
