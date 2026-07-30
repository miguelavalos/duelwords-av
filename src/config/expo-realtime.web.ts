import {
  resolveDuelWordsRealtimeRuntimeConfig,
  type DuelWordsRealtimeRuntimeConfig,
} from './realtime';
import { getDuelWordsWebRuntimeConfig } from './web-runtime';

export function getDuelWordsRealtimeRuntimeConfig(): DuelWordsRealtimeRuntimeConfig {
  const runtime = getDuelWordsWebRuntimeConfig();
  return resolveDuelWordsRealtimeRuntimeConfig({
    duelWordsAv: {
      convexRealtimeDisabled: runtime ? false : true,
      convexUrl: runtime?.convexUrl,
    },
  });
}
