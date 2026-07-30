import { type Href, useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, InkEyebrow, PaperCard, SectionHeading, aviAssets } from '@/ui/brand';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function ProScreen() {
  const router = useRouter();
  const account = useDuelWordsAccount();
  const styles = useStyles();
  const isPro = account.access.planTier === 'pro';
  const signedIn = account.user !== null;

  return (
    <AppScreen bottomInset={spacing.xxl}>
      <InteriorScreenHeader backLabel="Back" onBack={() => router.back()} title="DuelWords Pro" />

      <View style={styles.hero}>
        <AviArtwork size={150} source={isPro ? aviAssets.onboarding : aviAssets.neutral} />
        <View style={styles.heroCopy}>
          <InkEyebrow>DuelWords Pro</InkEyebrow>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>
            {isPro ? 'Pro is active.' : 'More of your story. None of the unfair stuff.'}
          </Text>
          <Text style={styles.subtitle}>
            Pro keeps more private history. It never changes the word, timer, attempts, or feedback.
          </Text>
        </View>
      </View>

      <PaperCard emphasized>
        <SectionHeading title="Designed around fair play" detail="Every player keeps the same rules." />
        <Benefit title="Daily in every language" detail="Play the Official Daily once per language each day." />
        <Benefit title="1,000 history records" detail="Keep a private 365-day statistics window on this device." />
        <Benefit title="100 challenges per day" detail="Create more human challenges without changing duel rules." />
        <Benefit title="Account-backed access" detail="Your Account AV identity carries active Pro status to the web." />
      </PaperCard>

      <PaperCard emphasized>
        <SectionHeading
          title={isPro ? 'Your access' : signedIn ? 'Free account' : 'Account AV optional'}
          detail={isPro
            ? 'DuelWords Pro is active on this account.'
            : signedIn
              ? 'This account does not currently have DuelWords Pro.'
              : 'Sign in to check existing Pro access. Guest play remains available.'}
        />
        {isPro ? <AppButton onPress={() => router.back()}>Done</AppButton> : null}
        {!signedIn ? (
          <AppButton disabled={!account.available} onPress={() => router.replace('/auth?mode=signIn' as Href)}>
            Sign in to check access
          </AppButton>
        ) : null}
        {!isPro ? (
          <Text style={styles.status}>
            Subscriptions are not sold on this website. Existing purchases can be managed in the iPhone or iPad app and their store account.
          </Text>
        ) : null}
      </PaperCard>

      <View style={styles.legalActions}>
        <AppButton tone="quiet" style={styles.legalButton} onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/terms/')}>Terms</AppButton>
        <AppButton tone="quiet" style={styles.legalButton} onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/privacy/')}>Privacy</AppButton>
        <AppButton tone="quiet" style={styles.legalButton} onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/support/')}>Support</AppButton>
      </View>
    </AppScreen>
  );
}

function Benefit({ detail, title }: { detail: string; title: string }) {
  const styles = useStyles();
  return (
    <View style={styles.benefit}>
      <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
      <View style={styles.benefitCopy}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function useStyles() {
  const { colors } = useAppTheme();
  return StyleSheet.create({
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
    status: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19, textAlign: 'center' },
    legalActions: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.sm },
    legalButton: { minWidth: 96 },
  });
}
