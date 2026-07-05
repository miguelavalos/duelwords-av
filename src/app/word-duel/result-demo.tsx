import { useLocalSearchParams } from 'expo-router';

import { WordDuelResultScreen } from '@/features/word-duel/result-screen';
import { parseWordDuelResultSourceParams } from '@/features/word-duel/word-duel-route-params';

export default function WordDuelResultRoute() {
  const { lang, mode, outcome, reason, result, resultId } = useLocalSearchParams<{
    lang?: string | string[];
    mode?: string | string[];
    outcome?: string | string[];
    reason?: string | string[];
    result?: string | string[];
    resultId?: string | string[];
  }>();
  const resultSource = parseWordDuelResultSourceParams({ lang, mode, outcome, reason, result, resultId });

  return <WordDuelResultScreen resultSource={resultSource} />;
}
