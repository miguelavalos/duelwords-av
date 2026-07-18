import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from './theme';

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
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View role="main" style={[styles.content, { gap: contentGap, paddingBottom: bottomInset }]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        role="main"
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
    backgroundColor: colors.background,
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
});
