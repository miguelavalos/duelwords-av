import { describe, expect, it } from 'vitest';

import {
  createDuelWordsDiagnosticsConfig,
  createDuelWordsDiagnosticsSmokeEvent,
  createDuelWordsResultFinalizationErrorEvent,
  createSafeDuelWordsBreadcrumb,
  initializeDuelWordsDiagnostics,
  sanitizeDiagnosticsEvent,
  scrubDuelWordsDiagnosticsPayload,
  type DuelWordsDiagnosticsClient,
} from './sentry-facade';

describe('duelwords sentry diagnostics facade', () => {
  it('keeps diagnostics disabled without a DSN and in local debug by default', () => {
    const missingDsn = createDuelWordsDiagnosticsConfig({
      dsn: '',
      environment: 'preview',
      platform: 'ios',
    });
    const debugWithDsn = createDuelWordsDiagnosticsConfig({
      dsn: 'https://example.invalid/123',
      environment: 'debug',
      platform: 'ios',
    });
    const webFallback = createDuelWordsDiagnosticsConfig({
      dsn: 'https://example.invalid/123',
      environment: 'preview',
      platform: 'web_fallback',
    });

    expect(missingDsn.enabled).toBe(false);
    expect(missingDsn.reasonDisabled).toBe('missing_dsn');
    expect(debugWithDsn.enabled).toBe(false);
    expect(debugWithDsn.reasonDisabled).toBe('debug_disabled');
    expect(webFallback.enabled).toBe(false);
    expect(webFallback.reasonDisabled).toBe('unsupported_platform');
  });

  it('initializes only when config is explicitly enabled', () => {
    const initCalls: string[] = [];
    const client: DuelWordsDiagnosticsClient = {
      init(config) {
        initCalls.push(`${config.platform}:${config.environment}`);
      },
    };

    initializeDuelWordsDiagnostics(
      createDuelWordsDiagnosticsConfig({
        dsn: '',
        environment: 'preview',
        platform: 'ios',
      }),
      client,
    );
    initializeDuelWordsDiagnostics(
      createDuelWordsDiagnosticsConfig({
        allowDebugEvents: true,
        dsn: 'https://example.invalid/123',
        environment: 'debug',
        platform: 'android',
      }),
      client,
    );

    expect(initCalls).toEqual(['android:debug']);
  });

  it('creates a safe no-spoiler smoke event without user context', () => {
    const smoke = createDuelWordsDiagnosticsSmokeEvent({
      buildNumber: '7',
      environment: 'preview',
      platform: 'ios',
      release: 'duelwordsav@0.1.0+7',
      smokeId: 'smoke-safe-001',
    });

    expect(smoke.message).toBe('duelwordsav.diagnostics.smoke');
    expect(smoke.tags).toMatchObject({
      app_id: 'duelwordsav',
      build_number: '7',
      environment: 'preview',
      platform: 'ios',
      release: 'duelwordsav@0.1.0+7',
      smoke_id: 'smoke-safe-001',
    });
    expect('user' in smoke).toBe(false);
    expect(JSON.stringify(smoke)).toContain('"no_spoilers":true');
  });

  it('creates a safe finalization error event without raw error messages or gameplay data', () => {
    const event = createDuelWordsResultFinalizationErrorEvent({
      error: new Error('target FIELD guess ADORE token secret room abc'),
      gameLanguage: 'en',
      mode: 'human_duel',
      routeGroup: 'active_duel',
      timestampMs: 1_000,
    });
    const payload = JSON.stringify(event).toLowerCase();

    expect(event.message).toBe('duelwordsav.result-finalization.failed');
    expect(event.level).toBe('error');
    expect(event.tags).toMatchObject({
      app_id: 'duelwordsav',
      game_language: 'en',
      mode: 'human_duel',
      route_group: 'active_duel',
      safe_error_category: 'result-finalization-failed',
    });
    expect(payload).toContain('no_spoilers');
    expect(payload).toContain('error');
    expect(payload).not.toContain('field');
    expect(payload).not.toContain('adore');
    expect(payload).not.toContain('secret');
    expect(payload).not.toContain('room abc');
    expect(payload).not.toContain('target');
    expect(payload).not.toContain('guess');
    expect('user' in event).toBe(false);
  });

  it('scrubs hidden gameplay, token, URL, and private identity fields', () => {
    const scrubbed = scrubDuelWordsDiagnosticsPayload({
      accountUserId: 'acct_internal_123',
      authToken: 'Bearer secret-auth-token',
      boardRows: [['F', 'I', 'E', 'L', 'D']],
      candidateCount: 428,
      convexDocumentId: 'j571abc',
      d1RowId: 'row_123',
      email: 'player@example.com',
      feedback: ['exact', 'present'],
      gameId: 'game-123',
      guess: 'ADORE',
      inviteUrl: 'https://app.duelwords-av.avalsys.com/i/c/raw-token?lang=es',
      normalizedGuess: 'adore',
      providerSubject: 'user_123456789',
      pushToken: 'ExponentPushToken[secret]',
      request: {
        body: {
          displayWord: 'FIELD',
          letters: ['F', 'I', 'E', 'L', 'D'],
          roomToken: 'room-secret',
          targetWord: 'FIELD',
        },
        safeRouteGroup: 'active_duel',
      },
      shareId: 'share-secret',
    });
    const payload = JSON.stringify(scrubbed).toLowerCase();

    for (const forbidden of [
      'acct_internal_123',
      'secret-auth-token',
      'field',
      'adore',
      'exact',
      'present',
      'game-123',
      'raw-token',
      'player@example.com',
      'user_123456789',
      'exponentpushtoken',
      'room-secret',
      'share-secret',
      'accountuserid',
      'authtoken',
      'boardrows',
      'candidatecount',
      'convexdocumentid',
      'd1rowid',
      'email',
      'feedback',
      'gameid',
      'guess',
      'inviteurl',
      'providesubject',
      'pushtoken',
      'roomtoken',
      'shareid',
      'targetword',
    ]) {
      expect(payload).not.toContain(forbidden);
    }
    expect(payload).toContain('redacted_count');
  });

  it('keeps allowed breadcrumbs coarse and strips unsafe data', () => {
    const breadcrumb = createSafeDuelWordsBreadcrumb({
      category: 'api.error',
      data: {
        category: 'timeout',
        fullUrl: 'https://api.example.invalid/v1/apps/duelwords/games/game-123/rounds/1/submit?token=secret',
        rawPayload: {
          guess: 'MERIT',
          targetWord: 'FIELD',
        },
        route_group: 'active_duel',
      },
      level: 'warning',
      timestampMs: 1_000,
    });
    const payload = JSON.stringify(breadcrumb).toLowerCase();

    expect(breadcrumb.category).toBe('api.error');
    expect(breadcrumb.level).toBe('warning');
    expect(payload).toContain('timeout');
    expect(payload).toContain('active_duel');
    expect(payload).not.toContain('game-123');
    expect(payload).not.toContain('secret');
    expect(payload).not.toContain('merit');
    expect(payload).not.toContain('field');
    expect(payload).not.toContain('rawpayload');
    expect(payload).not.toContain('fullurl');
  });

  it('sanitizes whole diagnostic events before a future Sentry SDK send', () => {
    const event = sanitizeDiagnosticsEvent({
      breadcrumbs: [
        createSafeDuelWordsBreadcrumb({
          category: 'room.state_changed',
          data: {
            room_state: 'countdown',
            unsafeInviteToken: 'invite-secret',
          },
          timestampMs: 1_000,
        }),
      ],
      contexts: {
        gameplay: {
          target: 'FIELD',
        },
      },
      extra: {
        safe_error_category: 'unavailable',
        wordLength: 5,
      },
      level: 'error',
      message: 'safe unavailable category',
      tags: {
        app_id: 'duelwordsav',
        email: 'player@example.com',
        environment: 'preview',
        route_group: 'lobby',
        safe_error_category: 'unavailable',
        token: 'secret',
      },
    });
    const payload = JSON.stringify(event).toLowerCase();

    expect(event.tags).toEqual({
      app_id: 'duelwordsav',
      environment: 'preview',
      route_group: 'lobby',
      safe_error_category: 'unavailable',
    });
    expect(payload).not.toContain('invite-secret');
    expect(payload).not.toContain('player@example.com');
    expect(payload).not.toContain('field');
    expect(payload).not.toContain('wordlength');
    expect(payload).not.toContain('secret');
  });
});
