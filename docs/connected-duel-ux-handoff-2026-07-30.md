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

## 2026-07-31 reaction palette and shared pause source follow-up

The next unreleased source slice expands the active-duel tray to the stable
eight reactions `gg`, `nice`, `close`, `almost`, `your_turn`, `tick_tock`,
`no_pressure`, and `wow`. All eight have distinct emoji and localized labels in
EN/ES/CA/FR/DE. The tray is a 4×2 floating panel: it remains legible on compact
iPhone and stays small in the lower-right corner on iPad without moving the
board or keyboard.

The former local-only mute has become a current-match receive preference in the
safe per-player Convex projection. Both participants observe the preference,
and the server rejects `sendReaction` when the recipient has paused reactions;
a stale or modified client therefore cannot bypass the control. Existing
players and rolling old projections default to receiving. The preference adds
no table or subscription and resets naturally with the next match's player
rows.

Reaction events now include authoritative `roundNumber` and `createdAt`.
Initial subscription, reconnect, and prior-round events stay visually quiet,
while fresh current-round rival reactions retain the existing non-interactive
animated overlay and Reduce Motion fallback. Source validation passes 91 test
files / 503 tests, TypeScript, Expo lint, iOS release config, diff hygiene, and
the 15-test private Convex architecture contract. React Doctor reports no
errors and 20 non-blocking advisories in the existing active/solo screen
structure.

Local native layout acceptance used the dedicated iPhone 17 and iPad Pro 13
simulators with a seven-letter/eight-attempt active demo. It verified the 4×2
palette, distinct labels, local send acknowledgement, and visible pause/resume
state on both sizes. No Convex environment, API, web deployment, TestFlight, or
Infisical state changed. A true two-device assertion that the paused recipient
blocks the rival is intentionally pending the separately authorized preview
Convex deployment of `setReactionPreference`; deterministic client and server
tests already cover that rule.

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

## Web abandonment-confirmation parity

The shared challenge screen originally called React Native `Alert.alert` for
the active-game and result/rematch exit guards. React Native Web implements that
API as a no-op, so the deployed browser could remain on the route without ever
showing the promised warning or offering a confirmed exit. The platform boundary
now preserves the native Alert path and uses browser `window.confirm` on web.
Focused web regressions require cancellation to retain the journey and explicit
confirmation to invoke the destructive exit callback. No backend, runtime
credential, room-state, or persistence contract changes with this parity fix.

## Configurable duel rules follow-up

The next local source candidate adds host-selectable duel rules without changing
Daily, Practice, or Solo Practice: human Challenge and Play Avi can use five,
six, or seven letters with four, six, or eight attempts. Four explained presets
(Classic, Quick, Strategic, and Epic) give both the host and recipient a simple
summary. The host edits the card before creating the room; the joined player
sees the same rules in a locked card, and the completed result identifies that a
rematch keeps those rules. Selection changes use short layout/fade animation,
iOS haptics, accessible radio semantics, and Reduce Motion fallbacks.

Play Avi uses the existing common game-setup route for language, rules, and Avi
difficulty, then starts directly. This intentionally avoids two consecutive
settings screens. Its engine, bot solver, board, target rotation, and bundled
dictionaries all derive their length and attempt count from the validated
rules. Target rotation persists independently by language, mode, and word
length so changing from five to seven letters cannot skip or repeat the other
deck.

The connected backend source is prepared but not deployed. Migration `0076`
expands the D1 dictionary, word, game, and rematch constraints to 5/6/7 while
preserving existing rows; the API validates 5/6/7 on create and copies both
`word_length` and `max_attempts` from the completed game into a rematch. The
deterministic local import contract contains all 15 dictionaries (five
languages × three lengths), 157,017 valid-word rows and 9,000 targets, with
contract SHA-256
`9278ffc4c5be8f3970983c2ce159f842faf0ca3afb9d56857a519421ae303b34`.

Connected 6/7-letter play must remain unshipped until the reviewed migration
and import are applied together to the intended backend and a real two-client
create-to-accepted-rematch smoke passes. No backend, production runtime,
TestFlight, App Store Connect, provider, or Infisical state was changed by this
follow-up. The six- and seven-letter Gaia target decks are source-frequency
ranked with explicit target exclusions but still need deeper human editorial
curation; that is the principal content-quality risk.

