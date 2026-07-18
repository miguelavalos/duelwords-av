import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { ensureDuelWordsDiagnosticsReady } from '@/diagnostics/runtime';

ensureDuelWordsDiagnosticsReady();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="word-duel/active-demo" />
        <Stack.Screen name="word-duel/challenge" options={{ title: 'Word Duel — DuelWords AV' }} />
        <Stack.Screen name="word-duel/connected-runtime" />
        <Stack.Screen name="word-duel/lobby-demo" />
        <Stack.Screen name="word-duel/play-avi-demo" />
        <Stack.Screen name="word-duel/practice" />
        <Stack.Screen name="word-duel/result-demo" />
        <Stack.Screen name="word-duel/solo-daily-demo" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
