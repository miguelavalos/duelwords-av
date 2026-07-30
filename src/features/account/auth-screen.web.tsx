import { SignIn, SignUp } from '@clerk/expo/web';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { PaperCard } from '@/ui/brand';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export function AuthScreen() {
  const router = useRouter();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string | string[] }>();
  const mode = Array.isArray(modeParam) ? modeParam[0] : modeParam;
  const { colors } = useAppTheme();
  const account = useDuelWordsAccount();
  const isSignUp = mode === 'signUp';
  return (
    <AppScreen bottomInset={spacing.xxl}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" aria-level={1} style={[styles.title, { color: colors.text }]}>
          {isSignUp ? 'Create your Account AV account' : 'Sign in to Account AV'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          One private identity for DuelWords access across your devices. Guest play remains available without an account.
        </Text>
      </View>

      {account.available ? (
        <View style={styles.clerkSurface}>
          {isSignUp ? (
            <SignUp
              fallbackRedirectUrl="/account"
              oauthFlow="redirect"
              routing="hash"
              signInUrl="/auth?mode=signIn"
            />
          ) : (
            <SignIn
              fallbackRedirectUrl="/account"
              oauthFlow="redirect"
              routing="hash"
              signUpUrl="/auth?mode=signUp"
              withSignUp
            />
          )}
        </View>
      ) : (
        <PaperCard emphasized>
          <Text accessibilityRole="alert" style={[styles.subtitle, { color: colors.textMuted }]}>
            Account AV is temporarily unavailable. No account changes were made.
          </Text>
        </PaperCard>
      )}

      <View style={styles.guestActions}>
        <AppButton tone="secondary" onPress={() => router.replace('/play')}>Continue as guest</AppButton>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { alignSelf: 'center', width: '100%', maxWidth: 560, gap: spacing.sm },
  title: { fontFamily: 'Georgia', fontSize: 36, lineHeight: 40, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: typeScale.body, lineHeight: 22, textAlign: 'center' },
  clerkSurface: { alignSelf: 'center', width: '100%', minHeight: 480, alignItems: 'center' },
  guestActions: { alignSelf: 'center', width: '100%', maxWidth: 420 },
});
