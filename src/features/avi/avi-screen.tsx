import { type Href, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { buildWordDuelHref, WORD_DUEL_ROUTE_PATHS } from '@/features/word-duel/word-duel-route-params';
import { experienceCopy } from '@/i18n/experience-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, DuelWordsWordmark, InkEyebrow, PaperCard, SectionHeading, aviAssets } from '@/ui/brand';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function AviScreen() {
  const router = useRouter();
  const [{ gameLanguage, interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const { colors } = useAppTheme();

  return (
    <AppScreen bottomInset={spacing.xxl}>
      <DuelWordsWordmark compact />
      <View style={styles.hero}>
        <AviArtwork size={142} source={aviAssets.onboarding} />
        <View style={styles.heroCopy}>
          <InkEyebrow>Avi · DuelWords AV</InkEyebrow>
          <Text accessibilityRole="header" aria-level={1} style={[styles.title, { color: colors.text }]}>{copy.aviTitle}</Text>
          <Text style={[styles.detail, { color: colors.textMuted }]}>{copy.aviDetail}</Text>
        </View>
      </View>

      <PaperCard emphasized>
        <SectionHeading title={copy.aviRulesTitle} detail={copy.aviRulesDetail} />
        <View style={styles.inkLegend}>
          <InkChip label="=" color={colors.feedbackExact} />
          <InkChip label="≈" color={colors.feedbackPresent} />
          <InkChip label="×" color={colors.feedbackAbsent} />
        </View>
        <AppButton tone="secondary" onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice, { gameLanguage, mode: 'practice' }))}>{copy.openPractice}</AppButton>
      </PaperCard>

      <PaperCard>
        <SectionHeading title={copy.aviModesTitle} detail={copy.aviModesDetail} />
        <AppButton onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.playAvi, { gameLanguage, mode: 'bot_duel' }))}>{copy.playAvi}</AppButton>
        <AppButton tone="quiet" onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.challenge, { gameLanguage, interfaceLocale, mode: 'human_duel' }))}>{copy.challenge}</AppButton>
      </PaperCard>

      <PaperCard>
        <SectionHeading title={copy.aviAccountTitle} detail={copy.aviAccountDetail} />
        <View style={styles.actions}>
          <AppButton tone="secondary" style={styles.action} onPress={() => router.push('/account' as Href)}>{copy.account}</AppButton>
          <AppButton tone="quiet" style={styles.action} onPress={() => router.push('/settings')}>{copy.openSettings}</AppButton>
        </View>
      </PaperCard>
    </AppScreen>
  );
}

function InkChip({ color, label }: { color: string; label: string }) {
  return <View style={[styles.inkChip, { backgroundColor: color }]}><Text style={styles.inkChipText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xl },
  heroCopy: { flex: 1, minWidth: 240, gap: spacing.sm },
  title: { fontFamily: 'Georgia', fontSize: 36, lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
  detail: { maxWidth: 560, fontSize: typeScale.lead, lineHeight: 26 },
  inkLegend: { flexDirection: 'row', gap: spacing.sm },
  inkChip: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  inkChipText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { flexGrow: 1, flexBasis: 160 },
});
