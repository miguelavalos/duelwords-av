import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  buildWordDuelHref,
  WORD_DUEL_ROUTE_PATHS,
} from '@/features/word-duel/word-duel-route-params';
import { GAME_LANGUAGES, t } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

type ModeCardProps = {
  badgeLabel: string;
  ctaLabel: string;
  description: string;
  disabled?: boolean;
  iconLabel: string;
  onPress?: () => void;
  title: string;
};

export function PlayScreen() {
  const router = useRouter();
  const styles = usePlayStyles();
  const [preferences, setPreferences] = useAppPreferences();
  const { gameLanguage, interfaceLocale } = preferences;
  const modeCardLabels = {
    badgeLabel: t(interfaceLocale, 'comingLater'),
    ctaLabel: t(interfaceLocale, 'start'),
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>{t(interfaceLocale, 'appName')}</Text>
          <Text style={styles.subtitle}>{t(interfaceLocale, 'playSubtitle')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(interfaceLocale, 'settings')}
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}>
          <Text style={styles.settingsText}>S</Text>
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
        {...modeCardLabels}
        title={t(interfaceLocale, 'challengeFriend')}
        description={t(interfaceLocale, 'challengeDescription')}
        iconLabel="1v1"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.challenge, {
          gameLanguage,
          interfaceLocale,
          mode: 'human_duel',
        }))}
      />

      <ModeCard
        {...modeCardLabels}
        title="Invite lobby preview"
        description="Host invite, join review, lobby Ready, countdown and round-open handoff."
        iconLabel="GO"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.lobby, {
          gameLanguage,
          mode: 'human_duel',
        }))}
      />

      <ModeCard
        {...modeCardLabels}
        title="Active duel preview"
        description="Mobile 1v1 surface with synced-round status, safe rival progress and compact ad slot."
        iconLabel="1v1"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.active, {
          gameLanguage,
          mode: 'human_duel',
        }))}
      />

      <ModeCard
        {...modeCardLabels}
        title="Result preview"
        description="Final result, target reveal, completed boards, rematch setup and safe share preview."
        iconLabel="R"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.result, {
          gameLanguage,
          mode: 'human_duel',
        }))}
      />

      <ModeCard
        {...modeCardLabels}
        title="Play Avi preview"
        description="Deterministic local bot duel with synced-round rhythm and safe opponent summary."
        iconLabel="AV"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.playAvi, {
          gameLanguage,
          mode: 'bot_duel',
        }))}
      />

      <ModeCard
        {...modeCardLabels}
        title="Solo / Daily preview"
        description="Local Solo and Daily-style board with safe sharing and post-result ad slot."
        iconLabel="SD"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.soloDaily, {
          gameLanguage,
          mode: 'solo_practice',
        }))}
      />

      <ModeCard
        {...modeCardLabels}
        title={`${t(interfaceLocale, 'wordDuel')} ${t(interfaceLocale, 'practice')}`}
        description="Local engine, five letters, six attempts. No remote authority yet."
        iconLabel="WD"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice, {
          gameLanguage,
          mode: 'practice',
        }))}
      />

      <View style={styles.modeGrid}>
        <ModeCard
          {...modeCardLabels}
          title={t(interfaceLocale, 'daily')}
          description="Official daily targets require server dictionary authority."
          disabled
          iconLabel="D"
        />
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>{t(interfaceLocale, 'localOnly')}</Text>
        <Text style={styles.noteText}>
          Connected games will use Apps AV API/D1 for target selection, validation and scoring.
          Convex will carry only safe realtime room state.
        </Text>
      </View>
    </AppScreen>
  );
}

function ModeCard({ badgeLabel, ctaLabel, description, disabled, iconLabel, onPress, title }: ModeCardProps) {
  const styles = usePlayStyles();
  return (
    <View style={[styles.modeCard, disabled && styles.modeCardDisabled]}>
      <View style={styles.modeIcon}>
        <Text style={[styles.modeIconText, disabled && styles.modeIconTextDisabled]}>{iconLabel}</Text>
      </View>
      <View style={styles.modeText}>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeDescription}>{description}</Text>
      </View>
      {disabled ? (
        <Text style={styles.badge}>{badgeLabel}</Text>
      ) : (
        <AppButton onPress={onPress} style={styles.cardCta}>
          {ctaLabel}
        </AppButton>
      )}
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
  },
  brand: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    marginTop: spacing.xs,
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  settingsText: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '900',
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
  modeGrid: {
    gap: spacing.md,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  modeCardDisabled: {
    backgroundColor: colors.surfaceStrong,
  },
  modeIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
  },
  modeIconText: {
    color: colors.accent,
    fontSize: typeScale.small,
    fontWeight: '900',
  },
  modeIconTextDisabled: {
    color: colors.textMuted,
  },
  modeText: {
    flex: 1,
    gap: spacing.xs,
  },
  modeTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '800',
  },
  modeDescription: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    lineHeight: 18,
  },
  badge: {
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardCta: {
    minWidth: 76,
    minHeight: 38,
  },
  note: {
    gap: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.pressureSoft,
    padding: spacing.md,
  },
  noteTitle: {
    color: colors.pressure,
    fontWeight: '800',
  },
  noteText: {
    color: colors.text,
    fontSize: typeScale.small,
    lineHeight: 19,
  },
  }), [colors]);
}
