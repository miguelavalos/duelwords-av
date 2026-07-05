import { describe, expect, it } from 'vitest';

import { localWordDuelResultRepository } from './local-result-repository';
import { createWordDuelResultLocalPayload } from './view-model';
import {
  createDefaultWordDuelResultSource,
  createWordDuelResultSource,
} from './source';

describe('word duel result source', () => {
  it('resolves route demo params into a view model', () => {
    const source = createWordDuelResultSource({
      gameLanguage: 'es',
      mode: 'bot_duel',
      outcome: 'loss',
      resultReason: 'solved',
    });

    expect(source.kind).toBe('route_demo');
    expect(source.mode).toBe('bot_duel');
    expect(source.viewModel.gameLanguage).toBe('es');
    expect(source.viewModel.outcome).toBe('loss');
    expect(source.viewModel.resultReason).toBe('solved');
  });

  it('prefers local payload data over route demo outcome data', () => {
    const localPayload = createWordDuelResultLocalPayload({
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

    const source = createWordDuelResultSource({
      gameLanguage: 'es',
      localPayload,
      mode: 'solo_practice',
      outcome: 'loss',
      resultReason: 'attempts_exhausted',
    });

    expect(source.kind).toBe('local_payload');
    expect(source.mode).toBe('solo_practice');
    expect(source.viewModel.gameLanguage).toBe('en');
    expect(source.viewModel.outcome).toBe('win');
    expect(source.viewModel.targetReveal.displayWord).toBe('CRANE');
  });

  it('loads a local mock persisted result by resultId before route params', () => {
    const source = createWordDuelResultSource({
      gameLanguage: 'es',
      mode: 'solo_practice',
      outcome: 'loss',
      resultId: 'local-human-win',
      resultRepository: localWordDuelResultRepository,
      resultReason: 'attempts_exhausted',
    });

    expect(source.kind).toBe('persisted_result');
    expect(source.mode).toBe('human_duel');
    expect(source.viewModel.gameLanguage).toBe('en');
    expect(source.viewModel.outcome).toBe('win');
    expect(source.viewModel.targetReveal.displayWord).toBe('CIDER');
    expect(source.viewModel.opponent.safeDisplayName).toBe('Rival');
  });

  it('falls back to local payload when resultId is unknown', () => {
    const localPayload = createWordDuelResultLocalPayload({
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

    const source = createWordDuelResultSource({
      gameLanguage: 'es',
      localPayload,
      mode: 'solo_practice',
      outcome: 'loss',
      resultId: 'missing-result',
      resultRepository: localWordDuelResultRepository,
      resultReason: 'attempts_exhausted',
    });

    expect(source.kind).toBe('local_payload');
    expect(source.viewModel.targetReveal.displayWord).toBe('CRANE');
  });

  it('does not resolve persisted ids without an injected repository', () => {
    const source = createWordDuelResultSource({
      gameLanguage: 'es',
      mode: 'bot_duel',
      outcome: 'loss',
      resultId: 'local-human-win',
      resultReason: 'attempts_exhausted',
    });

    expect(source.kind).toBe('route_demo');
    expect(source.mode).toBe('bot_duel');
    expect(source.viewModel.gameLanguage).toBe('es');
    expect(source.viewModel.outcome).toBe('loss');
  });

  it('keeps a stable default source for direct component previews', () => {
    const source = createDefaultWordDuelResultSource();

    expect(source.kind).toBe('route_demo');
    expect(source.mode).toBe('human_duel');
    expect(source.viewModel.outcome).toBe('win');
  });
});
