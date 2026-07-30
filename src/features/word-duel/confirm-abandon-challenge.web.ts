import type { ConfirmAbandonChallengeInput } from './confirm-abandon-challenge';

export function showAbandonChallengeConfirmation({
  detail,
  onConfirm,
  title,
}: ConfirmAbandonChallengeInput) {
  if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${detail}`)) {
    onConfirm();
  }
}
