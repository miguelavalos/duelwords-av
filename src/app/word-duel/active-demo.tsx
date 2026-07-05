import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { ActiveDuelScreen } from '@/features/word-duel/active-duel-screen';
import { parseWordDuelActiveHandoffParams } from '@/features/word-duel/word-duel-route-params';

export default function ActiveDuelRoute() {
  const {
    lang,
    maxAttempts,
    mode,
    source,
    wordLength,
  } = useLocalSearchParams<{
    lang?: string | string[];
    maxAttempts?: string | string[];
    mode?: string | string[];
    source?: string | string[];
    wordLength?: string | string[];
  }>();
  const initialHandoff = useMemo(
    () =>
      parseWordDuelActiveHandoffParams({
        lang,
        maxAttempts,
        mode,
        source,
        wordLength,
      }),
    [lang, maxAttempts, mode, source, wordLength],
  );

  return <ActiveDuelScreen initialHandoff={initialHandoff} />;
}
