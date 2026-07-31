import { createElement, type ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import { CompactDuelStatusRow } from './compact-duel-status-row';

type FakeNativeProps = {
  children?: ReactNode;
  style?: unknown;
  [key: string]: unknown;
};

vi.mock('react-native', () => ({
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
    hairlineWidth: 1,
  },
  Text: ({ children, ...props }: FakeNativeProps) => createElement('Text', props, children),
  View: ({ children, ...props }: FakeNativeProps) => createElement('View', props, children),
}));

vi.mock('@/ui/theme', () => ({
  radii: { md: 12 },
  spacing: { md: 12 },
  typeScale: { body: 16, small: 13 },
  useAppTheme: () => ({
    colors: {
      accent: '#0a0',
      danger: '#a00',
      surfaceSoft: '#eee',
      text: '#111',
    },
  }),
}));

describe('CompactDuelStatusRow', () => {
  it('keeps an iPhone error on one fixed-height line', () => {
    let renderer: ReactTestRenderer | undefined;

    act(() => {
      renderer = create(
        <CompactDuelStatusRow
          compact
          detail="No está en el diccionario"
          error
          label="Elige letras"
        />,
      );
    });

    if (!renderer) throw new Error('Status row did not mount.');
    const row = renderer.root.findByProps({ testID: 'compact-duel-status-row' });
    const detail = renderer.root.findAll((node) => node.props.minimumFontScale === 0.8).at(-1);

    expect(row.props.style).toContainEqual(expect.objectContaining({ height: 36 }));
    expect(detail?.props).toMatchObject({
      accessibilityLiveRegion: 'assertive',
      adjustsFontSizeToFit: true,
      minimumFontScale: 0.8,
      numberOfLines: 1,
    });

    act(() => renderer?.unmount());
  });
});
