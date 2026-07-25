import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DuelWordsAccountAvProvider } from './account-av-provider';

const authState = vi.hoisted(() => ({
  isLoaded: true,
  isSignedIn: true,
  tokenCalls: 0,
}));
const fetchAccountAvIdentity = vi.hoisted(() => vi.fn());

vi.mock('@clerk/expo', () => ({
  ClerkProvider: ({ children }: { children: unknown }) => children,
  useAuth: () => ({
    // Clerk may return a new function identity after its session state updates.
    getToken: async () => {
      authState.tokenCalls += 1;
      return 'preview-token';
    },
    isLoaded: authState.isLoaded,
    isSignedIn: authState.isSignedIn,
  }),
  useClerk: () => ({ signOut: vi.fn() }),
  useSSO: () => ({ startSSOFlow: vi.fn() }),
}));

vi.mock('@clerk/expo/apple', () => ({
  useSignInWithApple: () => ({ startAppleAuthenticationFlow: vi.fn() }),
}));

vi.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK: 'after-first-unlock',
  deleteItemAsync: vi.fn(async () => undefined),
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => undefined),
}));

vi.mock('./account-av-config', () => ({
  getDuelWordsAccountAvConfig: () => ({
    accountApiBaseUrl: 'https://api-account-av-preview.avalsys.com',
    keychainAccessGroup: 'test-access-group',
    keychainService: 'test-keychain-service',
    publishableKey: 'pk_test_preview',
  }),
}));

vi.mock('./account-api-client', () => ({ fetchAccountAvIdentity }));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('DuelWordsAccountAvProvider', () => {
  let renderer: ReactTestRenderer | undefined;

  beforeEach(() => {
    authState.isLoaded = true;
    authState.isSignedIn = true;
    authState.tokenCalls = 0;
    fetchAccountAvIdentity.mockReset();
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
      renderer = create(<DuelWordsAccountAvProvider>{null}</DuelWordsAccountAvProvider>);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchAccountAvIdentity).toHaveBeenCalledTimes(1);
    expect(authState.tokenCalls).toBe(1);
  });
});
