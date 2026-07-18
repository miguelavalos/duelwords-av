import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GameLanguage } from '@/game/word-duel-engine';
import {
  buildWordDuelHref,
  WORD_DUEL_ROUTE_PATHS,
} from '@/features/word-duel/word-duel-route-params';
import { GAME_LANGUAGES, t } from '@/i18n/locales';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { colors, radii, spacing, typeScale } from '@/ui/theme';

type ModeCardProps = {
  description: string;
  disabled?: boolean;
  iconLabel: string;
  onPress?: () => void;
  title: string;
};

export function PlayScreen() {
  const router = useRouter();
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>('en');

  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>{t('en', 'appName')}</Text>
          <Text style={styles.subtitle}>Synchronized word challenges start here.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}>
          <Text style={styles.settingsText}>S</Text>
        </Pressable>
      </View>

      <View style={styles.selectorBlock}>
        <Text style={styles.sectionLabel}>{t('en', 'gameLanguage')}</Text>
        <View style={styles.segmented}>
          {GAME_LANGUAGES.map((language) => {
            const selected = language.code === gameLanguage;
            return (
              <Pressable
                key={language.code}
                accessibilityRole="button"
                onPress={() => setGameLanguage(language.code)}
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
        title={t('en', 'challengeFriend')}
        description="Create or join a live guest challenge. Online play stays unavailable unless the safe runtime is enabled."
        iconLabel="1v1"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.challenge, {
          gameLanguage,
          mode: 'human_duel',
        }))}
      />

      <ModeCard
        title="Invite lobby preview"
        description="Host invite, join review, lobby Ready, countdown and round-open handoff."
        iconLabel="GO"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.lobby, {
          gameLanguage,
          mode: 'human_duel',
        }))}
      />

      <ModeCard
        title="Active duel preview"
        description="Mobile 1v1 surface with synced-round status, safe rival progress and compact ad slot."
        iconLabel="1v1"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.active, {
          gameLanguage,
          mode: 'human_duel',
        }))}
      />

      <ModeCard
        title="Result preview"
        description="Final result, target reveal, completed boards, rematch setup and safe share preview."
        iconLabel="R"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.result, {
          gameLanguage,
          mode: 'human_duel',
        }))}
      />

      <ModeCard
        title="Play Avi preview"
        description="Deterministic local bot duel with synced-round rhythm and safe opponent summary."
        iconLabel="AV"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.playAvi, {
          gameLanguage,
          mode: 'bot_duel',
        }))}
      />

      <ModeCard
        title="Solo / Daily preview"
        description="Local Solo and Daily-style board with safe sharing and post-result ad slot."
        iconLabel="SD"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.soloDaily, {
          gameLanguage,
          mode: 'solo_practice',
        }))}
      />

      <ModeCard
        title={`${t('en', 'wordDuel')} ${t('en', 'practice')}`}
        description="Local engine, five letters, six attempts. No remote authority yet."
        iconLabel="WD"
        onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice, {
          gameLanguage,
          mode: 'practice',
        }))}
      />

      <View style={styles.modeGrid}>
        <ModeCard
          title={t('en', 'daily')}
          description="Official daily targets require server dictionary authority."
          disabled
          iconLabel="D"
        />
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>{t('en', 'localOnly')}</Text>
        <Text style={styles.noteText}>
          Connected games will use Apps AV API/D1 for target selection, validation and scoring.
          Convex will carry only safe realtime room state.
        </Text>
      </View>
    </AppScreen>
  );
}

function ModeCard({ description, disabled, iconLabel, onPress, title }: ModeCardProps) {
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
        <Text style={styles.badge}>{t('en', 'comingLater')}</Text>
      ) : (
        <AppButton onPress={onPress} style={styles.cardCta}>
          Start
        </AppButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
