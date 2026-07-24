import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { experienceCopy } from '@/i18n/experience-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, DuelWordsWordmark, InkEyebrow, PaperCard, SectionHeading, aviAssets } from '@/ui/brand';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function DailyScreen() {
  const router = useRouter();
  const [{ interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const { colors } = useAppTheme();
  return (
    <AppScreen>
      <View style={styles.topBar}><DuelWordsWordmark compact /><AppButton tone="quiet" onPress={() => router.back()}>Close</AppButton></View>
      <View style={styles.hero}>
        <AviArtwork size={138} source={aviAssets.warning} />
        <View style={styles.heroCopy}>
          <InkEyebrow>{copy.daily}</InkEyebrow>
          <Text accessibilityRole="header" aria-level={1} style={[styles.title, { color: colors.text }]}>One official word. Not a local substitute.</Text>
          <Text style={[styles.detail, { color: colors.textMuted }]}>Daily is deliberately unavailable until the server-owned target, accepted guesses, result, and date policy are connected. Practice and Play Avi remain fully local.</Text>
        </View>
      </View>
      <PaperCard emphasized>
        <SectionHeading title="Why this is different" detail="Daily must fetch one server-selected challenge for the chosen language. The app will never silently replace it with a bundled target." />
        <AppButton onPress={() => router.back()}>Back to Home</AppButton>
      </PaperCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  hero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xl },
  heroCopy: { flex: 1, minWidth: 240, gap: spacing.sm },
  title: { fontFamily: 'Georgia', fontSize: 35, lineHeight: 39, fontWeight: '700', letterSpacing: -1 },
  detail: { fontSize: typeScale.body, lineHeight: 23 },
});
