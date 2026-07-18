import type { Href } from 'expo-router';

import type { GameLanguage } from '../../game/word-duel-engine';
import type { InterfaceLocale } from '../../i18n/locales';
import {
  createWordDuelActiveDemoHandoff,
  type WordDuelActiveHandoff,
  type WordDuelActiveHandoffSource,
} from '../../game/word-duel-active/handoff';
import {
  createWordDuelResultSource,
  type WordDuelResultMode,
  type WordDuelResultSource,
} from '../../game/word-duel-result/source';
import type {
  WordDuelResultLocalPayload,
  WordDuelResultOutcome,
  WordDuelResultReason,
} from '../../game/word-duel-result/view-model';
import {
  parseWordDuelResultLocalPayload,
  serializeWordDuelResultLocalPayload,
} from '../../game/word-duel-result/view-model';
import type { WordDuelSoloDailyMode } from '../../game/word-duel-solo-daily/view-model';
import { wordDuelResultRepositories } from './result-repositories';

export const WORD_DUEL_ROUTE_PATHS = {
  active: '/word-duel/active-demo',
  challenge: '/word-duel/challenge',
  lobby: '/word-duel/lobby-demo',
  playAvi: '/word-duel/play-avi-demo',
  practice: '/word-duel/practice',
  result: '/word-duel/result-demo',
  soloDaily: '/word-duel/solo-daily-demo',
} as const;

export type WordDuelRoutePath = (typeof WORD_DUEL_ROUTE_PATHS)[keyof typeof WORD_DUEL_ROUTE_PATHS];
export type WordDuelRouteMode = WordDuelResultMode;
export type WordDuelSearchParamValue = string | string[] | undefined;

export type WordDuelResultSourceSearchParams = {
  lang?: WordDuelSearchParamValue;
  mode?: WordDuelSearchParamValue;
  outcome?: WordDuelSearchParamValue;
  reason?: WordDuelSearchParamValue;
  result?: WordDuelSearchParamValue;
  resultId?: WordDuelSearchParamValue;
};

export type WordDuelActiveHandoffSearchParams = {
  lang?: WordDuelSearchParamValue;
  maxAttempts?: WordDuelSearchParamValue;
  mode?: WordDuelSearchParamValue;
  source?: WordDuelSearchParamValue;
  wordLength?: WordDuelSearchParamValue;
};

export function parseGameLanguageParam(value: WordDuelSearchParamValue): GameLanguage {
  return firstParam(value) === 'es' ? 'es' : 'en';
}

export function parseInterfaceLocaleParam(value: WordDuelSearchParamValue): InterfaceLocale | null {
  const locale = firstParam(value);
  return locale === 'ca' || locale === 'de' || locale === 'en' || locale === 'es' || locale === 'fr'
    ? locale
    : null;
}

export function parseSoloDailyModeParam(value: WordDuelSearchParamValue): WordDuelSoloDailyMode {
  const mode = firstParam(value);

  if (mode === 'daily' || mode === 'daily_preview') {
    return 'daily_preview';
  }

  return 'solo_practice';
}

export function parseWordDuelRouteModeParam(value: WordDuelSearchParamValue): WordDuelRouteMode {
  const mode = firstParam(value);

  if (
    mode === 'bot_duel'
    || mode === 'daily_preview'
    || mode === 'human_duel'
    || mode === 'practice'
    || mode === 'solo_practice'
  ) {
    return mode;
  }

  return 'human_duel';
}

export function parseResultOutcomeParam(value: WordDuelSearchParamValue): WordDuelResultOutcome {
  const outcome = firstParam(value);

  if (
    outcome === 'draw'
    || outcome === 'loss'
    || outcome === 'no_winner'
    || outcome === 'technical'
    || outcome === 'win'
  ) {
    return outcome;
  }

  return 'win';
}

