import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/ui/app-screen';
import { colors, radii, spacing, typeScale } from '@/ui/theme';

export function RivalsScreen() {
  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Rivals</Text>
        <Text style={styles.subtitle}>Fast re-invites will land here after Account AV login.</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>No local rival list</Text>
        <Text style={styles.panelText}>
          Recent rivals, favorites, blocks and direct push invites require signed-in users. This
          shell deliberately avoids fake identities and durable social data.
        </Text>
      </View>
    </AppScreen>
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
  panel: {
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  panelTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '800',
  },
  panelText: {
    color: colors.textMuted,
    lineHeight: 21,
  },
});
