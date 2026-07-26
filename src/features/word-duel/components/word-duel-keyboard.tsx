import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GameLanguage, LetterFeedback } from '@/game/word-duel-engine';
import { t, type InterfaceLocale } from '@/i18n/locales';
import { spacing, typeScale, useAppTheme } from '@/ui/theme';

export const WORD_DUEL_KEY_ROWS: Record<GameLanguage, readonly string[][]> = {
  en: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ],
  es: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ],
  ca: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ],
  fr: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ],
  de: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ],
};

type KeyboardFeedbackByKey = ReadonlyMap<string, LetterFeedback> | Readonly<Record<string, LetterFeedback>>;

type WordDuelKeyboardProps = {
  density?: 'regular' | 'compact';
  disabled: boolean;
  feedbackByKey: KeyboardFeedbackByKey;
  interfaceLocale?: InterfaceLocale;
  keyRows: readonly string[][];
  onKeyPress: (key: string) => void;
};

export function WordDuelKeyboard({
  density = 'regular',
  disabled,
  feedbackByKey,
  interfaceLocale = 'en',
  keyRows,
  onKeyPress,
}: WordDuelKeyboardProps) {
  const styles = useWordDuelKeyboardStyles();
  const compact = density === 'compact';

  return (
    <View style={[styles.keyboard, compact && styles.keyboardCompact]}>
      {keyRows.map((row, rowIndex) => (
        <View key={`key-row-${rowIndex}`} style={[styles.keyRow, compact && styles.keyRowCompact]}>
          {row.map((key) => {
            const normalized = key.length === 1 ? key.toLowerCase() : key;
            const feedback = getFeedback(feedbackByKey, normalized);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                disabled={disabled}
                hitSlop={{ bottom: 2, left: 2, right: 2, top: 2 }}
                onPressIn={() => onKeyPress(key)}
                style={({ pressed }) => [
                  styles.key,
                  compact && styles.keyCompact,
                  key.length > 1 && styles.actionKey,
                  feedback === 'exact' && styles.keyExact,
                  feedback === 'present' && styles.keyPresent,
                  feedback === 'absent' && styles.keyAbsent,
                  pressed && !disabled && styles.keyPressed,
                  disabled && styles.keyDisabled,
                ]}>
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[styles.keyText, feedback && styles.keyTextScored]}>
                  {keyLabel(key, interfaceLocale)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function getFeedback(feedbackByKey: KeyboardFeedbackByKey, key: string): LetterFeedback | undefined {
  if (isFeedbackMap(feedbackByKey)) {
    return feedbackByKey.get(key);
  }

  return feedbackByKey[key];
}

function isFeedbackMap(value: KeyboardFeedbackByKey): value is ReadonlyMap<string, LetterFeedback> {
  return typeof (value as ReadonlyMap<string, LetterFeedback>).get === 'function';
}

function keyLabel(key: string, interfaceLocale: InterfaceLocale): string {
  if (key === 'DEL') {
    return t(interfaceLocale, 'delete');
  }
  if (key === 'ENTER') {
    return t(interfaceLocale, 'enter');
  }
  return key;
}

function useWordDuelKeyboardStyles() {
  const { colors } = useAppTheme();

  return useMemo(() => StyleSheet.create({
  keyboard: {
    gap: 6,
  },
  keyboardCompact: {
    gap: spacing.xs,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  keyRowCompact: {
    gap: spacing.xs,
  },
  key: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 2,
  },
  keyCompact: {
    minHeight: 44,
  },
  actionKey: {
    flex: 1.55,
    backgroundColor: colors.surfaceStrong,
  },
  keyExact: {
    backgroundColor: colors.feedbackExact,
    borderColor: colors.feedbackExact,
  },
  keyPresent: {
    backgroundColor: colors.feedbackPresent,
    borderColor: colors.feedbackPresent,
  },
  keyAbsent: {
    backgroundColor: colors.feedbackAbsent,
    borderColor: colors.feedbackAbsent,
  },
  keyPressed: {
    opacity: 0.75,
  },
  keyDisabled: {
    opacity: 0.5,
  },
  keyText: {
    color: colors.text,
    fontSize: typeScale.small,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  keyTextScored: {
    color: colors.onAccent,
  },
  }), [colors]);
}
