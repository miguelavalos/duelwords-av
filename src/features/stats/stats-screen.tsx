import { useRouter } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { buildWordDuelHref, WORD_DUEL_ROUTE_PATHS } from '@/features/word-duel/word-duel-route-params';
import { experienceCopy } from '@/i18n/experience-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { DuelWordsWordmark, InkEyebrow, PaperCard, SectionHeading } from '@/ui/brand';
import { layout, spacing, typeScale, useAppTheme } from '@/ui/theme';

export function StatsScreen() {
  const router = useRouter();
  const [{ gameLanguage, interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();

  return (
    <AppScreen bottomInset={width < 760 ? layout.phoneShellBottomInset : spacing.xxl}>
      {width < 760 ? <DuelWordsWordmark compact /> : null}
      <View style={styles.header}>
        <InkEyebrow>{copy.stats}</InkEyebrow>
        <Text accessibilityRole="header" aria-level={1} style={[styles.title, { color: colors.text }]}>{copy.statsTitle}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{copy.statsDetail}</Text>
      </View>

      <PaperCard emphasized>
        <SectionHeading title={copy.statsPracticeTitle} detail={copy.statsPracticeDetail} />
        <AppButton onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice, { gameLanguage, mode: 'practice' }))}>{copy.openPractice}</AppButton>
      </PaperCard>

      <PaperCard>
        <SectionHeading title={copy.statsPrivacyTitle} detail={copy.statsPrivacyDetail} />
      </PaperCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { maxWidth: 620, fontFamily: 'Georgia', fontSize: 36, lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
  subtitle: { maxWidth: 620, fontSize: typeScale.body, lineHeight: 22 },
});
