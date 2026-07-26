import type { WordDuelResultMode } from '../../game/word-duel-result/source';
import type {
  WordDuelResultOutcome,
  WordDuelResultReason,
  WordDuelResultViewModel,
} from '../../game/word-duel-result/view-model';
import { gameLanguageLabel, type InterfaceLocale } from '../../i18n/locales';

type RematchTerminalStatus = 'cancelled' | 'declined' | 'expired';

export type WordDuelResultCopy = {
  accept: string;
  answer: string;
  cancel: string;
  challengeMe: string;
  completedBoard: (label: string) => string;
  decline: string;
  done: string;
  expire: string;
  fiveLetters: string;
  hidden: string;
  home: string;
  language: string;
  mode: string;
  newSetup: string;
  nextDuelReady: string;
  noNextDuelOpened: string;
  notSolved: string;
  openAcceptedDuel: string;
  openDuel: string;
  openShareSheet: string;
  opponentPath: (name: string) => string;
  rematch: string;
  rematchAccepted: string;
  rematchRequest: string;
  rematchSetup: string;
  result: string;
  secondsLeft: (count: number) => string;
  sendRematch: string;
  shareResult: string;
  tries: (count: number) => string;
  versus: string;
  viewOwner: string;
  viewRival: string;
  waitingForRival: string;
  wordDuel: string;
  yourPath: string;
  modeLabels: Record<WordDuelResultMode, string>;
  outcomeLabels: Record<WordDuelResultOutcome, string>;
  outcomeTitles: Record<WordDuelResultOutcome, string>;
  reasonLabels: Record<WordDuelResultReason, string>;
  rematchTerminalTitles: Record<RematchTerminalStatus, string>;
  replayLabels: Record<WordDuelResultMode, string>;
};

