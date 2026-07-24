import { Image, type ImageSource } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { radii, spacing, typeScale, useAppTheme } from './theme';

export const aviAssets = {
  footer: require('../../assets/images/brand/avi-footer.png'),
  fullBody: require('../../assets/images/brand/avi-full-body.png'),
  neutral: require('../../assets/images/brand/avi-neutral.png'),
  onboarding: require('../../assets/images/brand/avi-onboarding.png'),
  thinking: require('../../assets/images/brand/avi-thinking.png'),
  warning: require('../../assets/images/brand/avi-warning.png'),
} as const;

export function DuelWordsWordmark({ compact = false }: { compact?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View accessible accessibilityLabel="DuelWords AV" accessibilityRole="image" style={styles.wordmarkRow}>
      <Text style={[styles.wordmark, compact && styles.wordmarkCompact, { color: colors.text }]}>DuelWords</Text>
      <View style={[styles.avStamp, compact && styles.avStampCompact, { borderColor: colors.accent }]}> 
        <Text style={[styles.avStampText, compact && styles.avStampTextCompact, { color: colors.accent }]}>AV</Text>
      </View>
      <View style={[styles.penStroke, { backgroundColor: colors.secondary }]} />
    </View>
  );
}

export function AviArtwork({
  accessibilityLabel = 'Avi',
  size = 120,
  source = aviAssets.fullBody,
}: {
  accessibilityLabel?: string;
  size?: number;
  source?: ImageSource;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.aviHalo, { width: size, height: size, borderColor: colors.border, backgroundColor: colors.surface }]}> 
      <Image
        accessibilityLabel={accessibilityLabel}
        contentFit="contain"
        source={source}
        style={{ width: size * 0.96, height: size * 0.96 }}
      />
      <View style={[styles.aviPen, { backgroundColor: colors.inkSoft }]}> 
        <View style={[styles.aviPenTip, { borderTopColor: colors.secondary }]} />
      </View>
    </View>
  );
}

export function PaperCard({
  children,
  emphasized = false,
  style,
}: {
  children: ReactNode;
  emphasized?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.paperCard,
        {
          backgroundColor: emphasized ? colors.surfaceSoft : colors.surface,
          borderColor: emphasized ? colors.accent : colors.border,
        },
        style,
      ]}>
      <View style={[styles.cardTape, { backgroundColor: colors.secondarySoft }]} />
      {children}
    </View>
  );
}

export function InkEyebrow({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.eyebrow, { color: colors.accent }]}>{children}</Text>;
}

export function ChromeButton({
  accessibilityLabel,
  children,
  onPress,
  selected = false,
}: {
  accessibilityLabel: string;
  children: ReactNode;
  onPress: () => void;
  selected?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chromeButton,
        {
          backgroundColor: selected ? colors.surfaceSoft : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}>
      {children}
    </Pressable>
  );
}

export function SectionHeading({ detail, title }: { detail?: string; title: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionHeading}>
      <Text accessibilityRole="header" aria-level={2} style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {detail ? <Text style={[styles.sectionDetail, { color: colors.textMuted }]}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wordmarkRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  wordmark: {
    fontFamily: 'Georgia',
    fontSize: 31,
    fontWeight: '700',
    letterSpacing: -1.4,
  },
  wordmarkCompact: { fontSize: 24 },
  avStamp: {
    marginLeft: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderRadius: 7,
    transform: [{ rotate: '-4deg' }],
  },
  avStampCompact: { paddingHorizontal: 5, paddingVertical: 2 },
  avStampText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.6 },
  avStampTextCompact: { fontSize: 11 },
  penStroke: {
    position: 'absolute',
    left: 2,
    right: 36,
    bottom: 1,
    height: 2,
    borderRadius: 2,
    opacity: 0.82,
    transform: [{ rotate: '-1deg' }],
  },
  aviHalo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    transform: [{ rotate: '-1deg' }],
  },
  aviPen: {
    position: 'absolute',
    width: 7,
    height: 44,
    right: 6,
    bottom: -6,
    borderRadius: 4,
    transform: [{ rotate: '34deg' }],
  },
  aviPenTip: {
    position: 'absolute',
    bottom: -7,
    left: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  paperCard: {
    position: 'relative',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    boxShadow: '0 5px 18px rgba(38, 45, 43, 0.08)',
  },
  cardTape: {
    position: 'absolute',
    width: 54,
    height: 12,
    top: -6,
    left: '50%',
    marginLeft: -27,
    opacity: 0.62,
    transform: [{ rotate: '-2deg' }],
  },
  eyebrow: {
    fontSize: typeScale.tiny,
    fontWeight: '900',
    letterSpacing: 1.25,
    textTransform: 'uppercase',
  },
  chromeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    borderCurve: 'continuous',
  },
  sectionHeading: { gap: spacing.xs },
  sectionTitle: {
    fontFamily: 'Georgia',
    fontSize: typeScale.subtitle,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sectionDetail: { fontSize: typeScale.small, lineHeight: 19 },
});
