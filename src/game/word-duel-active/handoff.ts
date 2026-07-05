import type { GameLanguage } from '../word-duel-engine';
import { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH } from '../word-duel-engine';
import type { WordDuelLobbyViewModel } from '../word-duel-lobby/view-model';

export type WordDuelActiveHandoffSource = 'direct_active_demo' | 'local_lobby_demo';
export type WordDuelActiveHandoffMode = 'human_duel';

export type WordDuelActiveHandoff = {
  gameLanguage: GameLanguage;
  maxAttempts: typeof WORD_DUEL_MAX_ATTEMPTS;
  mode: WordDuelActiveHandoffMode;
  source: WordDuelActiveHandoffSource;
  wordLength: typeof WORD_DUEL_WORD_LENGTH;
};

export type WordDuelActiveHandoffErrorCode =
  | 'lobby_not_active'
  | 'unsupported_lobby_settings';

export class WordDuelActiveHandoffError extends Error {
  readonly code: WordDuelActiveHandoffErrorCode;

  constructor(code: WordDuelActiveHandoffErrorCode, message: string) {
    super(message);
    this.name = 'WordDuelActiveHandoffError';
    this.code = code;
  }
}

export function createWordDuelActiveDemoHandoff(input: {
  gameLanguage?: GameLanguage;
  source?: WordDuelActiveHandoffSource;
} = {}): WordDuelActiveHandoff {
  return {
    gameLanguage: input.gameLanguage ?? 'en',
    maxAttempts: WORD_DUEL_MAX_ATTEMPTS,
    mode: 'human_duel',
    source: input.source ?? 'direct_active_demo',
    wordLength: WORD_DUEL_WORD_LENGTH,
  };
}

export function createWordDuelActiveHandoffFromLobby(lobby: WordDuelLobbyViewModel): WordDuelActiveHandoff {
  if (lobby.status !== 'active_round' || lobby.activeRound === null || !lobby.canOpenActiveDuel) {
    throw new WordDuelActiveHandoffError(
      'lobby_not_active',
      'The Word Duel lobby must open the first round before the active board can start.',
    );
  }

  if (
    lobby.invitePreview.mode !== 'human_duel'
    || lobby.invitePreview.wordLength !== WORD_DUEL_WORD_LENGTH
    || lobby.invitePreview.maxAttempts !== WORD_DUEL_MAX_ATTEMPTS
  ) {
    throw new WordDuelActiveHandoffError(
      'unsupported_lobby_settings',
      'The active Word Duel demo only supports the V1 human duel settings.',
    );
  }

  return createWordDuelActiveDemoHandoff({
    gameLanguage: lobby.invitePreview.gameLanguage,
    source: 'local_lobby_demo',
  });
}
