import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typeScale, useAppTheme } from './theme';

type ScreenBackButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
};

export function ScreenBackButton({ accessibilityLabel, onPress }: ScreenBackButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      testID="header.back"
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.backChevron, { borderColor: colors.text }]} />
    </Pressable>
  );
}

type ScreenInfoButtonProps = {
  accessibilityLabel: string;
  expanded?: boolean;
  onPress: () => void;
};

export function ScreenInfoButton({ accessibilityLabel, expanded = false, onPress }: ScreenInfoButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      hitSlop={8}
      onPress={onPress}
      testID="header.info"
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: expanded ? colors.surfaceSoft : colors.surface, borderColor: expanded ? colors.accent : colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.infoCircle, { borderColor: expanded ? colors.accent : colors.text }]}>
        <Text style={[styles.infoGlyph, { color: expanded ? colors.accent : colors.text }]}>i</Text>
      </View>
    </Pressable>
  );
}

type InteriorScreenHeaderProps = {
  backLabel: string;
  detail?: string;
  onBack: () => void;
  title?: string;
  trailing?: ReactNode;
};

export function InteriorScreenHeader({ backLabel, detail, onBack, title, trailing }: InteriorScreenHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.header}>
      <ScreenBackButton accessibilityLabel={backLabel} onPress={onBack} />
      {title || detail ? (
        <View style={styles.copy}>
          {title ? <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
          {detail ? <Text numberOfLines={1} style={[styles.detail, { color: colors.textMuted }]}>{detail}</Text> : null}
        </View>
      ) : <View style={styles.spacer} />}
      {trailing ?? <View style={styles.trailingSpacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  backChevron: {
    width: 12,
    height: 12,
    marginLeft: 5,
    borderBottomWidth: 2.4,
    borderLeftWidth: 2.4,
    transform: [{ rotate: '45deg' }],
  },
  infoCircle: {
    width: 21,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1.8,
  },
  infoGlyph: {
    marginTop: -1,
    fontFamily: 'Georgia',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '700',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: typeScale.body,
    lineHeight: 20,
    fontWeight: '700',
  },
  detail: {
    fontSize: typeScale.tiny,
    lineHeight: 16,
    fontWeight: '800',
  },
  spacer: { flex: 1 },
  trailingSpacer: { width: 44 },
});
