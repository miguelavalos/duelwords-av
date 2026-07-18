export type DuelWordsDiagnosticsPlatform = 'ios' | 'android' | 'web_fallback';
export type DuelWordsDiagnosticsEnvironment = 'debug' | 'preview' | 'production';
export type DuelWordsDiagnosticsAccountState = 'guest' | 'signed_in_free' | 'signed_in_pro' | 'unknown';
export type DuelWordsDiagnosticsMode = 'human_duel' | 'bot_duel' | 'solo' | 'daily';
export type DuelWordsDiagnosticsRouteGroup = 'play' | 'lobby' | 'active_duel' | 'result' | 'settings' | 'fallback';
export type DuelWordsDiagnosticsBreadcrumbCategory =
  | 'screen.opened'
  | 'link.opened'
  | 'room.state_changed'
  | 'realtime.connection'
  | 'api.error'
  | 'submit.result'
  | 'game.finalized'
  | 'result.finalization_failed'
  | 'ad.state'
  | 'pro.state'
  | 'diagnostics.smoke';
export type DuelWordsDiagnosticsLevel = 'debug' | 'info' | 'warning' | 'error';

export type DuelWordsDiagnosticsConfig = {
  appId: 'duelwordsav';
  buildNumber: string | null;
  dsn: string | null;
  enabled: boolean;
  environment: DuelWordsDiagnosticsEnvironment;
  platform: DuelWordsDiagnosticsPlatform;
  reasonDisabled: DuelWordsDiagnosticsDisabledReason | null;
  release: string | null;
  tracesSampleRate: 0;
};

export type DuelWordsDiagnosticsDisabledReason =
  | 'missing_dsn'
  | 'debug_disabled'
  | 'unsupported_platform';

export type DuelWordsDiagnosticsBreadcrumb = {
  category: DuelWordsDiagnosticsBreadcrumbCategory;
  data: Record<string, unknown>;
  level: DuelWordsDiagnosticsLevel;
  timestampMs: number;
};

export type DuelWordsDiagnosticsEvent = {
  breadcrumbs?: DuelWordsDiagnosticsBreadcrumb[];
  contexts?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  level: DuelWordsDiagnosticsLevel;
  message: string;
  tags: Record<string, string>;
  user?: never;
};

export type DuelWordsDiagnosticsClient = {
  init(config: DuelWordsDiagnosticsConfig): void;
};

export const DUELWORDS_DIAGNOSTICS_SCHEMA_VERSION = 1;

const MAX_SAFE_STRING_LENGTH = 160;
const REDACTED_VALUE = '[redacted]';
const FORBIDDEN_KEY_PARTS = [
  'account',
  'auth',
  'board',
  'candidate',
  'clipboard',
  'convex',
  'd1',
  'dictionary',
  'displayword',
  'email',
  'feedback',
  'gameid',
  'guess',
  'guest',
  'invite',
  'letter',
  'normalized',
  'playerid',
  'provider',
  'push',
  'replay',
  'room',
  'session',
  'share',
  'solution',
  'target',
  'token',
  'url',
  'word',
  'payload',
] as const;
const SAFE_TAG_KEYS = new Set([
  'account_state',
  'app_id',
  'build_number',
  'environment',
  'game_language',
  'mode',
  'platform',
  'release',
  'route_group',
  'safe_error_category',
  'schema_version',
  'smoke_id',
]);

export function createDuelWordsDiagnosticsConfig(input: {
  allowDebugEvents?: boolean;
  buildNumber?: string | null;
  debug?: boolean;
  dsn?: string | null;
  environment: DuelWordsDiagnosticsEnvironment;
  platform: DuelWordsDiagnosticsPlatform;
  release?: string | null;
}): DuelWordsDiagnosticsConfig {
  const dsn = normalizeDsn(input.dsn);
  const debug = input.debug ?? input.environment === 'debug';
  const supportedPlatform = input.platform === 'ios' || input.platform === 'android';
  const reasonDisabled: DuelWordsDiagnosticsDisabledReason | null = !supportedPlatform
    ? 'unsupported_platform'
    : dsn === null
      ? 'missing_dsn'
      : debug && !input.allowDebugEvents
        ? 'debug_disabled'
        : null;

  return {
    appId: 'duelwordsav',
    buildNumber: input.buildNumber ?? null,
    dsn,
    enabled: reasonDisabled === null,
    environment: input.environment,
    platform: input.platform,
    reasonDisabled,
    release: input.release ?? null,
    tracesSampleRate: 0,
  };
}

