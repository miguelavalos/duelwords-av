import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

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
    <AppScreen key={appearance}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>DuelWords AV</Text>
          <Text aria-level={1} accessibilityRole="header" style={styles.title}>{t(interfaceLocale, 'settings')}</Text>
          <Text style={styles.subtitle}>{t(interfaceLocale, 'preferencesLocal')}</Text>
        </View>
        <AppButton
          style={styles.doneButton}
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
  const { fontScale } = useWindowDimensions();
  const usesCompactMarker = fontScale >= 1.3;

  return (
    <Pressable
      accessibilityLabel={selected ? `${label}, ${selectedLabel}` : label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.optionMarker}>
        {selected ? (usesCompactMarker ? '✓' : selectedLabel) : ''}
      </Text>
    </Pressable>
  );
}

function useSettingsStyles() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const usesCompactHeader = width <= 360;

  return useMemo(() => StyleSheet.create({
  header: {
    flexDirection: usesCompactHeader ? 'column' : 'row',
    alignItems: usesCompactHeader ? 'stretch' : 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  doneButton: {
    alignSelf: usesCompactHeader ? 'flex-end' : 'auto',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  kicker: {
    color: colors.accent,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    maxWidth: 520,
    color: colors.textMuted,
    fontSize: typeScale.small,
    lineHeight: 19,
  },
  section: {
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '800',
  },
  optionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    minHeight: 48,
    flexGrow: 1,
    flexBasis: 145,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  optionText: {
    flexShrink: 1,
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: colors.onAccent,
  },
  optionMarker: {
    flexShrink: 0,
    textAlign: 'right',
    color: colors.onAccent,
    fontSize: typeScale.tiny,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  }), [colors, usesCompactHeader]);
}
