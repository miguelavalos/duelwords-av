import { isDuelMaxAttempts, isDuelWordLength, type DuelMaxAttempts } from '../duel-rules';
import type { DuelWordLength, GameLanguage } from '../word-duel-engine';
import { WORD_DUEL_MAX_ATTEMPTS, WORD_DUEL_WORD_LENGTH } from '../word-duel-engine';
import type { WordDuelLobbyViewModel } from '../word-duel-lobby/view-model';

export type WordDuelActiveHandoffSource = 'direct_active_demo' | 'local_lobby_demo';
export type WordDuelActiveHandoffMode = 'human_duel';

export type WordDuelActiveHandoff = {
  gameLanguage: GameLanguage;
  maxAttempts: DuelMaxAttempts;
  mode: WordDuelActiveHandoffMode;
  source: WordDuelActiveHandoffSource;
  wordLength: DuelWordLength;
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
  maxAttempts?: number;
  source?: WordDuelActiveHandoffSource;
  wordLength?: number;
} = {}): WordDuelActiveHandoff {
  const maxAttempts = input.maxAttempts ?? WORD_DUEL_MAX_ATTEMPTS;
  const wordLength = input.wordLength ?? WORD_DUEL_WORD_LENGTH;
  if (!isDuelMaxAttempts(maxAttempts) || !isDuelWordLength(wordLength)) {
    throw new WordDuelActiveHandoffError('unsupported_lobby_settings', 'Unsupported duel rules.');
  }
  return {
    gameLanguage: input.gameLanguage ?? 'en',
    maxAttempts,
    mode: 'human_duel',
    source: input.source ?? 'direct_active_demo',
    wordLength,
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
    || !isDuelWordLength(lobby.invitePreview.wordLength)
    || !isDuelMaxAttempts(lobby.invitePreview.maxAttempts)
  ) {
    throw new WordDuelActiveHandoffError(
      'unsupported_lobby_settings',
      'The active Word Duel demo received unsupported duel rules.',
    );
  }

  return createWordDuelActiveDemoHandoff({
    gameLanguage: lobby.invitePreview.gameLanguage,
    maxAttempts: lobby.invitePreview.maxAttempts,
    source: 'local_lobby_demo',
    wordLength: lobby.invitePreview.wordLength,
  });
}
