import { describe, expect, it } from 'vitest';

import {
  buildWordDuelActiveHandoffHref,
  buildWordDuelHref,
  buildWordDuelResultHandoffHref,
  parseGameLanguageParam,
  parseDuelMaxAttemptsParam,
  parseDuelWordLengthParam,
  parseInterfaceLocaleParam,
  parseLocalResultParam,
  parseResultOutcomeParam,
  parseResultReasonParam,
  parseSoloDailyModeParam,
  parseWordDuelActiveHandoffParams,
  parseWordDuelResultSourceParams,
  parseWordDuelRouteModeParam,
  WORD_DUEL_ROUTE_PATHS,
} from './word-duel-route-params';
import { createWordDuelActiveDemoHandoff } from '../../game/word-duel-active/handoff';
import { createWordDuelResultLocalPayload } from '../../game/word-duel-result/view-model';

describe('word duel route params', () => {
  it('parses supported game languages with English fallback', () => {
    expect(parseGameLanguageParam('es')).toBe('es');
    expect(parseGameLanguageParam(['es', 'en'])).toBe('es');
    expect(parseGameLanguageParam('ca')).toBe('ca');
    expect(parseGameLanguageParam('fr')).toBe('fr');
    expect(parseGameLanguageParam('de')).toBe('de');
    expect(parseGameLanguageParam('xx')).toBe('en');
    expect(parseGameLanguageParam(undefined)).toBe('en');
  });

  it('parses supported interface locales without overriding stored preferences on invalid input', () => {
    expect(parseInterfaceLocaleParam('es')).toBe('es');
    expect(parseInterfaceLocaleParam(['ca', 'en'])).toBe('ca');
    expect(parseInterfaceLocaleParam('it')).toBeNull();
    expect(parseInterfaceLocaleParam(undefined)).toBeNull();
  });

  it('parses configurable duel rules with classic fallbacks', () => {
    expect(parseDuelWordLengthParam('7')).toBe(7);
    expect(parseDuelWordLengthParam(['6', '5'])).toBe(6);
    expect(parseDuelWordLengthParam('9')).toBe(5);
    expect(parseDuelWordLengthParam(undefined)).toBe(5);
    expect(parseDuelMaxAttemptsParam('8')).toBe(8);
    expect(parseDuelMaxAttemptsParam(['4', '6'])).toBe(4);
    expect(parseDuelMaxAttemptsParam('12')).toBe(6);
    expect(parseDuelMaxAttemptsParam(undefined)).toBe(6);
  });

  it('parses solo and daily modes with a stable fallback', () => {
    expect(parseSoloDailyModeParam('daily')).toBe('daily_preview');
    expect(parseSoloDailyModeParam('daily_preview')).toBe('daily_preview');
    expect(parseSoloDailyModeParam(['daily_preview', 'solo_practice'])).toBe('daily_preview');
    expect(parseSoloDailyModeParam('bot_duel')).toBe('solo_practice');
    expect(parseSoloDailyModeParam(undefined)).toBe('solo_practice');
  });

  it('parses route mode and result params with stable fallbacks', () => {
    expect(parseWordDuelRouteModeParam('bot_duel')).toBe('bot_duel');
    expect(parseWordDuelRouteModeParam('unknown')).toBe('human_duel');
    expect(parseResultOutcomeParam('loss')).toBe('loss');
    expect(parseResultOutcomeParam('invalid')).toBe('win');
    expect(parseResultReasonParam('attempts_exhausted')).toBe('attempts_exhausted');
    expect(parseResultReasonParam(undefined)).toBe('solved');
  });

  it('builds local preview hrefs with explicit language, mode and result state', () => {
    expect(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.active, {
      gameLanguage: 'es',
      mode: 'human_duel',
    })).toBe('/word-duel/active-demo?lang=es&mode=human_duel');

    expect(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.result, {
      gameLanguage: 'es',
      mode: 'bot_duel',
      outcome: 'loss',
      reason: 'solved',
    })).toBe('/word-duel/result-demo?lang=es&mode=bot_duel&outcome=loss&reason=solved');

    expect(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice)).toBe('/word-duel/practice');

    expect(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.challenge, {
      gameLanguage: 'es',
      interfaceLocale: 'ca',
    })).toBe('/word-duel/challenge?lang=es&ui=ca');

    expect(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.playAvi, {
      aviDifficulty: 'expert',
      gameLanguage: 'ca',
      maxAttempts: 8,
      mode: 'bot_duel',
      wordLength: 7,
    })).toBe('/word-duel/play-avi?lang=ca&difficulty=expert&mode=bot_duel&wordLength=7&maxAttempts=8');
  });

  it('builds persisted result hrefs with a resultId', () => {
    expect(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.result, {
      resultId: 'local-human-win',
    })).toBe('/word-duel/result-demo?resultId=local-human-win');
  });

  it('roundtrips active handoff hrefs without private gameplay fields', () => {
    const handoff = createWordDuelActiveDemoHandoff({
      gameLanguage: 'es',
      maxAttempts: 8,
      source: 'local_lobby_demo',
      wordLength: 7,
    });
    const href = String(buildWordDuelActiveHandoffHref(handoff));
    const params = new URLSearchParams(href.split('?')[1] ?? '');
    const parsed = parseWordDuelActiveHandoffParams({
      lang: params.get('lang') ?? undefined,
      maxAttempts: params.get('maxAttempts') ?? undefined,
      mode: params.get('mode') ?? undefined,
      source: params.get('source') ?? undefined,
      wordLength: params.get('wordLength') ?? undefined,
    });

    expect(href).toBe('/word-duel/active-demo?lang=es&mode=human_duel&source=local_lobby_demo&wordLength=7&maxAttempts=8');
    expect(parsed).toEqual(handoff);
    expect(href.toLowerCase()).not.toContain('target');
    expect(href.toLowerCase()).not.toContain('dictionary');
    expect(href.toLowerCase()).not.toContain('feedback');
    expect(href.toLowerCase()).not.toContain('gameid');
    expect(href.toLowerCase()).not.toContain('playerid');
    expect(href.toLowerCase()).not.toContain('realtime');
    expect(href.toLowerCase()).not.toContain('session');
  });

  it('parses active handoff params with stable direct demo fallbacks', () => {
    expect(parseWordDuelActiveHandoffParams({
      lang: 'ca',
      maxAttempts: '9',
      mode: 'bot_duel',
      source: 'runtime',
      wordLength: '7',
    })).toEqual({
      gameLanguage: 'ca',
      maxAttempts: 6,
      mode: 'human_duel',
      source: 'direct_active_demo',
      wordLength: 7,
    });
  });

  it('builds result handoff hrefs with local payload fallback', () => {
    const payload = createWordDuelResultLocalPayload({
      gameLanguage: 'es',
      outcome: 'win',
      own: {
        guesses: [
          {
            feedback: ['exact', 'present', 'absent', 'absent', 'exact'],
            input: 'perla',
            letters: ['p', 'e', 'r', 'l', 'a'],
            normalizedWord: 'perla',
          },
        ],
        solved: true,
      },
      resultReason: 'solved',
      targetDisplayWord: 'perla',
    });
    const href = String(buildWordDuelResultHandoffHref({
      gameLanguage: 'es',
      localResult: payload,
      mode: 'solo_practice',
      outcome: 'win',
      reason: 'solved',
    }));
    const params = new URLSearchParams(href.split('?')[1] ?? '');

    expect(href.startsWith('/word-duel/result-demo?')).toBe(true);
    expect(params.get('result')).toBeTruthy();
    expect(params.get('resultId')).toBeNull();
    expect(parseLocalResultParam(params.get('result') ?? undefined)).toEqual(payload);
  });

  it('prefers resultId over local payload in result handoff hrefs', () => {
    const payload = createWordDuelResultLocalPayload({
      gameLanguage: 'es',
      outcome: 'loss',
      own: {
        guesses: [
          {
            feedback: ['absent', 'absent', 'absent', 'absent', 'absent'],
            input: 'perla',
            letters: ['p', 'e', 'r', 'l', 'a'],
            normalizedWord: 'perla',
          },
        ],
        solved: false,
      },
      resultReason: 'attempts_exhausted',
      targetDisplayWord: 'perla',
    });
    const href = String(buildWordDuelResultHandoffHref({
      gameLanguage: 'es',
      localResult: payload,
      mode: 'bot_duel',
      outcome: 'loss',
      reason: 'attempts_exhausted',
      resultId: 'local-human-win',
    }));
    const params = new URLSearchParams(href.split('?')[1] ?? '');
    const source = parseWordDuelResultSourceParams({
      lang: params.get('lang') ?? undefined,
      mode: params.get('mode') ?? undefined,
      outcome: params.get('outcome') ?? undefined,
      reason: params.get('reason') ?? undefined,
      result: params.get('result') ?? undefined,
      resultId: params.get('resultId') ?? undefined,
    });

    expect(params.get('resultId')).toBe('local-human-win');
    expect(params.get('result')).toBeNull();
    expect(source.kind).toBe('persisted_result');
    expect(source.mode).toBe('human_duel');
    expect(source.viewModel.targetReveal.displayWord).toBe('CIDER');
  });

  it('roundtrips local result payloads through result hrefs', () => {
    const payload = createWordDuelResultLocalPayload({
      gameLanguage: 'es',
      outcome: 'win',
      own: {
        guesses: [
          {
            feedback: ['exact', 'present', 'absent', 'absent', 'exact'],
            input: 'perla',
            letters: ['p', 'e', 'r', 'l', 'a'],
            normalizedWord: 'perla',
          },
        ],
        solved: true,
      },
      resultReason: 'solved',
      targetDisplayWord: 'perla',
    });
    const href = String(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.result, {
      gameLanguage: 'es',
      localResult: payload,
      mode: 'solo_practice',
      outcome: 'win',
      reason: 'solved',
    }));
    const query = href.split('?')[1] ?? '';
    const params = new URLSearchParams(query);

    expect(params.get('lang')).toBe('es');
    expect(params.get('mode')).toBe('solo_practice');
    expect(parseLocalResultParam(params.get('result') ?? undefined)).toEqual(payload);
  });

  it('builds a result source from route params and prefers local payload data', () => {
    const payload = createWordDuelResultLocalPayload({
      gameLanguage: 'en',
      outcome: 'win',
      own: {
        guesses: [
          {
            feedback: ['exact', 'exact', 'exact', 'exact', 'exact'],
            input: 'crane',
            letters: ['c', 'r', 'a', 'n', 'e'],
            normalizedWord: 'crane',
          },
        ],
        solved: true,
      },
      resultReason: 'solved',
      targetDisplayWord: 'crane',
    });
    const href = String(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.result, {
      gameLanguage: 'es',
      localResult: payload,
      mode: 'solo_practice',
      outcome: 'loss',
      reason: 'attempts_exhausted',
    }));
    const params = new URLSearchParams(href.split('?')[1] ?? '');
    const source = parseWordDuelResultSourceParams({
      lang: params.get('lang') ?? undefined,
      mode: params.get('mode') ?? undefined,
      outcome: params.get('outcome') ?? undefined,
      reason: params.get('reason') ?? undefined,
      result: params.get('result') ?? undefined,
      resultId: params.get('resultId') ?? undefined,
    });

    expect(source.kind).toBe('local_payload');
    expect(source.mode).toBe('solo_practice');
    expect(source.viewModel.gameLanguage).toBe('en');
    expect(source.viewModel.outcome).toBe('win');
    expect(source.viewModel.targetReveal.displayWord).toBe('CRANE');
  });

  it('builds a persisted result source from resultId route params', () => {
    const href = String(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.result, {
      gameLanguage: 'es',
      mode: 'bot_duel',
      outcome: 'loss',
      reason: 'attempts_exhausted',
      resultId: 'local-human-win',
    }));
    const params = new URLSearchParams(href.split('?')[1] ?? '');
    const source = parseWordDuelResultSourceParams({
      lang: params.get('lang') ?? undefined,
      mode: params.get('mode') ?? undefined,
      outcome: params.get('outcome') ?? undefined,
      reason: params.get('reason') ?? undefined,
      resultId: params.get('resultId') ?? undefined,
    });

    expect(source.kind).toBe('persisted_result');
    expect(source.mode).toBe('human_duel');
    expect(source.viewModel.gameLanguage).toBe('en');
    expect(source.viewModel.outcome).toBe('win');
    expect(source.viewModel.targetReveal.displayWord).toBe('CIDER');
  });
});
