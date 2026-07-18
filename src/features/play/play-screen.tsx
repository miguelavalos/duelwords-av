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
  ctaLabel: string;
  description: string;
  iconLabel: string;
  onPress: () => void;
  title: string;
};

export function PlayScreen() {
  const router = useRouter();
  const styles = usePlayStyles();
  const [preferences, setPreferences] = useAppPreferences();
  const { gameLanguage, interfaceLocale } = preferences;
  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text aria-level={1} accessibilityRole="header" style={styles.brand}>{t(interfaceLocale, 'appName')}</Text>
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
        ctaLabel={t(interfaceLocale, 'start')}
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
        ctaLabel={t(interfaceLocale, 'startPractice')}
        title={`${t(interfaceLocale, 'wordDuel')} ${t(interfaceLocale, 'practice')}`}
        description={t(interfaceLocale, 'practiceDescription')}
        iconLabel="WD"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice, {
          gameLanguage,
          mode: 'practice',
        }))}
      />
    </AppScreen>
  );
}

function ModeCard({ ctaLabel, description, iconLabel, onPress, title }: ModeCardProps) {
  const styles = usePlayStyles();
  return (
    <View style={styles.modeCard}>
      <View style={styles.modeIcon}>
        <Text style={styles.modeIconText}>{iconLabel}</Text>
      </View>
      <View style={styles.modeText}>
        <Text aria-level={2} accessibilityRole="header" style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeDescription}>{description}</Text>
      </View>
      <AppButton onPress={onPress} style={styles.cardCta}>
        {ctaLabel}
      </AppButton>
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
  cardCta: {
    minWidth: 76,
    minHeight: 38,
  },
  }), [colors]);
}
