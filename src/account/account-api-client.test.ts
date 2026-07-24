import { describe, expect, it, vi } from 'vitest';

import { parseDeletionEligibility } from './account-api-client';

vi.mock('expo-constants', () => ({ default: { expoConfig: null } }));

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
