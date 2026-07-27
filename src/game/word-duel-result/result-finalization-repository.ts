import type { WordDuelResultMode, WordDuelResultStorage } from './result-repository';
import type { WordDuelResultLocalPayload } from './view-model';
import {
  recordDuelWordsActivity,
  type DuelWordsActivityMode,
  type DuelWordsActivityOutcome,
  type DuelWordsActivityStorage,
} from '../activity/device-activity-store';

export type WordDuelResultFinalizationInput = {
  localPayload: WordDuelResultLocalPayload;
  mode: WordDuelResultMode;
};

export type WordDuelResultFinalizationHandoff = {
  localResult?: WordDuelResultLocalPayload;
  resultId?: string;
  storage: WordDuelResultStorage;
};

export type WordDuelResultFinalizationRepository = {
  finalizeResult(
    input: WordDuelResultFinalizationInput,
  ): Promise<WordDuelResultFinalizationHandoff> | WordDuelResultFinalizationHandoff;
};

export function createLocalWordDuelResultFinalizationRepository(
  activityStorage?: DuelWordsActivityStorage | null,
): WordDuelResultFinalizationRepository {
  return {
    finalizeResult: (input) => {
      if (input.localPayload.matchStarted) {
        recordDuelWordsActivity({
          attemptsUsed: input.localPayload.own.rows.length,
          language: input.localPayload.gameLanguage,
          mode: activityMode(input.mode),
          opponentDisplayName: input.localPayload.opponent?.safeDisplayName,
          outcome: activityOutcome(input.localPayload.outcome),
        }, activityStorage);
      }

      return {
        localResult: input.localPayload,
        storage: 'local_mock',
      };
    },
  };
}

export const localWordDuelResultFinalizationRepository = createLocalWordDuelResultFinalizationRepository();

function activityMode(mode: WordDuelResultMode): DuelWordsActivityMode {
  if (mode === 'bot_duel' || mode === 'human_duel') return mode;
  if (mode === 'daily_preview') return 'daily';
  return 'practice';
}

function activityOutcome(outcome: WordDuelResultLocalPayload['outcome']): DuelWordsActivityOutcome {
  return outcome === 'technical' ? 'no_winner' : outcome;
}
