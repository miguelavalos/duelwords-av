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
        <Text accessibilityRole="header" aria-level={1} style={[styles.title, { color: colors.text }]}>Your results stay yours.</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Only finalized official summaries appear here. Local training never pretends to be ranked history.</Text>
      </View>

      <View style={styles.grid}>
        <StatTile label="Official duels" value="0" />
        <StatTile label="Daily streak" value="—" />
        <StatTile label="Best duel" value="—" />
      </View>

      <PaperCard emphasized>
        <SectionHeading title="Start with a real local round" detail="Practice teaches the same five-letter, six-attempt board without creating fake official stats." />
        <AppButton onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice, { gameLanguage, mode: 'practice' }))}>{copy.openPractice}</AppButton>
      </PaperCard>

      <PaperCard>
        <SectionHeading title="What will count" detail="Finalized human duels, Play Avi summaries, and Daily results remain distinguishable. Full private boards are not made public." />
      </PaperCard>
    </AppScreen>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <PaperCard style={styles.tile}>
      <Text style={[styles.value, { color: colors.accent }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </PaperCard>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { maxWidth: 620, fontFamily: 'Georgia', fontSize: 36, lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
  subtitle: { maxWidth: 620, fontSize: typeScale.body, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { flex: 1, minWidth: 150, minHeight: 126, justifyContent: 'center' },
  value: { fontFamily: 'Georgia', fontSize: 34, fontWeight: '700', fontVariant: ['tabular-nums'] },
  label: { fontSize: typeScale.small, fontWeight: '800' },
});
