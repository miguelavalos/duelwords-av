import { ClerkProvider, useAuth, useClerk, useSSO } from '@clerk/expo';
import { useSignInWithApple } from '@clerk/expo/apple';
import { useSignIn as useLegacySignIn, useSignUp as useLegacySignUp } from '@clerk/expo/legacy';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { fetchAccountAvIdentity, type AccountAvInternalUser, type DuelWordsAccess } from './account-api-client';
import { getDuelWordsAccountAvConfig } from './account-av-config';
import {
  AccountAuthCancelledError,
  isAccountAuthCancellation,
  isClerkSessionExistsError,
} from './account-auth-errors';
import { activateCreatedSession } from './account-session-activation';
import { getSimulatorUITestAccountMode } from './simulator-ui-test-runtime';

type AccountStatus = 'account_error' | 'guest' | 'loading' | 'signed_in' | 'signed_in_offline' | 'unavailable';

type AccountAvContextValue = {
  access: DuelWordsAccess;
  available: boolean;
  getToken: () => Promise<string | null>;
  refresh: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  status: AccountStatus;
  user: AccountAvInternalUser | null;
};

const GUEST_ACCESS: DuelWordsAccess = { accessMode: 'guest', planTier: 'free' };
const ACCOUNT_TOKEN_TIMEOUT_MS = 5_000;
const NO_ACCOUNT: AccountAvContextValue = {
  access: GUEST_ACCESS,
  available: false,
  getToken: async () => null,
  refresh: async () => undefined,
  signInWithApple: async () => undefined,
  signInWithGoogle: async () => undefined,
  signOut: async () => undefined,
  status: 'unavailable',
  user: null,
};
const AccountAvContext = createContext<AccountAvContextValue>(NO_ACCOUNT);
const UI_TEST_ACCOUNT = {
  free: createSimulatorUITestAccount('free'),
  pro: createSimulatorUITestAccount('pro'),
} as const;

export function DuelWordsAccountAvProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => getDuelWordsAccountAvConfig(), []);
  const tokenCache = useMemo(() => createTokenCache(config), [config]);
  const identityCache = useMemo(() => createIdentityCache(config), [config]);
  const simulatorUITestAccountMode = getSimulatorUITestAccountMode();
  if (simulatorUITestAccountMode) {
    return (
      <AccountAvContext.Provider value={UI_TEST_ACCOUNT[simulatorUITestAccountMode]}>
        {children}
      </AccountAvContext.Provider>
    );
  }
  if (!config.publishableKey || !config.accountApiBaseUrl) {
    return <AccountAvContext.Provider value={NO_ACCOUNT}>{children}</AccountAvContext.Provider>;
  }

  return (
    <ClerkProvider publishableKey={config.publishableKey} standardBrowser={false} tokenCache={tokenCache}>
      <AccountAvRuntime
        baseUrl={config.accountApiBaseUrl}
        identityCache={identityCache}
        iosSsoRedirectUrl={config.iosSsoRedirectUrl}
      >
        {children}
      </AccountAvRuntime>
    </ClerkProvider>
  );
}

function createSimulatorUITestAccount(mode: 'free' | 'pro'): AccountAvContextValue {
  return {
    access: {
      accessMode: mode === 'pro' ? 'signedInPro' : 'signedInFree',
      planTier: mode,
    },
    available: true,
    getToken: async () => null,
    refresh: async () => undefined,
    signInWithApple: async () => undefined,
    signInWithGoogle: async () => undefined,
    signOut: async () => undefined,
    status: 'signed_in',
    user: {
      displayName: 'UI Test User',
      email: 'ui-test@example.test',
      id: 'duelwords-simulator-ui-test-user',
    },
  };
}

type CachedIdentity = { access: DuelWordsAccess; user: AccountAvInternalUser };
type IdentityCache = {
  clear: () => Promise<void>;
  load: () => Promise<CachedIdentity | null>;
  save: (identity: CachedIdentity) => Promise<void>;
};

