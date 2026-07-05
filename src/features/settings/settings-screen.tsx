import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GameLanguage } from '@/game/word-duel-engine';
import { GAME_LANGUAGES, INTERFACE_LOCALES, type InterfaceLocale, t } from '@/i18n/locales';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { colors, radii, spacing, typeScale } from '@/ui/theme';

export function SettingsScreen() {
  const router = useRouter();
  const [interfaceLocale, setInterfaceLocale] = useState<InterfaceLocale>('en');
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>('en');

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>{t(interfaceLocale, 'settings')}</Text>
        <AppButton tone="quiet" onPress={() => router.back()}>
          Done
        </AppButton>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t(interfaceLocale, 'interfaceLanguage')}</Text>
        <View style={styles.optionList}>
          {INTERFACE_LOCALES.map((locale) => (
            <Option
              key={locale.code}
              label={locale.label}
              selected={locale.code === interfaceLocale}
              onPress={() => setInterfaceLocale(locale.code)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t(interfaceLocale, 'gameLanguage')}</Text>
        <View style={styles.optionList}>
          {GAME_LANGUAGES.map((language) => (
            <Option
              key={language.code}
              label={language.label}
              selected={language.code === gameLanguage}
              onPress={() => setGameLanguage(language.code)}
            />
          ))}
        </View>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Preferences are in-memory in this first local slice. Account-owned settings and durable
          sync come later through the approved Apps AV boundary.
        </Text>
      </View>
    </AppScreen>
  );
}

function Option({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      <Text style={styles.optionMarker}>{selected ? 'Selected' : ''}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '800',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '800',
  },
  optionList: {
    gap: spacing.sm,
  },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceSoft,
  },
  optionText: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: colors.accent,
  },
  optionMarker: {
    minWidth: 72,
    textAlign: 'right',
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  note: {
    borderRadius: radii.md,
    backgroundColor: colors.secondarySoft,
    padding: spacing.md,
  },
  noteText: {
    color: colors.text,
    fontSize: typeScale.small,
    lineHeight: 19,
  },
});
