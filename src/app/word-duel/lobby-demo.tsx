import { useLocalSearchParams } from 'expo-router';

import { WordDuelLobbyScreen } from '@/features/word-duel/lobby-screen';
import { parseGameLanguageParam } from '@/features/word-duel/word-duel-route-params';

export default function WordDuelLobbyRoute() {
  const params = useLocalSearchParams<{ lang?: string | string[] }>();
  const initialGameLanguage = parseGameLanguageParam(params.lang);

  return <WordDuelLobbyScreen initialGameLanguage={initialGameLanguage} />;
}
