# Connected-duel visual feedback and rematch handoff — 2026-07-30

This record covers the iPhone/iPad connected-duel UX correction. TestFlight
build `0.1.0 (6)` was uploaded before these source commits and therefore does
not contain this correction. Build `0.1.0 (7)` was archived from exact source
`64678d3`, uploaded, processed, and assigned only to the internal `avalsys`
group on 2026-07-30. The delivery did not submit App Review, enable external
testing, change a backend, call a paid provider, or write Infisical.

A later source follow-up adds the pre-game lobby interruption layer described
below. TestFlight build `0.1.0 (7)` contains the active-duel/reaction feedback
and rematch correction, but it does **not** contain this later lobby feedback;
internal build `0.1.0 (8)` was archived from exact source `0ca2169`, uploaded,
processed, and exposed only to the internal `avalsys` group with two testers on
2026-07-30.

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

The follow-up applies the same event-driven treatment before play. Safe lobby
projections now produce a full-screen, non-interactive interruption when the
rival joins, the rival becomes Ready, the authoritative countdown starts, or
round 1 becomes active. Join and Ready remain visible for at least 3.6 seconds,
countdown for at least 3.2 seconds, and active-round opening for at least 2.2
seconds. The card enters vertically over a dimmed scrim and exits at full size
with a fade; it never shrinks into a hard-to-see thumbnail. iOS haptics reinforce
the transitions, while Reduce Motion keeps the same timed static presentation.

The underlying lobby remains readable after the interruption: its phase is a
large bordered status band, joined/Ready players use thick state-colored rows,
glyphs and explicit chips, and countdown uses an 82-point pressure-colored
number. This persistent hierarchy is important when an app resumes after the
transient event and intentionally exposes only safe display name, side, state,
countdown deadline and active round number.

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

The lobby follow-up used the same dedicated device classes with one freshly
built preview Release app. The iPhone created a real preview room; the iPad
resolved that room code; joining and Ready were applied with the iPad guest
identity against the normal preview Apps API; and the iPhone host updated from
`waiting` to the named joined rival and then to the thick green Ready state
through its realtime subscription without manual refresh. This pass caught the
old `ZoomOut` exit as a tiny late-frame card, removed that transform, lengthened
the presentation, and rebuilt the Release simulator artifact. The deterministic
tests separately cover initial quiet state, join, Ready, countdown priority,
active-round emission, no replay, and minimum visibility durations.

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

The later lobby follow-up passes the complete Vitest suite (82 files / 451
tests), TypeScript, Expo lint, effective preview iOS runtime validation, and
`git diff --check` on Node `22.23.2`. React Doctor changed-scope finishes at
78/100 with no errors and nine non-blocking advisories: compiler-managed manual
memoization, two existing synchronous state projections, the existing large
Challenge component/useState shape, and two async effects whose setters are
already cancellation-guarded.

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

## Lobby-feedback TestFlight delivery

The canonical production archive for the later lobby-feedback follow-up is
`.DerivedData-duelwords-testflight/Archives/DuelWordsAV-0.1.0-8-2026-07-30-0ca2169.xcarchive`,
created from exact public source
`0ca216976c94d0097a2f8f8cbc705ec64f682cef`. Its app UUID is
`C32A3278-E43D-3928-A1F6-9B22807B99BE`; application/dSYM parity is exact. The
locally exported App Store IPA is
`.DerivedData-duelwords-testflight/Exports/DuelWordsAV-0.1.0-8-2026-07-30-0ca2169-local/DuelWordsAV.ipa`
(41,097,292 bytes; SHA-256
`a16a94a40585d83e22fce25847aaef59688ddd35dd50ce281bd6e8c3df9d4f69`).

The clean prebuild and CocoaPods install used Xcode's bundle phase pinned to
Node `22.23.2`. Version/build `0.1.0 (8)`, bundle
`com.avalsys.duelwordsav`, team `935PM55U6R`, the exact `DuelWords AV App
Store` profile, Apple Distribution, production Account AV and DuelWords
runtime, privacy manifest, iPhone/iPad device families, arm64, entitlements,
`get-task-allow=false`, and deep signature all passed. Sentry upload remained
disabled.

App Store Connect build ID `8300a0d6-945c-4eee-bfd0-c6e80174a115` finished
processing as binary `Validado` and `Lista para enviar`. Apple reports symbols
included, non-exempt encryption `No`, iOS minimum `18.0`, iPhone and iPad
support, and a 90-day TestFlight window. The build is assigned to exactly one
group, the internal `avalsys` group with two testers; it has no individual or
external testers. Eight known vendor-framework dSYM upload warnings remain a
third-party symbolication risk, while the application dSYM is present and
matches exactly. No App Review submission, external testing, backend deploy,
production-runtime change, paid provider call, or Infisical write ran.

## Remaining risk

- The active-duel animation, reactions, rematch correction, and stronger lobby
  join/Ready/countdown/start interruptions are now all present in build
  `0.1.0 (8)`, but still require the owner's signed-device replay.
- There is no physical iPad acceptance for this source; the processed universal
  binary and the simulator matrix are the current iPhone/iPad evidence.
- Transient overlays intentionally serialize to one visible event; a newer
  higher-priority projection can replace an earlier card without delaying game
  state or moving the board.
