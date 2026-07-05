import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GameLanguage, LetterFeedback } from '@/game/word-duel-engine';
import { t } from '@/i18n/locales';
import { colors, radii, spacing, typeScale } from '@/ui/theme';

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
};

type KeyboardFeedbackByKey = ReadonlyMap<string, LetterFeedback> | Readonly<Record<string, LetterFeedback>>;

type WordDuelKeyboardProps = {
  disabled: boolean;
  feedbackByKey: KeyboardFeedbackByKey;
  keyRows: readonly string[][];
  onKeyPress: (key: string) => void;
};

export function WordDuelKeyboard({
  disabled,
  feedbackByKey,
  keyRows,
  onKeyPress,
}: WordDuelKeyboardProps) {
  return (
    <View style={styles.keyboard}>
      {keyRows.map((row, rowIndex) => (
        <View key={`key-row-${rowIndex}`} style={styles.keyRow}>
          {row.map((key) => {
            const normalized = key.length === 1 ? key.toLowerCase() : key;
            const feedback = getFeedback(feedbackByKey, normalized);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                disabled={disabled}
                onPress={() => onKeyPress(key)}
                style={({ pressed }) => [
                  styles.key,
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
                  {keyLabel(key)}
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

function keyLabel(key: string): string {
  if (key === 'DEL') {
    return t('en', 'delete');
  }
  if (key === 'ENTER') {
    return t('en', 'enter');
  }
  return key;
}

const styles = StyleSheet.create({
  keyboard: {
    gap: spacing.sm,
  },
  keyRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  key: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 2,
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
  },
  keyTextScored: {
    color: colors.onAccent,
  },
});
