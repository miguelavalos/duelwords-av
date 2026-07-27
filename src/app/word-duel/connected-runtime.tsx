import { Redirect } from 'expo-router';

import { ConnectedRuntimeScreen } from '@/features/word-duel/connected-runtime-screen';

export default function ConnectedRuntimeRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ConnectedRuntimeScreen />;
}
