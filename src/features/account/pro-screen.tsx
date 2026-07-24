import { type Href, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

export function ProScreen() {
  const router = useRouter();
  const account = useDuelWordsAccount();
  const styles = useStyles();
  const isPro = account.access.planTier === 'pro';
  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.crown}><Text style={styles.crownText}>AV</Text></View>
        <Text style={styles.kicker}>DuelWords Pro</Text>
        <Text accessibilityRole="header" aria-level={1} style={styles.title}>{isPro ? 'Pro is active' : 'More history. Same fair game.'}</Text>
        <Text style={styles.subtitle}>Pro removes ads and expands private limits. It never adds hints, attempts, time, or competitive advantage.</Text>
      </View>
      <View style={styles.card}>
        {['No ads', 'Deeper private result history', 'Higher documented invite limits', 'Account-backed restore when available'].map((benefit) => (
          <View key={benefit} style={styles.benefit}><Text style={styles.check}>✓</Text><Text style={styles.benefitText}>{benefit}</Text></View>
        ))}
      </View>
      {isPro ? (
        <AppButton onPress={() => router.back()}>Done</AppButton>
      ) : account.user ? (
        <>
          <AppButton disabled>Purchases coming in a later verified build</AppButton>
          <Text style={styles.legal}>No StoreKit or RevenueCat purchase is started by this build.</Text>
        </>
      ) : (
        <AppButton disabled={!account.available} onPress={() => router.replace('/auth' as Href)}>Sign in to continue</AppButton>
      )}
      <AppButton tone="quiet" onPress={() => router.back()}>Close</AppButton>
    </AppScreen>
  );
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    header: { alignItems: 'center', gap: spacing.sm },
    crown: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary },
    crownText: { color: colors.background, fontSize: 24, fontWeight: '900' },
    kicker: { color: colors.secondary, fontSize: typeScale.small, fontWeight: '900', textTransform: 'uppercase' },
    title: { maxWidth: 520, color: colors.text, fontSize: 32, fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
    subtitle: { maxWidth: 560, color: colors.textMuted, fontSize: typeScale.body, lineHeight: 23, textAlign: 'center' },
    card: { gap: spacing.md, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    benefit: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
    check: { color: colors.accent, fontSize: typeScale.lead, fontWeight: '900' },
    benefitText: { flex: 1, color: colors.text, fontSize: typeScale.body, fontWeight: '700' },
    legal: { color: colors.textMuted, fontSize: typeScale.small, textAlign: 'center' },
  }), [colors]);
}
