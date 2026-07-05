import { describe, expect, it } from 'vitest';

import { createDuelWordsRuntimeApiClient } from './runtime-api-client';

describe('DuelWords runtime Apps AV API client factory', () => {
  it('fails closed by default without constructing a network client', () => {
    expect(createDuelWordsRuntimeApiClient()).toEqual({
      client: null,
      ok: false,
      reason: 'disabled_by_config',
      runtimeConfig: {
        apiBaseUrl: null,
        disabledReason: 'disabled_by_config',
        provider: 'disabled',
      },
      source: 'disabled',
    });
  });

  it('keeps a disabled runtime config as a non-network result', () => {
    expect(
      createDuelWordsRuntimeApiClient({
        runtimeConfig: {
          apiBaseUrl: null,
          disabledReason: 'invalid_api_base_url',
          provider: 'disabled',
        },
      }),
    ).toMatchObject({
      client: null,
      ok: false,
      reason: 'invalid_api_base_url',
      source: 'disabled',
    });
  });

  it('creates the injected HTTP client only when the runtime config is enabled', async () => {
    const calls: string[] = [];
    const response = new Response(JSON.stringify({
      invite: {
        challengeName: 'Word Duel',
        expiresAt: '2026-07-05T10:10:00.000Z',
        gameLanguage: 'en',
        gameName: 'DuelWords AV',
        hostSafeDisplayName: 'Host',
        inviteToken: 'dwr_room_1',
        joinAvailability: 'joinable',
        maxAttempts: 6,
        mode: 'human_duel',
        playerCount: 1,
        roomCode: 'ABCD-1234',
        roomState: 'waiting_for_opponent',
        settingsLocked: true,
        solutionSelected: false,
        wordLength: 5,
      },
    }));
    const fetchImpl: typeof fetch = async (input) => {
      calls.push(String(input));
      return response;
    };
    const bundle = createDuelWordsRuntimeApiClient({
      fetchImpl,
      platform: 'ios',
      runtimeConfig: {
        apiBaseUrl: 'https://api-account-av-preview.avalsys.com',
        disabledReason: null,
        provider: 'apps_av_api',
      },
    });

    expect(bundle.ok).toBe(true);
    if (!bundle.ok) {
      throw new Error('Expected enabled runtime API client.');
    }
    await expect(bundle.client.getInvitePreview({ inviteToken: 'dwr_room_1' })).resolves.toMatchObject({
      invite: {
        inviteToken: 'dwr_room_1',
      },
    });
    expect(calls).toEqual([
      'https://api-account-av-preview.avalsys.com/v1/apps/duelwords/invites/dwr_room_1',
    ]);
  });
});
