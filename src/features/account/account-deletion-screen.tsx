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
import { t } from '@/i18n/locales';
import { sharedSurfaceHasKey, sharedSurfaceT } from '@/i18n/shared-surface-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, PaperCard, SectionHeading, aviAssets } from '@/ui/brand';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { isSharedAppleSurfaceAvailable, SharedAppleSurface, type SharedAppleAction } from '@/ui/shared-apple-surface';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

type LoadState = 'idle' | 'loading' | 'requesting' | 'finalizing' | 'failed';

export function AccountDeletionScreen() {
  const router = useRouter();
  const account = useDuelWordsAccount();
  const [{ appearance, hapticsEnabled, interfaceLocale }] = useAppPreferences();
  const config = useMemo(() => getDuelWordsAccountAvConfig(), []);
  const [eligibility, setEligibility] = useState<AccountDeletionEligibility | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const { colors } = useAppTheme();
  const styles = useStyles();
  const copy = useCallback(
    (key: Parameters<typeof sharedSurfaceT>[1]) => sharedSurfaceT(interfaceLocale, key),
    [interfaceLocale],
  );
  const signedIn = account.user !== null;
  const localizeServiceText = useCallback(
    (value: string) => sharedSurfaceHasKey(value) ? sharedSurfaceT(interfaceLocale, value) : value,
    [interfaceLocale],
  );

  const refresh = useCallback(async () => {
    if (!signedIn || !config.accountApiBaseUrl) return;
    setState('loading');
    setError(null);
    try {
      setEligibility(await fetchAccountDeletionEligibility({ baseUrl: config.accountApiBaseUrl, getToken: account.getToken }));
      setState('idle');
    } catch {
      setError(copy('We could not check whether the account can be deleted. No account changes were made.'));
      setState('failed');
    }
  }, [account.getToken, config.accountApiBaseUrl, copy, signedIn]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function finishCompletedDeletion() {
    await account.signOut().catch(() => undefined);
    router.replace('/(tabs)/play' as Href);
  }

  function submitDeletion(confirmationValue = confirmation) {
    if (!config.accountApiBaseUrl || confirmationValue.trim().toUpperCase() !== 'DELETE') return;
    setState('requesting');
    setError(null);
    void requestAccountDeletion({ baseUrl: config.accountApiBaseUrl, getToken: account.getToken })
      .then((next) => {
        setEligibility(next);
        setConfirmation('');
        if (next.status === 'completed') return finishCompletedDeletion();
        setState('idle');
        return undefined;
      })
      .catch(() => {
        setError(copy('No account changes were made. Retry or open the public support page.'));
        setState('failed');
      });
  }

  function submitFinalization() {
    if (!config.accountApiBaseUrl) return;
    setState('finalizing');
    setError(null);
    void finalizeAccountDeletion({ baseUrl: config.accountApiBaseUrl, getToken: account.getToken })
      .then((next) => {
        setEligibility(next);
        if (next.status === 'completed') return finishCompletedDeletion();
        setState('idle');
        return undefined;
      })
      .catch(() => {
        setError(copy('Your request is already in progress. Check again instead of submitting it twice.'));
        setState('failed');
      });
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
      <InteriorScreenHeader
        backLabel={t(interfaceLocale, 'back')}
        detail={copy('Account safety')}
        onBack={() => router.back()}
        title={copy('Delete Apps AV account')}
      />
      <View style={styles.headerCopy}>
        <Text style={styles.subtitle}>{copy('This deletes the shared identity used by connected Apps AV products—not only DuelWords AV.')}</Text>
      </View>

      {!signedIn ? (
        <PaperCard emphasized>
          <SectionHeading title={copy('Sign in first')} detail={copy('You can review and delete the Account AV account currently signed in.')} />
          <AppButton onPress={() => router.replace('/auth?mode=signIn' as Href)}>{copy('Sign in to Account AV')}</AppButton>
        </PaperCard>
      ) : null}

      {signedIn ? (
        <>
          <PaperCard emphasized>
            <View style={styles.aviRow}>
              <AviArtwork size={92} source={aviAssets.warning} />
              <View style={styles.aviCopy}>
                <Text style={styles.cardTitle}>{copy('Shared Apps AV account')}</Text>
                <Text style={styles.cardDetail}>{copy('Your shared Account AV data and connected app links are removed. Local practice data on this device is separate.')}</Text>
              </View>
            </View>
          </PaperCard>

          {busy && !eligibility ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.cardDetail}>{copy('Checking Account AV…')}</Text></View> : null}
          {error ? <PaperCard><Text accessibilityRole="alert" style={styles.error}>{error}</Text><AppButton tone="secondary" onPress={() => void refresh()}>{copy('Retry safely')}</AppButton></PaperCard> : null}

          {eligibility?.blockers.length ? <DeletionItems copy={copy} items={eligibility.blockers} kind="blocker" localizeServiceText={localizeServiceText} /> : null}
          {eligibility?.warnings.length ? <DeletionItems copy={copy} items={eligibility.warnings} kind="warning" localizeServiceText={localizeServiceText} /> : null}

          {eligibility?.status === 'inProgress' ? (
            <PaperCard>
              <SectionHeading title={copy('Deletion is in progress')} detail={copy('Your request is already in progress. Check again instead of submitting it twice.')} />
              <Text style={styles.jobDetail}>{copy('Deletion is in progress')}</Text>
              <View style={styles.buttonRow}>
                <AppButton tone="secondary" style={styles.flexButton} onPress={() => void refresh()}>{copy('Refresh status')}</AppButton>
                {canFinalize ? <AppButton style={styles.flexButton} onPress={() => void submitFinalization()}>{copy('Finish deletion')}</AppButton> : null}
              </View>
            </PaperCard>
          ) : null}

          {eligibility?.status === 'completed' ? (
            <PaperCard emphasized>
              <SectionHeading title={copy('Account deleted')} detail={copy('The shared Account AV deletion workflow has completed. DuelWords AV will return to guest mode.')} />
              <AppButton onPress={() => void finishCompletedDeletion()}>{copy('Continue as guest')}</AppButton>
            </PaperCard>
          ) : null}

          {eligibility?.status === 'eligible' ? (
            <PaperCard>
              <SectionHeading title={copy('Deletion is available')} detail={copy('Type DELETE exactly. This cannot be undone and may not cancel subscriptions billed by Apple, Google, or another provider.')} />
              <TextInput
                accessibilityLabel={copy('Type DELETE exactly. This cannot be undone and may not cancel subscriptions billed by Apple, Google, or another provider.')}
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
                {state === 'requesting' ? copy('Requesting deletion…') : copy('Delete Apps AV account')}
              </AppButton>
              <Text style={styles.supportCopy}>{copy('No account changes were made. Retry or open the public support page.')}</Text>
              <AppButton tone="quiet" onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/delete-account/')}>{copy('Open deletion support')}</AppButton>
            </PaperCard>
          ) : null}
        </>
      ) : null}
    </AppScreen>
  );
}

