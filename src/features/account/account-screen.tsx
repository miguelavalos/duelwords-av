import { type Href, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

export function AccountScreen() {
  const router = useRouter();
  const account = useDuelWordsAccount();
  const [{ interfaceLocale }] = useAppPreferences();
  const styles = useStyles();
  const signedIn = account.user !== null;

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Account AV</Text>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>{signedIn ? 'Your DuelWords identity and access.' : 'Play instantly as a guest, or sign in when you want durable features.'}</Text>
        </View>
        <AppButton tone="quiet" onPress={() => router.back()}>Done</AppButton>
      </View>

      <View style={styles.identityCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{signedIn ? initials(account.user?.displayName) : 'G'}</Text></View>
        <View style={styles.identityCopy}>
          <Text style={styles.identityName}>{account.user?.displayName ?? 'Guest player'}</Text>
          <Text style={styles.identityDetail}>{account.user?.email ?? (account.available ? 'Account AV ready' : 'Account AV unavailable in this build')}</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>{account.access.planTier === 'pro' ? 'PRO' : signedIn ? 'FREE' : 'GUEST'}</Text></View>
      </View>

      {!signedIn ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{account.status === 'account_error' ? 'Account needs a refresh' : 'Keep your progress'}</Text>
          <Text style={styles.subtitle}>{account.status === 'account_error' ? 'Your secure sign-in exists, but Account AV could not verify the internal user yet.' : 'Account AV will own future stats, rival shortcuts, restored history, and DuelWords Pro access.'}</Text>
          {account.status === 'account_error' ? (
            <AppButton onPress={() => void account.refresh()}>Try again</AppButton>
          ) : (
            <AppButton disabled={!account.available} onPress={() => router.push('/auth' as Href)}>Create account or sign in</AppButton>
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account controls</Text>
          <AppButton tone="secondary" onPress={() => void account.refresh()}>Refresh access</AppButton>
          <AppButton tone="quiet" onPress={() => void account.signOut()}>Sign out</AppButton>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DuelWords Pro</Text>
        <Text style={styles.subtitle}>No ads and deeper private history, without changing gameplay fairness.</Text>
        <AppButton onPress={() => router.push('/pro' as Href)}>{account.access.planTier === 'pro' ? 'View Pro access' : 'Explore Pro'}</AppButton>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences & safety</Text>
        <AppButton tone="secondary" onPress={() => router.push('/settings')}>Settings · {interfaceLocale.toUpperCase()}</AppButton>
        <AppButton tone="quiet" onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/delete-account/')}>Delete account information</AppButton>
      </View>
    </AppScreen>
  );
}

function initials(name: string | null | undefined) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AV';
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    headerCopy: { flex: 1, gap: spacing.xs },
    kicker: { color: colors.accent, fontSize: typeScale.tiny, fontWeight: '900', textTransform: 'uppercase' },
    title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
    subtitle: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 22 },
    identityCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
    avatarText: { color: colors.onAccent, fontSize: typeScale.lead, fontWeight: '900' },
    identityCopy: { flex: 1, minWidth: 0 },
    identityName: { color: colors.text, fontSize: typeScale.lead, fontWeight: '900' },
    identityDetail: { color: colors.textMuted, fontSize: typeScale.small },
    badge: { borderRadius: 99, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.secondarySoft },
    badgeText: { color: colors.text, fontSize: typeScale.tiny, fontWeight: '900' },
    section: { gap: spacing.md, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    sectionTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: '900' },
  }), [colors]);
}
