import { Image } from 'expo-image';
import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboardingComplete } from '@/onboarding/use-onboarding-complete';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { DuelWordsWordmark, duelWordsBrandAssets } from '@/ui/brand';
import { isSharedAppleSurfaceAvailable, SharedAppleSurface } from '@/ui/shared-apple-surface';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function ProductSplashScreen() {
  const [complete] = useOnboardingComplete();
  const [ready, setReady] = useState(false);
  const [{ appearance, interfaceLocale }] = useAppPreferences();
  const { colors } = useAppTheme();

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      timeout = setTimeout(() => { if (active) setReady(true); }, reduceMotion ? 220 : 1250);
    });
    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (ready) return <Redirect href={(complete ? '/(tabs)/play' : '/onboarding') as Href} />;

  if (isSharedAppleSurfaceAvailable) {
    return (
      <SharedAppleSurface
        appearance={appearance}
        interfaceLocale={interfaceLocale}
        style={styles.screen}
        surface="splash"
      />
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Image contentFit="cover" source={duelWordsBrandAssets.splashHero} style={StyleSheet.absoluteFill} />
      <View style={styles.brandBlock}>
        <DuelWordsWordmark withIcon />
        <Text style={[styles.tagline, { color: colors.text }]}>A fair word duel, whenever you are ready.</Text>
        <Text style={[styles.status, { color: colors.textMuted }]}>Preparing the board…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  brandBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: 34,
  },
  tagline: { maxWidth: 350, fontFamily: 'Georgia', fontSize: typeScale.lead, fontWeight: '700', textAlign: 'center' },
  status: { fontSize: typeScale.small, fontWeight: '700' },
});
