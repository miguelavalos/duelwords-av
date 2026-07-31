import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { InterfaceLocale } from '@/i18n/locales';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

import type { ActiveDuelVisualFeedback } from './active-duel-visual-feedback';
import { reactionEmoji, reactionLabel } from './active-duel-reactions';
import { publicDuelT } from './public-duel-copy';

type ActiveDuelFeedbackOverlayProps = {
  event: ActiveDuelVisualFeedback | null;
  interfaceLocale: InterfaceLocale;
  onDismiss: (eventId: string) => void;
};

export function ActiveDuelFeedbackOverlay({
  event,
  interfaceLocale,
  onDismiss,
}: ActiveDuelFeedbackOverlayProps) {
  const styles = useActiveDuelFeedbackStyles();
  const [progress] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);
  const presentation = useMemo(
    () => event ? visualFeedbackPresentation(event, interfaceLocale) : null,
    [event, interfaceLocale],
  );

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
    if (!event) {
      progress.setValue(0);
      return undefined;
    }

    const eventId = event.id;
    progress.stopAnimation();
    progress.setValue(reduceMotion ? 1 : 0);

    if (reduceMotion) {
      const timeout = setTimeout(() => onDismiss(eventId), 1_300);
      return () => clearTimeout(timeout);
    }

    const animation = Animated.sequence([
      Animated.timing(progress, {
        duration: 210,
        easing: Easing.out(Easing.back(1.7)),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.delay(event.kind === 'opponent_reaction' ? 1_250 : 850),
      Animated.timing(progress, {
        duration: 240,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) onDismiss(eventId);
    });

    return () => animation.stop();
  }, [event, onDismiss, progress, reduceMotion]);

  if (!event || !presentation) return null;

  const isReaction = event.kind === 'opponent_reaction';
  return (
    <View
      pointerEvents="none"
      style={styles.overlay}>
      <Animated.View
        accessibilityLiveRegion="assertive"
        accessibilityRole="alert"
        style={[
          styles.card,
          isReaction ? styles.reactionCard : styles.syncCard,
          {
            opacity: progress,
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 0.72, 1],
                  outputRange: [0.64, 1.08, 1],
                }),
              },
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [26, 0],
                }),
              },
              { rotate: isReaction ? '-2deg' : '0deg' },
            ],
          },
        ]}>
        <Text style={[styles.emoji, isReaction && styles.reactionEmoji]}>
          {presentation.emoji}
        </Text>
        <View style={styles.copyBlock}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[styles.title, isReaction && styles.reactionTitle]}>
            {presentation.title}
          </Text>
          <Text numberOfLines={2} style={styles.detail}>
            {presentation.detail}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

function visualFeedbackPresentation(
  event: ActiveDuelVisualFeedback,
  locale: InterfaceLocale,
): {
  detail: string;
  emoji: string;
  title: string;
} {
  if (event.kind === 'opponent_reaction') {
    const title = reactionLabel(locale, event.reaction);
    return {
      detail: publicDuelT(locale, 'reactionFrom', {
        reaction: title,
        sender: publicDuelT(locale, 'rival'),
      }),
      emoji: reactionEmoji(event.reaction),
      title,
    };
  }
  if (event.kind === 'own_submitted') {
    return {
      detail: publicDuelT(locale, 'waitingForRival'),
      emoji: '✓',
      title: publicDuelT(locale, 'submitted'),
    };
  }
  if (event.kind === 'opponent_submitted') {
    return {
      detail: publicDuelT(locale, 'yourTurn'),
      emoji: '⚡',
      title: publicDuelT(locale, 'rivalSubmitted'),
    };
  }
  if (event.kind === 'round_resolving') {
    return {
      detail: publicDuelT(locale, 'roundResolving'),
      emoji: '↻',
      title: publicDuelT(locale, 'resolving'),
    };
  }
  return {
    detail: publicDuelT(locale, 'roundStarted', { number: event.roundNumber }),
    emoji: '⚔️',
    title: publicDuelT(locale, 'nextRound'),
  };
}

function useActiveDuelFeedbackStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    card: {
      maxWidth: 340,
      minWidth: 220,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 2,
      borderColor: colors.accent,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      boxShadow: '0 12px 22px rgba(0, 0, 0, 0.24)',
    },
    copyBlock: {
      flex: 1,
      gap: 2,
    },
    detail: {
      color: colors.textMuted,
      fontSize: typeScale.small,
      fontWeight: '800',
    },
    emoji: {
      color: colors.accent,
      fontSize: 36,
      fontWeight: '900',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 40,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    reactionCard: {
      minWidth: 260,
      borderColor: colors.pressure,
      backgroundColor: colors.pressureSoft,
    },
    reactionEmoji: {
      fontSize: 56,
    },
    reactionTitle: {
      color: colors.pressure,
      fontSize: 30,
    },
    syncCard: {
      borderColor: colors.secondary,
      backgroundColor: colors.secondarySoft,
    },
    title: {
      color: colors.text,
      fontSize: typeScale.subtitle,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
  }), [colors]);
}
