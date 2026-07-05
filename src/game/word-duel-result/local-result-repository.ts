import type { GuessRow, LetterFeedback } from '../word-duel-engine';
import type {
  WordDuelPersistedResultRecord,
  WordDuelResultRepository,
} from './result-repository';
import { createWordDuelResultLocalPayload } from './view-model';

export type LocalWordDuelResultRecord = WordDuelPersistedResultRecord & {
  storage: 'local_mock';
};

const LOCAL_WORD_DUEL_RESULT_RECORDS: Record<string, Omit<LocalWordDuelResultRecord, 'resultId' | 'storage'>> = {
  'local-human-win': {
    localPayload: createWordDuelResultLocalPayload({
      gameLanguage: 'en',
      opponent: {
        guesses: [
          guessRow('slate', ['absent', 'absent', 'present', 'absent', 'exact']),
          guessRow('pride', ['absent', 'exact', 'absent', 'exact', 'exact']),
          guessRow('sound', ['absent', 'absent', 'absent', 'absent', 'exact']),
          guessRow('cider', ['exact', 'exact', 'exact', 'exact', 'exact']),
        ],
        safeDisplayName: 'Rival',
        side: 'b',
        solved: true,
      },
      outcome: 'win',
      own: {
        guesses: [
          guessRow('civic', ['exact', 'exact', 'absent', 'absent', 'absent']),
          guessRow('adore', ['absent', 'absent', 'present', 'exact', 'exact']),
          guessRow('cider', ['exact', 'exact', 'exact', 'exact', 'exact']),
        ],
        side: 'a',
        solved: true,
      },
      resultReason: 'solved',
      targetDisplayWord: 'cider',
    }),
    mode: 'human_duel',
  },
  'local-bot-loss': {
    localPayload: createWordDuelResultLocalPayload({
      gameLanguage: 'en',
      opponent: {
        guesses: [
          guessRow('flame', ['absent', 'absent', 'absent', 'absent', 'exact']),
          guessRow('crane', ['exact', 'exact', 'exact', 'exact', 'exact']),
        ],
        safeDisplayName: 'Avi',
        side: 'b',
        solved: true,
      },
      outcome: 'loss',
      own: {
        guesses: [
          guessRow('civic', ['exact', 'absent', 'absent', 'absent', 'absent']),
          guessRow('brave', ['absent', 'exact', 'present', 'absent', 'exact']),
        ],
        side: 'a',
        solved: false,
      },
      resultReason: 'solved',
      targetDisplayWord: 'crane',
    }),
    mode: 'bot_duel',
  },
};

export const localWordDuelResultRepository: WordDuelResultRepository = {
  readResult: readLocalWordDuelResultRecord,
};

export function readLocalWordDuelResultRecord(resultId: string | null | undefined): LocalWordDuelResultRecord | null {
  const normalizedResultId = resultId?.trim();
  if (!normalizedResultId) {
    return null;
  }

  const record = LOCAL_WORD_DUEL_RESULT_RECORDS[normalizedResultId];
  if (!record) {
    return null;
  }

  return {
    ...record,
    resultId: normalizedResultId,
    storage: 'local_mock',
  };
}

function guessRow(normalizedWord: string, feedback: readonly LetterFeedback[]): GuessRow {
  return {
    feedback: [...feedback],
    input: normalizedWord,
    letters: Array.from(normalizedWord),
    normalizedWord,
  };
}
