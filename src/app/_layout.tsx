import * as Sentry from '@sentry/react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DuelWordsAccountAvProvider } from '@/account/account-av-provider';
import { ensureDuelWordsDiagnosticsReady } from '@/diagnostics/runtime';
import { AppThemeProvider, useResolvedAppTheme } from '@/ui/theme';

const diagnosticsConfig = ensureDuelWordsDiagnosticsReady();

const duelWordsFlowScreenOptions = {
  animation: 'slide_from_right' as const,
  gestureDirection: 'horizontal' as const,
};

function RootLayout() {
  const appTheme = useResolvedAppTheme();

  return (
    <GestureHandlerRootView style={styles.root}>
      <DuelWordsAccountAvProvider>
        <ThemeProvider value={appTheme.isDark ? DarkTheme : DefaultTheme}>
          <AppThemeProvider value={appTheme}>
            <Head>
              <title>DuelWords AV</title>
              <meta
                name="description"
                content="Guest-first synchronized word challenges."
              />
            </Head>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="delete-account" options={{ presentation: 'modal' }} />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="pro" options={{ presentation: 'modal' }} />
              <Stack.Screen name="word-duel/active-demo" options={duelWordsFlowScreenOptions} />
              <Stack.Screen name="word-duel/challenge" options={{ ...duelWordsFlowScreenOptions, title: 'Word Duel — DuelWords AV' }} />
              <Stack.Screen name="word-duel/connected-runtime" options={duelWordsFlowScreenOptions} />
              <Stack.Screen name="word-duel/lobby-demo" options={duelWordsFlowScreenOptions} />
              <Stack.Screen name="word-duel/play-avi" options={duelWordsFlowScreenOptions} />
              <Stack.Screen name="word-duel/play-avi-demo" options={duelWordsFlowScreenOptions} />
              <Stack.Screen name="word-duel/practice" options={duelWordsFlowScreenOptions} />
              <Stack.Screen name="word-duel/daily" options={duelWordsFlowScreenOptions} />
              <Stack.Screen name="word-duel/result-demo" options={duelWordsFlowScreenOptions} />
              <Stack.Screen name="word-duel/solo-daily-demo" options={duelWordsFlowScreenOptions} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style={appTheme.isDark ? 'light' : 'dark'} />
          </AppThemeProvider>
        </ThemeProvider>
      </DuelWordsAccountAvProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default diagnosticsConfig.enabled ? Sentry.wrap(RootLayout) : RootLayout;
