import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { experienceCopy } from '@/i18n/experience-copy';
import { useOnboardingComplete } from '@/onboarding/use-onboarding-complete';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, DuelWordsWordmark, aviAssets, duelWordsBrandAssets } from '@/ui/brand';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

export function OnboardingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [{ interfaceLocale }] = useAppPreferences();
  const account = useDuelWordsAccount();
  const [, complete] = useOnboardingComplete();
  const [showAuth, setShowAuth] = useState(false);
  const copy = experienceCopy(interfaceLocale);
  const intro = copy.onboardingPages[0];
  const styles = useStyles();
  const compact = height < 760;
  const tablet = width >= 700;

  function finish(path: Href) {
    complete();
    router.replace(path);
  }

  return (
    <AppScreen scroll={compact} contentGap={spacing.md}>
      <View style={styles.brandRow}><DuelWordsWordmark centered /></View>

      <View style={[styles.hero, tablet && styles.heroTablet]}>
        <View style={[styles.heroCopy, tablet && styles.heroCopyTablet]}>
          <Text style={styles.eyebrow}>{intro.eyebrow}</Text>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>{intro.title}</Text>
          <Text style={styles.detail}>{intro.detail}</Text>
        </View>
        <View style={[styles.artPanel, { minHeight: compact ? 260 : tablet ? Math.min(600, height * 0.58) : 390 }]}>
          <Image
            accessibilityLabel="Two word boards ready for a friendly duel"
            contentFit="cover"
            contentPosition="center"
            source={duelWordsBrandAssets.onboardingHero}
            style={styles.heroImage}
          />
          <View style={styles.heroAvi}><AviArtwork size={tablet ? 132 : 104} source={aviAssets.onboarding} /></View>
        </View>
      </View>

      {showAuth ? (
        <View style={styles.authPanel}>
          <View style={styles.panelAvi}><AviArtwork size={tablet ? 112 : 86} source={aviAssets.onboarding} /></View>
          <View style={styles.authCopy}>
            <Text style={styles.panelTitle}>Connect your Account AV account</Text>
            <Text style={styles.panelDetail}>Continue across devices when that adds value. Local play always remains available on this device.</Text>
          </View>
          <View style={styles.accountActions}>
            <AppButton disabled={!account.available} style={styles.accountAction} onPress={() => finish('/auth?mode=signUp' as Href)}>{copy.onboardingCreate}</AppButton>
            <AppButton disabled={!account.available} tone="secondary" style={styles.accountAction} onPress={() => finish('/auth?mode=signIn' as Href)}>{copy.onboardingSignIn}</AppButton>
          </View>
          {!account.available ? <Text style={styles.unavailable}>Account AV is unavailable in this build. You can continue as a guest.</Text> : null}
          <AppButton tone="quiet" onPress={() => finish('/(tabs)/play')}>{copy.onboardingGuest}</AppButton>
        </View>
      ) : (
        <View style={styles.actions}>
          <AppButton onPress={() => setShowAuth(true)}>{copy.onboardingContinue}</AppButton>
          <AppButton tone="quiet" onPress={() => finish('/(tabs)/play')}>{copy.onboardingSkip}</AppButton>
        </View>
      )}
    </AppScreen>
  );
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    brandRow: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
    hero: { overflow: 'hidden', borderRadius: radii.lg, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface },
    heroTablet: { flexDirection: 'row', alignItems: 'stretch' },
    heroImage: { ...StyleSheet.absoluteFill },
    heroCopy: { alignItems: 'center', gap: spacing.xs, padding: spacing.lg, backgroundColor: colors.surface },
    heroCopyTablet: { flex: 0.78, justifyContent: 'center', padding: spacing.xl },
    artPanel: { position: 'relative', flex: 1, overflow: 'hidden', backgroundColor: colors.surface },
    heroAvi: { position: 'absolute', right: spacing.md, bottom: -10 },
    eyebrow: { color: colors.accent, fontSize: typeScale.tiny, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
    title: { maxWidth: 560, color: colors.text, fontFamily: 'Georgia', fontSize: 35, lineHeight: 39, fontWeight: '700', textAlign: 'center', letterSpacing: -1 },
    detail: { maxWidth: 520, color: colors.textMuted, fontSize: typeScale.body, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
    actions: { gap: spacing.sm },
    authPanel: { position: 'relative', gap: spacing.md, marginTop: 40, padding: spacing.lg, paddingTop: 58, borderRadius: radii.lg, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface, boxShadow: '0 10px 28px rgba(38, 45, 43, 0.12)' },
    panelAvi: { position: 'absolute', top: -48, left: 0, right: 0, alignItems: 'center' },
    authCopy: { alignItems: 'center', gap: spacing.xs },
    panelTitle: { color: colors.text, fontFamily: 'Georgia', fontSize: typeScale.subtitle, fontWeight: '700', textAlign: 'center' },
    panelDetail: { maxWidth: 560, color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19, textAlign: 'center' },
    accountActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    accountAction: { flexGrow: 1, flexBasis: 190 },
    unavailable: { color: colors.danger, fontSize: typeScale.small, lineHeight: 19, textAlign: 'center' },
  }), [colors]);
}
