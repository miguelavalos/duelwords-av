import { type Href, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { experienceCopy } from '@/i18n/experience-copy';
import { sharedSurfaceT } from '@/i18n/shared-surface-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AppChromeHeader, AviArtwork, InkEyebrow, PaperCard, SectionHeading } from '@/ui/brand';
import { isSharedAppleSurfaceAvailable, SharedAppleSurface, type SharedAppleAction } from '@/ui/shared-apple-surface';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function AccountScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const account = useDuelWordsAccount();
  const refreshAccount = account.refresh;
  const [{ appearance, hapticsEnabled, interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const surfaceCopy = (key: Parameters<typeof sharedSurfaceT>[1]) => sharedSurfaceT(interfaceLocale, key);
  const styles = useStyles();
  const signedIn = account.user !== null;

  useEffect(() => {
    void refreshAccount();
  }, [refreshAccount]);

  function handleSharedAction({ action }: SharedAppleAction) {
    if (action === 'settings') router.replace('/(tabs)/settings' as Href);
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
        selectedTab="account"
        signedIn={signedIn}
        style={styles.sharedScreen}
        surface="account"
      />
    );
  }

  return (
    <AppScreen bottomInset={spacing.xxl}>
      {width < 760 ? (
        <AppChromeHeader
          accountLabel={copy.account}
          onAccountPress={() => undefined}
          onSettingsPress={() => router.replace('/(tabs)/settings' as Href)}
          selected="account"
          settingsLabel={copy.settings}
        />
      ) : null}
      <View style={styles.headerCopy}>
        <Text accessibilityRole="header" aria-level={1} style={styles.screenTitle}>{copy.account}</Text>
        <Text style={styles.subtitle}>{surfaceCopy(signedIn ? 'Your account and DuelWords access in one place.' : 'Play locally as a guest. Sign in when you want to use Pro across your devices.')}</Text>
      </View>

      <PaperCard emphasized>
        <View style={styles.identityRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{signedIn ? initials(account.user?.displayName) : 'G'}</Text></View>
          <View style={styles.identityCopy}>
            <Text style={styles.identityName}>{account.user?.displayName ?? surfaceCopy('Guest player')}</Text>
            <Text selectable={signedIn} style={styles.identityDetail}>{account.user?.email ?? accountStatusDetail(account.status, account.available, surfaceCopy)}</Text>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>{account.access.planTier === 'pro' ? 'PRO' : signedIn ? surfaceCopy('Free').toUpperCase() : surfaceCopy('Guest').toUpperCase()}</Text></View>
        </View>
        {!signedIn ? (
          <View style={styles.buttonRow}>
            <AppButton disabled={!account.available} style={styles.flexButton} onPress={() => router.push('/auth?mode=signUp' as Href)}>{copy.onboardingCreate}</AppButton>
            <AppButton disabled={!account.available} tone="secondary" style={styles.flexButton} onPress={() => router.push('/auth?mode=signIn' as Href)}>{copy.onboardingSignIn}</AppButton>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <AppButton tone="secondary" style={styles.flexButton} onPress={() => void account.refresh()}>{surfaceCopy('Refresh account')}</AppButton>
            <AppButton tone="quiet" style={styles.flexButton} onPress={() => void account.signOut()}>{surfaceCopy('Sign out')}</AppButton>
          </View>
        )}
      </PaperCard>

      <PaperCard>
        <SectionHeading title={surfaceCopy('Account and device')} detail={surfaceCopy(signedIn ? 'Pro access follows this account. Game history and rivals stay on this device.' : 'Game history and rivals stay on this device. Sign in only when you want account features.')} />
        <InfoRow label={surfaceCopy('Identity')} value={signedIn ? (account.status === 'signed_in_offline' ? surfaceCopy('Local play remains available on this device.') : surfaceCopy('Connected')) : surfaceCopy('Guest · local')} />
        <InfoRow label={surfaceCopy('Game history')} value={surfaceCopy('Stored on this device')} />
        <InfoRow label={surfaceCopy('Rivals')} value={surfaceCopy('Stored on this device')} />
      </PaperCard>

      <PaperCard emphasized>
        <View style={styles.aviPlanRow}>
          <AviArtwork size={84} />
          <View style={styles.aviPlanCopy}>
            <InkEyebrow>DuelWords Pro</InkEyebrow>
            <Text style={styles.cardTitle}>{surfaceCopy(account.access.planTier === 'pro' ? 'Pro is active.' : 'More history. The same fair game.')}</Text>
            <Text style={styles.cardDetail}>{surfaceCopy('Pro never adds hints, time, attempts, or different feedback.')}</Text>
          </View>
        </View>
        <AppButton onPress={() => router.push('/pro' as Href)}>{surfaceCopy(account.access.planTier === 'pro' ? 'View Pro access' : 'Explore DuelWords Pro')}</AppButton>
      </PaperCard>

      <PaperCard>
        <SectionHeading title={surfaceCopy('Account safety')} detail={surfaceCopy('Review what account deletion removes before confirming.')} />
        <View style={styles.buttonRow}>
          <AppButton tone="secondary" style={styles.flexButton} onPress={() => router.replace('/(tabs)/settings' as Href)}>{copy.settings}</AppButton>
          {signedIn ? <AppButton tone="danger" style={styles.flexButton} onPress={() => router.push('/delete-account' as Href)}>{surfaceCopy('Delete Apps AV account')}</AppButton> : null}
        </View>
      </PaperCard>
    </AppScreen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function accountStatusDetail(
  status: string,
  available: boolean,
  copy: (key: Parameters<typeof sharedSurfaceT>[1]) => string,
) {
  if (!available) return copy('Account AV unavailable');
  if (status === 'account_error') return copy('Account AV needs your review');
  if (status === 'loading') return copy('Checking Account AV…');
  return copy('No account is required for local play.');
}

function initials(name: string | null | undefined) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AV';
}

function useStyles() {
  const { colors } = useAppTheme();
  return StyleSheet.create({
    sharedScreen: { flex: 1 },
    headerCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
    screenTitle: { color: colors.text, fontFamily: 'Georgia', fontSize: 36, lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
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
  });
}
