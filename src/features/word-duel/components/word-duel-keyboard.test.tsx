import { createElement, type ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { GestureTouchEvent } from 'react-native-gesture-handler';
import { describe, expect, it, vi } from 'vitest';

import { useWordDuelInputBuffer } from './use-word-duel-input-buffer';
import { WordDuelKeyboard, WORD_DUEL_KEY_ROWS } from './word-duel-keyboard';

type FakeNativeProps = {
  children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
  style?: unknown;
  [key: string]: unknown;
};

const gestureMock = vi.hoisted(() => ({
  onTouchesDown: undefined as ((event: GestureTouchEvent) => void) | undefined,
}));

vi.mock('react-native', () => ({
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
    hairlineWidth: 1,
  },
  Text: ({ children, ...props }: FakeNativeProps) => createElement('Text', props, children as ReactNode),
  View: ({ children, ...props }: FakeNativeProps) => createElement('View', props, children as ReactNode),
  useColorScheme: () => 'light',
}));

vi.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Manual: () => {
      const gesture = {
        cancelsTouchesInView: () => gesture,
        onTouchesCancelled: () => gesture,
        onTouchesDown: (callback: (event: GestureTouchEvent) => void) => {
          gestureMock.onTouchesDown = callback;
          return gesture;
        },
        onTouchesMove: () => gesture,
        onTouchesUp: () => gesture,
        runOnJS: () => gesture,
      };
      return gesture;
    },
  },
  GestureDetector: ({ children }: FakeNativeProps) => children,
}));

vi.mock('@/i18n/locales', () => ({
  t: (_locale: string, key: string) => key,
}));

vi.mock('@/ui/theme', () => ({
  spacing: { xs: 4 },
  typeScale: { small: 13 },
  useAppTheme: () => ({
    colors: {
      border: '#000',
      feedbackAbsent: '#000',
      feedbackExact: '#000',
      feedbackPresent: '#000',
      onAccent: '#fff',
      surface: '#fff',
      surfaceStrong: '#fff',
      text: '#000',
    },
  }),
}));

describe('WordDuelKeyboard', () => {
  it('routes overlapping native touches once while allowing real repeated letters', () => {
    let renderer: ReactTestRenderer | undefined;
    const onKeyPress = vi.fn();

    act(() => {
      renderer = create(
        <WordDuelKeyboard
          disabled={false}
          feedbackByKey={{}}
          keyRows={WORD_DUEL_KEY_ROWS.en}
          onKeyPress={onKeyPress}
        />,
      );
    });

    if (!renderer || !gestureMock.onTouchesDown) {
      throw new Error('Native keyboard gesture did not mount.');
    }
    const mountedRenderer = renderer;
    const rows = mountedRenderer.root.findAll(
      (node) => String(node.type) === 'View'
        && String(node.props.testID).startsWith('word-duel-key-row-'),
    );
    const keys = new Map(mountedRenderer.root
      .findAll((node) => String(node.type) === 'View' && node.props.accessibilityRole === 'button')
      .map((key) => [key.props.testID, key]));

    act(() => {
      rows.forEach((row, rowIndex) => row.props.onLayout({
        nativeEvent: { layout: { height: 45, width: 300, x: 0, y: rowIndex * 50 } },
      }));
      WORD_DUEL_KEY_ROWS.en.forEach((row, rowIndex) => {
        row.forEach((key, keyIndex) => keys.get(`word-duel-key-${key}`)?.props.onLayout({
          nativeEvent: { layout: { height: 45, width: 25, x: keyIndex * 30, y: 0 } },
        }));
      });
    });

    const touchKey = (key: string, id: number) => {
      const rowIndex = WORD_DUEL_KEY_ROWS.en.findIndex((row) => row.includes(key));
      const keyIndex = WORD_DUEL_KEY_ROWS.en[rowIndex].indexOf(key);
      const touch = {
        absoluteX: keyIndex * 30 + 10,
        absoluteY: rowIndex * 50 + 10,
        id,
        x: keyIndex * 30 + 10,
        y: rowIndex * 50 + 10,
      };
      gestureMock.onTouchesDown?.({
        allTouches: [touch],
        changedTouches: [touch],
        eventType: 1,
        handlerTag: 1,
        numberOfTouches: 1,
        pointerType: 0,
        state: 2,
      });
    };

    act(() => {
      touchKey('R', 0);
      touchKey('A', 1);
      touchKey('A', 1); // Native replay of the same physical touch.
      touchKey('I', 1);
      touchKey('S', 1);
      touchKey('E', 1);
      touchKey('P', 2);
      touchKey('P', 3); // Two distinct presses must both survive.
    });

    expect(onKeyPress.mock.calls.flat()).toEqual(['R', 'A', 'I', 'S', 'E', 'P', 'P']);

    act(() => {
      mountedRenderer.unmount();
    });
  });

  it('preserves rapid key order through accessible controls', () => {
    let inputBuffer: ReturnType<typeof useWordDuelInputBuffer> | undefined;
    let renderer: ReactTestRenderer | undefined;

    function Probe() {
      inputBuffer = useWordDuelInputBuffer();
      return (
        <WordDuelKeyboard
          density="compact"
          disabled={false}
          feedbackByKey={{}}
          keyRows={WORD_DUEL_KEY_ROWS.en}
          onKeyPress={(key) => inputBuffer?.append(key)}
        />
      );
    }

    act(() => {
      renderer = create(<Probe />);
    });

    if (!renderer) throw new Error('Keyboard test renderer did not mount.');
    const mountedRenderer = renderer;

    const keys = new Map(mountedRenderer.root
      .findAll((node) => node.props.accessibilityRole === 'button')
      .map((key) => [key.props.testID, key]));

    act(() => {
      for (const letter of 'RAISE') {
        keys.get(`word-duel-key-${letter}`)?.props.onAccessibilityTap();
      }
    });

    expect(inputBuffer?.read()).toBe('RAISE');
    expect(inputBuffer?.input).toBe('RAISE');

    act(() => {
      mountedRenderer.unmount();
    });
  });

  it('marks every control disabled while the keyboard is disabled', () => {
    let renderer: ReactTestRenderer | undefined;
    const onKeyPress = vi.fn();

    act(() => {
      renderer = create(
        <WordDuelKeyboard
          disabled
          feedbackByKey={{}}
          keyRows={WORD_DUEL_KEY_ROWS.en}
          onKeyPress={onKeyPress}
        />,
      );
    });

    if (!renderer) throw new Error('Keyboard test renderer did not mount.');
    const mountedRenderer = renderer;
    const keys = mountedRenderer.root
      .findAll((node) => node.props.accessibilityRole === 'button');

    expect(keys.every((key) => key.props.accessibilityState.disabled === true)).toBe(true);
    expect(onKeyPress).not.toHaveBeenCalled();

    act(() => {
      mountedRenderer.unmount();
    });
  });
});
