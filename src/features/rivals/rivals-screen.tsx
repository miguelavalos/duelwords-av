import { type Href, useRouter } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { buildWordDuelHref, WORD_DUEL_ROUTE_PATHS } from '@/features/word-duel/word-duel-route-params';
import { experienceCopy } from '@/i18n/experience-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, DuelWordsWordmark, InkEyebrow, PaperCard, SectionHeading } from '@/ui/brand';
import { layout, spacing, typeScale, useAppTheme } from '@/ui/theme';

export function RivalsScreen() {
  const router = useRouter();
  const account = useDuelWordsAccount();
  const [{ gameLanguage, interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const signedIn = account.user !== null;

  return (
    <AppScreen bottomInset={width < 760 ? layout.phoneShellBottomInset : spacing.xxl}>
      {width < 760 ? <DuelWordsWordmark compact /> : null}
      <View style={styles.header}>
        <InkEyebrow>{copy.rivals}</InkEyebrow>
        <Text accessibilityRole="header" aria-level={1} style={[styles.title, { color: colors.text }]}>{signedIn ? 'Ready for a rematch.' : 'Rivals without a social network.'}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{signedIn ? 'Recent and favorite rivals will appear after account-owned summaries ship.' : 'Invite links stay guest-friendly. Account AV is only needed to remember people safely.'}</Text>
      </View>

      <PaperCard emphasized>
        <View style={styles.emptyHero}>
          <AviArtwork size={112} />
          <View style={styles.emptyCopy}>
            <SectionHeading title={signedIn ? 'No saved rivals yet' : 'Play first, remember later'} detail={signedIn ? 'Finish a human duel to create an eligible recent-rival summary. No public profile or precise online status is exposed.' : 'Create a normal private invite now. Sign in only if you want recent rivals, favorites, blocks, or direct invites.'} />
          </View>
        </View>
        <AppButton onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.challenge, { gameLanguage, interfaceLocale, mode: 'human_duel' }))}>{copy.challenge}</AppButton>
        {!signedIn ? <AppButton disabled={!account.available} tone="secondary" onPress={() => router.push('/auth?mode=signIn' as Href)}>Sign in to remember rivals</AppButton> : null}
      </PaperCard>

      <PaperCard>
        <SectionHeading title="Privacy by design" detail="DuelWords does not import contacts or expose friend lists, handles, profile search, exact presence, or opponent relationship state." />
        <View style={styles.pillRow}>{['Private invites', 'Favorites', 'Blocks', 'No public profiles'].map((label) => <View key={label} style={[styles.pill, { backgroundColor: colors.surfaceSoft }]}><Text style={[styles.pillText, { color: colors.text }]}>{label}</Text></View>)}</View>
      </PaperCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { maxWidth: 620, fontFamily: 'Georgia', fontSize: 36, lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
  subtitle: { maxWidth: 620, fontSize: typeScale.body, lineHeight: 22 },
  emptyHero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.lg },
  emptyCopy: { flex: 1, minWidth: 220 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 99 },
  pillText: { fontSize: typeScale.small, fontWeight: '800' },
});
