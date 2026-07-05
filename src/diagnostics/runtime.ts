import {
  createDuelWordsDiagnosticsConfig,
  createDuelWordsResultFinalizationErrorEvent,
  initializeDuelWordsDiagnostics,
  type DuelWordsDiagnosticsConfig,
  type DuelWordsDiagnosticsEvent,
  type DuelWordsDiagnosticsMode,
  type DuelWordsDiagnosticsRouteGroup,
} from './sentry-facade';

let cachedDiagnosticsConfig: DuelWordsDiagnosticsConfig | null = null;

export function ensureDuelWordsDiagnosticsReady(): DuelWordsDiagnosticsConfig {
  if (cachedDiagnosticsConfig !== null) {
    return cachedDiagnosticsConfig;
  }

  cachedDiagnosticsConfig = initializeDuelWordsDiagnostics(
    createDuelWordsDiagnosticsConfig({
      debug: true,
      dsn: null,
      environment: 'debug',
      platform: 'web_fallback',
      release: 'duelwordsav-local',
    }),
  );

  return cachedDiagnosticsConfig;
}

export function recordDuelWordsResultFinalizationError(input: {
  error: unknown;
  gameLanguage: string;
  mode: DuelWordsDiagnosticsMode;
  routeGroup: DuelWordsDiagnosticsRouteGroup;
  timestampMs?: number;
}): DuelWordsDiagnosticsEvent {
  ensureDuelWordsDiagnosticsReady();

  return createDuelWordsResultFinalizationErrorEvent({
    error: input.error,
    gameLanguage: input.gameLanguage,
    mode: input.mode,
    routeGroup: input.routeGroup,
    timestampMs: input.timestampMs ?? Date.now(),
  });
}
