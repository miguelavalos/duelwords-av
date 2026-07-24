import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { radii, spacing, typeScale, useAppTheme } from './theme';

type ButtonTone = 'primary' | 'secondary' | 'quiet' | 'danger';

type AppButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  tone?: ButtonTone;
};

export function AppButton({ children, disabled, onPress, style, tone = 'primary' }: AppButtonProps) {
  const { colors } = useAppTheme();
  const toneStyle = tone === 'primary'
    ? { backgroundColor: colors.accent }
    : tone === 'danger'
      ? { backgroundColor: colors.danger }
    : tone === 'secondary'
      ? { backgroundColor: colors.secondarySoft, borderColor: colors.secondary }
      : { backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone !== 'primary' && tone !== 'danger' && styles.bordered,
        toneStyle,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text
        style={[
          styles.label,
          { color: tone === 'primary' || tone === 'danger' ? colors.onAccent : colors.text },
          disabled && { color: colors.textMuted },
        ]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  bordered: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.52,
  },
  label: {
    fontSize: typeScale.body,
    fontWeight: '800',
    letterSpacing: -0.15,
  },
});
