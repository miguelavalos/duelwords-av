import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

type CompactDuelStatusRowProps = {
  compact?: boolean;
  detail: string;
  error?: boolean;
  label: string;
};

export function CompactDuelStatusRow({
  compact = false,
  detail,
  error = false,
  label,
}: CompactDuelStatusRowProps) {
  const styles = useStyles();

  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        error && styles.rowError,
      ]}
      testID="compact-duel-status-row">
      <Text numberOfLines={1} style={styles.label}>{label}</Text>
      <Text
        accessibilityLiveRegion={error ? 'assertive' : 'polite'}
        adjustsFontSizeToFit
        ellipsizeMode="tail"
        minimumFontScale={0.8}
        numberOfLines={1}
        style={[styles.detail, error && styles.detailError]}>
        {detail}
      </Text>
    </View>
  );
}

function useStyles() {
  const { colors } = useAppTheme();

  return StyleSheet.create({
    row: {
      height: 42,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      overflow: 'hidden',
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'transparent',
      backgroundColor: colors.surfaceSoft,
      paddingHorizontal: spacing.md,
    },
    rowCompact: {
      height: 36,
    },
    rowError: {
      borderColor: colors.danger,
    },
    label: {
      flex: 1,
      color: colors.text,
      fontSize: typeScale.body,
      fontWeight: '900',
    },
    detail: {
      flex: 1,
      flexShrink: 1,
      color: colors.accent,
      fontSize: typeScale.small,
      fontWeight: '900',
      textAlign: 'right',
      textTransform: 'uppercase',
    },
    detailError: {
      color: colors.danger,
    },
  });
}
