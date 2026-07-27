# Advertising and consent

DuelWords AV includes a native Google Mobile Ads boundary for a single Home
banner. It is disabled by default: app code does not call UMP, invoke explicit
Google Mobile Ads initialization, construct a banner, or request inventory
unless the build explicitly selects `test` or `live` mode and Home mounts its
one placement.

## Player contract

- Daily and Challenge a Friend remain the first two Home actions.
- Play Avi and Practice remain visible before advertising.
- The optional banner sits after every game mode and before the final Avi help
  card.
- Active Daily, human duels, Play Avi, Practice, results, onboarding, Account,
  Settings, and Pro contain no ads.
- Pro never triggers UMP, explicit initialization, or an ad request and sees no
  empty placeholder.
- Loading, unavailable, or failed account access also fails closed with no ad.
- V1 requests non-personalized inventory only and limits content rating to `G`.
- If Google UMP requires a privacy-options entry, Settings exposes it in
  EN/ES/CA/FR/DE.

## Build modes

`EXPO_PUBLIC_DUELWORDSAV_ADS_MODE` accepts exactly:

- `disabled` (default): native SDK is linked with Google's sample application
  IDs and delayed measurement, but app code makes no UMP, explicit
  initialization, banner, or ad-request call. The linked framework may create
  local support directories during process startup; that is not inventory.
- `test`: eligible Guest/Free players use Google's official test banner ID.
  This is the only mode allowed during development and simulator validation.
- `live`: eligible Guest/Free players on iPhone/iPad use the configured
  DuelWords AdMob application and Home banner IDs. Android fails closed until
  its final package and separate provider units exist.

Unknown modes fail the native build configuration. Live mode also fails unless
both public iOS AdMob identifiers are valid:

```text
DUELWORDSAV_ADMOB_IOS_APP_ID
EXPO_PUBLIC_DUELWORDSAV_ADMOB_IOS_HOME_BANNER_ID
```

Provider identifiers and mode selection do not belong in this public
repository. Follow the private DuelWords advertising runbook for activation,
privacy review, physical-device acceptance, and rollback.

## Implementation boundaries

- `src/ads/ads-policy.ts` is the account/plan eligibility authority.
- `src/ads/ads-provider.native.tsx` owns UMP, one-time SDK initialization, and
  the privacy-options action.
- `src/ads/home-banner-ad.native.tsx` owns the one adaptive Home placement.
- Web renders no ad and makes no advertising request.
- `app.config.js` supplies native application IDs and delays measurement.

The contract tests lock default-off behavior, live configuration validation,
Google test inventory, Pro/error fail-closed behavior, non-personalized
requests, Home placement, and the absence of ads from game boards.
