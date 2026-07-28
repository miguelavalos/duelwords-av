import { useLocalSearchParams } from 'expo-router';

import { GameSetupScreen } from '@/features/word-duel/game-setup-screen';
import { parseGameLanguageParam, parseWordDuelRouteModeParam } from '@/features/word-duel/word-duel-route-params';

export default function WordDuelSetupRoute() {
  const { lang, mode } = useLocalSearchParams<{ lang?: string | string[]; mode?: string | string[] }>();
  const parsedMode = parseWordDuelRouteModeParam(mode);
  const setupMode = parsedMode === 'bot_duel' || parsedMode === 'practice' ? parsedMode : 'human_duel';
  return <GameSetupScreen initialGameLanguage={parseGameLanguageParam(lang)} mode={setupMode} />;
}
