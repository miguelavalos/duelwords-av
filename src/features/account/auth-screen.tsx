import { type Href, useLocalSearchParams, useRouter } from 'expo-router';

import { AccountOnboardingExperience } from '@/features/onboarding/onboarding-screen';

export function AuthScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const authenticatedPath = resolveAuthenticatedReturnPath(Array.isArray(returnTo) ? returnTo[0] : returnTo);

  return (
    <AccountOnboardingExperience
      authenticatedPath={authenticatedPath}
      initialAuthExpanded
      onFinish={(path) => router.replace(path)}
    />
  );
}

/**
 * Only an app-internal path is honoured after sign-in; anything else returns to
 * the Account tab as before. Today the paywall is the only caller that asks to
 * come back.
 */
export function resolveAuthenticatedReturnPath(returnTo: string | undefined): Href | undefined {
  return returnTo === '/pro' ? ('/pro' as Href) : undefined;
}