export function initializeDuelWordsDiagnostics(
  config: DuelWordsDiagnosticsConfig,
  client?: DuelWordsDiagnosticsClient,
): DuelWordsDiagnosticsConfig {
  if (config.enabled) {
    client?.init(config);
  }

  return config;
}

export function createDuelWordsDiagnosticsSmokeEvent(input: {
  buildNumber?: string | null;
  environment: Exclude<DuelWordsDiagnosticsEnvironment, 'debug'>;
  platform: Extract<DuelWordsDiagnosticsPlatform, 'ios' | 'android'>;
  release?: string | null;
  smokeId: string;
}): DuelWordsDiagnosticsEvent {
  return sanitizeDiagnosticsEvent({
    level: 'info',
    message: 'duelwordsav.diagnostics.smoke',
    tags: {
      app_id: 'duelwordsav',
      build_number: input.buildNumber ?? 'unknown',
      environment: input.environment,
      platform: input.platform,
      release: input.release ?? 'unknown',
      schema_version: String(DUELWORDS_DIAGNOSTICS_SCHEMA_VERSION),
      smoke_id: input.smokeId,
    },
    extra: {
      no_spoilers: true,
      schema_version: DUELWORDS_DIAGNOSTICS_SCHEMA_VERSION,
    },
  });
}

export function createDuelWordsResultFinalizationErrorEvent(input: {
  error: unknown;
  gameLanguage: string;
  mode: DuelWordsDiagnosticsMode;
  routeGroup: DuelWordsDiagnosticsRouteGroup;
  timestampMs: number;
}): DuelWordsDiagnosticsEvent {
  return sanitizeDiagnosticsEvent({
    breadcrumbs: [
      createSafeDuelWordsBreadcrumb({
        category: 'result.finalization_failed',
        data: {
          mode: input.mode,
          route_group: input.routeGroup,
          safe_error_category: 'result-finalization-failed',
        },
        level: 'error',
        timestampMs: input.timestampMs,
      }),
    ],
    extra: {
      error_name: safeErrorName(input.error),
      no_spoilers: true,
      schema_version: DUELWORDS_DIAGNOSTICS_SCHEMA_VERSION,
    },
    level: 'error',
    message: 'duelwordsav.result-finalization.failed',
    tags: {
      app_id: 'duelwordsav',
      game_language: input.gameLanguage,
      mode: input.mode,
      route_group: input.routeGroup,
      safe_error_category: 'result-finalization-failed',
      schema_version: String(DUELWORDS_DIAGNOSTICS_SCHEMA_VERSION),
    },
  });
}

export function createSafeDuelWordsBreadcrumb(input: {
  category: DuelWordsDiagnosticsBreadcrumbCategory;
  data?: Record<string, unknown>;
  level?: DuelWordsDiagnosticsLevel;
  timestampMs: number;
}): DuelWordsDiagnosticsBreadcrumb {
  return {
    category: input.category,
    data: scrubDuelWordsDiagnosticsPayload(input.data ?? {}) as Record<string, unknown>,
    level: input.level ?? 'info',
    timestampMs: input.timestampMs,
  };
}

