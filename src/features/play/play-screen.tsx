import { type Href, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { buildWordDuelHref, WORD_DUEL_ROUTE_PATHS } from '@/features/word-duel/word-duel-route-params';
import { experienceCopy } from '@/i18n/experience-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppChromeHeader, AviArtwork, InkEyebrow, PaperCard } from '@/ui/brand';
import { layout, radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

export function PlayScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [preferences] = useAppPreferences();
  const { gameLanguage, interfaceLocale } = preferences;
  const copy = experienceCopy(interfaceLocale);
  const styles = useStyles();
  const twoColumn = width >= 680;
  const tablet = width >= 760;

  return (
    <AppScreen bottomInset={tablet ? spacing.xxl : layout.phoneShellBottomInset}>
      {!tablet ? (
        <AppChromeHeader
          accountLabel={copy.account}
          onAccountPress={() => router.push('/(tabs)/account' as Href)}
          onSettingsPress={() => router.push('/(tabs)/settings' as Href)}
          settingsLabel={copy.settings}
        />
      ) : null}

      <View style={styles.heroCopy}>
        <InkEyebrow>{copy.home}</InkEyebrow>
        <Text accessibilityRole="header" aria-level={1} style={styles.title}>{copy.homeTitle}</Text>
        {tablet ? <Text style={styles.headerDetail}>{copy.homeDetail}</Text> : null}
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/avi' as Href)}>
        {({ pressed }) => (
          <PaperCard emphasized style={{ opacity: pressed ? 0.78 : 1 }}>
            <View style={styles.aviBrief}>
              <AviArtwork size={86} />
              <View style={styles.aviBriefCopy}>
                <InkEyebrow>Avi</InkEyebrow>
                <Text style={styles.modeTitle}>{copy.aviBriefTitle}</Text>
                <Text style={styles.modeDetail}>{copy.aviBriefDetail}</Text>
              </View>
            </View>
          </PaperCard>
        )}
      </Pressable>

      <ModeCard
        eyebrow={copy.liveOneToOne}
        title={copy.challenge}
        detail={copy.challengeDetail}
        primary
        mark="VS"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.challenge, { gameLanguage, interfaceLocale, mode: 'human_duel' }))}
      />

      <View style={[styles.modeGrid, twoColumn && styles.modeGridWide]}>
        <ModeCard
          title={copy.playAvi}
          detail={copy.playAviDetail}
          mark="AV"
          compact={twoColumn}
          onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.playAvi, { gameLanguage, mode: 'bot_duel' }))}
        />
        <ModeCard
          title={copy.practice}
          detail={copy.practiceDetail}
          mark="5×6"
          compact={twoColumn}
          onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice, { gameLanguage, mode: 'practice' }))}
        />
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.soloDaily, { gameLanguage, mode: 'daily_preview' }))}>
        {({ pressed }) => (
          <PaperCard style={{ opacity: pressed ? 0.75 : 1 }}>
            <View style={styles.dailyRow}>
              <View style={styles.calendarMark}><Text style={styles.calendarNumber}>1</Text></View>
              <View style={styles.dailyCopy}>
                <Text style={styles.modeTitle}>{copy.daily}</Text>
                <Text style={styles.modeDetail}>{copy.dailyDetail}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
          </PaperCard>
        )}
      </Pressable>

    </AppScreen>
  );
}

function ModeCard({ compact, detail, eyebrow, mark, onPress, primary, title }: { compact?: boolean; detail: string; eyebrow?: string; mark: string; onPress: () => void; primary?: boolean; title: string }) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${detail}`} onPress={onPress} style={compact && styles.modeGridItem}>
      {({ pressed }) => (
        <PaperCard emphasized={primary} style={{ minHeight: compact ? 190 : 132, opacity: pressed ? 0.76 : 1 }}>
          <View style={styles.modeRow}>
            <View style={[styles.modeMark, { backgroundColor: primary ? colors.accent : colors.surfaceSoft, borderColor: primary ? colors.accent : colors.border }]}>
              <Text style={[styles.modeMarkText, { color: primary ? colors.onAccent : colors.accent }]}>{mark}</Text>
            </View>
            <View style={styles.modeCopy}>
              {eyebrow ? <InkEyebrow>{eyebrow}</InkEyebrow> : null}
              <Text style={styles.modeTitle}>{title}</Text>
              <Text style={styles.modeDetail}>{detail}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </View>
        </PaperCard>
      )}
    </Pressable>
  );
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    headerDetail: { maxWidth: 520, color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19 },
    headerActions: { flexDirection: 'row', gap: spacing.sm },
    heroCopy: { gap: spacing.xs, paddingTop: spacing.sm },
    title: { maxWidth: 620, color: colors.text, fontFamily: 'Georgia', fontSize: 38, lineHeight: 42, fontWeight: '700', letterSpacing: -1.3 },
    modeGrid: { gap: spacing.lg },
    modeGridWide: { flexDirection: 'row' },
    modeGridItem: { flex: 1 },
    modeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    modeMark: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.md, transform: [{ rotate: '-2deg' }] },
    modeMarkText: { fontFamily: 'Georgia', fontSize: 19, fontWeight: '700' },
    modeCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
    modeTitle: { color: colors.text, fontFamily: 'Georgia', fontSize: typeScale.subtitle, fontWeight: '700', letterSpacing: -0.5 },
    modeDetail: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19 },
    arrow: { color: colors.accent, fontSize: 26, fontWeight: '500' },
    dailyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    calendarMark: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.secondary, borderRadius: 12 },
    calendarNumber: { color: colors.secondary, fontFamily: 'Georgia', fontSize: 23, fontWeight: '700' },
    dailyCopy: { flex: 1, gap: 2 },
    aviBrief: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    aviBriefCopy: { flex: 1, gap: spacing.xs },
  }), [colors]);
}
