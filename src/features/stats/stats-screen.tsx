import { useRouter } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useDeviceActivity } from '@/features/activity/use-device-activity';
import { activityCopy, activityModeLabel, activityOutcomeLabel } from '@/features/activity/activity-copy';
import { summarizeDuelWordsStats } from '@/features/activity/activity-summary';
import { buildWordDuelHref, WORD_DUEL_ROUTE_PATHS } from '@/features/word-duel/word-duel-route-params';
import { readOfficialDailyStats } from '@/game/word-duel-daily/official-daily';
import { experienceCopy } from '@/i18n/experience-copy';
import { gameLanguageLabel, type InterfaceLocale } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { InkEyebrow, PaperCard, SectionHeading } from '@/ui/brand';
import { layout, radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

const DATE_FORMATTERS: Record<InterfaceLocale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en', { dateStyle: 'medium' }),
  es: new Intl.DateTimeFormat('es', { dateStyle: 'medium' }),
  ca: new Intl.DateTimeFormat('ca', { dateStyle: 'medium' }),
  fr: new Intl.DateTimeFormat('fr', { dateStyle: 'medium' }),
  de: new Intl.DateTimeFormat('de', { dateStyle: 'medium' }),
};

export function StatsScreen() {
  const router = useRouter();
  const [{ gameLanguage, interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const activity = activityCopy(interfaceLocale);
  const records = useDeviceActivity();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const stats = summarizeDuelWordsStats({
    dailyStats: {
      en: readOfficialDailyStats('en'),
      es: readOfficialDailyStats('es'),
      ca: readOfficialDailyStats('ca'),
      fr: readOfficialDailyStats('fr'),
      de: readOfficialDailyStats('de'),
    },
    records,
    selectedLanguage: gameLanguage,
  });
  const recent = records.slice(0, 5);
  const dateFormatter = DATE_FORMATTERS[interfaceLocale];

  return (
    <AppScreen bottomInset={width < 760 ? layout.phoneShellBottomInset : spacing.xxl}>
      <View style={styles.header}>
        <InkEyebrow>{copy.stats}</InkEyebrow>
        <Text accessibilityRole="header" aria-level={1} style={[styles.title, { color: colors.text }]}>{activity.statsTitle}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{activity.statsDetail}</Text>
      </View>

      <PaperCard emphasized>
        <View style={styles.metrics}>
          <Metric label={activity.completedGames} value={`${stats.completed}`} />
          <Metric label={activity.victories} value={`${stats.victories}`} />
          <Metric label={activity.successRate} value={`${stats.successRate}%`} />
          <Metric label={`${activity.dailyStreak} · ${gameLanguage.toUpperCase()}`} value={`${stats.currentDailyStreak}`} />
        </View>
      </PaperCard>

      <PaperCard>
        <SectionHeading title={activity.gamesByMode} />
        <View style={styles.modeGrid}>
          <ModeCount label={activityModeLabel(interfaceLocale, 'daily')} value={stats.modeCounts.daily} />
          <ModeCount label={activityModeLabel(interfaceLocale, 'human_duel')} value={stats.modeCounts.friends} />
          <ModeCount label={activityModeLabel(interfaceLocale, 'bot_duel')} value={stats.modeCounts.avi} />
          <ModeCount label={activityModeLabel(interfaceLocale, 'practice')} value={stats.modeCounts.practice} />
        </View>
      </PaperCard>

      {recent.length > 0 ? (
        <PaperCard>
          <SectionHeading title={activity.recentGames} />
          <View style={styles.activityList}>
            {recent.map((record) => (
              <View key={`${record.completedAt}-${record.mode}-${record.language}-${record.outcome}`} style={[styles.activityRow, { borderColor: colors.border }]}>
                <View style={styles.activityMain}>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>{activityModeLabel(interfaceLocale, record.mode)}</Text>
                  <Text style={[styles.activityDetail, { color: colors.textMuted }]}>
                    {gameLanguageLabel(record.language)} · {record.attemptsUsed}/6 {activity.attempts} · {dateFormatter.format(new Date(record.completedAt))}
                  </Text>
                </View>
                <Text style={[styles.outcome, { color: colors.accent }]}>{activityOutcomeLabel(interfaceLocale, record.outcome)}</Text>
              </View>
            ))}
          </View>
        </PaperCard>
      ) : (
        <PaperCard>
          <SectionHeading title={activity.noActivityTitle} detail={activity.noActivityDetail} />
          <AppButton onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice, { gameLanguage, mode: 'practice' }))}>{activity.openPractice}</AppButton>
        </PaperCard>
      )}

      <PaperCard>
        <SectionHeading title={activity.localPrivacyTitle} detail={activity.localPrivacyDetail} />
      </PaperCard>
    </AppScreen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.metric, { backgroundColor: colors.surface }]}>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function ModeCount({ label, value }: { label: string; value: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.modeCount, { backgroundColor: colors.surfaceSoft }]}>
      <Text style={[styles.modeValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.modeLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { maxWidth: 620, fontFamily: 'Georgia', fontSize: 36, lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
  subtitle: { maxWidth: 620, fontSize: typeScale.body, lineHeight: 22 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metric: { flexBasis: 120, flexGrow: 1, minHeight: 92, padding: spacing.md, borderRadius: radii.md, justifyContent: 'space-between', gap: spacing.xs },
  metricValue: { fontFamily: 'Georgia', fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metricLabel: { fontSize: typeScale.small, lineHeight: 17, fontWeight: '800' },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  modeCount: { flexBasis: 130, flexGrow: 1, padding: spacing.md, borderRadius: radii.md, gap: spacing.xs },
  modeValue: { fontSize: typeScale.subtitle, fontWeight: '900', fontVariant: ['tabular-nums'] },
  modeLabel: { fontSize: typeScale.small, fontWeight: '800' },
  activityList: { gap: spacing.sm },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  activityMain: { flex: 1, minWidth: 0, gap: spacing.xs },
  activityTitle: { fontSize: typeScale.body, fontWeight: '900' },
  activityDetail: { fontSize: typeScale.small, lineHeight: 18 },
  outcome: { fontSize: typeScale.small, fontWeight: '900' },
});
