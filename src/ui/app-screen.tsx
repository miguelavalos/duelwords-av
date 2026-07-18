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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
