import { useCallback, useRef, useState } from 'react';

import { WORD_DUEL_WORD_LENGTH } from '../../../game/word-duel-engine';

export function useWordDuelInputBuffer(maxLength = WORD_DUEL_WORD_LENGTH) {
  const [input, setRenderedInput] = useState('');
  const currentInputRef = useRef('');

  const replace = useCallback((next: string) => {
    currentInputRef.current = next;
    setRenderedInput(next);
  }, []);

  const append = useCallback((letter: string) => {
    if (Array.from(currentInputRef.current).length >= maxLength) {
      return;
    }

    replace(`${currentInputRef.current}${letter}`);
  }, [maxLength, replace]);

  const deleteLast = useCallback(() => {
    replace(Array.from(currentInputRef.current).slice(0, -1).join(''));
  }, [replace]);

  const clear = useCallback(() => {
    replace('');
  }, [replace]);

  const read = useCallback(() => currentInputRef.current, []);

  return {
    append,
    clear,
    deleteLast,
    input,
    read,
  };
}
