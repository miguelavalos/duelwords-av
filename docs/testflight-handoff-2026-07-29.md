# TestFlight handoff — 2026-07-29

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
