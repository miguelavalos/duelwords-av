import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function AuthScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  return (
    <AppScreen>
      <Text accessibilityRole="header" aria-level={1} style={{ color: colors.text, fontSize: 30, fontWeight: '900' }}>Account AV</Text>
      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.textMuted, fontSize: typeScale.body }}>Native account creation and sign-in are available in the iPhone and iPad app.</Text>
        <AppButton onPress={() => router.replace('/play')}>Continue as guest</AppButton>
      </View>
    </AppScreen>
  );
}
