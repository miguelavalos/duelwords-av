import { useRouter } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { activityCopy, activityOutcomeLabel } from '@/features/activity/activity-copy';
import { summarizeRecentRivals } from '@/features/activity/activity-summary';
import { useDeviceActivity } from '@/features/activity/use-device-activity';
import { buildWordDuelHref, WORD_DUEL_ROUTE_PATHS } from '@/features/word-duel/word-duel-route-params';
import { experienceCopy } from '@/i18n/experience-copy';
import { t, type InterfaceLocale } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, InkEyebrow, PaperCard, SectionHeading } from '@/ui/brand';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { layout, radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

const DATE_FORMATTERS: Record<InterfaceLocale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en', { dateStyle: 'medium' }),
  es: new Intl.DateTimeFormat('es', { dateStyle: 'medium' }),
  ca: new Intl.DateTimeFormat('ca', { dateStyle: 'medium' }),
  fr: new Intl.DateTimeFormat('fr', { dateStyle: 'medium' }),
  de: new Intl.DateTimeFormat('de', { dateStyle: 'medium' }),
};

export function RivalsScreen() {
  const router = useRouter();
  const [{ gameLanguage, interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const activity = activityCopy(interfaceLocale);
  const rivals = summarizeRecentRivals(useDeviceActivity());
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const dateFormatter = DATE_FORMATTERS[interfaceLocale];

  return (
    <AppScreen bottomInset={width < 760 ? layout.phoneShellBottomInset : spacing.xxl}>
      <InteriorScreenHeader backLabel={t(interfaceLocale, 'back')} onBack={() => router.replace('/(tabs)/play')} />
      <View style={styles.header}>
        <InkEyebrow>{copy.rivals}</InkEyebrow>
        <Text accessibilityRole="header" aria-level={1} style={[styles.title, { color: colors.text }]}>{activity.rivalsTitle}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{activity.rivalsDetail}</Text>
      </View>

      {rivals.length > 0 ? (
        <PaperCard emphasized>
          <View style={styles.rivalList}>
            {rivals.map((rival) => (
              <View key={rival.displayName.toLocaleLowerCase()} style={[styles.rivalRow, { backgroundColor: colors.surface }]}>
                <View style={[styles.rivalMonogram, { backgroundColor: colors.accent }]}><Text style={[styles.rivalInitial, { color: colors.onAccent }]}>{rival.displayName.slice(0, 1).toLocaleUpperCase()}</Text></View>
                <View style={styles.rivalCopy}>
                  <Text style={[styles.rivalName, { color: colors.text }]}>{rival.displayName}</Text>
                  <Text style={[styles.rivalDetail, { color: colors.textMuted }]}>
                    {rival.matches} {rival.matches === 1 ? activity.rivalsMatch : activity.rivalsMatches} · {dateFormatter.format(new Date(rival.lastCompletedAt))}
                  </Text>
                </View>
                <Text style={[styles.rivalOutcome, { color: colors.accent }]}>{activityOutcomeLabel(interfaceLocale, rival.lastOutcome)}</Text>
              </View>
            ))}
          </View>
          <AppButton onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.challenge, { gameLanguage, interfaceLocale, mode: 'human_duel' }))}>{activity.challenge}</AppButton>
        </PaperCard>
      ) : (
        <PaperCard emphasized>
          <View style={styles.emptyHero}>
            <AviArtwork size={112} />
            <View style={styles.emptyCopy}>
              <SectionHeading title={activity.rivalsEmptyTitle} detail={activity.rivalsEmptyDetail} />
            </View>
          </View>
          <AppButton onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.challenge, { gameLanguage, interfaceLocale, mode: 'human_duel' }))}>{activity.challenge}</AppButton>
        </PaperCard>
      )}

      <PaperCard>
        <SectionHeading title={activity.rivalsPrivacyTitle} detail={activity.rivalsPrivacyDetail} />
        <View style={styles.pillRow}>{copy.rivalsPrivacyPills.map((label) => <View key={label} style={[styles.pill, { backgroundColor: colors.surfaceSoft }]}><Text style={[styles.pillText, { color: colors.text }]}>{label}</Text></View>)}</View>
      </PaperCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { maxWidth: 620, fontFamily: 'Georgia', fontSize: 36, lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
  subtitle: { maxWidth: 620, fontSize: typeScale.body, lineHeight: 22 },
  emptyHero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.lg },
  emptyCopy: { flex: 1, minWidth: 220 },
  rivalList: { gap: spacing.sm },
  rivalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.md },
  rivalMonogram: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  rivalInitial: { fontFamily: 'Georgia', fontSize: typeScale.lead, fontWeight: '700' },
  rivalCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  rivalName: { fontSize: typeScale.lead, fontWeight: '900' },
  rivalDetail: { fontSize: typeScale.small, lineHeight: 18 },
  rivalOutcome: { fontSize: typeScale.small, fontWeight: '900' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 99 },
  pillText: { fontSize: typeScale.small, fontWeight: '800' },
});