- The existing React Doctor advisories in the large Challenge and active-duel
  screens remain structural follow-up; they are not runtime or gate failures.

## Active-journey navigation recovery follow-up

A later source follow-up closes an iOS navigation-loss defect observed during
an active game. The Challenge route inherited Expo Router's native back gesture;
an edge swipe could pop the route, dispose its component-local controller and
runtime clients, and leave the player on Home with no visible way back.

The route now disables both edge and full-screen back gestures. Its header Back,
active-game Back, lobby Back, and Android hardware Back paths require an
explicit localized abandon confirmation whenever the player owns a live lobby
seat. The completed connected result uses a distinct warning because leaving it
discards the current rematch opportunity or request. Accidental navigation
therefore cannot silently destroy either the journey or its rematch handoff.

As a second recovery layer, the latest participant lobby state is retained only
in process memory while its status is waiting, lobby, countdown, or active. The
snapshot deliberately removes its realtime session before storage. If the
Challenge screen is recreated, it requests a fresh backend-issued realtime
session and reconstructs the active controller; Home exposes a prominent
localized “Return to active duel” action until the journey ends or the player
explicitly abandons it. Invite previews and terminal lobbies are never retained,
and no game/session value is written to device persistence.

The reported rematch delay had a separate concrete cause. Result screens poll a
participant-scoped Apps API endpoint because rematch proposals are intentionally
absent from the safe realtime room projection. The poller previously backed off
from two seconds to five seconds while no request existed, so both request
detection and accepted-game handoff could appear inert. Result-only polling is
now immediate and remains capped at one second. Request and Accept lock on the
first tap and expose prominent sending/accepting/synchronizing progress; sent,
received, and accepted states use a thick highlighted panel, spinner where
applicable, assertive accessibility announcement for received requests, and iOS
haptic confirmation.

The focused regression suites first failed against the inherited gesture,
missing recovery store, unprotected result, and five-second rematch backoff,
then passed with 31 tests. The complete local gate passes 83 Vitest files / 456
tests, TypeScript, changed-file Expo lint, and `git diff --check`.

A fresh preview-connected Release build was installed on dedicated iPhone 17
and iPad Pro 13 simulators after resetting only their disposable DuelWords test
containers to obtain fresh guest quotas. One room completed join, Ready/start,
six `APPLE` submissions per player, final result, one-tap rematch request,
one-tap acceptance, next lobby, and next active round. The host observed the
iPad join in 1.27 seconds including automation overhead; accepted rematch moved
both players to the coordinated next lobby in 1.24 seconds, and one Start tap
opened both next-round keyboards in 1.89 seconds. The rematch request appeared
as a prominent received request on iPad without a second tap. Edge-swipe was
attempted on both devices in lobby, active play, and result without leaving the
route. iPad header Back showed the active-duel warning and the distinct result
warning. A forced alternate navigation to Home exposed “Return to active duel”;
one tap recovered the active keyboard through a fresh realtime session in 1.56
seconds. Recent simulator logs contain no fatal/uncaught/crash signature.

## Navigation-recovery TestFlight delivery

This source follow-up is included in internal TestFlight build `0.1.0 (9)`,
archived from exact public source
`084e67a31e6d61a06006bbeb59ff94610d755f83`. The canonical production archive
is `.DerivedData-duelwords-testflight/Archives/DuelWordsAV-0.1.0-9-2026-07-30-084e67a.xcarchive`.
Its application UUID is `4CAAF6A2-4EA2-3F5F-AD0B-D344C3879F5F`, with exact
application/dSYM parity. The locally exported App Store IPA is
`.DerivedData-duelwords-testflight/Exports/DuelWordsAV-0.1.0-9-2026-07-30-084e67a-local/DuelWordsAV.ipa`
(41,101,919 bytes; SHA-256
`8e779c3585aa14d3664e5ab472db46b7664cc908b0fd0b447747d7369d95d44c`).

The clean Expo prebuild and CocoaPods install used Xcode `26.6`; Xcode's bundle
phase was pinned to Node `22.23.2`. Version/build, bundle/team, production
Account AV and DuelWords runtime, privacy manifest, iPhone/iPad families,
arm64, entitlements, exact `DuelWords AV App Store` profile, Apple Distribution,
`get-task-allow=false`, deep signature, and IPA hash all passed. Sentry is
statically linked or absent as a dynamic framework and its archive-time upload
remained disabled.

Apple accepted the exact archive at 18:09 Europe/Madrid. App Store Connect build
ID `afcb7a01-8e52-42ad-b529-f84c578f5cb5` processed as `VALID`, with non-exempt
encryption `false`, expiry on 2026-10-28, and internal state
`IN_BETA_TESTING`. It is available through the existing automatic internal
`avalsys` group (`hasAccessToAllBuilds=true`) with two testers. External state
remains only `READY_FOR_BETA_SUBMISSION`; no external group, App Review,
backend, production-runtime, paid-provider, Sentry, or Infisical mutation ran.

The remaining acceptance risk is the owner's signed-device replay of active
swipe protection, the two distinct leave warnings, Home recovery, one-tap
rematch, and coordinated next-lobby/start timing. The complete functional
iPhone 17/iPad Pro 13 Release simulator battery described above is the current
source-level evidence; there is still no physical iPad acceptance.