function DeletionItems({ copy, items, kind, localizeServiceText }: {
  copy: (key: Parameters<typeof sharedSurfaceT>[1]) => string;
  items: AccountDeletionItem[];
  kind: 'blocker' | 'warning';
  localizeServiceText: (value: string) => string;
}) {
  const styles = useStyles();
  return (
    <PaperCard>
      <SectionHeading
        title={copy(kind === 'blocker' ? 'Action needed before deletion' : 'Review local game data separately on each device.')}
        detail={copy(kind === 'blocker' ? 'Some items need your attention before deletion can continue.' : 'Review every consequence before making the permanent request.')}
      />
      {items.map((item) => (
        <View key={`${item.type}-${item.appId ?? item.label}-${item.detail ?? ''}`} style={styles.item}>
          <View style={[styles.itemMark, kind === 'blocker' ? styles.itemMarkDanger : styles.itemMarkWarning]} />
          <View style={styles.itemCopy}><Text style={styles.itemTitle}>{localizeServiceText(item.label)}</Text>{item.detail ? <Text style={styles.itemDetail}>{localizeServiceText(item.detail)}</Text> : null}</View>
          {item.managementUrl ? <AppButton tone="quiet" onPress={() => void Linking.openURL(item.managementUrl!)}>{copy('Manage')}</AppButton> : null}
        </View>
      ))}
    </PaperCard>
  );
}

function useStyles() {
  const { colors } = useAppTheme();
  return StyleSheet.create({
    sharedScreen: { flex: 1 },
    headerCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
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
  });
}
