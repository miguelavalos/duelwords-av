import { useLocalSearchParams } from 'expo-router';

import { WordDuelSoloDailyScreen } from '@/features/word-duel/solo-daily-screen';
import {
  parseGameLanguageParam,
  parseSoloDailyModeParam,
} from '@/features/word-duel/word-duel-route-params';

export default function WordDuelSoloDailyDemoRoute() {
  const { lang, mode } = useLocalSearchParams<{ lang?: string | string[]; mode?: string | string[] }>();
  const initialGameLanguage = parseGameLanguageParam(lang);
  const initialMode = parseSoloDailyModeParam(mode);

  return <WordDuelSoloDailyScreen initialGameLanguage={initialGameLanguage} initialMode={initialMode} />;
}
