import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';

import { useOnboardingComplete } from '@/onboarding/use-onboarding-complete';
import { AppScreen } from '@/ui/app-screen';
import { AviArtwork, DuelWordsWordmark, InkEyebrow, aviAssets } from '@/ui/brand';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function ProductSplashScreen() {
  const [complete] = useOnboardingComplete();
  const [ready, setReady] = useState(false);
  const { colors } = useAppTheme();

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      timeout = setTimeout(() => { if (active) setReady(true); }, reduceMotion ? 180 : 950);
    });
    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (ready) return <Redirect href={(complete ? '/(tabs)/play' : '/onboarding') as Href} />;

  return (
    <AppScreen scroll={false}>
      <View style={styles.stage}>
        <AviArtwork size={174} source={aviAssets.onboarding} />
        <View style={styles.copy}>
          <DuelWordsWordmark />
          <InkEyebrow>Word duels with friends</InkEyebrow>
          <Text style={[styles.detail, { color: colors.textMuted }]}>Paper, ink, and a fair rival named Avi.</Text>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  copy: { alignItems: 'center', gap: spacing.sm },
  detail: { maxWidth: 320, fontSize: typeScale.body, lineHeight: 22, textAlign: 'center' },
});
