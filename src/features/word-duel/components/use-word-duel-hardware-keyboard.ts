export type WordDuelHardwareKeyboardOptions = {
  disabled: boolean;
  keyRows: readonly string[][];
  onKeyPress: (key: string) => void;
};

export function useWordDuelHardwareKeyboard(_options: WordDuelHardwareKeyboardOptions) {
  return undefined;
}