Final local verification used Node `22.23.2`. TypeScript and Expo lint pass;
the full public suite passes 87 files / 478 tests; a second deterministic Gaia
generation reports the expected counts for all 15 language/length decks and
leaves diff hygiene clean. React Doctor exits successfully with 29 non-blocking
structural advisories across the changed surfaces (score 73), with no runtime
gate failure. The private Apps API suite passes
39 files / 554 tests, its focused configurable-rule suites pass 42 tests, and
the in-memory migration/import replay passes its foreign-key and exact-count
assertions.

Fresh development-bundle evidence on dedicated iPhone 17 (dark) and iPad Pro 13
(light) simulators confirms one unified Play Avi setup, readable preset/help
copy, adaptive controls, and direct entry into an Epic 7-column / 8-round board
on both device classes. The recipient-side rules card is sourced from the safe
invite/lobby projection and is non-editable. A connected iPhone↔iPad 6/7-letter
smoke remains deliberately blocked on the undeployed backend migration/import.

## Interface-language and corpus follow-up

The public fallback screens now use the same canonical English-key catalog as
the shared Apple surfaces. Settings, Account, Pro, authentication, account
deletion, product splash, not-found, local lobby/result, and local Daily/Solo
fallbacks no longer carry independent raw English JSX. The generated catalog
contains 193 keys with complete EN/ES/CA/FR/DE maps. Tests enforce source drift,
equal non-empty key sets, format-placeholder and legal-link parity, absence of
implementation vocabulary, and a public JSX literal-copy contract. Known
account-deletion service labels are localized when they match the catalog;
unknown future service text remains visible instead of being discarded.
Safe result/share summaries are also localized instead of retaining an English
fallback for Catalan, French, or German game sessions.

Fresh simulator acceptance covered English plus the complete Spanish, Catalan,
French, and German setup/rule copy across a dark compact iPhone and a light
adaptive iPad. The longest French and German labels wrap without clipping, and
direct 7-letter / 8-attempt Play Avi starts render a complete localized board
and keyboard at both sizes. The interface locale and game language remain
separate by design: changing the word language does not silently change app
navigation or help text.

The English source review also removed the obsolete claim that every duel is
fixed to five letters and aligned the legacy result/rematch preview with the
configurable rule model. Local rematches now preserve language, word length,
and attempts through proposal, acceptance, and the next active handoff, while
both roles see the same localized rule explanation.

The five-letter EN and ES valid-guess lists are now deterministic unions of the
reviewed bases and every eligible pinned Gaia row: EN grows from 8,734 to 9,354
and ES from 7,571 to 8,365. Their existing 750 target decks are preserved. CA,
FR, and DE already contained every eligible Gaia row, and all 6/7 lists remain
complete under that same pinned-source policy. “Complete” means every eligible
entry from the documented, licensed inputs after normalization, not every word
that may exist in a living language. The unresolved editorial risk remains the
6/7 target decks, which are frequency-filtered but not yet reviewed word by
word.

## Configurable-rules backend activation

The connected backend gate closed after public feature source `ed87ede` and
private rollout source through `f45499b2` were pushed. Preview and production
each applied migration `0076` and imported immutable dictionary release
`gaia-5-7-20260730-002` once. Production now has exactly one active version for
each EN/ES/CA/FR/DE × 5/6/7 pair, 157,017 release word rows, 9,000 targets, and
zero foreign-key violations. Historical five-letter versions are retired, not
deleted, so existing games retain their immutable dictionary references.

Production Worker `5be6b490-7da0-4f3c-8a0a-80f36544056c` serves 100% of
traffic. Ordered six- and seven-letter lifecycle smokes passed create, join,
Ready/start, synchronized round progression, result, rematch request/
acceptance, rule-preserving next lobby, and next start. The protected Worker
tail saw 40 scoped requests, all HTTP 200/outcome `ok`, with no exception or
log. Convex was not redeployed because its existing safe projection already
accepts numeric length and attempt values.

Public commit `345abac` reserves internal iOS build `0.1.0 (10)` and aligns the
canonical archive/export gates. The exact production candidate was archived
from public documentation head `a89dec1`, whose application source is unchanged
from the configurable-duel feature and build-reservation commits.

The canonical archive is
`.DerivedData-duelwords-testflight/Archives/DuelWordsAV-0.1.0-10-2026-07-30-a89dec1.xcarchive`.
It reports version/build `0.1.0 (10)`, bundle
`com.avalsys.duelwordsav`, team `935PM55U6R`, arm64 application UUID
`5A75B8A8-1407-38D2-894A-5E118EC6C567`, and exact application/dSYM parity.
Production Account AV/runtime configuration, both Associated Domains,
entitlements, privacy manifest, the exact `DuelWords AV App Store` profile,
Apple Distribution signing, `get-task-allow=false`, deep signature, and a
non-interactive framework signing smoke all passed. Sentry is statically linked
or absent as a dynamic framework and remote symbol upload remained disabled.

