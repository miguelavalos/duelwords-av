import { type Href, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { t } from '@/i18n/locales';
import { sharedSurfaceT } from '@/i18n/shared-surface-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { useDuelWordsProPurchase } from '@/subscriptions/use-duelwords-pro-purchase';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, InkEyebrow, PaperCard, SectionHeading, aviAssets } from '@/ui/brand';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { isSharedAppleSurfaceAvailable, SharedAppleSurface, type SharedAppleAction } from '@/ui/shared-apple-surface';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function ProScreen() {
  const router = useRouter();
  const account = useDuelWordsAccount();
  const [{ appearance, hapticsEnabled, interfaceLocale }] = useAppPreferences();
  const styles = useStyles();
  const copy = (key: Parameters<typeof sharedSurfaceT>[1]) => sharedSurfaceT(interfaceLocale, key);
  const isPro = account.access.planTier === 'pro';
  const signedIn = account.user !== null;
  const subscription = useDuelWordsProPurchase({
    getToken: account.getToken,
    isPro,
    refreshAccount: account.refresh,
    userId: account.user?.id ?? null,
  });

  function handleSharedAction({ action, value }: SharedAppleAction) {
    if (action === 'close') router.back();
    else if (action === 'signIn') router.replace('/auth?mode=signIn' as Href);
    else if (action === 'refreshAccount') void account.refresh();
    else if (action === 'purchasePro') void subscription.purchase();
    else if (action === 'restorePurchases') void subscription.restore();
    else if (action === 'prepareRedeemCode') subscription.prepareRedeemCode();
    else if (action === 'redeemCode' && value) void subscription.redeemCode(value);
    else if (action === 'manageSubscriptions') void Linking.openURL('https://apps.apple.com/account/subscriptions');
    else if (action === 'openTerms') void Linking.openURL('https://duelwords-av.avalsys.com/terms/');
    else if (action === 'openPrivacy') void Linking.openURL('https://duelwords-av.avalsys.com/privacy/');
    else if (action === 'openSupport') void Linking.openURL('https://duelwords-av.avalsys.com/support/');
  }

  if (isSharedAppleSurfaceAvailable) {
    return (
      <SharedAppleSurface
        accountAvailable={account.available}
        appearance={appearance}
        displayName={account.user?.displayName ?? ''}
        email={account.user?.email ?? ''}
        hapticsEnabled={hapticsEnabled}
        interfaceLocale={interfaceLocale}
        onAction={handleSharedAction}
        planTier={account.access.planTier}
        signedIn={signedIn}
        subscriptionBusy={subscription.state === 'loading'}
        subscriptionError={subscription.error ?? ''}
        subscriptionPrice={subscription.price ?? ''}
        subscriptionState={subscription.state}
        style={styles.sharedScreen}
        surface="paywall"
      />
    );
  }

  return (
    <AppScreen bottomInset={spacing.xxl}>
      <InteriorScreenHeader backLabel={t(interfaceLocale, 'back')} onBack={() => router.back()} title="DuelWords Pro" />

      <View style={styles.hero}>
        <AviArtwork size={150} source={isPro ? aviAssets.onboarding : aviAssets.neutral} />
        <View style={styles.heroCopy}>
          <InkEyebrow>DuelWords Pro</InkEyebrow>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>{copy(isPro ? 'Pro is active.' : 'More history. The same fair game.')}</Text>
          <Text style={styles.subtitle}>{copy('Pro keeps more private history without changing the rules of a duel.')}</Text>
        </View>
      </View>

      <PaperCard emphasized>
        <SectionHeading title={copy('Fair play')} detail={copy('No hints, extra time, attempts, or feedback.')} />
        <Benefit title={copy('Daily in every language')} detail={copy('Play once per language each day.')} />
        <Benefit title={copy('1,000 history records')} detail={copy('Keep a 365-day private statistics window on this device.')} />
        <Benefit title={copy('100 challenges per day')} detail={copy('Create more human challenges without changing duel rules.')} />
        <Benefit title={copy('Account-backed access')} detail={copy('Your Apps AV account keeps Pro access with you.')} />
      </PaperCard>

      <PaperCard emphasized>
        <SectionHeading
          title={copy(isPro ? 'Your access' : signedIn ? 'Monthly subscription' : 'Account AV required')}
          detail={copy(isPro ? 'DuelWords Pro is active on this account.' : signedIn ? 'Cancel anytime in your Apple subscription settings.' : 'Sign in to continue')}
        />
        {isPro ? (
          <>
            <AppButton onPress={() => router.back()}>{copy('Done')}</AppButton>
            <AppButton tone="quiet" onPress={() => void Linking.openURL('https://apps.apple.com/account/subscriptions')}>{copy('Manage Apple subscription')}</AppButton>
          </>
        ) : signedIn ? (
          <>
            <AppButton
              disabled={subscription.state !== 'ready'}
              onPress={() => void subscription.purchase()}>
              {subscription.state === 'loading'
                ? copy('Please wait…')
                : subscription.price
                  ? `${copy('Subscribe')} · ${subscription.price} ${copy('per month')}`
                  : copy('Subscription unavailable')}
            </AppButton>
            <AppButton
              disabled={subscription.state === 'loading'}
              tone="quiet"
              onPress={() => void subscription.restore()}>
              {copy('Restore purchases')}
            </AppButton>
            {subscription.state === 'pending_reconciliation' ? (
              <Text style={styles.status}>{copy('Purchase received. Confirming Pro access with Apps AV…')}</Text>
            ) : null}
            {subscription.error ? <Text style={styles.error}>{subscription.error}</Text> : null}
          </>
        ) : (
          <AppButton disabled={!account.available} onPress={() => router.replace('/auth?mode=signIn' as Href)}>{copy('Sign in to continue')}</AppButton>
        )}
      </PaperCard>

      <View style={styles.legalActions}>
        <AppButton tone="quiet" style={styles.legalButton} onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/terms/')}>{copy('Terms')}</AppButton>
        <AppButton tone="quiet" style={styles.legalButton} onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/privacy/')}>{copy('Privacy')}</AppButton>
        <AppButton tone="quiet" style={styles.legalButton} onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/support/')}>{copy('Support')}</AppButton>
      </View>
      <Text style={styles.legal}>{copy('DuelWords Pro is a monthly auto-renewable subscription. You will be charged %@ for each 1-month period until you cancel in App Store settings.').replace('%@', subscription.price ?? '—')}</Text>
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
    sharedScreen: { flex: 1 },
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
    status: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19, textAlign: 'center' },
    error: { color: colors.danger, fontSize: typeScale.small, lineHeight: 19, textAlign: 'center', fontWeight: '700' },
    legalActions: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.sm },
    legalButton: { minWidth: 96 },
  }), [colors]);
}
