import type { ActiveDuelReactionId } from '@/game/word-duel-active/view-model';
import type { InterfaceLocale } from '@/i18n/locales';

import { publicDuelT } from './public-duel-copy';

export function reactionEmoji(reaction: ActiveDuelReactionId): string {
  if (reaction === 'nice') return '✨';
  if (reaction === 'almost') return '🎯';
  if (reaction === 'tick_tock') return '⏱️';
  if (reaction === 'your_turn') return '👉';
  if (reaction === 'close') return '😮';
  if (reaction === 'no_pressure') return '🧘';
  if (reaction === 'wow') return '🤯';
  return '🤝';
}

export function reactionLabel(locale: InterfaceLocale, reaction: ActiveDuelReactionId): string {
  if (reaction === 'nice') return publicDuelT(locale, 'nice');
  if (reaction === 'almost') return publicDuelT(locale, 'almost');
  if (reaction === 'your_turn') return publicDuelT(locale, 'yourTurn');
  if (reaction === 'tick_tock') return publicDuelT(locale, 'time');
  if (reaction === 'close') return publicDuelT(locale, 'closeCall');
  if (reaction === 'no_pressure') return publicDuelT(locale, 'noPressure');
  if (reaction === 'wow') return publicDuelT(locale, 'wow');
  return 'GG';
}
