# TestFlight handoff — 2026-07-29

Status: historical build-4 handoff. It is superseded by processed internal
build `0.1.0 (13)` from public functional commit `18f543e`; use the current
README and connected-duel UX handoff for present release state. Every statement
below applies only to its dated checkpoint.

This handoff records the state left on Office Openspace for continuation on
Home. It is documentation only: no signed archive, IPA export, physical-device
install, App Store Connect upload, production deployment, or provider mutation
was performed for this candidate.

## Reserved candidate

- Public app-source reservation: `2487f9f02dafc0b568fd0adfc20f686b2b15d792`.
- Private signed-runtime/preflight baseline:
  `a842ec2fadd2a3d29af360d499fc868eb0424169`.
- Marketing version/build: `0.1.0 (4)`.
- Runtime target when authorized: production.
- Expected incremental provider cost for archive/export/upload: zero.
- Sentry source-map upload remains disabled unless separately and explicitly
  authorized.

The public branch also contains this handoff documentation, so Home must use
its synchronized `origin/main` head for the exact archive gate rather than
assuming the app-source reservation is the branch head. The private repository
may likewise receive documentation-only integration commits; synchronize it
before recording the exact private gate commit.

The public source contains the approved Play Avi balance, local game setup and
preferences, separate Account/Settings ownership, and device-local DuelWords
display-name changes. `app.json`, the release-config checker, and the canonical
archive script all agree on build `4`.

## Evidence completed on Openspace

- `pnpm test`: 75 files and 393 tests passed.
- `pnpm typecheck`, `pnpm lint`, and `pnpm config:ios:check` passed.
- Earlier in this candidate's review, dedicated DuelWords iPhone and iPad
  simulators built and exercised the adaptive Home, Play Avi setup, and native
  Game preferences surfaces.
- The registered physical iPhone was offline when this handoff was created;
  no installation or local-data mutation was attempted. No physical iPad is
  available.

## Home continuation

1. Read the root and repository `AGENTS.md` instructions; synchronize both
   repositories without disturbing any local changes.
2. Verify the exact public/private commits above, then run the private
   signed-runtime preflight and all documented release gates again on Home.
3. Rebuild the signed candidate only after obtaining current approval for the
   exact commits, `0.1.0 (4)`, production runtime, and zero expected provider
   cost. Use the private internal-TestFlight runbook and the public canonical
   archive/export scripts.
4. If the physical iPhone is connected, install only over the existing app;
   never uninstall or clear its data. iPad acceptance remains simulator-only.
5. Stop before any App Store Connect/TestFlight mutation until the exact archive
   has a current explicit upload authorization.

## Home connected-duel stabilization

The connected-duel source was superseded on Home by public app-source commit
`05e570dc7e2d738d57da058a288286170b36c4d9`. The synchronized private guardrail
head at the final local gate was
`80e3721c56054bc6a2156be69e9b4596c9abea06`. The candidate remains DuelWords AV
`0.1.0 (4)`, Production runtime, zero expected incremental provider cost and
Sentry upload disabled.

The Home work removes the normal-path Refresh, Sync round, Next round and Open
result recovery controls. Convex room projections remain authoritative for
deadlines and state changes, while the visible clock advances locally every
250 ms. A resolving round now refreshes the caller's private snapshot and asks
the idempotent backend transition to open the next round. A newer authoritative
round resets stale timeout/submission UI state, and a finalized room opens its
result automatically.

The challenge entry and active-duel layouts were also tightened:

- room-code join is the default and appears before create;
- the code uses two four-character fields, so the player never types the
  separator;
- lobby membership arrives through realtime and a joined recipient is ready
  immediately;
- full game language, round, timer and rival attempt state remain visible;
- reactions use one compact tray and replace a fixed rival-status slot while
  visible, so neither device shifts its board or keyboard;
- manual recovery is limited to a contextual Try again action after an actual
  error.

Final automated gates passed on the exact source:

- `pnpm test`: 76 files and 406 tests;
- `pnpm typecheck`, `pnpm lint`, `pnpm config:ios:check` and
  `git diff --check`;
- React Doctor completed with no errors; its 75/100 report contains 16 advisory
  structural warnings in the changed large screens.

Dedicated Production Release simulators completed multiple two-player paths on
iPhone 17 and iPad Pro 13. Join appeared on the host without refresh, both
players entered the game, the one-second display remained smooth, two timeout
clients advanced automatically, a submitted-versus-timeout round advanced both
clients, and final result opened automatically. A second full layout pass
confirmed room entry, lobby, active play and reaction delivery on both sizes;
the reaction state no longer changes any downstream element position.

