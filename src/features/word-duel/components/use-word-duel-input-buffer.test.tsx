import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it } from 'vitest';

import { useWordDuelInputBuffer } from './use-word-duel-input-buffer';

describe('useWordDuelInputBuffer', () => {
  it('makes rapid letters available to submit before React renders again', () => {
    let controller: ReturnType<typeof useWordDuelInputBuffer> | undefined;
    let renderer: ReactTestRenderer;

    function Probe() {
      controller = useWordDuelInputBuffer();
      return null;
    }

    act(() => {
      renderer = create(<Probe />);
    });

    act(() => {
      controller?.append('P');
      controller?.append('L');
      controller?.append('U');
      controller?.append('M');
      controller?.append('A');

      expect(controller?.read()).toBe('PLUMA');
    });

    expect(controller?.input).toBe('PLUMA');

    act(() => {
      renderer.unmount();
    });
  });

  it('serializes delete, clear, and the five-letter limit', () => {
    let controller: ReturnType<typeof useWordDuelInputBuffer> | undefined;
    let renderer: ReactTestRenderer;

    function Probe() {
      controller = useWordDuelInputBuffer();
      return null;
    }

    act(() => {
      renderer = create(<Probe />);
    });

    act(() => {
      'BURLOS'.split('').forEach((letter) => controller?.append(letter));
      controller?.deleteLast();
      controller?.append('A');
    });

    expect(controller?.input).toBe('BURLA');
    expect(controller?.read()).toBe('BURLA');

    act(() => {
      controller?.clear();
    });

    expect(controller?.input).toBe('');
    expect(controller?.read()).toBe('');

    act(() => {
      renderer.unmount();
    });
  });
});