The local App Store export is
`.DerivedData-duelwords-testflight/Exports/DuelWordsAV-0.1.0-10-2026-07-30-a89dec1-local/DuelWordsAV.ipa`
(41,945,233 bytes; SHA-256
`686730fec04aee028c16bf8c76b010b4772aeac16b8d3893a9180146242d93cd`).
It embeds provisioning profile `DuelWords AV App Store`, UUID
`ed7d3672-dd55-4995-840f-00307dcfeb44`.

The canonical Xcode App Store upload completed at 21:48 Europe/Madrid on
2026-07-30 with `Upload succeeded`, `Uploaded DuelWordsAV`, and
`EXPORT SUCCEEDED`. Apple's delivery build ID is
`30880a8a-8767-4a47-800d-b0a8805d61fb`. An authenticated App Store Connect
readback then confirmed build 10 under version `0.1.0`, state `Lista para
enviar`, upload time 21:49, expiry in 90 days, and assignment to the internal
`avalsys` group with two invitations. No external group, App Review submission,
production runtime, paid provider, Sentry, or Infisical mutation ran during
this delivery.

Xcode again warned that eight vendor frameworks do not include matching dSYMs:
ExpoImage, React, ReactNativeDependencies, SDWebImage,
SDWebImageAVIFCoder, SDWebImageSVGCoder, SDWebImageWebPCoder, and hermesvm.
These warnings did not block upload and application/dSYM parity is exact, but
stack frames inside those vendor binaries retain the previously recorded
symbolication risk. The other remaining product risk is editorial: the 6/7
target decks are deterministic and frequency-filtered but have not been
reviewed word by word.

## Standardized curated solution decks

The next source candidate separates broad accepted guesses from authoritative
editorial solution decks. Every EN/ES/CA/FR/DE × 5/6/7 combination now has
exactly 750 solutions: 2,250 per language and 11,250 total, while the accepted
guess total remains 157,017. The checked-in decks prioritize common nouns and
adjectives and exclude known proper names, verbal forms, profanity, slurs, and
poor-fit sensitive terms. Gaia remains the accepted-word/frequency source;
WordNet-family lexical data supplies part-of-speech evidence.

The generator now reads `src/game/dictionaries/curated-targets/`, rejects any
entry that is not an exact eligible Gaia row or appears in the explicit
exclusion set, and embeds the deck path and SHA-256 into each generated asset.
`curated-targets.test.ts` prevents generated/editorial drift, while the local
fixture suite holds representative conjugation/name regressions. Full policy,
source hashes, and licenses are in `docs/dictionary-solution-policy.md` and
`THIRD_PARTY_NOTICES.md`.

The matching private immutable D1 import candidate is
`curated-5-7-20260730-003`: 15 versions, 157,017 word rows, 11,250 targets, and
contract SHA-256
`fb4c23234615a6597d160f094874aa39b2e799bc4905d6816e818e106f4eac6c`.
It passed local in-memory migration/import verification but has not been
applied to preview or production. Production therefore correctly remains on
the previously activated 9,000-target release until a separate deploy
preflight, explicit authorization, ordered import verification, and lifecycle
smoke.

## Web physical-keyboard parity

The shared on-screen keyboard remains the visual and touch target on every
platform. Web additionally subscribes to physical `keydown` events while that
keyboard is mounted and enabled. Supported game letters, Enter, and
Backspace/Delete forward through the same `onKeyPress` contract as touch input.
Modified shortcuts, key-repeat events, unsupported letters, and events originating
inside editable form controls are ignored so browser and accessibility behavior
remain intact.

## Configurable active-board propagation correction

Internal TestFlight build `0.1.0 (10)` and the matching production web client
expose a client-side rendering defect for connected non-default rules. A room
created as Epic correctly retains seven letters and eight attempts in the
backend, invite, and lobby, but the active screen displays a five-column,
six-row board on both iOS and web. This does not prove a backend rule or
dictionary failure; the wrong dimensions are introduced after the active
handoff.

