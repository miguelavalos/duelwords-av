import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

import {
  createDuelWordsDiagnosticsConfig,
  createDuelWordsDiagnosticsReleaseName,
  createDuelWordsResultFinalizationErrorEvent,
  initializeDuelWordsDiagnostics,
  sanitizeDiagnosticsEvent,
  scrubDuelWordsDiagnosticsPayload,
  type DuelWordsDiagnosticsConfig,
  type DuelWordsDiagnosticsEvent,
  type DuelWordsDiagnosticsMode,
  type DuelWordsDiagnosticsRouteGroup,
} from './sentry-facade';

let cachedDiagnosticsConfig: DuelWordsDiagnosticsConfig | null = null;

const SAFE_BREADCRUMB_CATEGORIES = new Set([
  'screen.opened',
  'link.opened',
  'room.state_changed',
  'realtime.connection',
  'api.error',
  'submit.result',
  'game.finalized',
  'result.finalization_failed',
  'ad.state',
  'pro.state',
  'diagnostics.smoke',
]);

export function ensureDuelWordsDiagnosticsReady(): DuelWordsDiagnosticsConfig {
  if (cachedDiagnosticsConfig !== null) {
    return cachedDiagnosticsConfig;
  }

  const runtime = readRuntimeInfo();
  const extra = runtime.extra;
  const version = runtime.version;
  const buildNumber = runtime.buildNumber;
  const release = createDuelWordsDiagnosticsReleaseName({
    buildNumber,
    bundleIdentifier: runtime.bundleIdentifier,
    version,
  });
  const platform = runtime.platform;
  const isDebug = typeof __DEV__ === 'undefined' ? true : __DEV__;
  const environment = extra?.sentry?.environment ?? (isDebug ? 'debug' : 'preview');

  cachedDiagnosticsConfig = initializeDuelWordsDiagnostics(createDuelWordsDiagnosticsConfig({
    buildNumber,
    debug: isDebug,
    dsn: extra?.sentry?.dsn ?? null,
    environment,
    platform,
    release,
  }), {
    init(config) {
      getSentrySdk().init({
        beforeBreadcrumb: sanitizeSdkBreadcrumb,
        beforeSend: sanitizeSdkEvent,
        debug: false,
        dsn: config.dsn ?? undefined,
        enableAutoPerformanceTracing: false,
        enableNative: true,
        enableNativeCrashHandling: true,
        environment: config.environment,
        release: config.release ?? undefined,
        sendDefaultPii: false,
        tracesSampleRate: config.tracesSampleRate,
      });
    },
  });

  return cachedDiagnosticsConfig;
}

function readRuntimeInfo(): {
  buildNumber: string | null;
  bundleIdentifier: string | null;
  extra?: { sentry?: { dsn?: string | null; environment?: 'debug' | 'preview' | 'production' } };
  platform: 'ios' | 'android' | 'web_fallback';
  version: string | null;
} {
  if (process.env.VITEST) {
    return { buildNumber: null, bundleIdentifier: null, platform: 'web_fallback', version: null };
  }

  // Synchronous lazy imports keep Node-only unit tests away from React Native's Flow entrypoint.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Constants = (require('expo-constants') as typeof import('expo-constants')).default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Platform } = require('react-native') as typeof import('react-native');
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web_fallback';
  const buildNumber = platform === 'ios'
    ? Constants.expoConfig?.ios?.buildNumber ?? null
    : platform === 'android'
      ? Constants.expoConfig?.android?.versionCode?.toString() ?? null
      : null;
  const bundleIdentifier = platform === 'ios'
    ? Constants.expoConfig?.ios?.bundleIdentifier ?? null
    : platform === 'android'
      ? Constants.expoConfig?.android?.package ?? null
      : null;

  return {
    buildNumber,
    bundleIdentifier,
    extra: Constants.expoConfig?.extra?.duelWordsAv,
    platform,
    version: Constants.expoConfig?.version ?? null,
  };
}

export function recordDuelWordsResultFinalizationError(input: {
  error: unknown;
  gameLanguage: string;
  mode: DuelWordsDiagnosticsMode;
  routeGroup: DuelWordsDiagnosticsRouteGroup;
  timestampMs?: number;
}): DuelWordsDiagnosticsEvent {
  const config = ensureDuelWordsDiagnosticsReady();
  const event = createDuelWordsResultFinalizationErrorEvent({
    error: input.error,
    gameLanguage: input.gameLanguage,
    mode: input.mode,
    routeGroup: input.routeGroup,
    timestampMs: input.timestampMs ?? Date.now(),
  });

  if (config.enabled) captureSafeEvent(event);
  return event;
}

function captureSafeEvent(event: DuelWordsDiagnosticsEvent) {
  const Sentry = getSentrySdk();
  Sentry.withScope((scope) => {
    scope.clearBreadcrumbs();
    for (const breadcrumb of event.breadcrumbs ?? []) {
      scope.addBreadcrumb({
        category: breadcrumb.category,
        data: breadcrumb.data,
        level: breadcrumb.level,
        timestamp: breadcrumb.timestampMs / 1_000,
      });
    }
    scope.setTags(event.tags);
    scope.setExtras(event.extra ?? {});
    for (const [name, context] of Object.entries(event.contexts ?? {})) {
      if (context && typeof context === 'object' && !Array.isArray(context)) {
        scope.setContext(name, context as Record<string, unknown>);
      }
    }
    scope.setUser(null);
    Sentry.captureMessage(event.message, event.level);
  });
}

function getSentrySdk(): typeof import('@sentry/react-native') {
  // The SDK is loaded only after the no-DSN/debug guard has enabled diagnostics.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@sentry/react-native') as typeof import('@sentry/react-native');
}

function sanitizeSdkBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (!breadcrumb.category || !SAFE_BREADCRUMB_CATEGORIES.has(breadcrumb.category)) return null;
  return {
    ...breadcrumb,
    data: scrubDuelWordsDiagnosticsPayload(breadcrumb.data ?? {}) as Record<string, unknown>,
    message: undefined,
  };
}

function sanitizeSdkEvent(event: ErrorEvent): ErrorEvent | null {
  const safeEnvelope = sanitizeDiagnosticsEvent({
    breadcrumbs: [],
    contexts: event.contexts as Record<string, unknown> | undefined,
    extra: event.extra,
    level: 'error',
    message: event.message?.startsWith('duelwordsav.') ? event.message : 'duelwordsav.runtime.error',
    tags: Object.fromEntries(Object.entries(event.tags ?? {}).map(([key, value]) => [key, String(value)])),
  });

  return {
    ...event,
    breadcrumbs: event.breadcrumbs?.map(sanitizeSdkBreadcrumb).filter((item): item is Breadcrumb => item !== null),
    contexts: safeEnvelope.contexts as ErrorEvent['contexts'],
    exception: event.exception ? {
      ...event.exception,
      values: event.exception.values?.map((exception) => ({
        ...exception,
        value: exception.type || 'RuntimeError',
      })),
    } : undefined,
    extra: safeEnvelope.extra,
    message: safeEnvelope.message,
    request: undefined,
    tags: safeEnvelope.tags,
    transaction: undefined,
    user: undefined,
  };
}
