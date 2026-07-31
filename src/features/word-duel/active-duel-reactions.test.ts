import { describe, expect, it } from 'vitest';

import { ACTIVE_DUEL_REACTION_IDS } from '../../game/word-duel-active/view-model';

import { reactionEmoji, reactionLabel } from './active-duel-reactions';

describe('active duel reaction presentation', () => {
  it('gives every canonical reaction a distinct visual and localized label', () => {
    const emojis = ACTIVE_DUEL_REACTION_IDS.map(reactionEmoji);

    expect(new Set(emojis).size).toBe(ACTIVE_DUEL_REACTION_IDS.length);
    for (const locale of ['en', 'es', 'ca', 'fr', 'de'] as const) {
      for (const reaction of ACTIVE_DUEL_REACTION_IDS) {
        expect(reactionLabel(locale, reaction)).not.toHaveLength(0);
      }
    }
  });
});
