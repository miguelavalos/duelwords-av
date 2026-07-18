import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';

import { PublicWordDuelChallengeScreen } from '@/features/word-duel/public-challenge-screen';
import {
  parseGameLanguageParam,
  parseInterfaceLocaleParam,
} from '@/features/word-duel/word-duel-route-params';

export default function PublicWordDuelChallengeRoute() {
  const { code, invite, lang, ui } = useLocalSearchParams<{
    code?: string | string[];
    invite?: string | string[];
    lang?: string | string[];
    ui?: string | string[];
  }>();

  return (
    <>
      <Head>
        <title>Word Duel — DuelWords AV</title>
        <meta
          name="description"
          content="Create or join a guest-first live Word Duel challenge."
        />
      </Head>
      <PublicWordDuelChallengeScreen
        initialGameLanguage={lang === undefined ? undefined : parseGameLanguageParam(lang)}
        initialInviteInput={firstParam(invite)}
        initialInterfaceLocale={parseInterfaceLocaleParam(ui)}
        initialRoomCode={firstParam(code)}
      />
    </>
  );
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}
