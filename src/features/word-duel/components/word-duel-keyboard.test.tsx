import { createElement, type ReactNode } from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import { useWordDuelInputBuffer } from './use-word-duel-input-buffer';
import { WordDuelKeyboard, WORD_DUEL_KEY_ROWS } from './word-duel-keyboard';

type FakeNativeProps = {
  children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
  style?: unknown;
  [key: string]: unknown;
};

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Pressable: ({ children, style: _style, ...props }: FakeNativeProps) => createElement(
    'Pressable',
    props,
    typeof children === 'function' ? children({ pressed: false }) : children,
  ),
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
    hairlineWidth: 1,
  },
  Text: ({ children, ...props }: FakeNativeProps) => createElement('Text', props, children as ReactNode),
  View: ({ children, ...props }: FakeNativeProps) => createElement('View', props, children as ReactNode),
  useColorScheme: () => 'light',
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
  it('keeps overlapping native touch starts lossless before responder negotiation', () => {
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
      .findAll((node) => String(node.type) === 'Pressable')
      .map((key) => [keyLabel(key), key]));

    expect([...keys.values()].every((key) => key.props.onPressIn === undefined)).toBe(true);

    act(() => {
      for (const letter of 'EVILS') {
        keys.get(letter)?.props.onTouchStart?.({ nativeEvent: { changedTouches: [{}] } });
      }
    });

    expect(inputBuffer?.read()).toBe('EVILS');
    expect(inputBuffer?.input).toBe('EVILS');

    act(() => {
      mountedRenderer.unmount();
    });
  });

  it('does not accept raw native touches while the keyboard is disabled', () => {
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
    const keys = mountedRenderer.root.findAll((node) => String(node.type) === 'Pressable');

    expect(keys.every((key) => key.props.onAccessibilityTap === undefined)).toBe(true);
    expect(keys.every((key) => key.props.onTouchStart === undefined)).toBe(true);
    expect(onKeyPress).not.toHaveBeenCalled();

    act(() => {
      mountedRenderer.unmount();
    });
  });
});

function keyLabel(key: ReactTestInstance): string {
  return key.find((node) => String(node.type) === 'Text').props.children as string;
}
