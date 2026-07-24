import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';

import { DuelWordsAccountAvProvider } from '@/account/account-av-provider';
import { ensureDuelWordsDiagnosticsReady } from '@/diagnostics/runtime';
import { AppThemeProvider, useResolvedAppTheme } from '@/ui/theme';

ensureDuelWordsDiagnosticsReady();

export default function RootLayout() {
  const appTheme = useResolvedAppTheme();

  return (
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
          <Stack.Screen name="account" />
          <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="pro" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          <Stack.Screen name="word-duel/active-demo" />
          <Stack.Screen name="word-duel/challenge" options={{ title: 'Word Duel — DuelWords AV' }} />
          <Stack.Screen name="word-duel/connected-runtime" />
          <Stack.Screen name="word-duel/lobby-demo" />
          <Stack.Screen name="word-duel/play-avi" />
          <Stack.Screen name="word-duel/play-avi-demo" />
          <Stack.Screen name="word-duel/practice" />
          <Stack.Screen name="word-duel/daily" />
          <Stack.Screen name="word-duel/result-demo" />
          <Stack.Screen name="word-duel/solo-daily-demo" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={appTheme.isDark ? 'light' : 'dark'} />
        </AppThemeProvider>
      </ThemeProvider>
    </DuelWordsAccountAvProvider>
  );
}
