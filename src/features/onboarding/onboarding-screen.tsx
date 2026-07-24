import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountAuthOptionsPanel } from '@/features/account/account-auth-options-panel';
import { experienceCopy } from '@/i18n/experience-copy';
import { useOnboardingComplete } from '@/onboarding/use-onboarding-complete';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AviArtwork, DuelWordsWordmark, aviAssets, duelWordsBrandAssets } from '@/ui/brand';
import { useAppTheme } from '@/ui/theme';

export function OnboardingScreen() {
  const router = useRouter();
  const [, complete] = useOnboardingComplete();

  function finish(path: Href) {
    complete();
    router.replace(path);
  }

  return <AccountOnboardingExperience initialAuthExpanded={false} onFinish={finish} />;
}

export function AccountOnboardingExperience({
  initialAuthExpanded,
  onFinish,
}: {
  initialAuthExpanded: boolean;
  onFinish: (path: Href) => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [{ interfaceLocale }] = useAppPreferences();
  const { isDark } = useAppTheme();
  const copy = experienceCopy(interfaceLocale);
  const intro = copy.onboardingPages[0];
  const [showAuth, setShowAuth] = useState(initialAuthExpanded);
  const styles = useStyles();
  const tablet = width >= 820;
  const contentMinHeight = Math.max(0, height - insets.top - insets.bottom);

  const content = (
    <View style={[styles.content, { minHeight: contentMinHeight }]}>
      <View style={{ height: Math.max(insets.top + 44, 62) }} />
      <View style={styles.heroCopy}>
        <Text accessibilityRole="header" aria-level={1} style={[styles.title, tablet && styles.titleTablet]}>{intro.title}</Text>
        <Text style={[styles.subtitle, { maxWidth: tablet ? 460 : 316 }, tablet && styles.subtitleTablet]}>{intro.detail}</Text>
      </View>

      <View style={[styles.flexSpacer, { minHeight: showAuth ? 18 : 246 }]} />

      {showAuth ? (
        <View style={[styles.authPanelWrap, { paddingBottom: Math.max(4, insets.bottom - 10) }]}>
          <AccountAuthOptionsPanel
            onAuthenticated={() => onFinish('/(tabs)/account' as Href)}
            onDismiss={() => setShowAuth(false)}
            onSkip={() => onFinish('/(tabs)/play' as Href)}
          />
        </View>
      ) : (
        <View style={[styles.ctaSection, { paddingBottom: Math.max(52, insets.bottom + 44), maxWidth: tablet ? 560 : undefined }]}>
          <View style={styles.ctaPrimaryWrap}>
            <LinearGradient colors={['rgba(41,106,112,0.18)', 'rgba(41,106,112,0)']} style={styles.ctaGlow} />
            <View pointerEvents="none" style={styles.ctaAvi}><AviArtwork size={146} source={aviAssets.onboarding} /></View>
            <Text accessibilityRole="button" onPress={() => setShowAuth(true)} style={styles.ctaPrimary}>{copy.onboardingContinue}</Text>
          </View>
          <Text accessibilityRole="button" onPress={() => onFinish('/(tabs)/play' as Href)} style={styles.ctaSecondary}>{copy.onboardingSkip}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={isDark ? ['#151B20', '#20292D', '#293735'] : ['#F7EFDB', '#FBF4E3', '#E5E7D4']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        accessibilityElementsHidden
        blurRadius={showAuth ? 6 : 0}
        contentFit="cover"
        source={duelWordsBrandAssets.onboardingHero}
        style={[styles.backdropArtwork, { height, opacity: showAuth ? 0.5 : 0.82 }]}
      />
      <LinearGradient
        colors={isDark
          ? ['rgba(21,27,32,0.18)', showAuth ? 'rgba(21,27,32,0.54)' : 'rgba(21,27,32,0.34)', showAuth ? 'rgba(21,27,32,0.96)' : 'rgba(21,27,32,0.88)']
          : ['rgba(251,244,227,0.16)', showAuth ? 'rgba(251,244,227,0.54)' : 'rgba(251,244,227,0.28)', showAuth ? 'rgba(251,244,227,0.94)' : 'rgba(251,244,227,0.86)']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {showAuth ? (
          <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>{content}</ScrollView>
        ) : content}
      </SafeAreaView>

      <View pointerEvents="none" style={[styles.brand, { top: insets.top + 24 }]}>
        <DuelWordsWordmark centered compact={!tablet} />
      </View>
    </View>
  );
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
    safeArea: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    content: { width: '100%', flexGrow: 1 },
    brand: { position: 'absolute', left: 0, right: 0, height: 54, alignItems: 'center', justifyContent: 'center' },
    backdropArtwork: { position: 'absolute', top: 50, left: 0, right: 0, width: '100%' },
    heroCopy: { alignItems: 'center', gap: 8, paddingHorizontal: 42 },
    title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900', textAlign: 'center' },
    titleTablet: { fontSize: 36, lineHeight: 42 },
    subtitle: { color: colors.text, opacity: 0.76, fontSize: 15, lineHeight: 20, fontWeight: '500', textAlign: 'center' },
    subtitleTablet: { fontSize: 18, lineHeight: 24 },
    flexSpacer: { flex: 1 },
    authPanelWrap: { paddingHorizontal: 14 },
    ctaSection: { width: '100%', alignSelf: 'center', gap: 18, paddingHorizontal: 24 },
    ctaPrimaryWrap: { position: 'relative' },
    ctaGlow: { position: 'absolute', top: -18, left: -24, right: -24, height: 220, borderRadius: 110 },
    ctaAvi: { position: 'absolute', top: -98, right: -2, width: 146, height: 150 },
    ctaPrimary: { overflow: 'hidden', width: '100%', paddingVertical: 16, borderRadius: 28, backgroundColor: colors.accent, color: colors.text, fontSize: 17, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
    ctaSecondary: { color: colors.text, opacity: 0.84, fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  }), [colors]);
}
