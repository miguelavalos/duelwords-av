import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Linking, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { useDuelWordsAccount } from '@/account/account-av-provider';
import { isAccountAuthCancellation } from '@/account/account-auth-errors';
import { AviArtwork, aviAssets } from '@/ui/brand';
import { radii, spacing, useAppTheme } from '@/ui/theme';

type AuthProvider = 'apple' | 'google';

export function AccountAuthOptionsPanel({
  onAuthenticated,
  onDismiss,
  onSkip,
}: {
  onAuthenticated: () => void;
  onDismiss: () => void;
  onSkip: () => void;
}) {
  const account = useDuelWordsAccount();
  const styles = useStyles();
  const [activeProvider, setActiveProvider] = useState<AuthProvider | null>(null);
  const [translateY] = useState(() => new Animated.Value(520));
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 120 || gesture.vy > 1.2) {
        Animated.timing(translateY, { duration: 180, toValue: 520, useNativeDriver: true }).start(onDismiss);
      } else {
        Animated.spring(translateY, { damping: 18, mass: 1, stiffness: 190, toValue: 0, useNativeDriver: true }).start();
      }
    },
  }), [onDismiss, translateY]);

  useEffect(() => {
    Animated.spring(translateY, { damping: 18, mass: 1, stiffness: 190, toValue: 0, useNativeDriver: true }).start();
  }, [translateY]);

  async function startSignIn(provider: AuthProvider) {
    if (activeProvider) return;
    setActiveProvider(provider);
    try {
      if (provider === 'apple') await account.signInWithApple();
      else await account.signInWithGoogle();
      onAuthenticated();
    } catch (error) {
      if (!isAccountAuthCancellation(error)) {
        Alert.alert(
          'Could not continue',
          'Account AV could not complete sign-in. Please try again.',
          [{ text: 'Close', style: 'cancel' }],
        );
      }
    } finally {
      setActiveProvider(null);
    }
  }

  return (
    <Animated.View style={[styles.panel, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
      <View style={styles.handle} />
      <View pointerEvents="none" style={styles.avi}><AviArtwork size={126} source={aviAssets.loginPeek} /></View>
      <View style={styles.copyGroup}>
        <Text accessibilityRole="header" aria-level={2} style={styles.title}>Connect your account</Text>
        <Text style={styles.subtitle}>Use your Account AV account to continue across devices.</Text>
      </View>

      <View style={styles.providerStack}>
        <ProviderButton
          disabled={!account.available || activeProvider !== null}
          loading={activeProvider === 'apple'}
          mark=""
          onPress={() => void startSignIn('apple')}
          title="Continue with Apple"
          tone="apple"
        />
        <ProviderButton
          disabled={!account.available || activeProvider !== null}
          loading={activeProvider === 'google'}
          mark="google"
          onPress={() => void startSignIn('google')}
          title="Continue with Google"
          tone="google"
        />
      </View>

      {!account.available ? <Text style={styles.message}>Local play remains available on this device.</Text> : null}
      <Pressable accessibilityRole="button" disabled={activeProvider !== null} onPress={onSkip} style={styles.skipButton}>
        <Text style={styles.skipLabel}>Skip for now</Text>
      </Pressable>
      <Text style={styles.legal}>
        By continuing, you agree to the{' '}
        <Text accessibilityRole="link" style={styles.link} onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/terms/')}>Terms</Text>
        {' '}and{' '}
        <Text accessibilityRole="link" style={styles.link} onPress={() => void Linking.openURL('https://duelwords-av.avalsys.com/privacy/')}>Privacy Policy</Text>
        {' '}of DuelWords AV.
      </Text>
    </Animated.View>
  );
}

function ProviderButton({ disabled, loading, mark, onPress, title, tone }: {
  disabled: boolean;
  loading: boolean;
  mark: string;
  onPress: () => void;
  title: string;
  tone: 'apple' | 'google';
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.providerButton,
        tone === 'apple' ? styles.appleButton : styles.googleButton,
        pressed && !disabled && styles.providerPressed,
        disabled && styles.providerDisabled,
      ]}>
      {loading
        ? <ActivityIndicator color={tone === 'apple' ? '#fffdf5' : undefined} />
        : tone === 'google'
          ? <GoogleBadge />
          : <Text style={[styles.providerMark, styles.appleLabel]}>{mark}</Text>}
      <Text style={[styles.providerLabel, tone === 'apple' && styles.appleLabel]}>{loading ? 'Connecting…' : title}</Text>
    </Pressable>
  );
}

