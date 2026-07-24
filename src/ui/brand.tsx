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

export const duelWordsBrandAssets = {
  lockup: require('../../assets/images/brand/duelwords-logo-lockup.png'),
  lockupDark: require('../../assets/images/brand/duelwords-logo-lockup-dark.png'),
  onboardingHero: require('../../assets/images/brand/duelwords-onboarding-hero.png'),
  splashHero: require('../../assets/images/brand/duelwords-splash-hero.png'),
  wordmark: require('../../assets/images/brand/duelwords-wordmark.png'),
  wordmarkDark: require('../../assets/images/brand/duelwords-wordmark-dark.png'),
} as const;

export function DuelWordsWordmark({ compact = false, withIcon = false }: { compact?: boolean; withIcon?: boolean }) {
  const { isDark } = useAppTheme();
  const source = withIcon
    ? (isDark ? duelWordsBrandAssets.lockupDark : duelWordsBrandAssets.lockup)
    : (isDark ? duelWordsBrandAssets.wordmarkDark : duelWordsBrandAssets.wordmark);

  return (
    <Image
      accessibilityLabel="DuelWords AV"
      accessibilityRole="image"
      contentFit="contain"
      source={source}
      style={[
        withIcon ? styles.lockup : styles.wordmark,
        compact && (withIcon ? styles.lockupCompact : styles.wordmarkCompact),
      ]}
    />
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
  return (
    <View style={[styles.aviFrame, { width: size, height: size }]}>
      <Image
        accessibilityLabel={accessibilityLabel}
        contentFit="contain"
        source={source}
        style={{ width: size, height: size }}
      />
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
  wordmark: {
    width: 242,
    height: 58,
    alignSelf: 'flex-start',
  },
  wordmarkCompact: { width: 190, height: 46 },
  lockup: {
    width: 318,
    height: 70,
    alignSelf: 'flex-start',
  },
  lockupCompact: { width: 246, height: 56 },
  aviFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperCard: {
    position: 'relative',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    boxShadow: '0 5px 18px rgba(38, 45, 43, 0.08)',
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
