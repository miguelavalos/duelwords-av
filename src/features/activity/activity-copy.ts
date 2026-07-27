import type { DuelWordsActivityMode, DuelWordsActivityOutcome } from '@/game/activity/device-activity-store';
import type { InterfaceLocale } from '@/i18n/locales';

type ActivityCopy = {
  attempts: string;
  challenge: string;
  completedGames: string;
  dailyStreak: string;
  gamesByMode: string;
  localPrivacyDetail: string;
  localPrivacyTitle: string;
  noActivityDetail: string;
  noActivityTitle: string;
  openPractice: string;
  recentGames: string;
  rivalsDetail: string;
  rivalsEmptyDetail: string;
  rivalsEmptyTitle: string;
  rivalsMatch: string;
  rivalsMatches: string;
  rivalsPrivacyDetail: string;
  rivalsPrivacyTitle: string;
  rivalsTitle: string;
  statsDetail: string;
  statsTitle: string;
  successRate: string;
  victories: string;
};

const copy: Record<InterfaceLocale, ActivityCopy> = {
  en: {
    attempts: 'attempts', challenge: 'Challenge a friend', completedGames: 'Games', dailyStreak: 'Daily streak', gamesByMode: 'Games by mode',
    localPrivacyDetail: 'Only finished summaries stay on this device. Words, boards, guesses, account details and invitation data are never saved here.', localPrivacyTitle: 'Private on this device',
    noActivityDetail: 'Finish Practice, Play Avi, Daily or a friend duel to start your private summary.', noActivityTitle: 'Your first result starts here', openPractice: 'Open Practice', recentGames: 'Recent games',
    rivalsDetail: 'People from completed friend duels, kept only on this device.', rivalsEmptyDetail: 'Finish a private friend duel and that rival will appear here. DuelWords never searches your contacts or publishes a profile.', rivalsEmptyTitle: 'No recent rivals yet',
    rivalsMatch: 'duel', rivalsMatches: 'duels', rivalsPrivacyDetail: 'This is a local shortcut, not a public profile or online-status list.', rivalsPrivacyTitle: 'Recent, not searchable', rivalsTitle: 'Your recent rivals.',
    statsDetail: 'A clear summary of finished games on this device.', statsTitle: 'Your games at a glance.', successRate: 'Win rate', victories: 'Victories',
  },
  es: {
    attempts: 'intentos', challenge: 'Retar a alguien', completedGames: 'Partidas', dailyStreak: 'Racha diaria', gamesByMode: 'Partidas por modo',
    localPrivacyDetail: 'Solo se guardan resúmenes terminados en este dispositivo. Aquí nunca se guardan palabras, tableros, intentos, datos de cuenta ni invitaciones.', localPrivacyTitle: 'Privado en este dispositivo',
    noActivityDetail: 'Termina Práctica, Jugar con Avi, Diario o un duelo con alguien para iniciar tu resumen privado.', noActivityTitle: 'Tu primer resultado empieza aquí', openPractice: 'Abrir Práctica', recentGames: 'Partidas recientes',
    rivalsDetail: 'Personas de duelos terminados, guardadas solo en este dispositivo.', rivalsEmptyDetail: 'Termina un duelo privado y ese rival aparecerá aquí. DuelWords nunca busca contactos ni publica perfiles.', rivalsEmptyTitle: 'Aún no hay rivales recientes',
    rivalsMatch: 'duelo', rivalsMatches: 'duelos', rivalsPrivacyDetail: 'Es un acceso local, no un perfil público ni una lista de estado en línea.', rivalsPrivacyTitle: 'Recientes, no buscables', rivalsTitle: 'Tus rivales recientes.',
    statsDetail: 'Un resumen claro de las partidas terminadas en este dispositivo.', statsTitle: 'Tus partidas de un vistazo.', successRate: 'Porcentaje', victories: 'Ganadas',
  },
  ca: {
    attempts: 'intents', challenge: 'Reptar algú', completedGames: 'Partides', dailyStreak: 'Ratxa diària', gamesByMode: 'Partides per mode',
    localPrivacyDetail: 'Només es desen resums acabats en aquest dispositiu. Aquí mai no es desen paraules, taulers, intents, dades del compte ni invitacions.', localPrivacyTitle: 'Privat en aquest dispositiu',
    noActivityDetail: 'Acaba Pràctica, Jugar amb l’Avi, Diari o un duel amb algú per iniciar el teu resum privat.', noActivityTitle: 'El teu primer resultat comença aquí', openPractice: 'Obrir Pràctica', recentGames: 'Partides recents',
    rivalsDetail: 'Persones de duels acabats, desades només en aquest dispositiu.', rivalsEmptyDetail: 'Acaba un duel privat i aquest rival apareixerà aquí. DuelWords mai no cerca contactes ni publica perfils.', rivalsEmptyTitle: 'Encara no hi ha rivals recents',
    rivalsMatch: 'duel', rivalsMatches: 'duels', rivalsPrivacyDetail: 'És un accés local, no un perfil públic ni una llista d’estat en línia.', rivalsPrivacyTitle: 'Recents, no cercables', rivalsTitle: 'Els teus rivals recents.',
    statsDetail: 'Un resum clar de les partides acabades en aquest dispositiu.', statsTitle: 'Les teves partides d’un cop d’ull.', successRate: 'Percentatge', victories: 'Guanyades',
  },
  fr: {
    attempts: 'essais', challenge: 'Défier un ami', completedGames: 'Parties', dailyStreak: 'Série quotidienne', gamesByMode: 'Parties par mode',
    localPrivacyDetail: 'Seuls les résumés terminés restent sur cet appareil. Les mots, grilles, essais, données de compte et invitations ne sont jamais enregistrés ici.', localPrivacyTitle: 'Privé sur cet appareil',
    noActivityDetail: 'Terminez Entraînement, Jouer contre Avi, Quotidien ou un duel entre amis pour commencer votre résumé privé.', noActivityTitle: 'Votre premier résultat commence ici', openPractice: 'Ouvrir Entraînement', recentGames: 'Parties récentes',
    rivalsDetail: 'Les personnes de vos duels terminés, conservées uniquement sur cet appareil.', rivalsEmptyDetail: 'Terminez un duel privé et ce rival apparaîtra ici. DuelWords ne recherche jamais vos contacts et ne publie aucun profil.', rivalsEmptyTitle: 'Aucun rival récent',
    rivalsMatch: 'duel', rivalsMatches: 'duels', rivalsPrivacyDetail: 'Il s’agit d’un raccourci local, pas d’un profil public ni d’une liste de présence.', rivalsPrivacyTitle: 'Récents, sans recherche', rivalsTitle: 'Vos rivaux récents.',
    statsDetail: 'Un résumé clair des parties terminées sur cet appareil.', statsTitle: 'Vos parties en un coup d’œil.', successRate: 'Taux de victoire', victories: 'Gagnées',
  },
  de: {
    attempts: 'Versuche', challenge: 'Freund herausfordern', completedGames: 'Spiele', dailyStreak: 'Tagesfolge', gamesByMode: 'Spiele nach Modus',
    localPrivacyDetail: 'Nur abgeschlossene Zusammenfassungen bleiben auf diesem Gerät. Wörter, Bretter, Versuche, Kontodaten und Einladungen werden hier nie gespeichert.', localPrivacyTitle: 'Privat auf diesem Gerät',
    noActivityDetail: 'Beende Training, Gegen Avi, Täglich oder ein Freundesduell, um deine private Übersicht zu starten.', noActivityTitle: 'Dein erstes Ergebnis beginnt hier', openPractice: 'Training öffnen', recentGames: 'Letzte Spiele',
    rivalsDetail: 'Personen aus abgeschlossenen Duellen, nur auf diesem Gerät gespeichert.', rivalsEmptyDetail: 'Beende ein privates Duell und dieser Rivale erscheint hier. DuelWords durchsucht nie deine Kontakte und veröffentlicht kein Profil.', rivalsEmptyTitle: 'Noch keine letzten Rivalen',
    rivalsMatch: 'Duell', rivalsMatches: 'Duelle', rivalsPrivacyDetail: 'Dies ist eine lokale Abkürzung, kein öffentliches Profil und keine Anwesenheitsliste.', rivalsPrivacyTitle: 'Zuletzt gespielt, nicht durchsuchbar', rivalsTitle: 'Deine letzten Rivalen.',
    statsDetail: 'Eine klare Übersicht der auf diesem Gerät beendeten Spiele.', statsTitle: 'Deine Spiele auf einen Blick.', successRate: 'Siegquote', victories: 'Gewonnen',
  },
};

