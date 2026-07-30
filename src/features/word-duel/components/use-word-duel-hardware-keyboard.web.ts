import { useEffect, useLayoutEffect, useRef } from 'react';

import type { WordDuelHardwareKeyboardOptions } from './use-word-duel-hardware-keyboard';

export function useWordDuelHardwareKeyboard(options: WordDuelHardwareKeyboardOptions) {
  const optionsRef = useRef(options);

  useLayoutEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const current = optionsRef.current;
      if (
        current.disabled
        || event.isComposing
        || event.repeat
        || event.altKey
        || event.ctrlKey
        || event.metaKey
      ) return;
      if (isEditableTarget(event.target)) return;

      const key = wordDuelKeyForKeyboardEvent(event.key, current.keyRows);
      if (!key) return;

      event.preventDefault();
      current.onKeyPress(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

export function wordDuelKeyForKeyboardEvent(key: string, keyRows: readonly string[][]) {
  if (key === 'Enter') return 'ENTER';
  if (key === 'Backspace' || key === 'Delete') return 'DEL';

  const normalized = key.toUpperCase();
  if (Array.from(normalized).length !== 1) return null;

  return keyRows.some((row) => row.includes(normalized)) ? normalized : null;
}

function isEditableTarget(target: EventTarget | null) {
  if (typeof HTMLElement === 'undefined') return false;
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === 'input' || tagName === 'select' || tagName === 'textarea';
}
