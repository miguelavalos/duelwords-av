import { useRouter } from 'expo-router';

import { AccountOnboardingExperience } from '@/features/onboarding/onboarding-screen';

export function AuthScreen() {
  const router = useRouter();

  return (
    <AccountOnboardingExperience
      initialAuthExpanded
      onFinish={(path) => router.replace(path)}
    />
  );
}