A development-identity signed Production Release app was then built from the
exact app-source commit. Runtime config, `0.1.0 (4)` metadata and strict code
signature passed, and the build explicitly skipped Sentry upload. It was
installed in place over `com.avalsys.duelwordsav` on the connected physical
iPhone 14 and iPad Air without uninstalling or clearing data. The iPad launched
successfully. The iPhone installation succeeded, but its automated launch was
denied because the device was locked; owner launch and the final physical
two-device acceptance remain open.

No archive, IPA, App Store Connect or TestFlight upload was created. This
stabilization did not write Infisical or perform an additional Convex,
Cloudflare, D1 or other production deployment.

## Home automatic-rematch follow-up

Public app source was superseded again by
`4925cd177f80d8dc606032d0b10ffb87c8f415fc`. The candidate metadata remains
DuelWords AV `0.1.0 (4)`, Production runtime, zero expected incremental
provider cost and Sentry upload disabled.

The result screen now checks the Apps API rematch proposal automatically once
per second while it is visible. A rival request therefore exposes Accept and
Decline without a manual Refresh control. Once accepted, both participants
automatically leave the completed result and open the next lobby. Closing a
connected journey also returns to Join rather than Create.

Automated gates passed on the exact source:

- `pnpm test`: 76 files and 409 tests;
- `pnpm typecheck`, `pnpm lint`, `pnpm config:ios:check` and
  `git diff --check`;
- React Doctor completed with no errors; its 77/100 report contains ten
  advisory warnings in the changed large screen.

Fresh dedicated Production Release iPhone 17 and iPad Pro 13 simulators
completed a full six-round duel. The iPad requested a rematch and, without any
refresh action, the iPhone exposed Accept in about two seconds. Acceptance
automatically opened the same next lobby on both devices; the host exposed
Start game and the recipient waited without an extra ready action.

The accepted rematch lobby currently renders its backend game identifier
(`dwr_…`) in the Room code field. This is a v1 capture/release blocker: it must
be replaced by suitable rematch copy or a human-facing code before marketing
screenshots or release readiness are declared. The existing guest daily-limit
message can also prevent further rematch testing once a simulator identity has
exhausted its challenge allowance; fresh identities were used to isolate the
automatic-rematch behavior.

A development-identity signed Production Release app was rebuilt from exact
source `4925cd177f80d8dc606032d0b10ffb87c8f415fc`. Effective runtime config,
`0.1.0 (4)` metadata and strict code signature passed, and Sentry upload was
explicitly skipped. It was installed in place on the connected physical iPhone
14 and iPad Air without uninstalling or clearing data. The iPad launched; the
iPhone installation succeeded and only its automated launch was denied because
the device was locked.

No archive, IPA, App Store Connect or TestFlight upload was created, and no
Infisical, Convex, Cloudflare, D1 or other production deployment was performed.

## Home round-progress and result-clarity follow-up

The next synchronized code checkpoint is public app commit
`7fb1925f748fd412dd8bc859d4f8573b7448000e` with private projection commit
`8b123c502b9d11a56fa38c0863fe5f5284196695`. Candidate metadata remains
DuelWords AV `0.1.0 (4)`, Production runtime, zero expected incremental
provider cost and Sentry upload disabled.

The active duel now follows the existing Play Avi information contract for
rival progress: each resolved round exposes only aggregate valid-letter and
correct-position counts. Convex never exposes the rival's word, letters or
feedback states. Sent reactions are labelled as the viewer's and align to the
right; received reactions are labelled with the rival and align to the left.
Both occupy a fixed-height lane, so neither board nor keyboard moves.

The connected result screen now identifies `You` and `Rival` in both a result
overview and each final board, includes separate attempt counts, and places the
live rematch action before the boards. A received rematch therefore exposes
Accept and Decline immediately. On iPad the final boards render side by side
with larger tiles; on iPhone they remain stacked below the always-visible
rematch action.

Final source gates at this checkpoint passed:

- public `pnpm test`: 77 files and 414 tests;
- public typecheck, lint, `config:ios:check` and `git diff --check`;
- private focused projection suite: 2 files and 17 tests;
- private Apps API and Convex TypeScript checks and Apps API lint;
- React Doctor completed without errors. Its remaining 13 warnings are the
  pre-existing state/component-structure advisories in the two large screens;
  the unstable list key and barrel import introduced during this follow-up
  were removed.

Production Release fixtures were inspected on the dedicated iPhone 17 and iPad
Pro 13 simulators. The iPhone kept rival scores, reactions, board, keyboard and
controls visible without displacement. The redesigned final screen exposed a
received rematch above both boards on both devices, and the iPad wide layout
showed both labelled boards simultaneously. The temporary Release preview
access used for that inspection was removed before the final source commit;
existing development-only routes retain their normal Release redirects.

