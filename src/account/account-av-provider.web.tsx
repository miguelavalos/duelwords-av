import { ClerkProvider, useAuth, useClerk } from '@clerk/expo';
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <AccountAvContext.Provider value={NO_ACCOUNT}>{children}</AccountAvContext.Provider>;
  }

  const config = getDuelWordsAccountAvConfig();
  if (!config.publishableKey || !config.accountApiBaseUrl) {
    return <AccountAvContext.Provider value={NO_ACCOUNT}>{children}</AccountAvContext.Provider>;
  }

  return (
    <ClerkProvider publishableKey={config.publishableKey}>
      <AccountAvRuntime baseUrl={config.accountApiBaseUrl}>{children}</AccountAvRuntime>
    </ClerkProvider>
  );
}

function AccountAvRuntime({ baseUrl, children }: { baseUrl: string; children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn, sessionId } = useAuth({ treatPendingAsSignedOut: false });
  const clerk = useClerk();
  const [user, setUser] = useState<AccountAvInternalUser | null>(null);
  const [access, setAccess] = useState<DuelWordsAccess>(GUEST_ACCESS);
  const [status, setStatus] = useState<AccountStatus>('loading');
  const userRef = useRef<AccountAvInternalUser | null>(null);
  const getTokenRef = useRef(getToken);
  const automaticResolutionSessionRef = useRef<string | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const tokenProvider = useCallback(async () => {
    if (!isSignedIn) return null;
    return withTimeout(getTokenRef.current(), ACCOUNT_TOKEN_TIMEOUT_MS);
  }, [isSignedIn]);

  const refresh = useCallback(async () => {
    if (!isLoaded) {
      setStatus('loading');
      return;
    }
    if (!isSignedIn) {
      automaticResolutionSessionRef.current = null;
      userRef.current = null;
      setUser(null);
      setAccess(GUEST_ACCESS);
      setStatus('guest');
      return;
    }

    if (!userRef.current) setStatus('loading');
    try {
      const identity = await fetchAccountAvIdentity({ baseUrl, getToken: tokenProvider });
      userRef.current = identity.user;
      setUser(identity.user);
      setAccess(identity.access);
      setStatus('signed_in');
    } catch {
      setStatus(userRef.current ? 'signed_in_offline' : 'account_error');
    }
  }, [baseUrl, isLoaded, isSignedIn, tokenProvider]);

  useEffect(() => {
    if (isSignedIn && sessionId && automaticResolutionSessionRef.current === sessionId) return;
    if (isSignedIn && sessionId) automaticResolutionSessionRef.current = sessionId;
    void refresh();
  }, [isSignedIn, refresh, sessionId]);

  const signOut = useCallback(async () => {
    await clerk.signOut();
    automaticResolutionSessionRef.current = null;
    userRef.current = null;
    setUser(null);
    setAccess(GUEST_ACCESS);
    setStatus('guest');
  }, [clerk]);

  const unavailableNativeFlow = useCallback(async () => {
    throw new Error('Use the Account AV web sign-in screen.');
  }, []);

  const value = useMemo<AccountAvContextValue>(() => ({
    access,
    available: isLoaded,
    getToken: tokenProvider,
    refresh,
    signInWithApple: unavailableNativeFlow,
    signInWithGoogle: unavailableNativeFlow,
    signOut,
    status,
    user,
  }), [access, isLoaded, refresh, signOut, status, tokenProvider, unavailableNativeFlow, user]);

  return <AccountAvContext.Provider value={value}>{children}</AccountAvContext.Provider>;
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
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
