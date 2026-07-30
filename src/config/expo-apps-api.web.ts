import { getDuelWordsWebRuntimeConfig } from './web-runtime';
import {
  resolveDuelWordsAppsApiRuntimeConfig,
  type DuelWordsAppsApiRuntimeConfig,
} from './apps-api';

export function getDuelWordsAppsApiRuntimeConfig(): DuelWordsAppsApiRuntimeConfig {
  const runtime = getDuelWordsWebRuntimeConfig();
  return resolveDuelWordsAppsApiRuntimeConfig({
    duelWordsAv: {
      apiBaseUrl: runtime?.apiBaseUrl,
      apiDisabled: runtime ? false : true,
    },
  });
}
