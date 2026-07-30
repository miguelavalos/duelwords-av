import type { InterfaceLocale } from './locales';

export type ShareOutcome = 'draw' | 'loss' | 'no_winner' | 'technical' | 'win';

type ShareCopy = {
  challengeMe: string;
  dailyPreview: string;
  outcomeAgainst: Record<ShareOutcome, string>;
  outcomeSolo: Record<ShareOutcome, string>;
  playAvi: string;
  soloPractice: string;
  wordDuel: string;
};

export const SHARE_COPY: Record<InterfaceLocale, ShareCopy> = {
  en: shareCopy('Challenge me', 'Daily preview', 'Play Avi', 'Solo practice', 'Word Duel', ['Won against', 'Lost against', 'Draw against', 'Result unavailable', 'No winner against'], ['Won', 'Lost', 'Draw', 'Result saved', 'No winner']),
  es: shareCopy('Réteme', 'Vista previa diaria', 'Jugar con Avi', 'Práctica en solitario', 'Duelo de palabras', ['Victoria contra', 'Derrota contra', 'Empate contra', 'Resultado no disponible', 'Sin ganador contra'], ['Victoria', 'Derrota', 'Empate', 'Resultado guardado', 'Sin ganador']),
  ca: shareCopy('Repta’m', 'Vista prèvia diària', 'Jugar amb l’Avi', 'Pràctica en solitari', 'Duel de paraules', ['Victòria contra', 'Derrota contra', 'Empat contra', 'Resultat no disponible', 'Sense guanyador contra'], ['Victòria', 'Derrota', 'Empat', 'Resultat desat', 'Sense guanyador']),
  fr: shareCopy('Défiez-moi', 'Aperçu quotidien', 'Jouer contre Avi', 'Entraînement solo', 'Duel de mots', ['Victoire contre', 'Défaite contre', 'Match nul contre', 'Résultat indisponible', 'Aucun vainqueur contre'], ['Victoire', 'Défaite', 'Match nul', 'Résultat enregistré', 'Aucun vainqueur']),
  de: shareCopy('Fordere mich heraus', 'Tagesvorschau', 'Gegen Avi spielen', 'Solo-Training', 'Wortduell', ['Sieg gegen', 'Niederlage gegen', 'Unentschieden gegen', 'Ergebnis nicht verfügbar', 'Kein Sieger gegen'], ['Gewonnen', 'Verloren', 'Unentschieden', 'Ergebnis gespeichert', 'Kein Sieger']),
};

function shareCopy(
  challengeMe: string,
  dailyPreview: string,
  playAvi: string,
  soloPractice: string,
  wordDuel: string,
  outcomes: readonly [string, string, string, string, string],
  soloOutcomes: readonly [string, string, string, string, string],
): ShareCopy {
  return {
    challengeMe,
    dailyPreview,
    outcomeAgainst: {
      win: outcomes[0],
      loss: outcomes[1],
      draw: outcomes[2],
      technical: outcomes[3],
      no_winner: outcomes[4],
    },
    outcomeSolo: {
      win: soloOutcomes[0],
      loss: soloOutcomes[1],
      draw: soloOutcomes[2],
      technical: soloOutcomes[3],
      no_winner: soloOutcomes[4],
    },
    playAvi,
    soloPractice,
    wordDuel,
  };
}