const modeLabels: Record<InterfaceLocale, Record<DuelWordsActivityMode, string>> = {
  en: { practice: 'Practice', bot_duel: 'Play Avi', human_duel: 'Friends', daily: 'Daily' },
  es: { practice: 'Práctica', bot_duel: 'Jugar con Avi', human_duel: 'Amigos', daily: 'Diario' },
  ca: { practice: 'Pràctica', bot_duel: 'Jugar amb l’Avi', human_duel: 'Amics', daily: 'Diari' },
  fr: { practice: 'Entraînement', bot_duel: 'Jouer contre Avi', human_duel: 'Amis', daily: 'Quotidien' },
  de: { practice: 'Training', bot_duel: 'Gegen Avi', human_duel: 'Freunde', daily: 'Täglich' },
};

const outcomeLabels: Record<InterfaceLocale, Record<DuelWordsActivityOutcome, string>> = {
  en: { win: 'Won', loss: 'Lost', draw: 'Draw', no_winner: 'Completed' },
  es: { win: 'Ganada', loss: 'Perdida', draw: 'Empate', no_winner: 'Terminada' },
  ca: { win: 'Guanyada', loss: 'Perduda', draw: 'Empat', no_winner: 'Acabada' },
  fr: { win: 'Gagnée', loss: 'Perdue', draw: 'Égalité', no_winner: 'Terminée' },
  de: { win: 'Gewonnen', loss: 'Verloren', draw: 'Unentschieden', no_winner: 'Beendet' },
};

export function activityCopy(locale: InterfaceLocale) {
  return copy[locale];
}

export function activityModeLabel(locale: InterfaceLocale, mode: DuelWordsActivityMode) {
  return modeLabels[locale][mode];
}

export function activityOutcomeLabel(locale: InterfaceLocale, outcome: DuelWordsActivityOutcome) {
  return outcomeLabels[locale][outcome];
}
