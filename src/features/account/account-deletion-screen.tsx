import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  fetchAccountDeletionEligibility,
  finalizeAccountDeletion,
  requestAccountDeletion,
  type AccountDeletionEligibility,
  type AccountDeletionItem,
} from '@/account/account-api-client';
import { getDuelWordsAccountAvConfig } from '@/account/account-av-config';
import { useDuelWordsAccount } from '@/account/account-av-provider';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, InkEyebrow, PaperCard, SectionHeading, aviAssets } from '@/ui/brand';
import { isSharedAppleSurfaceAvailable, SharedAppleSurface, type SharedAppleAction } from '@/ui/shared-apple-surface';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

type LoadState = 'idle' | 'loading' | 'requesting' | 'finalizing' | 'failed';

export function AccountDeletionScreen() {
  const router = useRouter();
  const account = useDuelWordsAccount();
  const [{ appearance, hapticsEnabled, interfaceLocale }] = useAppPreferences();
  const config = useMemo(getDuelWordsAccountAvConfig, []);
  const [eligibility, setEligibility] = useState<AccountDeletionEligibility | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const { colors } = useAppTheme();
  const styles = useStyles();
  const signedIn = account.user !== null;

  const refresh = useCallback(async () => {
    if (!signedIn || !config.accountApiBaseUrl) return;
    setState('loading');
    setError(null);
    try {
      setEligibility(await fetchAccountDeletionEligibility({ baseUrl: config.accountApiBaseUrl, getToken: account.getToken }));
      setState('idle');
    } catch {
      setError('Account AV could not verify deletion eligibility. No account changes were made.');
      setState('failed');
    }
  }, [account.getToken, config.accountApiBaseUrl, signedIn]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function submitDeletion(confirmationValue = confirmation) {
    if (!config.accountApiBaseUrl || confirmationValue.trim().toUpperCase() !== 'DELETE') return;
    setState('requesting');
    setError(null);
    try {
      const next = await requestAccountDeletion({ baseUrl: config.accountApiBaseUrl, getToken: account.getToken });
      setEligibility(next);
      setConfirmation('');
      if (next.status === 'completed') await finishCompletedDeletion();
      else setState('idle');
    } catch {
      setError('The deletion request was not accepted. Your account remains unchanged; refresh and try again.');
      setState('failed');
    }
  }

  async function submitFinalization() {
    if (!config.accountApiBaseUrl) return;
    setState('finalizing');
    setError(null);
    try {
      const next = await finalizeAccountDeletion({ baseUrl: config.accountApiBaseUrl, getToken: account.getToken });
      setEligibility(next);
      if (next.status === 'completed') await finishCompletedDeletion();
      else setState('idle');
    } catch {
      setError('Account AV could not finish deletion. The existing request remains recorded; refresh to check its status.');
      setState('failed');
    }
  }

  async function finishCompletedDeletion() {
    await account.signOut().catch(() => undefined);
    router.replace('/(tabs)/play' as Href);
  }

  const busy = state === 'loading' || state === 'requesting' || state === 'finalizing';
  const canFinalize = eligibility?.currentJob?.status === 'awaitingIdentityDeletion';

  function handleSharedAction({ action, value }: SharedAppleAction) {
    if (action === 'close') router.back();
    else if (action === 'signIn') router.replace('/auth?mode=signIn' as Href);
    else if (action === 'retry') void refresh();
    else if (action === 'confirmDelete') void submitDeletion(value);
    else if (action === 'finalizeDelete') void submitFinalization();
    else if (action === 'continueGuest') void finishCompletedDeletion();
    else if (action === 'openDeletionSupport') void Linking.openURL('https://duelwords-av.avalsys.com/delete-account/');
  }

  if (isSharedAppleSurfaceAvailable) {
    return (
      <SharedAppleSurface
        accountAvailable={account.available}
        appearance={appearance}
        deletionBlockersJSON={JSON.stringify(eligibility?.blockers ?? [])}
        deletionBusy={busy}
        deletionCanFinalize={canFinalize}
        deletionError={error ?? ''}
        deletionStatus={eligibility?.status ?? ''}
        deletionWarningsJSON={JSON.stringify(eligibility?.warnings ?? [])}
        hapticsEnabled={hapticsEnabled}
        interfaceLocale={interfaceLocale}
        onAction={handleSharedAction}
        planTier={account.access.planTier}
        signedIn={signedIn}
        style={styles.sharedScreen}
        surface="delete-account"
      />
    );
  }

  return (
    <AppScreen bottomInset={spacing.xxl}>
      <View style={styles.modalBar}><AppButton tone="quiet" onPress={() => router.back()}>Done</AppButton></View>
      <View style={styles.headerCopy}>
        <InkEyebrow>ACCOUNT AV · SAFETY</InkEyebrow>
        <Text accessibilityRole="header" aria-level={1} style={styles.title}>Delete Apps AV account</Text>
        <Text style={styles.subtitle}>This deletes the shared identity used by every connected Apps AV product—not only DuelWords AV.</Text>
      </View>

      {!signedIn ? (
        <PaperCard emphasized>
          <SectionHeading title="Sign in first" detail="Account deletion is available for the currently authenticated Account AV identity." />
          <AppButton onPress={() => router.replace('/auth?mode=signIn' as Href)}>Sign in to Account AV</AppButton>
        </PaperCard>
      ) : null}

      {signedIn ? (
        <>
          <PaperCard emphasized>
            <View style={styles.aviRow}>
              <AviArtwork size={92} source={aviAssets.warning} />
              <View style={styles.aviCopy}>
                <Text style={styles.cardTitle}>Avi’s checklist</Text>
                <Text style={styles.cardDetail}>Remote Account AV data and connected app links are removed. Practice and other local-only data on this device are separate.</Text>
              </View>
            </View>
          </PaperCard>

          {busy && !eligibility ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.cardDetail}>Checking Account AV…</Text></View> : null}
          {error ? <PaperCard><Text accessibilityRole="alert" style={styles.error}>{error}</Text><AppButton tone="secondary" onPress={() => void refresh()}>Retry safely</AppButton></PaperCard> : null}

          {eligibility?.blockers.length ? <DeletionItems items={eligibility.blockers} kind="blocker" /> : null}
          {eligibility?.warnings.length ? <DeletionItems items={eligibility.warnings} kind="warning" /> : null}

          {eligibility?.status === 'inProgress' ? (
            <PaperCard>
              <SectionHeading title="Deletion is in progress" detail="The request is already recorded. Refresh to check completion; it is not necessary to submit it again." />
              <Text style={styles.jobDetail}>Status: {eligibility.currentJob?.status ?? 'processing'}</Text>
              <View style={styles.buttonRow}>
                <AppButton tone="secondary" style={styles.flexButton} onPress={() => void refresh()}>Refresh status</AppButton>
                {canFinalize ? <AppButton style={styles.flexButton} onPress={() => void submitFinalization()}>Finish deletion</AppButton> : null}
              </View>
            </PaperCard>
          ) : null}

          {eligibility?.status === 'completed' ? (
            <PaperCard emphasized>
              <SectionHeading title="Account deleted" detail="The shared Account AV deletion workflow has completed. This app will return to guest mode." />
              <AppButton onPress={() => void finishCompletedDeletion()}>Continue as guest</AppButton>
            </PaperCard>
          ) : null}

          {eligibility?.status === 'eligible' ? (
            <PaperCard>
              <SectionHeading title="Permanent confirmation" detail="Type DELETE exactly. This cannot be undone and may not cancel subscriptions billed by Apple, Google, or another provider." />
              <TextInput
                accessibilityLabel="Type DELETE to confirm"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!busy}
                onChangeText={setConfirmation}
                placeholder="DELETE"
                placeholderTextColor={styles.placeholder.color}
                style={styles.confirmation}
                value={confirmation}
              />
              <AppButton disabled={confirmation !== 'DELETE' || busy} tone="danger" onPress={() => void submitDeletion()}>
                {state === 'requesting' ? 'Requesting deletion…' : 'Delete my Apps AV account'}
              </AppButton>
              <Text style={styles.supportCopy}>Need help instead? Use the public deletion and support page without sharing your sign-in token.</Text>
              <AppButton tone="quiet" onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/delete-account/')}>Open deletion support</AppButton>
            </PaperCard>
          ) : null}
        </>
      ) : null}
    </AppScreen>
  );
}

