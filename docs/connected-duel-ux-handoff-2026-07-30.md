# Connected-duel visual feedback and rematch handoff — 2026-07-30

This record covers the iPhone/iPad connected-duel UX correction that follows
the accepted internal TestFlight build `0.1.0 (5)`. Build `0.1.0 (6)` remains
reserved only. This work did not archive, export, upload, deploy, change a
backend, call a paid provider, or write Infisical.

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

## Remaining risk

- The animation and repaired rematch were accepted on simulators against the
  preview-connected runtime, not a newly uploaded TestFlight binary.
- There is no physical iPad acceptance for this source.
- Transient overlays intentionally serialize to one visible event; a newer
  higher-priority projection can replace an earlier card without delaying game
  state or moving the board.
- The existing React Doctor advisories in the large Challenge and active-duel
  screens remain structural follow-up; they are not runtime or gate failures.