function AccountAvRuntime({ baseUrl, children, identityCache, iosSsoRedirectUrl }: {
  baseUrl: string;
  children: ReactNode;
  identityCache: IdentityCache;
  iosSsoRedirectUrl: string;
}) {
  const { getToken, isLoaded, isSignedIn, sessionId } = useAuth({ treatPendingAsSignedOut: false });
  const clerk = useClerk();
  const { isLoaded: isSignInLoaded } = useLegacySignIn();
  const { isLoaded: isSignUpLoaded } = useLegacySignUp();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { startSSOFlow } = useSSO();
  const [user, setUser] = useState<AccountAvInternalUser | null>(null);
  const [access, setAccess] = useState<DuelWordsAccess>(GUEST_ACCESS);
  const [status, setStatus] = useState<AccountStatus>('loading');
  const userRef = useRef<AccountAvInternalUser | null>(null);
  const clerkGetTokenRef = useRef(getToken);
  const automaticResolutionSessionRef = useRef<string | null>(null);
  const providerFlowIsLoaded = isLoaded && isSignInLoaded && isSignUpLoaded;

  useEffect(() => {
    clerkGetTokenRef.current = getToken;
  }, [getToken]);

  const tokenProvider = useCallback(async () => {
    if (!isSignedIn) {
      return null;
    }

    return withTimeout(clerkGetTokenRef.current(), ACCOUNT_TOKEN_TIMEOUT_MS);
  }, [isSignedIn]);
  const publishIdentity = useCallback(async (identityTokenProvider: () => Promise<string | null>) => {
    const identity = await fetchAccountAvIdentity({ baseUrl, getToken: identityTokenProvider });
    await identityCache.save(identity).catch(() => undefined);
    userRef.current = identity.user;
    setUser(identity.user);
    setAccess(identity.access);
    setStatus('signed_in');
  }, [baseUrl, identityCache]);
  const refresh = useCallback(async () => {
    if (!isLoaded) {
      setStatus('loading');
      return;
    }
    if (!isSignedIn) {
      await identityCache.clear().catch(() => undefined);
      automaticResolutionSessionRef.current = null;
      userRef.current = null;
      setUser(null);
      setAccess(GUEST_ACCESS);
      setStatus('guest');
      return;
    }

    if (!userRef.current) {
      const cached = await identityCache.load().catch(() => null);
      if (cached) {
        userRef.current = cached.user;
        setUser(cached.user);
        setAccess(cached.access);
        setStatus('signed_in_offline');
      } else {
        setStatus('loading');
      }
    }
    try {
      await publishIdentity(tokenProvider);
    } catch {
      setStatus(userRef.current ? 'signed_in_offline' : 'account_error');
    }
  }, [identityCache, isLoaded, isSignedIn, publishIdentity, tokenProvider]);

  useEffect(() => {
    if (isSignedIn && sessionId && automaticResolutionSessionRef.current === sessionId) {
      return;
    }
    if (isSignedIn && sessionId) {
      automaticResolutionSessionRef.current = sessionId;
    }
    void refresh();
  }, [isSignedIn, refresh, sessionId]);

  const signOut = useCallback(async () => {
    await clerk.signOut();
    await identityCache.clear().catch(() => undefined);
    automaticResolutionSessionRef.current = null;
    userRef.current = null;
    setUser(null);
    setAccess(GUEST_ACCESS);
    setStatus('guest');
  }, [clerk, identityCache]);

  const signInWithApple = useCallback(async () => {
    if (!providerFlowIsLoaded) {
      throw new Error('Account AV is still loading.');
    }

    if (await restoreExistingSessionIfPossible({
      automaticResolutionSessionRef,
      clerk,
      setStatus,
    })) return;

    try {
      const result = await startAppleAuthenticationFlow();
      await activateCreatedSession(result.createdSessionId, result.setActive);
      automaticResolutionSessionRef.current = null;
      setStatus('loading');
    } catch (error: unknown) {
      if (isClerkSessionExistsError(error) && await restoreExistingSessionIfPossible({
        automaticResolutionSessionRef,
        clerk,
        refreshClient: true,
        setStatus,
      })) return;
      throw isAccountAuthCancellation(error) ? new AccountAuthCancelledError() : error;
    }
  }, [clerk, providerFlowIsLoaded, startAppleAuthenticationFlow]);

  const signInWithGoogle = useCallback(async () => {
    if (!providerFlowIsLoaded) {
      throw new Error('Account AV is still loading.');
    }

    if (await restoreExistingSessionIfPossible({
      automaticResolutionSessionRef,
      clerk,
      setStatus,
    })) return;

    try {
      const result = await startSSOFlow({
        redirectUrl: iosSsoRedirectUrl,
        strategy: 'oauth_google',
      });
      if (result.authSessionResult?.type === 'cancel' || result.authSessionResult?.type === 'dismiss') {
        return Promise.reject(new AccountAuthCancelledError());
      }
      await activateCreatedSession(result.createdSessionId, result.setActive);
      automaticResolutionSessionRef.current = null;
      setStatus('loading');
    } catch (error: unknown) {
      if (isClerkSessionExistsError(error) && await restoreExistingSessionIfPossible({
        automaticResolutionSessionRef,
        clerk,
        refreshClient: true,
        setStatus,
      })) return;
      throw isAccountAuthCancellation(error) ? new AccountAuthCancelledError() : error;
    }
  }, [clerk, iosSsoRedirectUrl, providerFlowIsLoaded, startSSOFlow]);

  const value = useMemo<AccountAvContextValue>(() => ({
    access,
    available: providerFlowIsLoaded,
    getToken: tokenProvider,
    refresh,
    signInWithApple,
    signInWithGoogle,
    signOut,
    status,
    user,
  }), [access, providerFlowIsLoaded, refresh, signInWithApple, signInWithGoogle, signOut, status, tokenProvider, user]);

  return <AccountAvContext.Provider value={value}>{children}</AccountAvContext.Provider>;
}