export function sanitizeDiagnosticsEvent(event: DuelWordsDiagnosticsEvent): DuelWordsDiagnosticsEvent {
  const scrubbedTags = scrubTags(event.tags);
  const scrubbedExtra = event.extra
    ? (scrubDuelWordsDiagnosticsPayload(event.extra) as Record<string, unknown>)
    : undefined;
  const scrubbedContexts = event.contexts
    ? (scrubDuelWordsDiagnosticsPayload(event.contexts) as Record<string, unknown>)
    : undefined;

  return {
    breadcrumbs: event.breadcrumbs?.map((breadcrumb) => ({
      ...breadcrumb,
      data: scrubDuelWordsDiagnosticsPayload(breadcrumb.data) as Record<string, unknown>,
    })),
    contexts: scrubbedContexts,
    extra: scrubbedExtra,
    level: event.level,
    message: sanitizeString(event.message, 'message'),
    tags: scrubbedTags,
  };
}

export function scrubDuelWordsDiagnosticsPayload(value: unknown, keyPath: string[] = []): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubDuelWordsDiagnosticsPayload(item, keyPath));
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    let redactedCount = 0;

    for (const [rawKey, rawValue] of Object.entries(value)) {
      const safeKey = sanitizeKey(rawKey);
      if (isForbiddenKey(rawKey) || safeKey === null) {
        redactedCount += 1;
        continue;
      }

      output[safeKey] = scrubDuelWordsDiagnosticsPayload(rawValue, [...keyPath, rawKey]);
    }

    if (redactedCount > 0) {
      output.redacted_count = redactedCount;
    }

    return output;
  }

  if (typeof value === 'string') {
    return sanitizeString(value, keyPath[keyPath.length - 1] ?? '');
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return REDACTED_VALUE;
}

function scrubTags(tags: Record<string, string>): Record<string, string> {
  const safeTags: Record<string, string> = {};

  for (const [key, value] of Object.entries(tags)) {
    if (key === 'release' && isSafeRelease(value)) {
      safeTags[key] = truncateSafeString(value);
      continue;
    }

    if (SAFE_TAG_KEYS.has(key) && !isForbiddenValue(value)) {
      safeTags[key] = sanitizeString(value, key);
    }
  }

  return safeTags;
}

function normalizeDsn(dsn: string | null | undefined): string | null {
  const normalized = dsn?.trim() ?? '';
  if (normalized.length === 0) {
    return null;
  }

  return normalized;
}

function sanitizeKey(key: string): string | null {
  const normalized = key.trim().replace(/[^A-Za-z0-9_]/g, '_').slice(0, 48);
  if (normalized.length === 0 || isForbiddenKey(normalized)) {
    return null;
  }

  return normalized;
}

function sanitizeString(value: string, key: string): string {
  if (isForbiddenKey(key) || isForbiddenValue(value)) {
    return REDACTED_VALUE;
  }

  const url = safeUrl(value);
  if (url !== null) {
    return url;
  }

  return truncateSafeString(value);
}

function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return `${url.origin}/[path-redacted]`;
  } catch {
    return null;
  }
}

function isForbiddenKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return FORBIDDEN_KEY_PARTS.some((part) => normalized.includes(part));
}

function isForbiddenValue(value: string): boolean {
  if (/\b[^@\s]+@[^@\s]+\.[^@\s]+\b/.test(value)) {
    return true;
  }

  if (/bearer\s+[a-z0-9._-]+/i.test(value)) {
    return true;
  }

  if (/(token|secret|provider|email|auth|push|target|guess|feedback|board|letter|room|invite|share|convex|d1|dictionary)/i.test(value)) {
    return true;
  }

  if (/[a-z]+_[a-z0-9]{8,}/i.test(value)) {
    return true;
  }

  return false;
}

function isSafeRelease(value: string): boolean {
  return /^[A-Za-z0-9._-]+@[A-Za-z0-9._+-]+$/.test(value) && !/(token|secret|provider|email|auth|push|target|guess|feedback|board|letter|room|invite|share|convex|d1|dictionary)/i.test(value);
}

function safeErrorName(error: unknown): string {
  if (error instanceof Error && error.name.trim().length > 0) {
    return error.name;
  }

  return typeof error;
}

function truncateSafeString(value: string): string {
  return value.length > MAX_SAFE_STRING_LENGTH ? `${value.slice(0, MAX_SAFE_STRING_LENGTH)}...` : value;
}