The root cause was a fixed-size initial view model. The active runtime
assembler discarded the handoff's `wordLength` and `maxAttempts`, while the row
factory and mock safe-game projection reused the five-letter/six-attempt engine
constants. Current source passes both values into every connected, local-mock,
fallback, row-replacement, feedback-reveal, timeout, and next-round path. The
opponent marker count follows the same configured attempt count.

The regression is locked at two levels: the connected controller assembler
must produce a 7-column/8-row board before any realtime update arrives, and the
active model must retain all seven letters of `ANOTHER` through submission and
round eight. The complete suite passes 88 files / 482 tests, with TypeScript,
Expo lint, React Doctor changed-scope (100/100), iOS release configuration, and
diff hygiene also green.

Local visual acceptance used the direct Epic active route. Web at a compact
mobile viewport renders seven columns and eight rows without horizontal
overflow and accepts/submits all seven letters. One universal development
binary then rendered the same complete board on a dark iPhone 17 simulator and
a light iPad Pro 13 simulator.

## Corrected web release and build 11 reservation

The environment-neutral artifact built from exact public commit `865e7a0` has
SHA-256 `f85bf9a8de0d41b164fd888fa6010396b0e616096202f03f3ec5789224b2ff46`
and bundle `entry-3b02cefd6cc8c6cb809a25f392b3a97b.js`. Preview Worker version
`9e3a713f-baa0-4d7c-9a18-81e3ef8e9304` passed a compact-viewport,
production-shape smoke: an Epic room showed `7 letters · 8 attempts`,
host-selected rules were locked in the lobby, and the document had no
horizontal overflow. The same artifact was then promoted without a rebuild to
production Worker version `37360667-8728-492f-85b3-b967585883eb`; the
production route returned HTTP 200 and referenced the expected bundle.

Internal iOS build `0.1.0 (11)` is the first uploaded TestFlight candidate
containing this correction. It was archived from exact public source
`ea2ddfdfaab50ea8d5488a7f1d0d886ef4372acc` with Xcode 26.6 and production
runtime. Archive verification passed version/build, bundle/team, arm64,
Account AV, privacy, entitlements, and exact application/dSYM UUID
`D22F003A-B459-3097-9854-64653A6BC457`.

The local App Store IPA is
`.DerivedData-duelwords-testflight/Exports/DuelWordsAV-0.1.0-11-2026-07-30-ea2ddfd-local/DuelWordsAV.ipa`
(41,945,867 bytes; SHA-256
`38960438156a0ddebd01f0c8eb6b358d8fc49084ffae7e9949a68c60016127f8`).
It uses the manual `DuelWords AV App Store` profile
`ed7d3672-dd55-4995-840f-00307dcfeb44` and Apple Distribution team
`935PM55U6R`.

The canonical Xcode upload completed at 23:14:35 CEST on 2026-07-30 with
`Upload succeeded`, `Uploaded DuelWordsAV`, and `EXPORT SUCCEEDED`. Apple
reported that the package had begun processing. The same eight known missing
vendor-framework dSYM warnings remain for ExpoImage, React,
ReactNativeDependencies, SDWebImage and its AVIF/SVG/WebP coders, and hermesvm;
application/dSYM parity is exact. App Store Connect processing and assignment
only to the internal `avalsys` group still require readback before build 11 is
called test-ready. No external testing, App Review, backend, Convex, D1,
Infisical, paid-provider, or Sentry mutation accompanied this delivery.

## Reaction preference rollout and build 12 — 2026-07-31

Public feature source `4169170a8e005f362b53902f0c5a5e4495ec0eed`
adds the compact invalid-word status, eight localized reactions, an adaptive
4-by-2 picker, animated opponent-reaction feedback, and a shared reaction
preference. Private source `c286f7c6fa997d8cc1fb2ad7b5ec6fb78887d973`
adds the migration-safe projection fields and enforces the recipient's
preference in the Convex mutation. The public gate passed 91 files / 503 tests,
TypeScript, Expo lint, iOS release configuration, and diff hygiene.

The Convex development deployment `graceful-ibis-609` received the reviewed
private bundle with crons disabled and no index deletion. A production-shaped
Release simulator build from public feature source then completed two connected
English five-letter duels across a narrow iPhone and an iPad. The first game
used iPhone host / iPad rival; the accepted rematch swapped the host role. Both
directions proved that pausing reactions removes the rival's send control and
that resuming restores it. The picker exposed exactly eight reactions, received
feedback animated above the board without displacing input, both finals opened,
and the accepted rematch reached its new lobby and active game without repeated
button presses. The iPad result Back action showed a leave confirmation and an
edge swipe did not discard the result. Captured runtime logs contained no
sensitive markers or fatal/crash markers. Background/reconnect grace and an
approved Sentry no-spoiler event remain deferred, so this is a conditional
connected acceptance rather than the complete DW-012 matrix.

