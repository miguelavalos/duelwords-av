import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';

import type { InterfaceLocale } from '@/i18n/locales';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

import {
  lobbyVisualFeedbackDurationMs,
  type LobbyVisualFeedback,
} from './lobby-visual-feedback';
import { publicDuelT } from './public-duel-copy';

type LobbyFeedbackOverlayProps = {
  event: LobbyVisualFeedback | null;
  interfaceLocale: InterfaceLocale;
  onDismiss: (eventId: string) => void;
};

export function LobbyFeedbackOverlay({
  event,
  interfaceLocale,
  onDismiss,
}: LobbyFeedbackOverlayProps) {
  const styles = useLobbyFeedbackStyles();
  const [reduceMotion, setReduceMotion] = useState(false);
  const onDismissRef = useRef(onDismiss);
  const presentation = useMemo(
    () => event ? lobbyFeedbackPresentation(event, interfaceLocale) : null,
    [event, interfaceLocale],
  );

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!event) return undefined;

    const eventId = event.id;
    const durationMs = lobbyVisualFeedbackDurationMs(event);
    void playLobbyHaptic(event);

    const dismissTimeout = setTimeout(() => onDismissRef.current(eventId), durationMs);

    return () => clearTimeout(dismissTimeout);
  }, [event]);

  if (!event || !presentation) return null;

  const entering = reduceMotion
    ? undefined
    : FadeInDown.springify().damping(17).stiffness(210);
  const exiting = reduceMotion ? undefined : FadeOut.duration(220);

  return (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      pointerEvents="none"
      style={styles.overlay}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(120)}
        exiting={reduceMotion ? undefined : FadeOut.duration(180)}
        style={styles.scrim}
      />
      <Animated.View
        key={event.id}
        entering={entering}
        exiting={exiting}
        style={[
          styles.card,
          event.kind === 'countdown_started' && styles.cardCountdown,
          event.kind === 'duel_started' && styles.cardStarted,
        ]}>
        <View style={styles.liveBadge}>
          <Text style={styles.liveDot}>●</Text>
          <Text style={styles.liveText}>{publicDuelT(interfaceLocale, 'online')}</Text>
        </View>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[
            styles.glyph,
            event.kind === 'countdown_started' && styles.countdownGlyph,
          ]}>
          {event.kind === 'countdown_started'
            ? <CountdownGlyph key={event.id} seconds={event.seconds} />
            : presentation.glyph}
        </Text>
        <Text adjustsFontSizeToFit numberOfLines={2} style={styles.title}>
          {presentation.title}
        </Text>
        <Text numberOfLines={2} style={styles.detail}>
          {presentation.detail}
        </Text>
        <View style={styles.signalRow}>
          <View style={styles.signalBar} />
          <View style={styles.signalBar} />
          <View style={styles.signalBar} />
        </View>
      </Animated.View>
    </View>
  );
}

function CountdownGlyph({ seconds }: { seconds: number }) {
  const [visibleSeconds, setVisibleSeconds] = useState(seconds);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setVisibleSeconds((current) => {
        const next = Math.max(1, current - 1);
        if (next !== current) void playCountdownTick();
        return next;
      });
    }, 1_000);

    return () => clearInterval(countdownInterval);
  }, []);

  return visibleSeconds;
}

function lobbyFeedbackPresentation(
  event: LobbyVisualFeedback,
  locale: InterfaceLocale,
): { detail: string; glyph: string; title: string } {
  if (event.kind === 'rival_joined') {
    return {
      detail: `${publicDuelT(locale, 'rival')} · ${publicDuelT(locale, 'joined')}`,
      glyph: '👋',
      title: event.rivalName,
    };
  }
  if (event.kind === 'rival_ready') {
    return {
      detail: publicDuelT(locale, 'rivalReady'),
      glyph: '✓',
      title: event.rivalName,
    };
  }
  if (event.kind === 'countdown_started') {
    return {
      detail: publicDuelT(locale, 'bothReady'),
      glyph: String(event.seconds),
      title: publicDuelT(locale, 'starting'),
    };
  }
  return {
    detail: publicDuelT(locale, 'roundStarted', { number: event.roundNumber }),
    glyph: '⚔️',
    title: publicDuelT(locale, 'activeDuel'),
  };
}

async function playLobbyHaptic(event: LobbyVisualFeedback): Promise<void> {
  if (process.env.EXPO_OS !== 'ios') return;
  try {
    if (event.kind === 'rival_joined') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    await Haptics.impactAsync(
      event.kind === 'duel_started'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium,
    );
  } catch {
    // Haptics are supplementary; visual feedback remains authoritative.
  }
}

async function playCountdownTick(): Promise<void> {
  if (process.env.EXPO_OS !== 'ios') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Haptics are supplementary; visual feedback remains authoritative.
  }
}

function useLobbyFeedbackStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    card: {
      width: '88%',
      maxWidth: 390,
      minHeight: 286,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderWidth: 3,
      borderColor: colors.secondary,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      boxShadow: '0 22px 48px rgba(0, 0, 0, 0.38)',
    },
    cardCountdown: {
      borderColor: colors.pressure,
      backgroundColor: colors.pressureSoft,
    },
    cardStarted: {
      borderColor: colors.accent,
      backgroundColor: colors.secondarySoft,
    },
    countdownGlyph: {
      color: colors.pressure,
      fontSize: 96,
      fontVariant: ['tabular-nums'],
    },
    detail: {
      color: colors.textMuted,
      fontSize: typeScale.body,
      fontWeight: '800',
      lineHeight: 22,
      textAlign: 'center',
    },
    glyph: {
      color: colors.secondary,
      fontSize: 70,
      fontWeight: '900',
      lineHeight: 100,
      textAlign: 'center',
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceStrong,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    liveDot: {
      color: colors.accent,
      fontSize: typeScale.small,
    },
    liveText: {
      color: colors.text,
      fontSize: typeScale.tiny,
      fontWeight: '900',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 80,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    scrim: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(10, 12, 16, 0.48)',
    },
    signalBar: {
      width: 42,
      height: 5,
      borderRadius: radii.sm,
      backgroundColor: colors.secondary,
    },
    signalRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingTop: spacing.sm,
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.7,
      lineHeight: 36,
      textAlign: 'center',
    },
  }), [colors]);
}
