import { useLocalSearchParams } from 'expo-router';

import { PlayAviScreen } from '@/features/word-duel/play-avi-screen';
import {
  parseAviDifficultyParam,
  parseDuelMaxAttemptsParam,
  parseDuelWordLengthParam,
  parseGameLanguageParam,
} from '@/features/word-duel/word-duel-route-params';

export default function PlayAviRoute() {
  const { difficulty, lang, maxAttempts, wordLength } = useLocalSearchParams<{
    difficulty?: string | string[];
    lang?: string | string[];
    maxAttempts?: string | string[];
    wordLength?: string | string[];
  }>();
  return (
    <PlayAviScreen
      initialAviDifficulty={parseAviDifficultyParam(difficulty) ?? undefined}
      initialDuelRules={{
        maxAttempts: parseDuelMaxAttemptsParam(maxAttempts),
        wordLength: parseDuelWordLengthParam(wordLength),
      }}
      initialGameLanguage={parseGameLanguageParam(lang)}
    />
  );
}
