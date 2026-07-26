import { describe, expect, it } from 'vitest';

import {
  AccountAuthCancelledError,
  isAccountAuthCancellation,
  isClerkSessionExistsError,
} from './account-auth-errors';

describe('isAccountAuthCancellation', () => {
  it('recognizes the native Apple cancellation code', () => {
    expect(isAccountAuthCancellation({ code: 'ERR_REQUEST_CANCELED' })).toBe(true);
  });

  it('recognizes the Account AV cancellation wrapper', () => {
    expect(isAccountAuthCancellation(new AccountAuthCancelledError())).toBe(true);
  });

  it('does not hide real provider failures as cancellations', () => {
    expect(isAccountAuthCancellation({ code: 'oauth_failed', message: 'Invalid client' })).toBe(false);
  });
});

describe('isClerkSessionExistsError', () => {
  it('recognizes the structured Clerk error without relying on provider copy', () => {
    expect(isClerkSessionExistsError({
      clerkError: true,
      errors: [{ code: 'session_exists' }],
      status: 400,
    })).toBe(true);
    expect(isClerkSessionExistsError({ code: 'session_exists' })).toBe(true);
    expect(isClerkSessionExistsError(new Error('session exists'))).toBe(false);
  });
});
