import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/ui/app-screen';
import { experienceCopy } from '@/i18n/experience-copy';
import { sharedSurfaceT } from '@/i18n/shared-surface-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export default function NotFoundRoute() {
  const router = useRouter();
  const [{ interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const surfaceCopy = (key: Parameters<typeof sharedSurfaceT>[1]) => sharedSurfaceT(interfaceLocale, key);
  const styles = useNotFoundStyles();
  return (
    <>
      <Stack.Screen options={{ title: surfaceCopy('Screen not found') }} />
      <AppScreen scroll={false}>
        <InteriorScreenHeader
          backLabel={copy.backHome}
          detail="DuelWords AV"
          onBack={() => router.replace('/play')}
          title={surfaceCopy('Screen not found')}
        />
        <View style={styles.container}>
          <Text style={styles.body}>{surfaceCopy('This screen is not part of the current duel.')}</Text>
        </View>
      </AppScreen>
    </>
  );
}

function useNotFoundStyles() {
  const { colors } = useAppTheme();
  return StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    maxWidth: 520,
  },
  body: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    lineHeight: 22,
  },
  });
}
