import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export default function NotFoundRoute() {
  const router = useRouter();
  const styles = useNotFoundStyles();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <AppScreen scroll={false}>
        <View style={styles.container}>
          <Text style={styles.kicker}>DuelWords AV</Text>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>Screen not found</Text>
          <Text style={styles.body}>This route is not part of the current duel.</Text>
          <AppButton onPress={() => router.replace('/play')}>Back to Play</AppButton>
        </View>
      </AppScreen>
    </>
  );
}

function useNotFoundStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    maxWidth: 520,
  },
  kicker: {
    color: colors.accent,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  body: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    lineHeight: 22,
  },
  }), [colors]);
}
