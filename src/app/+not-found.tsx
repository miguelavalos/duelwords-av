import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/ui/app-screen';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export default function NotFoundRoute() {
  const router = useRouter();
  const styles = useNotFoundStyles();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <AppScreen scroll={false}>
        <InteriorScreenHeader
          backLabel="Back to Home"
          detail="DuelWords AV"
          onBack={() => router.replace('/play')}
          title="Screen not found"
        />
        <View style={styles.container}>
          <Text style={styles.body}>This route is not part of the current duel.</Text>
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
