import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GameLanguage } from '@/game/word-duel-engine';
import { GAME_LANGUAGES } from '@/i18n/locales';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

type GameLanguagePickerProps = {
  disabled?: boolean;
  dismissLabel: string;
  label: string;
  onChange: (language: GameLanguage) => void;
  options?: readonly { code: GameLanguage; label: string }[];
  value: GameLanguage;
};

/**
 * A compact game-setting control that remains usable as the approved
 * playable-language catalog grows without crowding the game screen.
 */
export function GameLanguagePicker({
  disabled = false,
  dismissLabel,
  label,
  onChange,
  options = GAME_LANGUAGES,
  value,
}: GameLanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useGameLanguagePickerStyles();
  const selected = options.find((language) => language.code === value) ?? options[0];
  const centered = width >= 700;

  function select(language: GameLanguage) {
    setOpen(false);
    if (language !== value) {
      onChange(language);
    }
  }

  return (
    <>
      <Pressable
        accessibilityLabel={`${label}, ${selected.label}`}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          pressed && styles.triggerPressed,
          disabled && styles.disabled,
        ]}>
        <View style={styles.triggerCopy}>
          <Text numberOfLines={1} style={styles.label}>{label}</Text>
          <Text numberOfLines={1} style={styles.selectedLabel}>{selected.label}</Text>
        </View>
        <View style={styles.trailing}>
          <Text style={styles.code}>{selected.code.toUpperCase()}</Text>
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.chevron}>⌄</Text>
        </View>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}>
        <View accessibilityViewIsModal style={styles.modalRoot}>
          <Pressable
            accessibilityLabel={dismissLabel}
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.sheet,
              centered && styles.sheetCentered,
              { paddingBottom: Math.max(insets.bottom, spacing.md) },
            ]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeading}>
                <Text accessibilityRole="header" style={styles.sheetTitle}>{label}</Text>
                <Text style={styles.sheetSubtitle}>{selected.label}</Text>
              </View>
              <Pressable
                accessibilityLabel={dismissLabel}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setOpen(false)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.triggerPressed]}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              bounces={false}
              contentContainerStyle={styles.optionList}
              contentInsetAdjustmentBehavior="automatic">
              {options.map((language) => {
                const isSelected = language.code === value;
                return (
                  <Pressable
                    key={language.code}
                    accessibilityLabel={`${language.label}, ${language.code.toUpperCase()}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => select(language.code)}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}>
                    <View style={styles.optionCode}>
                      <Text style={[styles.optionCodeText, isSelected && styles.optionCodeTextSelected]}>
                        {language.code.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {language.label}
                    </Text>
                    <Text
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      style={[styles.checkmark, !isSelected && styles.checkmarkHidden]}>
                      ✓
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function useGameLanguagePickerStyles() {
  const { colors } = useAppTheme();

  return useMemo(() => StyleSheet.create({
    trigger: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderRadius: radii.md,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    triggerPressed: { opacity: 0.72 },
    disabled: { opacity: 0.48 },
    triggerCopy: { flex: 1, minWidth: 0, gap: 2 },
    label: {
      color: colors.textMuted,
      fontSize: typeScale.tiny,
      fontWeight: '900',
      letterSpacing: 0.45,
      textTransform: 'uppercase',
    },
    selectedLabel: { color: colors.text, fontSize: typeScale.body, fontWeight: '900' },
    trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    code: {
      color: colors.accent,
      fontSize: typeScale.tiny,
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
    },
    chevron: { color: colors.textMuted, fontSize: 20, fontWeight: '900', marginTop: -5 },
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(18, 13, 10, 0.42)',
    },
    sheet: {
      maxHeight: '78%',
      gap: spacing.md,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      borderCurve: 'continuous',
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      boxShadow: '0 -8px 30px rgba(18, 13, 10, 0.18)',
    },
    sheetCentered: {
      width: '100%',
      maxWidth: 520,
      alignSelf: 'center',
      marginBottom: spacing.xxl,
      borderRadius: radii.lg,
    },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    sheetHeading: { flex: 1, minWidth: 0, gap: 2 },
    sheetTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: '900' },
    sheetSubtitle: { color: colors.textMuted, fontSize: typeScale.small, fontWeight: '700' },
    closeButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: colors.surfaceStrong,
    },
    closeText: { color: colors.text, fontSize: 26, fontWeight: '500', lineHeight: 29 },
    optionList: { gap: spacing.sm, paddingBottom: spacing.xs },
    option: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderRadius: radii.md,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    optionSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceSoft },
    optionPressed: { opacity: 0.76 },
    optionCode: {
      width: 40,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.sm,
      backgroundColor: colors.surfaceStrong,
    },
    optionCodeText: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '900' },
    optionCodeTextSelected: { color: colors.accent },
    optionLabel: { flex: 1, color: colors.text, fontSize: typeScale.body, fontWeight: '800' },
    optionLabelSelected: { color: colors.accent },
    checkmark: { color: colors.accent, fontSize: typeScale.lead, fontWeight: '900' },
    checkmarkHidden: { opacity: 0 },
  }), [colors]);
}
