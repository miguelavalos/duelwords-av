import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GAME_LANGUAGES, INTERFACE_LOCALES, t } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

export function SettingsScreen() {
  const router = useRouter();
  const styles = useSettingsStyles();
  const [preferences, setPreferences] = useAppPreferences();
  const { appearance, gameLanguage, interfaceLocale } = preferences;

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text aria-level={1} accessibilityRole="header" style={styles.title}>{t(interfaceLocale, 'settings')}</Text>
        <AppButton
          tone="quiet"
          onPress={() => router.replace('/play')}>
          {t(interfaceLocale, 'done')}
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
              selectedLabel={t(interfaceLocale, 'selected')}
              onPress={() => setPreferences((current) => ({
                ...current,
                interfaceLocale: locale.code,
              }))}
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
              selectedLabel={t(interfaceLocale, 'selected')}
              onPress={() => setPreferences((current) => ({
                ...current,
                gameLanguage: language.code,
              }))}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t(interfaceLocale, 'appearance')}</Text>
        <View style={styles.optionList}>
          {(['system', 'light', 'dark'] as const).map((option) => (
            <Option
              key={option}
              label={t(interfaceLocale, option)}
              selected={appearance === option}
              selectedLabel={t(interfaceLocale, 'selected')}
              onPress={() => setPreferences((current) => ({
                ...current,
                appearance: option,
              }))}
            />
          ))}
        </View>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          {t(interfaceLocale, 'preferencesLocal')}
        </Text>
      </View>
    </AppScreen>
  );
}

function Option({
  label,
  onPress,
  selected,
  selectedLabel,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
  selectedLabel: string;
}) {
  const styles = useSettingsStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      <Text style={styles.optionMarker}>{selected ? selectedLabel : ''}</Text>
    </Pressable>
  );
}

function useSettingsStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
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
  }), [colors]);
}
