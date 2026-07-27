# V1 advertising exclusion

DuelWords AV V1 ships without advertising.

This is an implementation boundary, not a disabled feature flag:

- no Google Mobile Ads or consent SDK is a dependency;
- no AdMob application ID, ad-unit ID, build mode, or native plugin exists;
- Home, lobby, Daily, Practice, Play Avi, active duels, results, onboarding,
  Account, Settings, and Pro contain no placement or reserved ad layout;
- Settings contains no advertising privacy action;
- Pro does not promise “no ads” because V1 has no ads for any player;
- web and native make no advertising or consent request.

`src/v1-no-ads-contract.test.ts` prevents the V1 client from regaining the
removed SDK, configuration, consent bridge, or `adSlot` models by accident.

Advertising may be reconsidered after V1 only through a new product decision.
That future work must re-evaluate provider choice, consent, store privacy
answers, user experience, Pro positioning, physical-device acceptance, and
rollback. The historical AdMob/UMP plan is not authority to re-enable it.
