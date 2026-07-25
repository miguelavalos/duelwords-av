import { ClerkProvider, useAuth, useClerk, useSSO } from '@clerk/expo';
import { useSignInWithApple } from '@clerk/expo/apple';
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
import { AccountAuthCancelledError, isAccountAuthCancellation } from './account-auth-errors';
import { activateCreatedSession } from './account-session-activation';

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

export function DuelWordsAccountAvProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => getDuelWordsAccountAvConfig(), []);
  const tokenCache = useMemo(() => createTokenCache(config), [config]);
  const identityCache = useMemo(() => createIdentityCache(config), [config]);
  if (!config.publishableKey || !config.accountApiBaseUrl) {
    return <AccountAvContext.Provider value={NO_ACCOUNT}>{children}</AccountAvContext.Provider>;
  }

  return (
    <ClerkProvider publishableKey={config.publishableKey} standardBrowser={false} tokenCache={tokenCache}>
      <AccountAvRuntime baseUrl={config.accountApiBaseUrl} identityCache={identityCache}>{children}</AccountAvRuntime>
    </ClerkProvider>
  );
}

type CachedIdentity = { access: DuelWordsAccess; user: AccountAvInternalUser };
type IdentityCache = {
  clear: () => Promise<void>;
  load: () => Promise<CachedIdentity | null>;
  save: (identity: CachedIdentity) => Promise<void>;
};

function AccountAvRuntime({ baseUrl, children, identityCache }: {
  baseUrl: string;
  children: ReactNode;
  identityCache: IdentityCache;
}) {
  const { getToken, isLoaded, isSignedIn, sessionId } = useAuth({ treatPendingAsSignedOut: false });
  const clerk = useClerk();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { startSSOFlow } = useSSO();
  const [user, setUser] = useState<AccountAvInternalUser | null>(null);
  const [access, setAccess] = useState<DuelWordsAccess>(GUEST_ACCESS);
  const [status, setStatus] = useState<AccountStatus>('loading');
  const userRef = useRef<AccountAvInternalUser | null>(null);
  const clerkGetTokenRef = useRef(getToken);
  const automaticResolutionSessionRef = useRef<string | null>(null);

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
    try {
      if (!isLoaded) throw new Error('Account AV is still loading.');
      const result = await startAppleAuthenticationFlow();
      const activatedSessionId = await activateCreatedSession(result.createdSessionId, result.setActive);
      automaticResolutionSessionRef.current = activatedSessionId;
      await publishActivatedSessionIdentity({
        activatedSessionId,
        clerk,
        publishIdentity,
        userRef,
        setStatus,
      });
    } catch (error) {
      if (isAccountAuthCancellation(error)) throw new AccountAuthCancelledError();
      throw error;
    }
  }, [clerk, isLoaded, publishIdentity, startAppleAuthenticationFlow]);

  const signInWithGoogle = useCallback(async () => {
    const result = await startSSOFlow({ strategy: 'oauth_google' });
    if (result.authSessionResult?.type === 'cancel' || result.authSessionResult?.type === 'dismiss') {
      throw new AccountAuthCancelledError();
    }
    const activatedSessionId = await activateCreatedSession(result.createdSessionId, result.setActive);
    automaticResolutionSessionRef.current = activatedSessionId;
    await publishActivatedSessionIdentity({
      activatedSessionId,
      clerk,
      publishIdentity,
      userRef,
      setStatus,
    });
  }, [clerk, publishIdentity, startSSOFlow]);

  const value = useMemo<AccountAvContextValue>(() => ({
    access,
    available: isLoaded,
    getToken: tokenProvider,
    refresh,
    signInWithApple,
    signInWithGoogle,
    signOut,
    status,
    user,
  }), [access, isLoaded, refresh, signInWithApple, signInWithGoogle, signOut, status, tokenProvider, user]);

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

async function publishActivatedSessionIdentity(input: {
  activatedSessionId: string;
  clerk: ReturnType<typeof useClerk>;
  publishIdentity: (getToken: () => Promise<string | null>) => Promise<void>;
  setStatus: (status: AccountStatus) => void;
  userRef: { current: AccountAvInternalUser | null };
}) {
  const session = input.clerk.client?.sessions.find(({ id }) => id === input.activatedSessionId)
    ?? (input.clerk.session?.id === input.activatedSessionId ? input.clerk.session : null);
  try {
    if (!session) {
      throw new Error('Account AV activated session is unavailable.');
    }
    await input.publishIdentity(() => withTimeout(session.getToken(), ACCOUNT_TOKEN_TIMEOUT_MS));
  } catch (error) {
    input.setStatus(input.userRef.current ? 'signed_in_offline' : 'account_error');
    throw error;
  }
}
