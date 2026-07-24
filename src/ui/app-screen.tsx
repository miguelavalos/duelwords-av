import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, spacing, useAppTheme } from './theme';

type AppScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  bottomInset?: number;
  contentGap?: number;
};

export function AppScreen({
  children,
  scroll = true,
  bottomInset = spacing.xl,
  contentGap = spacing.lg,
}: AppScreenProps) {
  const { colors } = useAppTheme();

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PaperRules />
        <View
          role="main"
          style={[
            styles.content,
            styles.nonScrollContent,
            { gap: contentGap, paddingBottom: bottomInset },
          ]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PaperRules />
      <ScrollView
        role="main"
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={[styles.content, { gap: contentGap, paddingBottom: bottomInset }]}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function PaperRules() {
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.paperRules, styles.paperRulesNonInteractive]}>
      <View style={[styles.marginRule, { backgroundColor: colors.paperMargin }]} />
      {Array.from({ length: 18 }, (_, index) => (
        <View
          key={index}
          style={[styles.paperRule, { top: 72 + index * 38, backgroundColor: colors.paperLine }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  paperRules: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    opacity: 0.16,
  },
  paperRulesNonInteractive: {
    pointerEvents: 'none',
  },
  paperRule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  marginRule: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 28,
    width: StyleSheet.hairlineWidth,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  nonScrollContent: {
    flex: 1,
  },
});
