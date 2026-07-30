import { SignIn, SignUp } from '@clerk/expo/web';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { experienceCopy } from '@/i18n/experience-copy';
import { sharedSurfaceT } from '@/i18n/shared-surface-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
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
  const [{ interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const surfaceCopy = (key: Parameters<typeof sharedSurfaceT>[1]) => sharedSurfaceT(interfaceLocale, key);
  const isSignUp = mode === 'signUp';
  return (
    <AppScreen bottomInset={spacing.xxl}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" aria-level={1} style={[styles.title, { color: colors.text }]}>
          {isSignUp ? copy.onboardingCreate : copy.onboardingSignIn}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {surfaceCopy('Use your Account AV account to continue across devices.')}
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
            {surfaceCopy('No account changes were made. Retry or open the public support page.')}
          </Text>
        </PaperCard>
      )}

      <View style={styles.guestActions}>
        <AppButton tone="secondary" onPress={() => router.replace('/play')}>{copy.onboardingGuest}</AppButton>
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
