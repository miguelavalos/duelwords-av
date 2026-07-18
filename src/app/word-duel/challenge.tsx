import { useLocalSearchParams } from 'expo-router';

import { PublicWordDuelChallengeScreen } from '@/features/word-duel/public-challenge-screen';
import { parseGameLanguageParam } from '@/features/word-duel/word-duel-route-params';

export default function PublicWordDuelChallengeRoute() {
  const { code, invite, lang } = useLocalSearchParams<{
    code?: string | string[];
    invite?: string | string[];
    lang?: string | string[];
  }>();

  return (
    <PublicWordDuelChallengeScreen
      initialGameLanguage={parseGameLanguageParam(lang)}
      initialInviteInput={firstParam(invite)}
      initialRoomCode={firstParam(code)}
    />
  );
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}
