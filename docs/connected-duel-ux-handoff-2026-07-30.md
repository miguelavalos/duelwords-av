# Connected-duel visual feedback and rematch handoff — 2026-07-30

This record covers the iPhone/iPad connected-duel UX correction. TestFlight
build `0.1.0 (6)` was uploaded before these source commits and therefore does
not contain this correction. Build `0.1.0 (7)` was archived from exact source
`64678d3`, uploaded, processed, and assigned only to the internal `avalsys`
group on 2026-07-30. The delivery did not submit App Review, enable external
testing, change a backend, call a paid provider, or write Infisical.

## Visual feedback

The active duel now derives transient presentation events only from the safe
realtime room projection. It never reads or reveals the opponent's word. The
player sees a centered animated card when:

- their own word is submitted;
- the opponent submits;
- the room enters round resolution;
- the authoritative next round opens; or
- a fresh opponent reaction arrives.

Reactions use a large sticker-style emoji and localized label. Their controls
live in a floating dock so the board and keyboard do not move when the tray is
opened. Muting suppresses incoming reaction overlays, while state-transition
feedback remains visible. The overlay is non-interactive, dismisses itself,
uses an assertive accessibility live region, and replaces motion with a static
timed presentation when Reduce Motion is enabled.

The event derivation is deterministic and covered separately from rendering:
the initial projection stays quiet, repeat projections do not replay an event,
own and expired reactions are ignored, resolution wins over a simultaneous
opponent-submitted flag, and round changes emit once.

## Accepted-rematch root cause and correction

The accepted rematch payload intentionally contains a safe `nextGame` view but
does not contain a Convex realtime session. The client previously constructed
the next lobby directly from that payload. The accepting player could become
Ready, but only the player who started the rematch observed the later countdown
and active-round transition; the other device remained stranded in the lobby.

The connected-runtime recovery is now a shared public helper. Both normal
active-duel opening and accepted-rematch handoff request a fresh backend-issued
realtime session for the current game/player before subscribing. The accepting
recipient is made Ready first, then the recovered lobby is presented. A rejected
or unavailable session stays fail-closed on the completed-game surface instead
of presenting a disconnected next lobby.

`AGENTS.md` records this as a recurrent invariant: a future rematch change must
not assume `nextGame` carries realtime credentials and must keep lobby-time
recovery covered by `connected-runtime.test.ts`.

## iPhone ↔ iPad acceptance

Dedicated iPhone 17 and iPad Pro 13 simulators used the preview-connected
runtime and fresh Release app builds. The battery covered lobby synchronization,
Ready/countdown, active play, own/opponent submission transitions, round
resolution, next-round opening, floating reaction controls, received reaction
animation, final result, rematch request/accept, recipient auto-Ready, and entry
of both devices into the rematch active round.

The pre-fix run reproduced the defect with iPad as rematch host: the iPad opened
the new game while the iPhone stayed in the lobby. After the correction, a
fresh six-round duel completed, the rematch was requested and accepted, both
devices entered the new lobby, and both opened its active round. Local evidence
includes the iPad reaction/synchronization recordings and final iPhone/iPad
rematch-active captures retained in the task visualization directory.

## Automated gates

Before the final Git closure, the changed source passed the focused visual,
connected-runtime, and public Challenge recovery suites (25 tests), followed
by the complete Vitest suite (81 files / 445 tests), TypeScript, Expo lint, the
iOS release-configuration check, and `git diff --check`. The direct executable
gates used the supported Node `22.23.2` runtime. React Doctor changed-scope
completed at 76/100 with 15 non-blocking structural advisories in the two
existing large screens; the async effect findings were reviewed and retain
their cancellation guards. Exact commit hashes are recorded in the private
living handoff after the public commits are created.

## Internal TestFlight delivery

The canonical production archive is
`.DerivedData-duelwords-testflight/Archives/DuelWordsAV-0.1.0-7-2026-07-30-64678d3.xcarchive`.
Its app UUID is `BEC1C27D-406F-310D-9072-FC7A0348740E`; app/dSYM parity is
exact. The locally exported App Store IPA is
`.DerivedData-duelwords-testflight/Exports/DuelWordsAV-0.1.0-7-2026-07-30-64678d3-local/DuelWordsAV.ipa`
(41,091,861 bytes; SHA-256
`55082857529db51376cd7ce1cac4e7959b07c49a0604f362004deee43bb9b76b`).
Version/build `0.1.0 (7)`, bundle `com.avalsys.duelwordsav`, team
`935PM55U6R`, the exact `DuelWords AV App Store` profile, Apple Distribution,
production Account AV runtime, privacy manifest, entitlements,
`get-task-allow=false`, and deep signature all passed.

App Store Connect build ID `3cc2bd08-498d-404a-a33e-a26357f489fa` finished
processing as binary `Validado` and `Lista para enviar`, with symbols included,
non-exempt encryption `No`, iPhone and iPad device families, and a 90-day
internal-testing window. It is assigned to the existing internal `avalsys`
group with two testers; there are no external groups or individual testers.
Eight known vendor-framework dSYM warnings remain a third-party symbolication
risk; the application dSYM is present and matches exactly. Sentry upload was
disabled for the archive. No external testing or App Review action ran.

## Remaining risk

- The animation and repaired rematch were accepted on simulators against the
  preview-connected runtime and delivered in TestFlight, but still require the
  owner's signed-device replay from build `0.1.0 (7)`.
- There is no physical iPad acceptance for this source; the processed universal
  binary and the simulator matrix are the current iPhone/iPad evidence.
- Transient overlays intentionally serialize to one visible event; a newer
  higher-priority projection can replace an earlier card without delaying game
  state or moving the board.
- The existing React Doctor advisories in the large Challenge and active-duel
  screens remain structural follow-up; they are not runtime or gate failures.
