import { useLocalSearchParams } from 'expo-router';

import { PlayAviScreen } from '@/features/word-duel/play-avi-screen';
import { parseAviDifficultyParam, parseGameLanguageParam } from '@/features/word-duel/word-duel-route-params';

export default function PlayAviRoute() {
  const { difficulty, lang } = useLocalSearchParams<{ difficulty?: string | string[]; lang?: string | string[] }>();
  return <PlayAviScreen initialAviDifficulty={parseAviDifficultyParam(difficulty) ?? undefined} initialGameLanguage={parseGameLanguageParam(lang)} />;
}