The environment-neutral web artifact from the same feature source has SHA-256
`5bca4a9cfd9d3409825c52473c7a87f42fc76e708d793ce02ee0de884c0d4667`
and bundle `entry-267e4d975dc5ea59f998faf935855e86.js`. Preview Worker
version `dbf9484e-5a9d-4581-b17a-4ebc65d4174b` passed 5/6/7 rule selection,
a selected seven-letter summary, 390-by-844 no-overflow, exact bundle, and
zero console errors. The identical bytes became production Worker version
`33a03a13-7d70-43a3-ba58-dafeecaa1781`; production returned HTTP 200 and its
downloaded bundle matched the local bundle SHA-256 exactly.

Public release commit `53e01dd79934c44f223c31b2d6bb14e72cf6f4b7`
reserves internal iOS build `0.1.0 (12)`. Xcode 26.6 archived it with the
production runtime. Version/build, bundle/team, arm64, Account AV, privacy,
entitlements, Distribution signature, and exact app/dSYM UUID
`B0EE6C99-8876-398E-AEFC-DA2AD1B1F38D` passed. The verified IPA is 41,981,908
bytes with SHA-256
`c12e423195271e6845e8542ad311161037571bb57ff233c5169a32491318b360`.
Apple accepted the Xcode upload at 10:23:13 CEST on 2026-07-31 with all three
success markers. The same eight known vendor-framework dSYM warnings remain;
application/dSYM parity is exact.

After explicit authorization, the reviewed private Convex bundle was deployed
to production `blissful-shark-434` with crons disabled and no index deletion.
A bounded production flow used two guest clients and real backend timestamps;
it proved the shared mute projection, rejection of a blocked sender with
`opponent_reactions_disabled`, resume, reaction delivery, timeout/open-next,
accepted rematch, and the next lobby. Production shared-mute parity is closed
without an API, D1, dictionary, or client redeploy.

Do not call build 12 test-ready yet. App Store Connect processing and the
internal-only group still require authenticated readback; the available browser
session redirected to Apple's unauthenticated login. No invite/AASA, DNS, App
Review, external testing, Sentry, paid-provider, or Infisical mutation
accompanied this Convex closure.

## Persistent tablet brand and truthful web settings — 2026-07-31

The left navigation now keeps the DuelWords wordmark on Home, Rivals, Stats,
Avi, Settings, and Account in both wide web layouts and iPad. The initial Swift
condition that limited the header to Home was only part of the defect: a clean
Release simulator replay showed that a SwiftUI sidebar replacement could still
drop the brand during the immediate route transition. The native bridge now
publishes prop changes through one observable render model instead of replacing
the hosting controller's root view. The iPad wordmark itself is rendered as a
persistent React overlay above a fixed 56-point slot in the native sidebar, so
selection updates cannot remove or shift it. Web uses the same stable React
wordmark on every wide route.

Web Settings now omits Haptics and says that interface language and appearance
remain in the browser. The previous web switch could only store a preference;
the browser implementation does not provide the physical iOS haptic feedback
described by the UI. Native Settings remains unchanged and exposes Haptics on
both iPhone and iPad. The new browser-only explanation is complete in
EN/ES/CA/FR/DE.

Focused source contracts passed 17 tests and TypeScript. A clean preview-shaped
Release build with embedded JavaScript compiled and launched on iPad Pro 13.
Fresh screenshots proved the wordmark present on Home, still present in the
first frame after Home to Rivals, and present on Settings; Settings exposed the
native Haptics switch. The same universal binary launched on iPhone 17 with the
floating footer intact and native Haptics visible. Local web Browser QA proved
one accessible DuelWords logo on Home, Rivals, and Settings, zero Haptics copy
on web, the browser-specific settings explanation, and zero console warnings or
errors. The in-app-browser screenshot renderer tiled the wide frame, so DOM,
route, locator, and console evidence—not the tiled bitmap—is authoritative.

Internal build `0.1.0 (13)` is reserved for this client-only correction. The
release must use the canonical production archive, archive validation, local
App Store export, Distribution-signature check, and Xcode upload path. No API,
Convex, D1, dictionary, invite/AASA, DNS, or paid-provider change is needed.
