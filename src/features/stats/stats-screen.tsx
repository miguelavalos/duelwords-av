import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/ui/app-screen';
import { colors, radii, spacing, typeScale } from '@/ui/theme';

export function StatsScreen() {
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
  return (
    <View style={styles.tile}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typeScale.body,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    minHeight: 92,
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
  },
  value: {
    color: colors.accent,
    fontSize: typeScale.title,
    fontWeight: '900',
  },
  label: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    fontWeight: '700',
  },
  panel: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
    padding: spacing.md,
  },
  panelText: {
    color: colors.text,
    fontSize: typeScale.small,
    lineHeight: 19,
  },
});
