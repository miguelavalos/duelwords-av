import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { useOnboardingComplete } from '@/onboarding/use-onboarding-complete';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

const slides = [
  { mark: 'A', title: 'Think together. Race apart.', detail: 'Two players solve the same hidden word in synchronized rounds.' },
  { mark: '5', title: 'Five letters. Six attempts.', detail: 'Practice offline, then invite someone when you are ready.' },
  { mark: 'AV', title: 'Play now. Keep more later.', detail: 'Continue as a guest, or use Account AV for durable history, rivals, and Pro.' },
] as const;

export function OnboardingScreen() {
  const router = useRouter();
  const [{ interfaceLocale }] = useAppPreferences();
  const account = useDuelWordsAccount();
  const [, complete] = useOnboardingComplete();
  const [index, setIndex] = useState(0);
  const styles = useStyles();
  const slide = slides[index];

  function finish(path: '/auth' | '/play') {
    complete();
    router.replace(path as Href);
  }

  return (
    <AppScreen scroll={false} contentGap={spacing.xl}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>DuelWords</Text><Text style={styles.brandAccent}>AV</Text>
      </View>
      <View style={styles.hero}>
        <View style={styles.mark}><Text style={styles.markText}>{slide.mark}</Text></View>
        <Text accessibilityRole="header" aria-level={1} style={styles.title}>{slide.title}</Text>
        <Text style={styles.detail}>{slide.detail}</Text>
        <View style={styles.dots}>
          {slides.map((_, dot) => <View key={dot} style={[styles.dot, dot === index && styles.dotSelected]} />)}
        </View>
      </View>
      <View style={styles.actions}>
        {index < slides.length - 1 ? (
          <AppButton onPress={() => setIndex((current) => current + 1)}>Continue</AppButton>
        ) : (
          <>
            <AppButton disabled={!account.available} onPress={() => finish('/auth')}>Create account or sign in</AppButton>
            <AppButton tone="secondary" onPress={() => finish('/play')}>Continue as guest</AppButton>
          </>
        )}
        {index < slides.length - 1 ? (
          <AppButton tone="quiet" onPress={() => finish('/play')}>Skip</AppButton>
        ) : null}
        {!account.available && index === slides.length - 1 ? (
          <Text style={styles.helper}>Account AV is not configured in this build. Guest play remains available.</Text>
        ) : null}
        <Text style={styles.locale}>{interfaceLocale.toUpperCase()} · Interface language can be changed in Settings</Text>
      </View>
    </AppScreen>
  );
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    brandRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
    brand: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -1 },
    brandAccent: { color: colors.accent, fontSize: 22, fontWeight: '800' },
    hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
    mark: { width: 112, height: 112, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
    markText: { color: colors.onAccent, fontSize: 42, fontWeight: '900' },
    title: { maxWidth: 520, color: colors.text, fontSize: 34, lineHeight: 38, fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
    detail: { maxWidth: 520, color: colors.textMuted, fontSize: typeScale.lead, lineHeight: 26, textAlign: 'center' },
    dots: { flexDirection: 'row', gap: spacing.sm },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotSelected: { width: 24, backgroundColor: colors.accent },
    actions: { gap: spacing.sm },
    helper: { color: colors.textMuted, fontSize: typeScale.small, textAlign: 'center' },
    locale: { color: colors.textMuted, fontSize: typeScale.tiny, textAlign: 'center' },
  }), [colors]);
}