The new private projection code has not been deployed to Convex production or
the production Apps API. Consequently the aggregate rival scores are not yet
an end-to-end production result. The exact production Convex and Apps API
deployments require new explicit authorization; after them, the final build
must be installed in place on the physical iPhone and iPad and a real
multi-round duel must be repeated before release readiness is declared.

No final physical install, archive, IPA, App Store Connect/TestFlight upload,
Infisical mutation, Convex deployment, Cloudflare deployment, D1 mutation or
other production change was performed at this checkpoint.

## Home Production activation and physical-install checkpoint

The owner explicitly authorized the exact synchronized code pair: public app
source `7fb1925f748fd412dd8bc859d4f8573b7448000e` and private projection/API
source `8b123c502b9d11a56fa38c0863fe5f5284196695`, for DuelWords AV `0.1.0 (4)`,
Production runtime, zero expected incremental provider cost and disabled Sentry
upload.

The isolated DuelWords Convex bundle deployed first to Production deployment
`blissful-shark-434`. Its pre-deploy and post-deploy dry-runs selected the same
deployment, kept crons disabled, validated the schema and deleted no indexes.
Apps API Production then deployed as Worker version
`77640926-e7e3-4104-8c44-d3fb377d7e0a`; the preceding rollback version is
`4699f459-7dda-4b7b-bea8-3283f5f6fbee`. The new version is active at 100%, has
both required DuelWords Convex secret binding names, keeps realtime enabled,
and returned a healthy Production response.

A clean development-identity signed Production Release app was built from the
exact public source. Strict signature validation, `0.1.0 (4)` metadata,
production bundle id, Account AV keychain/associated-domain entitlements and
the Production Apps API/Convex runtime targets passed. The app was installed in
place over `com.avalsys.duelwordsav` on the physical iPhone 14 and iPad Air,
without uninstalling or clearing data. Both automated launches were denied only
because the devices were locked; manual launch and the real multi-round
two-device acceptance remain open.

No Infisical write or sync, D1 migration/import, repeated automated gameplay
smoke, archive, IPA, TestFlight upload or App Store build submission occurred.

## Final physical acceptance and TestFlight upload

The final public source candidate is
`afc84da5c12253b0bbb6a8e34b097977906ad9a3`; the private backend source remains
`8b123c502b9d11a56fa38c0863fe5f5284196695`. The final follow-up highlights the
winning `You` or `Rival` summary card in green while keeping the losing card
neutral. The owner accepted the corrected result on the physical iPhone and
iPad after the real multi-round Production duel. Final public gates passed at
77 files / 414 tests plus typecheck, lint, `config:ios:check`, diff validation
and React Doctor 81/100 with six pre-existing structural advisories.

The canonical archive/export/upload completed for exact candidate `0.1.0 (4)`,
Production runtime, zero expected incremental provider cost and disabled Sentry
upload:

- archive: `.DerivedData-duelwords-testflight/Archives/DuelWordsAV-0.1.0-4-2026-07-29-190240.xcarchive`;
- application UUID: `A166D0F8-E339-3623-8993-BCE1E8124AF1`;
- IPA: `.DerivedData-duelwords-testflight/Exports/DuelWordsAV-0.1.0-4-2026-07-29-190240-auto/DuelWordsAV.ipa`;
- IPA size: `41,082,188` bytes;
- IPA SHA-256: `651c8225508c177883b121f945c38b949ba0716aa3560abc8411a6727b6251e6`;
- App Store Connect build id: `55ac273b-4143-430c-a8fa-c8fb1d914d36`.

The upload log ended with `Upload succeeded`, `Uploaded DuelWordsAV` and
`EXPORT SUCCEEDED`. App Store Connect reports the upload as `Finalizado`, the
binary as validated, symbols present, non-exempt encryption `No`, the expected
entitlements and a 90-day TestFlight window. The build has no beta group or
beta status because it was not added to testing. It was not added or submitted
to App Review. No build `5` was reserved, archived or uploaded.

The existing manual Apple provisioning profile was corrected to use the local
distribution identity that expires on 2027-06-07; no certificate was created.
No code, backend, Infisical, D1 or production-runtime change accompanied that
profile correction.

## Post-upload Sentry correlation

A read-only Production Sentry check found two new native watchdog events for
`0.1.0 (4)`: the physical iPhone at `2026-07-29T16:49:18Z` and physical iPad at
`2026-07-29T16:49:25Z`. Those timestamps match the in-place installation of the
new app on each device exactly. Both events contain no crash file, stack trace
or runtime error and were reported when Sentry next launched. There was no
later occurrence during launch or the accepted real multi-round duel.

