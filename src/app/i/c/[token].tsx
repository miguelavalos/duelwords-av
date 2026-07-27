import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';

import { PublicWordDuelChallengeScreen } from '@/features/word-duel/public-challenge-screen';
import {
  parseGameLanguageParam,
  parseInterfaceLocaleParam,
} from '@/features/word-duel/word-duel-route-params';

export default function PublicWordDuelInviteRoute() {
  const { lang, token, ui } = useLocalSearchParams<{
    lang?: string | string[];
    token?: string | string[];
    ui?: string | string[];
  }>();

  return (
    <>
      <Head>
        <title>Word Duel — DuelWords AV</title>
        <meta name="description" content="Review and join a Word Duel invitation." />
      </Head>
      <PublicWordDuelChallengeScreen
        initialGameLanguage={lang === undefined ? undefined : parseGameLanguageParam(lang)}
        initialInviteInput={firstParam(token)}
        initialInterfaceLocale={parseInterfaceLocaleParam(ui)}
      />
    </>
  );
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}