function DeletionItems({ items, kind }: { items: AccountDeletionItem[]; kind: 'blocker' | 'warning' }) {
  const styles = useStyles();
  return (
    <PaperCard>
      <SectionHeading
        title={kind === 'blocker' ? 'Action needed before retrying' : 'Review these consequences'}
        detail={kind === 'blocker' ? 'Account AV reports a recovery condition.' : 'These do not prevent deletion, but billing may continue until cancelled with its provider.'}
      />
      {items.map((item, index) => (
        <View key={`${item.type}-${item.appId ?? index}`} style={styles.item}>
          <View style={[styles.itemMark, kind === 'blocker' ? styles.itemMarkDanger : styles.itemMarkWarning]} />
          <View style={styles.itemCopy}><Text style={styles.itemTitle}>{item.label}</Text>{item.detail ? <Text style={styles.itemDetail}>{item.detail}</Text> : null}</View>
          {item.managementUrl ? <AppButton tone="quiet" onPress={() => void Linking.openURL(item.managementUrl!)}>Manage</AppButton> : null}
        </View>
      ))}
    </PaperCard>
  );
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    sharedScreen: { flex: 1 },
    modalBar: { minHeight: 52, flexDirection: 'row', alignItems: 'center' },
    headerCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
    title: { color: colors.text, fontFamily: 'Georgia', fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -1 },
    subtitle: { maxWidth: 600, color: colors.textMuted, fontSize: typeScale.body, lineHeight: 22 },
    aviRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    aviCopy: { flex: 1, gap: spacing.xs },
    cardTitle: { color: colors.text, fontFamily: 'Georgia', fontSize: typeScale.subtitle, fontWeight: '700' },
    cardDetail: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19 },
    loading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
    error: { color: colors.danger, fontSize: typeScale.body, lineHeight: 22, fontWeight: '700' },
    jobDetail: { color: colors.textMuted, fontSize: typeScale.small, fontWeight: '800' },
    buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    flexButton: { flexGrow: 1, flexBasis: 170 },
    confirmation: { minHeight: 54, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.background, color: colors.text, paddingHorizontal: spacing.lg, fontSize: typeScale.lead, fontWeight: '900', letterSpacing: 2 },
    supportCopy: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19, textAlign: 'center' },
    item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    itemMark: { width: 10, height: 10, borderRadius: 5 },
    itemMarkDanger: { backgroundColor: colors.danger },
    itemMarkWarning: { backgroundColor: colors.secondary },
    itemCopy: { flex: 1, gap: 2 },
    itemTitle: { color: colors.text, fontSize: typeScale.body, fontWeight: '800' },
    itemDetail: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 18 },
    placeholder: { color: colors.textMuted },
  }), [colors]);
}
