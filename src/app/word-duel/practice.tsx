import { useLocalSearchParams } from 'expo-router';

import { WordDuelPracticeScreen } from '@/features/word-duel/practice-screen';
import { parseGameLanguageParam } from '@/features/word-duel/word-duel-route-params';

export default function WordDuelPracticeRoute() {
  const { lang } = useLocalSearchParams<{ lang?: string | string[] }>();
  const initialGameLanguage = parseGameLanguageParam(lang);

  return <WordDuelPracticeScreen initialGameLanguage={initialGameLanguage} />;
}
