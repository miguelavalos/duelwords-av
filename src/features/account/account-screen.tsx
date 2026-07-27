import { type Href, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { experienceCopy } from '@/i18n/experience-copy';
import { t } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, InkEyebrow, PaperCard, SectionHeading } from '@/ui/brand';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { isSharedAppleSurfaceAvailable, SharedAppleSurface, type SharedAppleAction } from '@/ui/shared-apple-surface';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function AccountScreen() {
  const router = useRouter();
  const account = useDuelWordsAccount();
  const refreshAccount = account.refresh;
  const [{ appearance, hapticsEnabled, interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const styles = useStyles();
  const signedIn = account.user !== null;

  useEffect(() => {
    void refreshAccount();
  }, [refreshAccount]);

  function handleSharedAction({ action }: SharedAppleAction) {
    if (action === 'close') router.replace('/(tabs)/play' as Href);
    else if (action === 'settings') router.replace('/(tabs)/settings' as Href);
    else if (action === 'paywall') router.push('/pro' as Href);
    else if (action === 'deleteAccount') router.push('/delete-account' as Href);
    else if (action === 'signIn') router.push('/auth?mode=signIn' as Href);
    else if (action === 'signUp') router.push('/auth?mode=signUp' as Href);
    else if (action === 'refreshAccount') void account.refresh();
    else if (action === 'signOut') void account.signOut();
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
        style={styles.sharedScreen}
        surface="account"
      />
    );
  }

  return (
    <AppScreen bottomInset={spacing.xxl}>
      <InteriorScreenHeader
        backLabel={t(interfaceLocale, 'back')}
        detail="Account AV"
        onBack={() => router.replace('/(tabs)/play' as Href)}
        title={copy.account}
      />
      <View style={styles.headerCopy}>
        <Text style={styles.subtitle}>{signedIn ? 'Your account and DuelWords access in one place.' : 'Play locally as a guest. Sign in when you want access across devices.'}</Text>
      </View>

      <PaperCard emphasized>
        <View style={styles.identityRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{signedIn ? initials(account.user?.displayName) : 'G'}</Text></View>
          <View style={styles.identityCopy}>
            <Text style={styles.identityName}>{account.user?.displayName ?? 'Guest player'}</Text>
            <Text selectable={signedIn} style={styles.identityDetail}>{account.user?.email ?? accountStatusDetail(account.status, account.available)}</Text>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>{account.access.planTier === 'pro' ? 'PRO' : signedIn ? 'FREE' : 'GUEST'}</Text></View>
        </View>
        {!signedIn ? (
          <View style={styles.buttonRow}>
            <AppButton disabled={!account.available} style={styles.flexButton} onPress={() => router.push('/auth?mode=signUp' as Href)}>Create account</AppButton>
            <AppButton disabled={!account.available} tone="secondary" style={styles.flexButton} onPress={() => router.push('/auth?mode=signIn' as Href)}>Sign in</AppButton>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <AppButton tone="secondary" style={styles.flexButton} onPress={() => void account.refresh()}>Refresh access</AppButton>
            <AppButton tone="quiet" style={styles.flexButton} onPress={() => void account.signOut()}>Sign out</AppButton>
          </View>
        )}
      </PaperCard>

      <PaperCard>
        <SectionHeading title="Across your devices" detail={signedIn ? 'You are signed in with Account AV.' : 'Practice, Daily, and Play Avi stay on this device while you are a guest.'} />
        <InfoRow label="Identity" value={signedIn ? (account.status === 'signed_in_offline' ? 'Available offline' : 'Connected') : 'Guest · local'} />
        <InfoRow label="Game history" value={signedIn ? 'Stored on this device' : 'Local only'} />
        <InfoRow label="Rivals" value={signedIn ? 'Coming later' : 'Sign-in required'} />
      </PaperCard>

      <PaperCard emphasized>
        <View style={styles.aviPlanRow}>
          <AviArtwork size={84} />
          <View style={styles.aviPlanCopy}>
            <InkEyebrow>DuelWords Pro</InkEyebrow>
            <Text style={styles.cardTitle}>{account.access.planTier === 'pro' ? 'Pro is active' : 'More history. Same fair game.'}</Text>
            <Text style={styles.cardDetail}>Deeper private limits and history. Never hints, extra time, or extra attempts.</Text>
          </View>
        </View>
        <AppButton onPress={() => router.push('/pro' as Href)}>{account.access.planTier === 'pro' ? 'View Pro access' : 'Explore DuelWords Pro'}</AppButton>
      </PaperCard>

      <PaperCard>
        <SectionHeading title="Preferences & account safety" detail="Settings stay device-local. Account deletion follows the secure Account AV workflow." />
        <View style={styles.buttonRow}>
          <AppButton tone="secondary" style={styles.flexButton} onPress={() => router.push('/(tabs)/settings' as Href)}>{copy.settings}</AppButton>
          {signedIn ? <AppButton tone="danger" style={styles.flexButton} onPress={() => router.push('/delete-account' as Href)}>Delete Apps AV account</AppButton> : null}
        </View>
      </PaperCard>
    </AppScreen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function accountStatusDetail(status: string, available: boolean) {
  if (!available) return 'Account AV temporarily unavailable';
  if (status === 'account_error') return 'Account needs a secure refresh';
  if (status === 'loading') return 'Checking Account AV…';
  return 'No account required for local play';
}

function initials(name: string | null | undefined) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AV';
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    sharedScreen: { flex: 1 },
    headerCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
    subtitle: { maxWidth: 560, color: colors.textMuted, fontSize: typeScale.body, lineHeight: 22 },
    identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, transform: [{ rotate: '-2deg' }] },
    avatarText: { color: colors.onAccent, fontFamily: 'Georgia', fontSize: typeScale.lead, fontWeight: '700' },
    identityCopy: { flex: 1, minWidth: 0, gap: 2 },
    identityName: { color: colors.text, fontSize: typeScale.lead, fontWeight: '900' },
    identityDetail: { color: colors.textMuted, fontSize: typeScale.small },
    badge: { borderRadius: 99, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.secondarySoft },
    badgeText: { color: colors.text, fontSize: typeScale.tiny, fontWeight: '900' },
    buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    flexButton: { flexBasis: 160, flexGrow: 1 },
    infoRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    infoLabel: { color: colors.textMuted, fontSize: typeScale.small, fontWeight: '700' },
    infoValue: { flex: 1, color: colors.text, fontSize: typeScale.small, fontWeight: '800', textAlign: 'right' },
    aviPlanRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    aviPlanCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
    cardTitle: { color: colors.text, fontFamily: 'Georgia', fontSize: typeScale.subtitle, fontWeight: '700' },
    cardDetail: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19 },
  }), [colors]);
}
