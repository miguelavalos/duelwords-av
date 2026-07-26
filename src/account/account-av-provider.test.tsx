import { useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DuelWordsAccountAvProvider, useDuelWordsAccount } from './account-av-provider';

const clerkMocks = vi.hoisted(() => {
  const authState = {
    isLoaded: true,
    isSignedIn: true,
    sessionId: 'session-existing' as string | null,
    tokenCalls: 0,
  };
  const authFlowState = {
    isSignInLoaded: true,
    isSignUpLoaded: true,
  };
  const sessionGetToken = vi.fn(async () => 'activated-session-token');
  type TestSession = { getToken: typeof sessionGetToken; id: string };
  const clerk = {
    client: {
      reload: vi.fn(),
      sessions: [] as TestSession[],
    },
    session: null as TestSession | null,
    setActive: vi.fn(),
    signOut: vi.fn(async () => undefined),
  };
  clerk.client.reload.mockImplementation(async () => clerk.client);
  clerk.setActive.mockImplementation(async ({ session: sessionId }: { session: string }) => {
    const session = { getToken: sessionGetToken, id: sessionId };
    authState.isSignedIn = true;
    authState.sessionId = sessionId;
    clerk.client.sessions = [session];
    clerk.session = session;
  });
  return {
    authState,
    authFlowState,
    clerk,
    sessionGetToken,
    setActive: clerk.setActive,
    startAppleAuthenticationFlow: vi.fn(),
    startSSOFlow: vi.fn(),
  };
});
const fetchAccountAvIdentity = vi.hoisted(() => vi.fn());
const secureStoreMocks = vi.hoisted(() => ({
  deleteItemAsync: vi.fn(async () => undefined),
  getItemAsync: vi.fn(async () => null as string | null),
  setItemAsync: vi.fn(async () => undefined),
}));
const simulatorUITest = vi.hoisted(() => ({
  accountMode: null as 'free' | 'pro' | null,
}));

vi.mock('@clerk/expo', () => ({
  ClerkProvider: ({ children }: { children: unknown }) => children,
  useAuth: () => ({
    // Clerk may return a new function identity after its session state updates.
    getToken: async () => {
      clerkMocks.authState.tokenCalls += 1;
      return 'preview-token';
    },
    isLoaded: clerkMocks.authState.isLoaded,
    isSignedIn: clerkMocks.authState.isSignedIn,
    sessionId: clerkMocks.authState.sessionId,
  }),
  useClerk: () => clerkMocks.clerk,
  useSSO: () => ({ startSSOFlow: clerkMocks.startSSOFlow }),
}));

vi.mock('@clerk/expo/apple', () => ({
  useSignInWithApple: () => ({ startAppleAuthenticationFlow: clerkMocks.startAppleAuthenticationFlow }),
}));

vi.mock('@clerk/expo/legacy', () => ({
  useSignIn: () => ({ isLoaded: clerkMocks.authFlowState.isSignInLoaded }),
  useSignUp: () => ({ isLoaded: clerkMocks.authFlowState.isSignUpLoaded }),
}));

vi.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK: 'after-first-unlock',
  deleteItemAsync: secureStoreMocks.deleteItemAsync,
  getItemAsync: secureStoreMocks.getItemAsync,
  setItemAsync: secureStoreMocks.setItemAsync,
}));

vi.mock('./account-av-config', () => ({
  getDuelWordsAccountAvConfig: () => ({
    accountApiBaseUrl: 'https://api-account-av-preview.avalsys.com',
    iosSsoRedirectUrl: 'com.avalsys.duelwordsav.dev://callback',
    keychainAccessGroup: 'test-access-group',
    keychainService: 'test-keychain-service',
    publishableKey: 'pk_test_preview',
  }),
}));

