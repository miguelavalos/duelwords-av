import { type Href, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, DuelWordsWordmark, InkEyebrow, PaperCard, SectionHeading, aviAssets } from '@/ui/brand';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function ProScreen() {
  const router = useRouter();
  const account = useDuelWordsAccount();
  const styles = useStyles();
  const isPro = account.access.planTier === 'pro';
  const signedIn = account.user !== null;

  return (
    <AppScreen bottomInset={spacing.xxl}>
      <View style={styles.topBar}><DuelWordsWordmark compact /><AppButton tone="quiet" onPress={() => router.back()}>Close</AppButton></View>

      <View style={styles.hero}>
        <AviArtwork size={150} source={isPro ? aviAssets.onboarding : aviAssets.neutral} />
        <View style={styles.heroCopy}>
          <InkEyebrow>DuelWords Pro</InkEyebrow>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>{isPro ? 'Pro is active.' : 'More of your story. None of the unfair stuff.'}</Text>
          <Text style={styles.subtitle}>Pro can remove ads and expand private continuity. It never changes the word, timer, attempts, or feedback.</Text>
        </View>
      </View>

      <PaperCard emphasized>
        <SectionHeading title="Designed around fair play" detail="Every player keeps the same rules." />
        <Benefit title="No ads" detail="Keep Home and post-result surfaces quiet when Pro access is active." />
        <Benefit title="Deeper private history" detail="Retain more finalized summaries without exposing full boards publicly." />
        <Benefit title="Higher documented limits" detail="More challenge continuity while keeping one active live game at a time." />
        <Benefit title="Account-backed access" detail="Apps AV remains the durable entitlement authority." />
      </PaperCard>

      <PaperCard>
        <SectionHeading
          title={isPro ? 'Your access' : signedIn ? 'Subscriptions are coming later' : 'Account AV required'}
          detail={isPro ? 'DuelWords AV received active Pro access from Apps AV.' : signedIn ? 'Subscriptions are not offered yet. Your account and local games remain unchanged.' : 'Sign in first so a future subscription can belong to your Apps AV identity.'}
        />
        {isPro ? (
          <>
            <AppButton onPress={() => router.back()}>Done</AppButton>
            <AppButton tone="quiet" onPress={() => void Linking.openURL('https://apps.apple.com/account/subscriptions')}>Manage Apple subscriptions</AppButton>
          </>
        ) : signedIn ? (
          <>
            <AppButton disabled>Offering unavailable</AppButton>
            <AppButton tone="quiet" onPress={() => void account.refresh()}>Refresh Apps AV access</AppButton>
          </>
        ) : (
          <AppButton disabled={!account.available} onPress={() => router.replace('/auth?mode=signIn' as Href)}>Sign in to continue</AppButton>
        )}
      </PaperCard>

      <Text style={styles.legal}>When subscriptions become available, this screen will show the App Store price and offer a clear way to restore access. Pro never changes the rules of a duel.</Text>
    </AppScreen>
  );
}

function Benefit({ detail, title }: { detail: string; title: string }) {
  const styles = useStyles();
  return (
    <View style={styles.benefit}>
      <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
      <View style={styles.benefitCopy}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitDetail}>{detail}</Text></View>
    </View>
  );
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    hero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
    heroCopy: { flex: 1, minWidth: 250, maxWidth: 560, gap: spacing.sm },
    title: { color: colors.text, fontFamily: 'Georgia', fontSize: 36, lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
    subtitle: { color: colors.textMuted, fontSize: typeScale.lead, lineHeight: 26 },
    benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    check: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.accent },
    checkText: { color: colors.onAccent, fontSize: 17, fontWeight: '900' },
    benefitCopy: { flex: 1, gap: 2 },
    benefitTitle: { color: colors.text, fontSize: typeScale.body, fontWeight: '900' },
    benefitDetail: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 18 },
    legal: { maxWidth: 620, alignSelf: 'center', color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19, textAlign: 'center' },
  }), [colors]);
}
