import { describe, expect, it } from 'vitest';

import { INTERFACE_LOCALES } from '../../i18n/locales';

import { activityCopy, activityModeLabel, activityOutcomeLabel } from './activity-copy';

describe('activity interface copy', () => {
  it('provides complete user-facing copy in all five interface languages', () => {
    for (const { code } of INTERFACE_LOCALES) {
      const values = Object.values(activityCopy(code));
      expect(values.every((value) => value.trim().length > 0)).toBe(true);
      expect(activityModeLabel(code, 'daily').trim()).not.toBe('');
      expect(activityOutcomeLabel(code, 'win').trim()).not.toBe('');
    }
  });

  it('keeps implementation vocabulary and placeholder language out of English', () => {
    const english = Object.values(activityCopy('en')).join(' ');
    expect(english).not.toMatch(/\b(server|backend|runtime|convex|clerk|mock|placeholder|coming later)\b/i);
  });
});
