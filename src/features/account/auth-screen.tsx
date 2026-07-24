import { AuthView } from '@clerk/expo/native';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { AppButton } from '@/ui/buttons';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function AuthScreen() {
  const router = useRouter();
  const account = useDuelWordsAccount();
  const styles = useStyles();

  useEffect(() => {
    if (account.status === 'signed_in') router.replace('/account' as Href);
  }, [account.status, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Account AV</Text>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>Sign in or create an account</Text>
          <Text style={styles.subtitle}>Keep future DuelWords history, rivals, and Pro access tied to your Apps AV account.</Text>
        </View>
        <AppButton tone="quiet" onPress={() => router.back()}>Close</AppButton>
      </View>
      {account.available ? (
        <View style={styles.auth}><AuthView isDismissible mode="signInOrUp" onDismiss={() => router.back()} /></View>
      ) : (
        <View style={styles.unavailable}>
          <Text style={styles.unavailableTitle}>Account AV is unavailable in this build</Text>
          <Text style={styles.subtitle}>You can continue as a guest and use Practice or Challenge a Friend.</Text>
          <AppButton onPress={() => router.replace('/play')}>Continue as guest</AppButton>
        </View>
      )}
    </SafeAreaView>
  );
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg },
    headerCopy: { flex: 1, gap: spacing.xs },
    kicker: { color: colors.accent, fontSize: typeScale.tiny, fontWeight: '900', textTransform: 'uppercase' },
    title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.7 },
    subtitle: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19 },
    auth: { flex: 1 },
    unavailable: { margin: spacing.lg, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.surface, borderRadius: 14 },
    unavailableTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: '900' },
  }), [colors]);
}
