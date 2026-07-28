import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchAccountAvIdentity,
  parseDeletionEligibility,
  redeemDuelWordsPromotionCode,
} from './account-api-client';

vi.mock('expo-constants', () => ({ default: { expoConfig: null } }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAccountAvIdentity', () => {
  it('reads the internal user from the canonical Account AV suite summary envelope', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({
          generatedAt: '2026-07-26T12:00:00.000Z',
          user: {
            displayName: 'DuelWords player',
            email: null,
            id: 'user-internal',
          },
        }),
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        json: async () => ({
          apps: [{ appId: 'duelwordsav', accessMode: 'signedInFree', planTier: 'free' }],
        }),
        ok: true,
        status: 200,
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAccountAvIdentity({
      baseUrl: 'https://api-account-av-preview.avalsys.com',
      getToken: async () => 'test-token',
    })).resolves.toEqual({
      access: { accessMode: 'signedInFree', planTier: 'free' },
      user: { displayName: 'DuelWords player', email: null, id: 'user-internal' },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('parseDeletionEligibility', () => {
  it('keeps backend-owned blockers, warnings, and replay status', () => {
    expect(parseDeletionEligibility({
      status: 'inProgress',
      blockers: [],
      warnings: [{
        type: 'activeBillingSubscription',
        appId: 'tuneav',
        label: 'Tune AV Pro',
        detail: 'Billing can continue until cancelled with Apple.',
        managementUrl: 'https://apps.apple.com/account/subscriptions',
      }],
      currentJob: {
        id: 'job-1',
        status: 'awaitingIdentityDeletion',
        requestedAt: '2026-07-24T10:00:00.000Z',
        completedAt: null,
        notes: null,
      },
    })).toEqual({
      status: 'inProgress',
      blockers: [],
      warnings: [expect.objectContaining({ type: 'activeBillingSubscription', appId: 'tuneav' })],
      currentJob: expect.objectContaining({ id: 'job-1', status: 'awaitingIdentityDeletion' }),
    });
  });

  it('rejects unknown eligibility states instead of guessing locally', () => {
    expect(() => parseDeletionEligibility({ status: 'maybe', blockers: [], warnings: [], currentJob: null }))
      .toThrow('invalid_account_deletion_status');
  });

  it('drops non-HTTPS management links', () => {
    const result = parseDeletionEligibility({
      status: 'eligible',
      blockers: [],
      warnings: [{ type: 'linkedApp', appId: 'seriesav', label: 'Series AV', detail: null, managementUrl: 'http://unsafe.example' }],
      currentJob: null,
    });
    expect(result.warnings[0]?.managementUrl).toBeNull();
  });
});

describe('redeemDuelWordsPromotionCode', () => {
  it('redeems app-scoped Pro access through the authenticated Apps AV route', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        appId: 'duelwordsav',
        code: 'DUEL-PRO',
        redemptionId: 'redemption-1',
        entitlement: {
          accessMode: 'signedInPro',
          appId: 'duelwordsav',
          planTier: 'pro',
        },
      }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(redeemDuelWordsPromotionCode({
      baseUrl: 'https://api-account-av-preview.avalsys.com',
      code: 'DUEL-PRO',
      getToken: async () => 'test-token',
    })).resolves.toEqual({
      appId: 'duelwordsav',
      code: 'DUEL-PRO',
      entitlement: { accessMode: 'signedInPro', planTier: 'pro' },
      redemptionId: 'redemption-1',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api-account-av-preview.avalsys.com/v1/apps/duelwordsav/promotions/redeem',
      expect.objectContaining({
        body: JSON.stringify({ code: 'DUEL-PRO' }),
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'x-appsav-app-id': 'duelwordsav',
        }),
      }),
    );
  });

  it('preserves the backend error code for localized paywall feedback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        error: {
          code: 'promo_code_already_redeemed',
          message: 'This promo code was already used on this account.',
        },
      }),
      ok: false,
      status: 409,
    }));

    const redemption = redeemDuelWordsPromotionCode({
      baseUrl: 'https://api-account-av-preview.avalsys.com',
      code: 'USED-CODE',
      getToken: async () => 'test-token',
    });
    await expect(redemption).rejects.toMatchObject({
      code: 'promo_code_already_redeemed',
      status: 409,
    });
  });
});
