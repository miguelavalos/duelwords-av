import { useLocalSearchParams } from 'expo-router';

import { DailyScreen } from '@/features/word-duel/daily-screen';
import { parseGameLanguageParam } from '@/features/word-duel/word-duel-route-params';

export default function DailyRoute() {
  const { lang } = useLocalSearchParams<{ lang?: string | string[] }>();
  return <DailyScreen initialGameLanguage={parseGameLanguageParam(lang)} />;
}
