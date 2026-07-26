import { describe, expect, it } from 'vitest';

import { duelWordsIosSsoRedirectUrl } from './account-native-auth-contract';

describe('DuelWords iOS native authentication contract', () => {
  it('uses the exact Clerk callback for development and production identities', () => {
    expect(duelWordsIosSsoRedirectUrl('com.avalsys.duelwordsav.dev')).toBe(
      'com.avalsys.duelwordsav.dev://callback',
    );
    expect(duelWordsIosSsoRedirectUrl('com.avalsys.duelwordsav')).toBe(
      'com.avalsys.duelwordsav://callback',
    );
  });

  it('rejects generic, malformed, or multiple schemes', () => {
    expect(() => duelWordsIosSsoRedirectUrl('duelwordsav')).toThrow(
      'one approved native URL scheme',
    );
    expect(() => duelWordsIosSsoRedirectUrl('com.avalsys.duelwordsav://sso-callback')).toThrow(
      'one approved native URL scheme',
    );
    expect(() => duelWordsIosSsoRedirectUrl([
      'com.avalsys.duelwordsav',
      'com.avalsys.duelwordsav.dev',
    ])).toThrow('one approved native URL scheme');
  });
});
