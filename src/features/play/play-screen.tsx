import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  buildWordDuelHref,
  WORD_DUEL_ROUTE_PATHS,
} from '@/features/word-duel/word-duel-route-params';
import { GAME_LANGUAGES, t } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

type ModeCardProps = {
  ctaLabel: string;
  description: string;
  kind: 'duel' | 'practice';
  onPress: () => void;
  primary?: boolean;
  title: string;
};

export function PlayScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const styles = usePlayStyles();
  const [preferences, setPreferences] = useAppPreferences();
  const { gameLanguage, interfaceLocale } = preferences;
  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.wordmark}>
            <Text aria-level={1} accessibilityRole="header" style={styles.brand}>DuelWords</Text>
            <Text style={styles.brandAccent}>AV</Text>
          </View>
          <Text style={styles.subtitle}>{t(interfaceLocale, 'playSubtitle')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(interfaceLocale, 'settings')}
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}>
          <View style={styles.settingsGlyph}>
            <View style={styles.settingsLine} />
            <View style={[styles.settingsLine, styles.settingsLineMiddle]} />
            <View style={styles.settingsLine} />
          </View>
        </Pressable>
      </View>

      <View style={styles.selectorBlock}>
        <Text style={styles.sectionLabel}>{t(interfaceLocale, 'gameLanguage')}</Text>
        <View style={styles.segmented}>
          {GAME_LANGUAGES.map((language) => {
            const selected = language.code === gameLanguage;
            return (
              <Pressable
                key={language.code}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPreferences((current) => ({
                  ...current,
                  gameLanguage: language.code,
                }))}
                style={[styles.segment, selected && styles.segmentSelected]}>
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {language.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ModeCard
        compactAction={width < 520}
        ctaLabel={t(interfaceLocale, 'start')}
        title={t(interfaceLocale, 'challengeFriend')}
        description={t(interfaceLocale, 'challengeDescription')}
        kind="duel"
        primary
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.challenge, {
          gameLanguage,
          interfaceLocale,
          mode: 'human_duel',
        }))}
      />

      <ModeCard
        compactAction={width < 520}
        ctaLabel={t(interfaceLocale, 'startPractice')}
        title={`${t(interfaceLocale, 'wordDuel')} ${t(interfaceLocale, 'practice')}`}
        description={t(interfaceLocale, 'practiceDescription')}
        kind="practice"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice, {
          gameLanguage,
          mode: 'practice',
        }))}
      />
    </AppScreen>
  );
}

function ModeCard({ compactAction, ctaLabel, description, kind, onPress, primary = false, title }: ModeCardProps & { compactAction: boolean }) {
  const styles = usePlayStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}. ${ctaLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeCard,
        primary && styles.modeCardPrimary,
        pressed && styles.modeCardPressed,
      ]}>
      <ModeMark kind={kind} primary={primary} />
      <View style={styles.modeText}>
        <Text aria-level={2} accessibilityRole="header" style={[styles.modeTitle, primary && styles.modeTitlePrimary]}>{title}</Text>
        <Text style={[styles.modeDescription, primary && styles.modeDescriptionPrimary]}>{description}</Text>
      </View>
      <View style={styles.modeAction}>
        {compactAction ? null : (
          <Text style={[styles.modeActionLabel, primary && styles.modeActionLabelPrimary]}>{ctaLabel}</Text>
        )}
        <View style={[styles.chevron, primary && styles.chevronPrimary]} />
      </View>
    </Pressable>
  );
}

function ModeMark({ kind, primary }: { kind: 'duel' | 'practice'; primary: boolean }) {
  const styles = usePlayStyles();
  if (kind === 'practice') {
    return (
      <View style={[styles.modeIcon, primary && styles.modeIconPrimary]}>
        <View style={styles.practiceGrid}>
          {[0, 1, 2, 3].map((cell) => <View key={cell} style={[styles.practiceCell, primary && styles.practiceCellPrimary]} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.modeIcon, primary && styles.modeIconPrimary]}>
      <View style={[styles.duelBar, styles.duelBarLeft, primary && styles.duelBarPrimary]} />
      <View style={[styles.duelDivider, primary && styles.duelDividerPrimary]} />
      <View style={[styles.duelBar, styles.duelBarRight, primary && styles.duelBarPrimary]} />
    </View>
  );
}

function usePlayStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brand: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  brandAccent: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    marginTop: spacing.xs,
    lineHeight: 21,
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  settingsGlyph: {
    width: 18,
    gap: 4,
  },
  settingsLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.text,
  },
  settingsLineMiddle: {
    width: 12,
    alignSelf: 'flex-end',
  },
  selectorBlock: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.surfaceSoft,
  },
  segmentText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  segmentTextSelected: {
    color: colors.accent,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 126,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  modeCardPrimary: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  modeCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.992 }],
  },
  modeIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
  },
  modeIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  duelBar: {
    position: 'absolute',
    width: 9,
    height: 25,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  duelBarLeft: {
    left: 13,
    transform: [{ rotate: '-24deg' }],
  },
  duelBarRight: {
    right: 13,
    transform: [{ rotate: '24deg' }],
  },
  duelBarPrimary: {
    backgroundColor: colors.onAccent,
  },
  duelDivider: {
    width: 2,
    height: 28,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
  duelDividerPrimary: {
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  practiceGrid: {
    width: 28,
    height: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  practiceCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  practiceCellPrimary: {
    backgroundColor: colors.onAccent,
  },
  modeText: {
    flex: 1,
    gap: spacing.xs,
  },
  modeTitle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '900',
    letterSpacing: -0.45,
  },
  modeTitlePrimary: {
    color: colors.onAccent,
  },
  modeDescription: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    lineHeight: 19,
  },
  modeDescriptionPrimary: {
    color: colors.onAccent,
    opacity: 0.8,
  },
  modeAction: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  modeActionLabel: {
    color: colors.accent,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modeActionLabelPrimary: {
    color: colors.onAccent,
  },
  chevron: {
    width: 11,
    height: 11,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  chevronPrimary: {
    borderColor: colors.onAccent,
  },
  }), [colors]);
}
