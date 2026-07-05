import { useLocalSearchParams } from 'expo-router';

import { PlayAviScreen } from '@/features/word-duel/play-avi-screen';
import { parseGameLanguageParam } from '@/features/word-duel/word-duel-route-params';

export default function PlayAviDemoRoute() {
  const { lang } = useLocalSearchParams<{ lang?: string | string[] }>();
  const initialGameLanguage = parseGameLanguageParam(lang);

  return <PlayAviScreen initialGameLanguage={initialGameLanguage} />;
}
