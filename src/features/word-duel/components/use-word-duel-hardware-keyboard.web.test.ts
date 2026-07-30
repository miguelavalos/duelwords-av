import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WORD_DUEL_KEY_ROWS } from './word-duel-key-rows';
import {
  useWordDuelHardwareKeyboard,
  wordDuelKeyForKeyboardEvent,
} from './use-word-duel-hardware-keyboard.web';

const originalWindow = globalThis.window;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
});

describe('web Word Duel hardware keyboard', () => {
  it('maps letters and action keys from the physical keyboard', () => {
    expect(wordDuelKeyForKeyboardEvent('r', WORD_DUEL_KEY_ROWS.en)).toBe('R');
    expect(wordDuelKeyForKeyboardEvent('ñ', WORD_DUEL_KEY_ROWS.es)).toBe('Ñ');
    expect(wordDuelKeyForKeyboardEvent('Enter', WORD_DUEL_KEY_ROWS.en)).toBe('ENTER');
    expect(wordDuelKeyForKeyboardEvent('Backspace', WORD_DUEL_KEY_ROWS.en)).toBe('DEL');
    expect(wordDuelKeyForKeyboardEvent('Delete', WORD_DUEL_KEY_ROWS.en)).toBe('DEL');
    expect(wordDuelKeyForKeyboardEvent('ñ', WORD_DUEL_KEY_ROWS.en)).toBeNull();
    expect(wordDuelKeyForKeyboardEvent('ArrowLeft', WORD_DUEL_KEY_ROWS.en)).toBeNull();
  });

  it('forwards supported non-modified keys through one browser listener', () => {
    let keydownListener: ((event: KeyboardEvent) => void) | undefined;
    const addEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'keydown' && typeof listener === 'function') {
        keydownListener = listener as (event: KeyboardEvent) => void;
      }
    });
    const removeEventListener = vi.fn();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { addEventListener, removeEventListener },
    });
    const onKeyPress = vi.fn();
    let renderer: ReactTestRenderer | undefined;

    function Probe() {
      useWordDuelHardwareKeyboard({
        disabled: false,
        keyRows: WORD_DUEL_KEY_ROWS.en,
        onKeyPress,
      });
      return null;
    }

    act(() => {
      renderer = create(createElement(Probe));
    });

    const preventDefault = vi.fn();
    act(() => {
      keydownListener?.(keyboardEvent('r', preventDefault));
      keydownListener?.(keyboardEvent('a', preventDefault, { ctrlKey: true }));
      keydownListener?.(keyboardEvent('i', preventDefault, { isComposing: true }));
      keydownListener?.(keyboardEvent('s', preventDefault, { repeat: true }));
      keydownListener?.(keyboardEvent('Enter', preventDefault));
    });

    expect(onKeyPress.mock.calls.flat()).toEqual(['R', 'ENTER']);
    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(addEventListener).toHaveBeenCalledOnce();

    act(() => {
      renderer?.unmount();
    });
    expect(removeEventListener).toHaveBeenCalledOnce();
  });
});

function keyboardEvent(
  key: string,
  preventDefault: () => void,
  overrides: Partial<KeyboardEvent> = {},
) {
  return {
    altKey: false,
    ctrlKey: false,
    isComposing: false,
    key,
    metaKey: false,
    preventDefault,
    repeat: false,
    target: null,
    ...overrides,
  } as unknown as KeyboardEvent;
}
