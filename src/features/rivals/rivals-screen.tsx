import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/ui/app-screen';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

export function RivalsScreen() {
  const styles = useRivalsStyles();
  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Rivals</Text>
        <Text style={styles.subtitle}>Fast re-invites will land here after Account AV login.</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.emptyMark}>
          <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
          <View style={styles.rivalLine} />
          <View style={[styles.avatar, styles.avatarQuiet]}><Text style={styles.avatarText}>B</Text></View>
        </View>
        <Text style={styles.panelTitle}>No local rival list</Text>
        <Text style={styles.panelText}>
          Recent rivals, favorites, blocks and direct push invites require signed-in users. This
          shell deliberately avoids fake identities and durable social data.
        </Text>
      </View>
    </AppScreen>
  );
}

function useRivalsStyles() {
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
  panel: {
    gap: spacing.sm,
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  emptyMark: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: colors.accent,
  },
  avatarQuiet: {
    backgroundColor: colors.surfaceStrong,
  },
  avatarText: {
    color: colors.onAccent,
    fontSize: typeScale.lead,
    fontWeight: '900',
  },
  rivalLine: {
    width: 54,
    height: 2,
    backgroundColor: colors.border,
  },
  panelTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
    textAlign: 'center',
  },
  panelText: {
    color: colors.textMuted,
    lineHeight: 21,
    maxWidth: 520,
    textAlign: 'center',
  },
  }), [colors]);
}