const copies: Record<InterfaceLocale, WordDuelResultCopy> = {
  en: {
    accept: 'Accept', answer: 'Answer', cancel: 'Cancel', challengeMe: 'Challenge me',
    completedBoard: (label) => `${label} completed board`, decline: 'Decline', done: 'Done', expire: 'Expire',
    fiveLetters: 'five letters', hidden: 'Hidden', home: 'Home', language: 'Language', mode: 'Mode',
    newSetup: 'New setup', nextDuelReady: 'next duel ready', noNextDuelOpened: 'no next duel opened',
    notSolved: 'Not solved', openAcceptedDuel: 'Open accepted duel', openDuel: 'Open duel',
    openShareSheet: 'Open share sheet', opponentPath: (name) => `${name}'s path`, rematch: 'Rematch',
    rematchAccepted: 'Rematch accepted', rematchRequest: 'Rematch request', rematchSetup: 'Rematch setup',
    result: 'Result', secondsLeft: (count) => `${count}s left`, sendRematch: 'Send rematch',
    shareResult: 'Share result', tries: (count) => `${count} ${count === 1 ? 'try' : 'tries'}`, versus: 'vs',
    viewOwner: 'View owner', viewRival: 'View rival', waitingForRival: 'Waiting for rival',
    wordDuel: 'Word Duel', yourPath: 'Your path',
    modeLabels: { bot_duel: 'Play Avi', daily_preview: 'Daily', human_duel: '1v1', practice: 'Practice', solo_practice: 'Solo' },
    outcomeLabels: { draw: 'Draw', loss: 'Loss', no_winner: 'No winner', technical: 'Closed safely', win: 'Win' },
    outcomeTitles: { draw: 'Draw', loss: 'You lost', no_winner: 'No winner', technical: 'Result saved', win: 'You won' },
    reasonLabels: {
      abandoned_after_start: 'Duel abandoned', abandoned_inactive: 'Inactive duel', abandoned_no_winner: 'Duel abandoned',
      attempts_exhausted: 'Attempts exhausted', cancelled_before_first_round: 'Cancelled', round_timeout: 'Timeout',
      solved: 'Solved', technical_result: 'Round closed safely',
    },
    rematchTerminalTitles: { cancelled: 'Rematch cancelled', declined: 'Rematch declined', expired: 'Rematch expired' },
    replayLabels: { bot_duel: 'Play Avi again', daily_preview: 'Daily again', human_duel: 'Play again', practice: 'Practice again', solo_practice: 'Play again' },
  },
  es: {
    accept: 'Aceptar', answer: 'Palabra', cancel: 'Cancelar', challengeMe: 'Rétame',
    completedBoard: (label) => `Tablero final: ${label}`, decline: 'Rechazar', done: 'Listo', expire: 'Caducar',
    fiveLetters: 'cinco letras', hidden: 'Oculta', home: 'Inicio', language: 'Idioma', mode: 'Modo',
    newSetup: 'Nueva configuración', nextDuelReady: 'siguiente duelo listo', noNextDuelOpened: 'no se ha abierto otro duelo',
    notSolved: 'Sin resolver', openAcceptedDuel: 'Abrir revancha aceptada', openDuel: 'Abrir duelo',
    openShareSheet: 'Abrir menú para compartir', opponentPath: (name) => `Recorrido de ${name}`, rematch: 'Revancha',
    rematchAccepted: 'Revancha aceptada', rematchRequest: 'Solicitud de revancha', rematchSetup: 'Configurar revancha',
    result: 'Resultado', secondsLeft: (count) => `quedan ${count} s`, sendRematch: 'Enviar revancha',
    shareResult: 'Compartir resultado', tries: (count) => `${count} ${count === 1 ? 'intento' : 'intentos'}`, versus: 'vs.',
    viewOwner: 'Ver anfitrión', viewRival: 'Ver rival', waitingForRival: 'Esperando al rival',
    wordDuel: 'Duelo de palabras', yourPath: 'Tu recorrido',
    modeLabels: { bot_duel: 'Jugar con Avi', daily_preview: 'Diario', human_duel: '1 contra 1', practice: 'Práctica', solo_practice: 'Solo' },
    outcomeLabels: { draw: 'Empate', loss: 'Derrota', no_winner: 'Sin ganador', technical: 'Cerrado con seguridad', win: 'Victoria' },
    outcomeTitles: { draw: 'Empate', loss: 'Has perdido', no_winner: 'Sin ganador', technical: 'Resultado guardado', win: 'Has ganado' },
    reasonLabels: {
      abandoned_after_start: 'Duelo abandonado', abandoned_inactive: 'Duelo inactivo', abandoned_no_winner: 'Duelo abandonado',
      attempts_exhausted: 'Intentos agotados', cancelled_before_first_round: 'Cancelado', round_timeout: 'Tiempo agotado',
      solved: 'Resuelto', technical_result: 'Ronda cerrada con seguridad',
    },
    rematchTerminalTitles: { cancelled: 'Revancha cancelada', declined: 'Revancha rechazada', expired: 'Revancha caducada' },
    replayLabels: { bot_duel: 'Volver a jugar con Avi', daily_preview: 'Volver al diario', human_duel: 'Jugar de nuevo', practice: 'Volver a practicar', solo_practice: 'Jugar de nuevo' },
  },
  ca: {
    accept: 'Acceptar', answer: 'Paraula', cancel: 'Cancel·lar', challengeMe: 'Repta’m',
    completedBoard: (label) => `Tauler final: ${label}`, decline: 'Rebutjar', done: 'Fet', expire: 'Fer caducar',
    fiveLetters: 'cinc lletres', hidden: 'Oculta', home: 'Inici', language: 'Idioma', mode: 'Mode',
    newSetup: 'Configuració nova', nextDuelReady: 'duel següent preparat', noNextDuelOpened: 'no s’ha obert cap altre duel',
    notSolved: 'Sense resoldre', openAcceptedDuel: 'Obrir revenja acceptada', openDuel: 'Obrir duel',
    openShareSheet: 'Obrir el menú per compartir', opponentPath: (name) => `Camí de ${name}`, rematch: 'Revenja',
    rematchAccepted: 'Revenja acceptada', rematchRequest: 'Sol·licitud de revenja', rematchSetup: 'Configurar revenja',
    result: 'Resultat', secondsLeft: (count) => `queden ${count} s`, sendRematch: 'Enviar revenja',
    shareResult: 'Compartir resultat', tries: (count) => `${count} ${count === 1 ? 'intent' : 'intents'}`, versus: 'vs.',
    viewOwner: 'Veure amfitrió', viewRival: 'Veure rival', waitingForRival: 'Esperant el rival',
    wordDuel: 'Duel de paraules', yourPath: 'El teu camí',
    modeLabels: { bot_duel: 'Jugar amb l’Avi', daily_preview: 'Diari', human_duel: '1 contra 1', practice: 'Pràctica', solo_practice: 'Solo' },
    outcomeLabels: { draw: 'Empat', loss: 'Derrota', no_winner: 'Sense guanyador', technical: 'Tancat amb seguretat', win: 'Victòria' },
    outcomeTitles: { draw: 'Empat', loss: 'Has perdut', no_winner: 'Sense guanyador', technical: 'Resultat desat', win: 'Has guanyat' },
    reasonLabels: {
      abandoned_after_start: 'Duel abandonat', abandoned_inactive: 'Duel inactiu', abandoned_no_winner: 'Duel abandonat',
      attempts_exhausted: 'Intents esgotats', cancelled_before_first_round: 'Cancel·lat', round_timeout: 'Temps esgotat',
      solved: 'Resolt', technical_result: 'Ronda tancada amb seguretat',
    },
    rematchTerminalTitles: { cancelled: 'Revenja cancel·lada', declined: 'Revenja rebutjada', expired: 'Revenja caducada' },
    replayLabels: { bot_duel: 'Tornar a jugar amb l’Avi', daily_preview: 'Tornar al diari', human_duel: 'Tornar a jugar', practice: 'Tornar a practicar', solo_practice: 'Tornar a jugar' },
  },
  fr: {
    accept: 'Accepter', answer: 'Mot', cancel: 'Annuler', challengeMe: 'Défiez-moi',
    completedBoard: (label) => `Grille terminée : ${label}`, decline: 'Refuser', done: 'Terminé', expire: 'Faire expirer',
    fiveLetters: 'cinq lettres', hidden: 'Masqué', home: 'Accueil', language: 'Langue', mode: 'Mode',
    newSetup: 'Nouvelle configuration', nextDuelReady: 'prochain duel prêt', noNextDuelOpened: 'aucun autre duel ouvert',
    notSolved: 'Non résolu', openAcceptedDuel: 'Ouvrir la revanche acceptée', openDuel: 'Ouvrir le duel',
    openShareSheet: 'Ouvrir le menu de partage', opponentPath: (name) => `Parcours de ${name}`, rematch: 'Revanche',
    rematchAccepted: 'Revanche acceptée', rematchRequest: 'Demande de revanche', rematchSetup: 'Configurer la revanche',
    result: 'Résultat', secondsLeft: (count) => `${count} s restantes`, sendRematch: 'Envoyer la revanche',
    shareResult: 'Partager le résultat', tries: (count) => `${count} ${count === 1 ? 'essai' : 'essais'}`, versus: 'vs',
    viewOwner: 'Voir l’hôte', viewRival: 'Voir le rival', waitingForRival: 'En attente du rival',
    wordDuel: 'Duel de mots', yourPath: 'Votre parcours',
    modeLabels: { bot_duel: 'Jouer contre Avi', daily_preview: 'Quotidien', human_duel: '1 contre 1', practice: 'Entraînement', solo_practice: 'Solo' },
    outcomeLabels: { draw: 'Égalité', loss: 'Défaite', no_winner: 'Sans vainqueur', technical: 'Terminé en sécurité', win: 'Victoire' },
    outcomeTitles: { draw: 'Égalité', loss: 'Vous avez perdu', no_winner: 'Sans vainqueur', technical: 'Résultat enregistré', win: 'Vous avez gagné' },
    reasonLabels: {
      abandoned_after_start: 'Duel abandonné', abandoned_inactive: 'Duel inactif', abandoned_no_winner: 'Duel abandonné',
      attempts_exhausted: 'Essais épuisés', cancelled_before_first_round: 'Annulé', round_timeout: 'Temps écoulé',
      solved: 'Résolu', technical_result: 'Manche terminée en sécurité',
    },
    rematchTerminalTitles: { cancelled: 'Revanche annulée', declined: 'Revanche refusée', expired: 'Revanche expirée' },
    replayLabels: { bot_duel: 'Rejouer contre Avi', daily_preview: 'Rejouer le quotidien', human_duel: 'Rejouer', practice: 'Reprendre l’entraînement', solo_practice: 'Rejouer' },
  },
  de: {
    accept: 'Annehmen', answer: 'Lösung', cancel: 'Abbrechen', challengeMe: 'Fordere mich heraus',
    completedBoard: (label) => `Abgeschlossenes Brett: ${label}`, decline: 'Ablehnen', done: 'Fertig', expire: 'Ablaufen lassen',
    fiveLetters: 'fünf Buchstaben', hidden: 'Verdeckt', home: 'Start', language: 'Sprache', mode: 'Modus',
    newSetup: 'Neue Einstellungen', nextDuelReady: 'nächstes Duell bereit', noNextDuelOpened: 'kein weiteres Duell geöffnet',
    notSolved: 'Nicht gelöst', openAcceptedDuel: 'Angenommene Revanche öffnen', openDuel: 'Duell öffnen',
    openShareSheet: 'Teilen-Menü öffnen', opponentPath: (name) => `Weg von ${name}`, rematch: 'Revanche',
    rematchAccepted: 'Revanche angenommen', rematchRequest: 'Revanche-Anfrage', rematchSetup: 'Revanche einstellen',
    result: 'Ergebnis', secondsLeft: (count) => `noch ${count} s`, sendRematch: 'Revanche senden',
    shareResult: 'Ergebnis teilen', tries: (count) => `${count} ${count === 1 ? 'Versuch' : 'Versuche'}`, versus: 'gegen',
    viewOwner: 'Gastgeber ansehen', viewRival: 'Rivalen ansehen', waitingForRival: 'Warten auf Rivalen',
    wordDuel: 'Wortduell', yourPath: 'Dein Weg',
    modeLabels: { bot_duel: 'Gegen Avi', daily_preview: 'Täglich', human_duel: '1 gegen 1', practice: 'Training', solo_practice: 'Solo' },
    outcomeLabels: { draw: 'Unentschieden', loss: 'Niederlage', no_winner: 'Ohne Sieger', technical: 'Sicher beendet', win: 'Sieg' },
    outcomeTitles: { draw: 'Unentschieden', loss: 'Du hast verloren', no_winner: 'Ohne Sieger', technical: 'Ergebnis gespeichert', win: 'Du hast gewonnen' },
    reasonLabels: {
      abandoned_after_start: 'Duell abgebrochen', abandoned_inactive: 'Inaktives Duell', abandoned_no_winner: 'Duell abgebrochen',
      attempts_exhausted: 'Versuche aufgebraucht', cancelled_before_first_round: 'Abgebrochen', round_timeout: 'Zeit abgelaufen',
      solved: 'Gelöst', technical_result: 'Runde sicher beendet',
    },
    rematchTerminalTitles: { cancelled: 'Revanche abgebrochen', declined: 'Revanche abgelehnt', expired: 'Revanche abgelaufen' },
    replayLabels: { bot_duel: 'Noch einmal gegen Avi', daily_preview: 'Täglich wiederholen', human_duel: 'Noch einmal spielen', practice: 'Weiter trainieren', solo_practice: 'Noch einmal spielen' },
  },
};

export function wordDuelResultCopy(locale: InterfaceLocale): WordDuelResultCopy {
  return copies[locale];
}

export function buildLocalizedSafeShareText(
  result: WordDuelResultViewModel,
  copy: WordDuelResultCopy,
): string {
  const outcome = copy.outcomeLabels[result.outcome];
  const language = gameLanguageLabel(result.gameLanguage);
  const attempts = `${result.own.attemptsUsed}/${result.maxAttempts}`;

  return `DuelWords AV · ${copy.wordDuel}\n${outcome} · ${language} · ${attempts}`;
}