function GoogleBadge() {
  const quadrants = [
    { color: '#4285F4', height: 10, left: 0, top: 0, width: 10 },
    { color: '#34A853', height: 10, left: 10, top: 0, width: 10 },
    { color: '#FBBC05', height: 10, left: 0, top: 10, width: 10 },
    { color: '#EA4335', height: 10, left: 10, top: 10, width: 10 },
  ] as const;

  return (
    <View accessibilityElementsHidden style={staticStyles.googleBadge}>
      {quadrants.map((quadrant) => (
        <View key={`${quadrant.left}-${quadrant.top}`} style={[staticStyles.googleQuadrant, quadrant]}>
          <Text style={[staticStyles.googleGlyph, { color: quadrant.color, left: -quadrant.left, top: -quadrant.top }]}>G</Text>
        </View>
      ))}
    </View>
  );
}

const staticStyles = StyleSheet.create({
  googleBadge: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  googleQuadrant: { position: 'absolute', overflow: 'hidden' },
  googleGlyph: { position: 'absolute', width: 20, height: 20, fontFamily: 'Arial', fontSize: 20, lineHeight: 20, fontWeight: '900', textAlign: 'center' },
});

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    panel: {
      position: 'relative',
      paddingHorizontal: 24,
      paddingBottom: 24,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: 30,
      borderCurve: 'continuous',
      backgroundColor: colors.surface,
      boxShadow: '0 14px 24px rgba(0, 0, 0, 0.28)',
    },
    handle: { width: 46, height: 4, alignSelf: 'center', marginTop: 12, borderRadius: 2, backgroundColor: colors.text, opacity: 0.22 },
    avi: { position: 'absolute', top: -91, right: 44, width: 140, height: 110, alignItems: 'center', justifyContent: 'center' },
    copyGroup: { gap: 7, paddingTop: 16 },
    title: { color: colors.text, fontFamily: 'Georgia', fontSize: 22, lineHeight: 28, fontWeight: '900', textAlign: 'center' },
    subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 20, fontWeight: '500', textAlign: 'center' },
    providerStack: { gap: 10, paddingTop: 20 },
    providerButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radii.md, borderCurve: 'continuous' },
    appleButton: { backgroundColor: colors.text },
    googleButton: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface },
    providerPressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
    providerDisabled: { opacity: 0.52 },
    providerMark: { width: 24, height: 24, color: colors.text, fontSize: 22, lineHeight: 24, fontWeight: '800', textAlign: 'center' },
    providerLabel: { color: colors.text, fontSize: 17, lineHeight: 22, fontWeight: '700' },
    appleLabel: { color: '#fffdf5' },
    message: { color: colors.text, opacity: 0.7, paddingTop: 12, fontSize: 13, lineHeight: 18, fontWeight: '500', textAlign: 'center' },
    skipButton: { alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingVertical: 13 },
    skipLabel: { color: colors.text, opacity: 0.82, fontSize: 15, lineHeight: 20, fontWeight: '700' },
    legal: { color: colors.text, opacity: 0.66, paddingTop: 12, fontSize: 13, lineHeight: 18, fontWeight: '500', textAlign: 'center' },
    link: { color: colors.text, fontWeight: '800', textDecorationLine: 'underline' },
  }), [colors]);
}
