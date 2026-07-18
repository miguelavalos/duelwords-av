import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/ui/app-screen';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

export function StatsScreen() {
  const styles = useStatsStyles();
  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.subtitle}>Durable results come after the authoritative game API.</Text>
      </View>

      <View style={styles.grid}>
        <StatTile label="Official duels" value="0" />
        <StatTile label="Daily streak" value="-" />
        <StatTile label="Best duel" value="-" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelText}>
          Local practice is for engine validation only. It does not create official history,
          achievements, rivals, or shareable results.
        </Text>
      </View>
    </AppScreen>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  const styles = useStatsStyles();
  return (
    <View style={styles.tile}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function useStatsStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typeScale.body,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  tile: {
    flex: 1,
    minWidth: 160,
    minHeight: 126,
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  value: {
    color: colors.accent,
    fontSize: typeScale.title,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    fontWeight: '700',
  },
  panel: {
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSoft,
    padding: spacing.lg,
  },
  panelText: {
    color: colors.text,
    fontSize: typeScale.small,
    lineHeight: 19,
  },
  }), [colors]);
}
