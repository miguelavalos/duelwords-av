import { Redirect, type Href } from 'expo-router';

import { useOnboardingComplete } from '@/onboarding/use-onboarding-complete';

export default function HomeScreen() {
  const [complete] = useOnboardingComplete();
  return <Redirect href={(complete ? '/(tabs)/play' : '/onboarding') as Href} />;
}