export function parseResultReasonParam(value: WordDuelSearchParamValue): WordDuelResultReason {
  const reason = firstParam(value);

  if (
    reason === 'abandoned_after_start'
    || reason === 'abandoned_inactive'
    || reason === 'abandoned_no_winner'
    || reason === 'attempts_exhausted'
    || reason === 'cancelled_before_first_round'
    || reason === 'round_timeout'
    || reason === 'solved'
    || reason === 'technical_result'
  ) {
    return reason;
  }

  return 'solved';
}

export function parseLocalResultParam(value: WordDuelSearchParamValue): WordDuelResultLocalPayload | null {
  return parseWordDuelResultLocalPayload(firstParam(value));
}

export function parseWordDuelResultSourceParams(
  params: WordDuelResultSourceSearchParams,
): WordDuelResultSource {
  return createWordDuelResultSource({
    gameLanguage: parseGameLanguageParam(params.lang),
    localPayload: parseLocalResultParam(params.result),
    mode: parseWordDuelRouteModeParam(params.mode),
    outcome: parseResultOutcomeParam(params.outcome),
    resultId: firstParam(params.resultId),
    resultRepository: wordDuelResultRepositories.resultRepository,
    resultReason: parseResultReasonParam(params.reason),
  });
}

export function parseWordDuelActiveHandoffParams(
  params: WordDuelActiveHandoffSearchParams,
): WordDuelActiveHandoff {
  return createWordDuelActiveDemoHandoff({
    gameLanguage: parseGameLanguageParam(params.lang),
    source: parseWordDuelActiveHandoffSourceParam(params.source),
  });
}

export function buildWordDuelHref(
  path: WordDuelRoutePath,
  params: {
    gameLanguage?: GameLanguage;
    interfaceLocale?: InterfaceLocale;
    localResult?: WordDuelResultLocalPayload;
    mode?: WordDuelRouteMode;
    outcome?: WordDuelResultOutcome;
    reason?: WordDuelResultReason;
    resultId?: string;
  } = {},
): Href {
  const searchParams = new URLSearchParams();

  if (params.gameLanguage) {
    searchParams.set('lang', params.gameLanguage);
  }

  if (params.interfaceLocale) {
    searchParams.set('ui', params.interfaceLocale);
  }

  if (params.mode) {
    searchParams.set('mode', params.mode);
  }

  if (params.outcome) {
    searchParams.set('outcome', params.outcome);
  }

  if (params.reason) {
    searchParams.set('reason', params.reason);
  }

  if (params.localResult) {
    searchParams.set('result', serializeWordDuelResultLocalPayload(params.localResult));
  }

  if (params.resultId) {
    searchParams.set('resultId', params.resultId);
  }

  const query = searchParams.toString();
  return `${path}${query ? `?${query}` : ''}` as Href;
}

export function buildWordDuelActiveHandoffHref(handoff: WordDuelActiveHandoff): Href {
  const searchParams = new URLSearchParams();
  searchParams.set('lang', handoff.gameLanguage);
  searchParams.set('mode', handoff.mode);
  searchParams.set('source', handoff.source);
  searchParams.set('wordLength', String(handoff.wordLength));
  searchParams.set('maxAttempts', String(handoff.maxAttempts));

  return `${WORD_DUEL_ROUTE_PATHS.active}?${searchParams.toString()}` as Href;
}

export function buildWordDuelResultHandoffHref(params: {
  gameLanguage?: GameLanguage;
  localResult?: WordDuelResultLocalPayload;
  mode?: WordDuelRouteMode;
  outcome?: WordDuelResultOutcome;
  reason?: WordDuelResultReason;
  resultId?: string | null;
}): Href {
  const resultId = params.resultId?.trim();

  return buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.result, {
    gameLanguage: params.gameLanguage,
    mode: params.mode,
    outcome: params.outcome,
    reason: params.reason,
    ...(resultId ? { resultId } : { localResult: params.localResult }),
  });
}

function parseWordDuelActiveHandoffSourceParam(value: WordDuelSearchParamValue): WordDuelActiveHandoffSource {
  return firstParam(value) === 'local_lobby_demo' ? 'local_lobby_demo' : 'direct_active_demo';
}

function firstParam(value: WordDuelSearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
