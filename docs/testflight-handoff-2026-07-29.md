# TestFlight handoff — 2026-07-29

This handoff records the state left on Office Openspace for continuation on
Home. It is documentation only: no signed archive, IPA export, physical-device
install, App Store Connect upload, production deployment, or provider mutation
was performed for this candidate.

## Reserved candidate

- Public repository: `miguelavalos/duelwords-av` `main` at `2487f9f02dafc0b568fd0adfc20f686b2b15d792`.
- Private repository: `avalsys/avalsys-suite` `main` at `a842ec2fadd2a3d29af360d499fc868eb0424169`.
- Marketing version/build: `0.1.0 (4)`.
- Runtime target when authorized: production.
- Expected incremental provider cost for archive/export/upload: zero.
- Sentry source-map upload remains disabled unless separately and explicitly
  authorized.

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
