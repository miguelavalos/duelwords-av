import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, type GestureTouchEvent } from 'react-native-gesture-handler';

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

type KeyboardKeyLayout = {
  key: string;
  width: number;
  x: number;
};

type KeyboardRowLayout = {
  height: number;
  keys: KeyboardKeyLayout[];
  y: number;
};

const DUPLICATE_NATIVE_TOUCH_WINDOW_MS = 75;

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
  const disabledRef = useRef(disabled);
  const onKeyPressRef = useRef(onKeyPress);
  const rowLayoutsRef = useRef<KeyboardRowLayout[]>([]);
  const recentKeyTouchesRef = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    disabledRef.current = disabled;
    onKeyPressRef.current = onKeyPress;
  }, [disabled, onKeyPress]);

  const handleTouchesChanged = useCallback((event: GestureTouchEvent) => {
    handleKeyboardTouches(
      event,
      rowLayoutsRef.current,
      recentKeyTouchesRef.current,
      disabledRef.current,
      onKeyPressRef.current,
    );
  }, []);

  const keyboardGesture = useMemo(
    () => Gesture.Manual()
      .cancelsTouchesInView(false)
      .runOnJS(true)
      // Gesture Handler registers this callback; it does not invoke it during render.
      // eslint-disable-next-line react-hooks/refs
      .onTouchesDown(handleTouchesChanged),
    [handleTouchesChanged],
  );

  return (
    <GestureDetector gesture={keyboardGesture}>
      <View
        style={[styles.keyboard, compact && styles.keyboardCompact]}
        testID="word-duel-keyboard">
        {keyRows.map((row, rowIndex) => (
          <View
            key={`key-row-${rowIndex}`}
            onLayout={({ nativeEvent }) => {
              const current = rowLayoutsRef.current[rowIndex] ?? { keys: [] };
              rowLayoutsRef.current[rowIndex] = {
                ...current,
                height: nativeEvent.layout.height,
                y: nativeEvent.layout.y,
              };
            }}
            style={[styles.keyRow, compact && styles.keyRowCompact]}
            testID={`word-duel-key-row-${rowIndex}`}>
            {row.map((key, keyIndex) => {
              const normalized = key.length === 1 ? key.toLowerCase() : key;
              const feedback = getFeedback(feedbackByKey, normalized);
              return (
                <View
                  accessible
                  accessibilityLabel={keyLabel(key, interfaceLocale)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled }}
                  key={key}
                  onAccessibilityTap={() => {
                    if (!disabled) {
                      onKeyPress(key);
                    }
                  }}
                  onLayout={({ nativeEvent }) => {
                    const rowLayout = rowLayoutsRef.current[rowIndex] ?? {
                      height: 0,
                      keys: [],
                      y: 0,
                    };
                    rowLayout.keys[keyIndex] = {
                      key,
                      width: nativeEvent.layout.width,
                      x: nativeEvent.layout.x,
                    };
                    rowLayoutsRef.current[rowIndex] = rowLayout;
                  }}
                  pointerEvents="none"
                  style={[
                    styles.key,
                    compact && styles.keyCompact,
                    key.length > 1 && styles.actionKey,
                    feedback === 'exact' && styles.keyExact,
                    feedback === 'present' && styles.keyPresent,
                    feedback === 'absent' && styles.keyAbsent,
                    disabled && styles.keyDisabled,
                  ]}
                  testID={`word-duel-key-${key}`}>
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[styles.keyText, feedback && styles.keyTextScored]}>
                    {keyLabel(key, interfaceLocale)}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </GestureDetector>
  );
}

function handleKeyboardTouches(
  event: GestureTouchEvent,
  rowLayouts: readonly KeyboardRowLayout[],
  recentKeyTouches: Map<string, number>,
  disabled: boolean,
  onKeyPress: (key: string) => void,
) {
  if (disabled) {
    recentKeyTouches.clear();
    return;
  }

  const now = Date.now();
  for (const [keyTouch, handledAt] of recentKeyTouches) {
    if (now - handledAt >= DUPLICATE_NATIVE_TOUCH_WINDOW_MS) {
      recentKeyTouches.delete(keyTouch);
    }
  }

  for (const touch of event.changedTouches) {
    const key = findKeyAtTouch(touch, rowLayouts);
    const keyTouch = key ? `${touch.id}:${key}` : undefined;
    if (key && keyTouch && !recentKeyTouches.has(keyTouch)) {
      recentKeyTouches.set(keyTouch, now);
      onKeyPress(key);
    }
  }
}

function findKeyAtTouch(
  touch: GestureTouchEvent['changedTouches'][number],
  rowLayouts: readonly KeyboardRowLayout[],
) {
  const row = rowLayouts.find(
    ({ height, y }) => touch.y >= y && touch.y <= y + height,
  );
  return row?.keys.find(
    ({ width, x }) => touch.x >= x && touch.x <= x + width,
  )?.key;
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
