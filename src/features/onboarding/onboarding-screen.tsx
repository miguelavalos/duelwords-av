import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { experienceCopy } from '@/i18n/experience-copy';
import { useOnboardingComplete } from '@/onboarding/use-onboarding-complete';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, DuelWordsWordmark, InkEyebrow, PaperCard, aviAssets } from '@/ui/brand';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [{ interfaceLocale }] = useAppPreferences();
  const account = useDuelWordsAccount();
  const [, complete] = useOnboardingComplete();
  const [index, setIndex] = useState(0);
  const copy = experienceCopy(interfaceLocale);
  const page = copy.onboardingPages[index] ?? copy.onboardingPages[0];
  const styles = useStyles();
  const last = index === copy.onboardingPages.length - 1;

  function finish(path: Href) {
    complete();
    router.replace(path);
  }

  return (
    <AppScreen scroll={width < 700} contentGap={spacing.lg}>
      <View style={styles.topBar}>
        <DuelWordsWordmark compact />
        {!last ? <Pressable accessibilityRole="button" onPress={() => finish('/(tabs)/play')}><Text style={styles.skip}>{copy.onboardingSkip}</Text></Pressable> : null}
      </View>

      <View style={styles.stage}>
        <AviArtwork size={width >= 700 ? 220 : 166} source={index === 1 ? aviAssets.onboarding : aviAssets.fullBody} />
        <PaperCard emphasized style={styles.copyCard}>
          <InkEyebrow>{page.eyebrow}</InkEyebrow>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>{page.title}</Text>
          <Text style={styles.detail}>{page.detail}</Text>
          <View style={styles.dots}>
            {copy.onboardingPages.map((_, dot) => <View key={dot} style={[styles.dot, dot === index && styles.dotSelected]} />)}
          </View>
        </PaperCard>
      </View>

      <View style={styles.actions}>
        {!last ? (
          <AppButton onPress={() => setIndex((current) => current + 1)}>{copy.onboardingContinue}</AppButton>
        ) : (
          <>
            <View style={styles.accountActions}>
              <AppButton disabled={!account.available} style={styles.accountAction} onPress={() => finish('/auth?mode=signUp' as Href)}>{copy.onboardingCreate}</AppButton>
              <AppButton disabled={!account.available} tone="secondary" style={styles.accountAction} onPress={() => finish('/auth?mode=signIn' as Href)}>{copy.onboardingSignIn}</AppButton>
            </View>
            <AppButton tone="quiet" onPress={() => finish('/(tabs)/play')}>{copy.onboardingGuest}</AppButton>
          </>
        )}
      </View>
    </AppScreen>
  );
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    skip: { color: colors.accent, fontSize: typeScale.body, fontWeight: '800', padding: spacing.sm },
    stage: { flex: 1, minHeight: 410, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
    copyCard: { width: '100%', maxWidth: 600, alignItems: 'center' },
    title: { maxWidth: 520, color: colors.text, fontFamily: 'Georgia', fontSize: 35, lineHeight: 39, fontWeight: '700', textAlign: 'center', letterSpacing: -1 },
    detail: { maxWidth: 520, color: colors.textMuted, fontSize: typeScale.lead, lineHeight: 26, textAlign: 'center' },
    dots: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.xs },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotSelected: { width: 26, backgroundColor: colors.accent },
    actions: { gap: spacing.sm },
    accountActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    accountAction: { flexGrow: 1, flexBasis: 190 },
  }), [colors]);
}
