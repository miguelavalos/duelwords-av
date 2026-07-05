import type { WordDuelResultLocalPayload } from './view-model';

export type WordDuelResultMode = 'bot_duel' | 'daily_preview' | 'human_duel' | 'practice' | 'solo_practice';
export type WordDuelResultStorage = 'convex' | 'local_mock';

export type WordDuelPersistedResultRecord = {
  localPayload: WordDuelResultLocalPayload;
  mode: WordDuelResultMode;
  resultId: string;
  storage: WordDuelResultStorage;
};

export type WordDuelResultRepository = {
  readResult(resultId: string | null | undefined): WordDuelPersistedResultRecord | null;
};