The evidence therefore classifies these two events as installation-induced
termination of the previously running app, not a reproduced memory or gameplay
failure in the final candidate. The Sentry issue remains unmodified and
unresolved so that any genuinely independent recurrence remains visible.

## TestFlight availability follow-up

App Store Connect continues to report upload `0.1.0 (4)` / build id
`55ac273b-4143-430c-a8fa-c8fb1d914d36` as `Finalizado`, binary `Validado`, with
symbols, non-exempt encryption `No` and 90 days remaining. As of
`2026-07-29T18:23Z`, Apple still had not exposed `Lista para enviar`, enabled
the build controls or allowed the build to join an internal testing group.
There is no visible processing error, compliance request or missing metadata
action. The archive and upload must not be repeated and build `5` remains
unreserved.

During monitoring, builds `0.1.0 (1)`, `(2)` and `(3)` changed to `Caducado` and
the existing internal `avalsys` group changed to zero builds while retaining
its single tester. This task did not expire or remove those builds and did not
modify the group. A bounded five-minute heartbeat now observes only build `4`;
when Apple enables it, the authorized next action is to add that exact build to
the existing internal group and verify `En pruebas`. No external testing or
App Review action is authorized.

## Owner-authorized replacement-build experiment

The owner superseded the earlier no-reupload hold and explicitly authorized a
new build to test the same TestFlight propagation failure reproduced in another
Avalsys app. Public commit
`3979ae4b96a55cb83dd842834163051720ab732e` changes only the iOS build number
and its executable release checks from `4` to `5`; functional app source remains
the physically accepted `afc84da5c12253b0bbb6a8e34b097977906ad9a3`, and
backend source remains `8b123c502b9d11a56fa38c0863fe5f5284196695`.
Node `22.23.1` and pnpm `11.9.0` passed 77 files / 414 tests, typecheck, lint,
the iOS release-config check and diff validation.

The canonical Production archive, local IPA verification and authorized upload
then completed with Sentry upload disabled and zero expected incremental cost:

- archive: `.DerivedData-duelwords-testflight/Archives/DuelWordsAV-0.1.0-5-2026-07-29-211438.xcarchive`;
- application UUID: `FB8416B2-A056-36CD-87A9-BF48E41472C5`;
- IPA: `.DerivedData-duelwords-testflight/Exports/DuelWordsAV-0.1.0-5-2026-07-29-211438-local/DuelWordsAV.ipa`;
- IPA size: `41,080,754` bytes;
- IPA SHA-256: `964d37f24859a7968243017836919c09e307f490e31c4275a23e8eb7a1c5f6ad`;
- App Store Connect build id: `5bea9253-f372-4f3e-9660-588582a73d52`.

The upload receipt ended with `Upload succeeded`, `Uploaded DuelWordsAV` and
`EXPORT SUCCEEDED`. Immediate official App Store Connect API readback reports
both builds `4` and `5` as `VALID`, `APP_STORE_ELIGIBLE`, encryption exempt and
still missing `buildBetaDetail` with HTTP `404`. Therefore build `5` did not
immediately activate build `4`. The existing `avalsys` group still reported
`hasAccessToAllBuilds=true`; a later read of the group endpoint returned an
Apple HTTP `500` while both build reads remained stable. No group/tester,
external testing, App Review, backend, provider, Sentry or production mutation
accompanied the experiment.

Heartbeat `completar-testflight-duelwords-build-4` now observes only builds `4`
and `5`. If Apple creates a beta detail for build `4`, the authorized mutation
remains limited to making that exact build available to the existing internal
`avalsys` group and verifying its sole tester. Do not upload build `6`.

## TestFlight propagation closure

Apple's beta service later recovered without another upload or configuration
change. At `2026-07-29T20:20Z`, official API readback reported build `5` as
`VALID`, `APP_STORE_ELIGIBLE` and `IN_BETA_TESTING`, with beta detail HTTP
`200`. The internal `avalsys` group remains configured with
`hasAccessToAllBuilds=true` and exactly one tester. The owner confirmed that
build `5` was installed from TestFlight.

Apple simultaneously created beta detail for build `4` but marked it
`EXPIRED`; build `5`, id `5bea9253-f372-4f3e-9660-588582a73d52`, is therefore
the accepted internal-testing artifact. No manual group assignment was needed.
No external tester, App Review, review submission, public release, backend,
provider, Sentry, Infisical or production mutation occurred during closure.
The propagation heartbeat is no longer required.