function createTokenCache(config: ReturnType<typeof getDuelWordsAccountAvConfig>) {
  const options: SecureStore.SecureStoreOptions = {
    accessGroup: config.keychainAccessGroup,
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    keychainService: config.keychainService,
  };
  return {
    clearToken: (key: string) => SecureStore.deleteItemAsync(key, options),
    getToken: (key: string) => SecureStore.getItemAsync(key, options),
    saveToken: (key: string, token: string) => SecureStore.setItemAsync(key, token, options),
  };
}

function createIdentityCache(config: ReturnType<typeof getDuelWordsAccountAvConfig>): IdentityCache {
  const key = 'duelwords-account-av-internal-identity-v1';
  const options: SecureStore.SecureStoreOptions = {
    accessGroup: config.keychainAccessGroup,
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    keychainService: config.keychainService,
  };
  return {
    clear: () => SecureStore.deleteItemAsync(key, options),
    async load() {
      const value = await SecureStore.getItemAsync(key, options);
      if (!value) return null;
      try {
        const parsed = JSON.parse(value) as CachedIdentity;
        return parsed?.user?.id && parsed?.access?.accessMode ? parsed : null;
      } catch {
        return null;
      }
    },
    save: (identity) => SecureStore.setItemAsync(key, JSON.stringify(identity), options),
  };
}

export function useDuelWordsAccount() {
  return useContext(AccountAvContext);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Account token lookup timed out.')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

async function restoreExistingSessionIfPossible(input: {
  automaticResolutionSessionRef: { current: string | null };
  clerk: ReturnType<typeof useClerk>;
  refreshClient?: boolean;
  setStatus: (status: AccountStatus) => void;
}): Promise<boolean> {
  if (input.refreshClient) {
    await input.clerk.client.reload();
  }
  const session = input.clerk.session ?? input.clerk.client.sessions[0] ?? null;
  if (!session?.id) return false;

  await input.clerk.setActive({ session: session.id });
  input.automaticResolutionSessionRef.current = null;
  input.setStatus('loading');
  return true;
}
