import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function AuthScreen() {
  const router = useRouter();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string | string[] }>();
  const mode = Array.isArray(modeParam) ? modeParam[0] : modeParam;
  const { colors } = useAppTheme();
  return (
    <AppScreen>
      <Text accessibilityRole="header" aria-level={1} style={{ color: colors.text, fontSize: 30, fontWeight: '900' }}>{mode === 'signUp' ? 'Create Account AV account' : 'Sign in to Account AV'}</Text>
      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.textMuted, fontSize: typeScale.body }}>Native account creation and sign-in are available in the iPhone and iPad app.</Text>
        <AppButton onPress={() => router.replace('/play')}>Continue as guest</AppButton>
      </View>
    </AppScreen>
  );
}
