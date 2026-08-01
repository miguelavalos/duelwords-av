import { type Href, useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { sharedSurfaceT } from '@/i18n/shared-surface-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, InkEyebrow, PaperCard, SectionHeading, aviAssets } from '@/ui/brand';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function ProScreen() {
  const router = useRouter();
  const account = useDuelWordsAccount();
  const [{ interfaceLocale }] = useAppPreferences();
  const copy = (key: Parameters<typeof sharedSurfaceT>[1]) => sharedSurfaceT(interfaceLocale, key);
  const styles = useStyles();
  const isPro = account.access.planTier === 'pro';
  const signedIn = account.user !== null;

  return (
    <AppScreen bottomInset={spacing.xxl}>
      <InteriorScreenHeader backLabel={copy('Back')} onBack={() => router.back()} title="DuelWords Pro" />

      <View style={styles.hero}>
        <AviArtwork size={150} source={isPro ? aviAssets.onboarding : aviAssets.neutral} />
        <View style={styles.heroCopy}>
          <InkEyebrow>DuelWords Pro</InkEyebrow>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>
            {copy(isPro ? 'Pro is active.' : 'More history. The same fair game.')}
          </Text>
          <Text style={styles.subtitle}>
            {copy('Pro keeps more private history without changing the rules of a duel.')}
          </Text>
        </View>
      </View>

      <PaperCard emphasized>
        <SectionHeading title={copy('Fair play')} detail={copy('No hints, extra time, attempts, or feedback.')} />
        <Benefit title={copy('Daily in every language')} detail={copy('Play once per language each day.')} />
        <Benefit title={copy('1,000 history records')} detail={copy('Keep a 365-day private statistics window on this device.')} />
        <Benefit title={copy('100 challenges per day')} detail={copy('Create more human challenges without changing duel rules.')} />
        <Benefit title={copy('Pro on your devices')} detail={copy('Your account keeps Pro available across your devices.')} />
      </PaperCard>

      <PaperCard emphasized>
        <SectionHeading
          title={copy(isPro ? 'Your access' : signedIn ? 'Your access' : 'Account AV required')}
          detail={isPro
            ? copy('DuelWords Pro is active on this account.')
            : signedIn
              ? copy('This account does not currently have DuelWords Pro.')
              : copy('Sign in to continue')}
        />
        {isPro ? <AppButton onPress={() => router.back()}>{copy('Done')}</AppButton> : null}
        {!signedIn ? (
          <AppButton disabled={!account.available} onPress={() => router.replace('/auth?mode=signIn' as Href)}>
            {copy('Sign in to continue')}
          </AppButton>
        ) : null}
        {!isPro ? (
          <Text style={styles.status}>
            {copy('Subscriptions are not sold on this website. Manage existing purchases in the iPhone or iPad app and its store account.')}
          </Text>
        ) : null}
      </PaperCard>

      <View style={styles.legalActions}>
        <AppButton tone="quiet" style={styles.legalButton} onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/terms/')}>{copy('Terms')}</AppButton>
        <AppButton tone="quiet" style={styles.legalButton} onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/privacy/')}>{copy('Privacy')}</AppButton>
        <AppButton tone="quiet" style={styles.legalButton} onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/support/')}>{copy('Support')}</AppButton>
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