vi.mock('./account-api-client', () => ({ fetchAccountAvIdentity }));
vi.mock('./simulator-ui-test-runtime', () => ({
  getSimulatorUITestAccountMode: () => simulatorUITest.accountMode,
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type AccountValue = ReturnType<typeof useDuelWordsAccount>;
let accountValue: AccountValue | undefined;

function AccountProbe() {
  const value = useDuelWordsAccount();
  useEffect(() => {
    accountValue = value;
  }, [value]);
  return null;
}

describe('DuelWordsAccountAvProvider', () => {
  let renderer: ReactTestRenderer | undefined;

  beforeEach(() => {
    clerkMocks.authState.isLoaded = true;
    clerkMocks.authState.isSignedIn = true;
    clerkMocks.authState.sessionId = 'session-existing';
    clerkMocks.authState.tokenCalls = 0;
    clerkMocks.authFlowState.isSignInLoaded = true;
    clerkMocks.authFlowState.isSignUpLoaded = true;
    clerkMocks.sessionGetToken.mockReset().mockResolvedValue('activated-session-token');
    clerkMocks.setActive.mockReset().mockImplementation(async ({ session: sessionId }: { session: string }) => {
      const session = { getToken: clerkMocks.sessionGetToken, id: sessionId };
      clerkMocks.authState.isSignedIn = true;
      clerkMocks.authState.sessionId = sessionId;
      clerkMocks.clerk.client.sessions = [session];
      clerkMocks.clerk.session = session;
    });
    clerkMocks.clerk.client.reload.mockReset().mockImplementation(async () => clerkMocks.clerk.client);
    clerkMocks.clerk.signOut.mockClear();
    clerkMocks.startAppleAuthenticationFlow.mockReset();
    clerkMocks.startSSOFlow.mockReset();
    secureStoreMocks.deleteItemAsync.mockClear();
    secureStoreMocks.getItemAsync.mockReset().mockResolvedValue(null);
    secureStoreMocks.setItemAsync.mockClear();
    const existingSession = { getToken: clerkMocks.sessionGetToken, id: 'session-existing' };
    clerkMocks.clerk.client.sessions = [existingSession];
    clerkMocks.clerk.session = existingSession;
    fetchAccountAvIdentity.mockReset();
    simulatorUITest.accountMode = null;
    accountValue = undefined;
  });

  it('uses a tokenless local Pro identity for opted-in simulator UI review', async () => {
    simulatorUITest.accountMode = 'pro';

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
    });

    expect(accountValue).toMatchObject({
      access: { accessMode: 'signedInPro', planTier: 'pro' },
      available: true,
      status: 'signed_in',
      user: {
        displayName: 'UI Test User',
        email: 'ui-test@example.test',
        id: 'duelwords-simulator-ui-test-user',
      },
    });
    await expect(accountValue?.getToken()).resolves.toBeNull();
    await expect(accountValue?.refresh()).resolves.toBeUndefined();
    expect(fetchAccountAvIdentity).not.toHaveBeenCalled();
    expect(clerkMocks.authState.tokenCalls).toBe(0);
  });

  it('keeps provider sign-in unavailable until Clerk sign-in and sign-up resources are loaded', async () => {
    clerkMocks.authFlowState.isSignInLoaded = false;

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
    });

    expect(accountValue?.available).toBe(false);
    await expect(accountValue?.signInWithApple()).rejects.toThrow('still loading');
    expect(clerkMocks.startAppleAuthenticationFlow).not.toHaveBeenCalled();
  });

  afterEach(() => {
    renderer?.unmount();
    renderer = undefined;
  });

  it('resolves the signed-in identity once when Clerk changes getToken identity across renders', async () => {
    fetchAccountAvIdentity
      .mockImplementationOnce(async (input: { getToken: () => Promise<string | null> }) => {
        await input.getToken();
        return {
          access: { accessMode: 'signedInFree', planTier: 'free' },
          user: { displayName: 'Preview user', email: null, id: 'user-preview' },
        };
      })
      // Keep a runaway second refresh observable without allowing it to spin forever.
      .mockImplementationOnce(async (input: { getToken: () => Promise<string | null> }) => {
        await input.getToken();
        return new Promise(() => undefined);
      });

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchAccountAvIdentity).toHaveBeenCalledTimes(1);
    expect(clerkMocks.authState.tokenCalls).toBe(1);
  });

  it('completes Apple activation before resolving the internal Account AV user from observed auth state', async () => {
    clerkMocks.authState.isSignedIn = false;
    clerkMocks.authState.sessionId = null;
    clerkMocks.clerk.client.sessions = [];
    clerkMocks.clerk.session = null;
    clerkMocks.startAppleAuthenticationFlow.mockResolvedValue({
      createdSessionId: 'session-apple',
      setActive: clerkMocks.setActive,
    });
    fetchAccountAvIdentity.mockImplementation(async (input: { getToken: () => Promise<string | null> }) => {
      expect(await input.getToken()).toBe('preview-token');
      return {
        access: { accessMode: 'signedInPro', planTier: 'pro' },
        user: { displayName: 'Apple player', email: null, id: 'user-apple' },
      };
    });

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
    });
    await act(async () => {
      await accountValue?.signInWithApple();
    });

    expect(clerkMocks.setActive).toHaveBeenCalledWith({ session: 'session-apple' });
    expect(clerkMocks.authState.tokenCalls).toBe(1);
    expect(fetchAccountAvIdentity).toHaveBeenCalledTimes(1);
    expect(accountValue?.status).toBe('signed_in');
    expect(accountValue?.user?.id).toBe('user-apple');
  });

  it('resolves identity from observed auth state without inspecting a stale session snapshot', async () => {
    clerkMocks.authState.isSignedIn = false;
    clerkMocks.authState.sessionId = null;
    clerkMocks.clerk.client.sessions = [];
    clerkMocks.clerk.session = null;
    clerkMocks.setActive.mockImplementationOnce(async ({ session: sessionId }: { session: string }) => {
      clerkMocks.authState.isSignedIn = true;
      clerkMocks.authState.sessionId = sessionId;
    });
    clerkMocks.clerk.client.reload.mockImplementationOnce(async () => {
      const session = { getToken: clerkMocks.sessionGetToken, id: 'session-apple-delayed' };
      clerkMocks.clerk.client.sessions = [session];
      clerkMocks.clerk.session = session;
      return clerkMocks.clerk.client;
    });
    clerkMocks.startAppleAuthenticationFlow.mockResolvedValue({
      createdSessionId: 'session-apple-delayed',
      setActive: clerkMocks.setActive,
    });
    fetchAccountAvIdentity.mockResolvedValue({
      access: { accessMode: 'signedInFree', planTier: 'free' },
      user: { displayName: 'Apple player', email: null, id: 'user-apple-delayed' },
    });

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
    });
    await act(async () => {
      await accountValue?.signInWithApple();
    });

    expect(clerkMocks.clerk.client.reload).not.toHaveBeenCalled();
    expect(fetchAccountAvIdentity).toHaveBeenCalledTimes(1);
    expect(accountValue?.status).toBe('signed_in');
    expect(accountValue?.user?.id).toBe('user-apple-delayed');
  });

  it('completes Google activation before resolving the internal Account AV user from observed auth state', async () => {
    clerkMocks.authState.isSignedIn = false;
    clerkMocks.authState.sessionId = null;
    clerkMocks.clerk.client.sessions = [];
    clerkMocks.clerk.session = null;
    clerkMocks.startSSOFlow.mockResolvedValue({
      authSessionResult: { type: 'success' },
      createdSessionId: 'session-google',
      setActive: clerkMocks.setActive,
    });
    fetchAccountAvIdentity.mockImplementation(async (input: { getToken: () => Promise<string | null> }) => {
      expect(await input.getToken()).toBe('preview-token');
      return {
        access: { accessMode: 'signedInFree', planTier: 'free' },
        user: { displayName: 'Google player', email: null, id: 'user-google' },
      };
    });

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
    });
    await act(async () => {
      await accountValue?.signInWithGoogle();
    });

    expect(clerkMocks.startSSOFlow).toHaveBeenCalledWith({
      redirectUrl: 'com.avalsys.duelwordsav.dev://callback',
      strategy: 'oauth_google',
    });
    expect(clerkMocks.setActive).toHaveBeenCalledWith({ session: 'session-google' });
    expect(clerkMocks.authState.tokenCalls).toBe(1);
    expect(fetchAccountAvIdentity).toHaveBeenCalledTimes(1);
    expect(accountValue?.status).toBe('signed_in');
    expect(accountValue?.user?.id).toBe('user-google');
  });

  it('restores a persisted Clerk session before opening Google SSO', async () => {
    clerkMocks.authState.isSignedIn = false;
    clerkMocks.authState.sessionId = null;
    const persistedSession = { getToken: clerkMocks.sessionGetToken, id: 'session-persisted' };
    clerkMocks.clerk.client.sessions = [persistedSession];
    clerkMocks.clerk.session = null;
    fetchAccountAvIdentity.mockResolvedValue({
      access: { accessMode: 'signedInFree', planTier: 'free' },
      user: { displayName: 'Returning player', email: null, id: 'user-returning' },
    });

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
    });
    await act(async () => {
      await accountValue?.signInWithGoogle();
    });

    expect(clerkMocks.startSSOFlow).not.toHaveBeenCalled();
    expect(clerkMocks.setActive).toHaveBeenCalledWith({ session: 'session-persisted' });
    expect(fetchAccountAvIdentity).toHaveBeenCalledTimes(1);
    expect(accountValue?.status).toBe('signed_in');
    expect(accountValue?.user?.id).toBe('user-returning');
  });

  it('recovers Apple sign-in when Clerk reports that a session already exists', async () => {
    clerkMocks.authState.isSignedIn = false;
    clerkMocks.authState.sessionId = null;
    clerkMocks.clerk.client.sessions = [];
    clerkMocks.clerk.session = null;
    clerkMocks.startAppleAuthenticationFlow.mockImplementation(async () => {
      clerkMocks.clerk.client.sessions = [{
        getToken: clerkMocks.sessionGetToken,
        id: 'session-recovered',
      }];
      throw {
        clerkError: true,
        errors: [{ code: 'session_exists' }],
        status: 400,
      };
    });
    fetchAccountAvIdentity.mockResolvedValue({
      access: { accessMode: 'signedInFree', planTier: 'free' },
      user: { displayName: 'Recovered player', email: null, id: 'user-recovered' },
    });

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
    });
    await act(async () => {
      await accountValue?.signInWithApple();
    });

    expect(clerkMocks.clerk.client.reload).toHaveBeenCalledTimes(1);
    expect(clerkMocks.setActive).toHaveBeenCalledWith({ session: 'session-recovered' });
    expect(fetchAccountAvIdentity).toHaveBeenCalledTimes(1);
    expect(accountValue?.status).toBe('signed_in');
    expect(accountValue?.user?.id).toBe('user-recovered');
  });

  it('keeps provider activation successful when the bounded Account AV refresh fails', async () => {
    clerkMocks.authState.isSignedIn = false;
    clerkMocks.authState.sessionId = null;
    clerkMocks.clerk.client.sessions = [];
    clerkMocks.clerk.session = null;
    clerkMocks.startAppleAuthenticationFlow.mockResolvedValue({
      createdSessionId: 'session-offline',
      setActive: clerkMocks.setActive,
    });
    fetchAccountAvIdentity.mockRejectedValue(new Error('account_api_unavailable'));

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
    });
    let signInError: unknown;
    await act(async () => {
      try {
        await accountValue?.signInWithApple();
      } catch (error) {
        signInError = error;
      }
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(signInError).toBeUndefined();
    expect(fetchAccountAvIdentity).toHaveBeenCalledTimes(1);
    expect(accountValue?.status).toBe('account_error');
  });

  it('restores the last internal Account AV user when startup resolution is temporarily unavailable', async () => {
    secureStoreMocks.getItemAsync.mockResolvedValue(JSON.stringify({
      access: { accessMode: 'signedInPro', planTier: 'pro' },
      user: { displayName: 'Cached player', email: null, id: 'user-cached' },
    }));
    fetchAccountAvIdentity.mockRejectedValue(new Error('account_api_unavailable'));

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(accountValue?.status).toBe('signed_in_offline');
    expect(accountValue?.user?.id).toBe('user-cached');
    expect(accountValue?.access.planTier).toBe('pro');
    expect(clerkMocks.clerk.signOut).not.toHaveBeenCalled();
  });

  it('preserves the current internal user when a manual refresh temporarily fails', async () => {
    fetchAccountAvIdentity.mockResolvedValueOnce({
      access: { accessMode: 'signedInFree', planTier: 'free' },
      user: { displayName: 'Current player', email: null, id: 'user-current' },
    });

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
      await Promise.resolve();
    });
    fetchAccountAvIdentity.mockRejectedValueOnce(new Error('account_api_unavailable'));
    await act(async () => {
      await accountValue?.refresh();
    });

    expect(accountValue?.status).toBe('signed_in_offline');
    expect(accountValue?.user?.id).toBe('user-current');
    expect(clerkMocks.clerk.signOut).not.toHaveBeenCalled();
  });

  it('clears the internal identity after a confirmed signed-out restore', async () => {
    clerkMocks.authState.isSignedIn = false;
    clerkMocks.authState.sessionId = null;
    clerkMocks.clerk.client.sessions = [];
    clerkMocks.clerk.session = null;

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(accountValue?.status).toBe('guest');
    expect(accountValue?.user).toBeNull();
    expect(secureStoreMocks.deleteItemAsync).toHaveBeenCalled();
  });

  it('clears provider and internal state only on explicit sign-out', async () => {
    fetchAccountAvIdentity.mockResolvedValue({
      access: { accessMode: 'signedInFree', planTier: 'free' },
      user: { displayName: 'Current player', email: null, id: 'user-current' },
    });

    await act(async () => {
      renderer = create(<DuelWordsAccountAvProvider><AccountProbe /></DuelWordsAccountAvProvider>);
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      await accountValue?.signOut();
    });

    expect(clerkMocks.clerk.signOut).toHaveBeenCalledTimes(1);
    expect(secureStoreMocks.deleteItemAsync).toHaveBeenCalled();
    expect(accountValue?.status).toBe('guest');
    expect(accountValue?.user).toBeNull();
  });
});
