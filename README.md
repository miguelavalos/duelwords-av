# DuelWords AV

Expo client for the playable DuelWords AV experience on web, iPhone, and iPad.

Future game/interface language additions must follow the client-safe
[language expansion guide](docs/game-language-expansion.md) together with the
mandatory private cross-stack runbook. The checklist covers dictionary
provenance, local modes, interface copy, API/D1/Convex parity, full rematch
smokes, observability, and rollback.

## Current Status

Current as of 2026-08-01: the current processed internal iOS checkpoint is
`1.0.0 (16)` from exact release commit
`437a6a52b506090f752b0dfef590fed71f74d346`. Apple reports build id
`c2528485-55b4-4a2e-8860-724212e09a6e` as `VALID`, encryption exempt,
unexpired through 2026-10-29, and `IN_BETA_TESTING` only through the automatic
internal `avalsys` group. This candidate preserves the complete V1 purchase
surface but no longer treats a StoreKit transaction as active Pro until
RevenueCat returns the configured active `pro` entitlement. Builds 7–15 are
immutable historical checkpoints and are not the current acceptance target.
Its physical Sandbox purchase, second-device hydration, cancellation, and
expiry safety pass. An expired Restore exposed misleading anti-repurchase copy
in build 16; current source distinguishes “no active subscription” from a
post-purchase entitlement failure. The corrected replacement is reserved as
`1.0.0 (17)` from exact release commit
`b9223116090ba01a88bea530bcebfd65954bc939`. Its canonical archive and
Distribution IPA passed every local release gate, and Apple accepted the
TestFlight upload at 08:35 CEST on 2026-08-01. Build 16 remains the last
processed binary until Apple finishes processing that successor.

The current client includes configurable 5/6/7-letter human Challenge and
Play Avi, eight localized reactions, animated receipt, compact invalid-word
feedback, server-enforced recipient mute, prominent lobby synchronization,
protected active/result navigation, bounded rematch discovery, fresh realtime
session recovery, and physical-keyboard input on web. Production Convex
`blissful-shark-434` contains the matching reaction-preference contract; the
bounded two-client production smoke passed mute, blocked send, resume,
reaction, timeout/open-next, accepted rematch, and next lobby.

The current source also keeps the tablet/desktop left navigation visually
stable on every Home, Rivals, Stats, Avi, Settings, and Account route. On iPad the logo
is now a persistent React overlay above a fixed Swift sidebar slot, so native
surface-prop updates cannot make the brand disappear during a route change;
the shared SwiftUI host also updates an observable model instead of replacing
its entire root hierarchy. Web retains the same wordmark on every route. The
web Settings screen no longer offers a misleading Haptics switch because
browser vibration is not part of the product contract; iPhone and iPad keep
their real native Haptics setting. The exact client-only correction shipped
from public commit `18f543e`: web preview and production received one identical
artifact. Preview Worker `b76242fb-0367-448d-a931-b8f64bde1776` and production
Worker `55e36bdf-f6cc-4831-80dd-a10fd05d50bb` serve the same stamped bytes.
Internal build 16 passed canonical Production archive, Distribution export,
upload, processing, and internal-group readback, but remains an immutable
pre-review checkpoint rather than the final candidate.
No API, Convex, D1, dictionary, or invite change was required.
Historical build progression and release evidence remain in
[the connected-duel UX handoff](docs/connected-duel-ux-handoff-2026-07-30.md)
and [the earlier TestFlight handoff](docs/testflight-handoff-2026-07-29.md).
**Challenge a Friend**
is linked from Play and opens `/word-duel/challenge`. With the safe runtime
enabled, that route can create a room-scoped guest, create or review an invite
without auto-joining, join explicitly, Ready, start, play connected rounds,
recover the finalized result, share a no-spoiler summary, and create or answer
a participant-scoped rematch. Room-code lookup and canonical invite-token
parsing are included. With runtime disabled—the repository default—the same
surface fails closed and performs no network calls.

The same product is now prepared as an environment-neutral static web artifact
for `play.duelwords-av-preview.avalsys.com` and
`play.duelwords-av.avalsys.com`. It retains responsive phone/tablet/desktop
layouts, guest local modes, connected Challenge, and full browser Account AV
sign-in while keeping Pro non-purchasing on web. Commercial/legal pages remain
at the existing `duelwords-av` hosts and AASA/invitation handoff remains at the
existing `app.duelwords-av` hosts. See the
[web application deployment contract](docs/web-app-deployment.md).

The public Play catalog contains Challenge a Friend, Play Avi, offline
Practice, and official Daily.
Home presents them in product order: official Daily first, Challenge a Friend
second, Play Avi and Practice as secondary modes, and compact Avi help last.
Advertising is excluded from V1. The native and web clients contain no Google
Mobile Ads SDK, UMP consent runtime, ad configuration, ad placement, reserved
ad layout, or Pro no-ads promise. See the executable
[V1 advertising exclusion](docs/advertising-and-consent.md).
Practice, Solo Practice, and deterministic Play Avi use bundled
EN/ES/CA/FR/DE dictionaries and make no word-list request. Native word
acceptance and non-Daily local target selection stay on-device; the app must
never download an allowed-word list per round. Daily is the only mode allowed
to fetch its selected word before play: it does so at most once per uncached
local date, time zone, and game language, then keeps the board, guesses,
result, resume state, and participation streak on the device. It has no
Convex state, polling, heartbeat, per-guess request, account identifier, or
automatic fetch on render. A saved Daily resumes offline; without a saved
target it fails closed instead of substituting a local word. The production
Daily endpoint and audited D1 assignment store are active for EN/ES/CA/FR/DE;
one bounded rollout check per language passed, and routine health checks must
not request another target matrix. Challenge remains
server-arbitrated for fairness. The release candidate and live production
API/D1/Convex backend now support EN/ES/CA/FR/DE end to end after one bounded
production lifecycle smoke passed for each newly enabled language. The client
does not fetch its target during gameplay; it receives only the authorized
reveal in the finalized result. Lobby, active-duel, result,
Solo/Daily demo, Play Avi demo, and connected-runtime engineering previews remain
available by direct internal route when they are not linked from Play.

Interface language (EN/ES/CA/FR/DE) and appearance (system/light/dark) are
versioned local preferences. On first launch, interface and game language both
use the device/browser's primary supported language, or English when it is not
supported; that initial choice is persisted and later manual choices always
win. See the [initial app language contract](docs/initial-app-language.md).
Web uses browser
`localStorage`; native uses Expo SQLite's `localStorage` compatibility layer.
The Home screen deliberately has no word-language selector. Word language is
selected from a compact, accessible Game settings picker inside Challenge,
Practice, Solo/Daily, or Play Avi; it applies only to that game and Challenge
locks it when the room is created. Local modes and connected Challenge offer
EN/ES/CA/FR/DE. Matching API/D1 dictionaries, validators, and rematch
constraints are deployed; signed physical iPhone+iPad acceptance remains
open after the internal TestFlight delivery.
The picker is list-based rather than a segmented control so all choices remain
clear on phones and iPads. The shell, Settings, and public
challenge/lobby/game/result/rematch path react to their applicable choices.
English, Spanish, Catalan, French, and German each
cover the complete public challenge/lobby/game/result/rematch journey; module
initialization fails in tests if a locale omits a public-journey key.

Stats and Rivals are functional, private device features. A bounded store keeps
at most 100 completed summaries with mode, language, outcome, attempts, date,
and an optional safe opponent display name for human duels. It never stores a
target, guess, feedback row, raw game/player identifier, invite token, email,
or provider subject. Stats combines those summaries with the existing local
Official Daily record; Rivals derives at most 20 recent human opponents. Both
work for guests, remain on this device, and do not claim account sync, public
profiles, contact search, or presence.

The native shell now includes the canonical DuelWords icon, the promoted
engraved light/dark logo and wordmark family, a paper-and-ink branded splash
without Tune-specific music cues, onboarding
with guest skip, the canonical Tune AV Account AV provider sheet, Account,
Settings, an adaptive Apps AV footer/sidebar with Avi, and the native
DuelWords Pro StoreKit purchase, restore, redemption, and management surface.
The identity boundary is strict: game boards,
mode copy, icon, wordmark, lockup, and editorial artwork may express the
DuelWords paper-and-ink product; common splash/onboarding mechanics, auth,
header controls, footer/sidebar, Settings, Account, paywall, deletion, legal,
support, spacing, state grammar, and colors use the shared Apps AV components
and canonical `AVBrandPalette.standard`, exactly as Tune AV does. Account and
Pro unavailable states use product language rather than deployment terminology.
Opening a new invite while the Challenge screen is already mounted replaces the
previous invite instead of reusing stale room state, and guests receive a local
editable room alias by default.

The 2026-07-26 physical production login now completes and restores the
internal Account AV identity. Its first Challenge capture exposed a separate
presentation defect: an authenticated user without an Account AV display name
was still shown with a random `Guest` alias, a guest-only eyebrow, and an
English helper inside a Catalan screen. The current source derives an
account-scoped, localized player label without exposing email/provider data,
localizes the Challenge title and helper in all five interface languages, and
uses the shorter in-game language label so it does not truncate on iPhone.
Deterministic signed-in iPhone captures pass in both light and dark appearance.
The separate production realtime gate was subsequently approved and validated
with a complete controlled human-duel smoke, so current production native
config enables connected Challenge.

Navigation now follows the same common-versus-product boundary as Tune AV.
Home, Account, Settings, Avi, Rivals, and Stats are shell destinations: they
retain the shared phone header/footer or adaptive iPad sidebar and never render
a top-left Back control. Account and Settings replace one another inside that
common shell instead of building an interior navigation stack. DuelWords-only
flows such as Daily, Practice, Play Avi, Challenge, results, Pro, deletion, and
engineering previews keep the icon-only 44-point Back control. Every game route
opened from Home explicitly enters from right to left and exits with the inverse
transition. iPhone active-game screens hide the footer and keep the board and
full keyboard ahead of secondary information. Official Daily reduces its
active header to Back, mode/language/attempts, and an information toggle; date,
language detail, and local-privacy copy expand only on request.

Home, Settings, and Account now follow Tune AV's common-screen ordering as
well as its shared shell. Home puts Avi's brief directly below the title.
Settings begins with one compact App preferences card (app language,
appearance, and native haptics where supported); web intentionally omits the
haptics control. On-device data and help/legal follow; Account and
Pro no longer appear as duplicate Settings destinations. Account orders the
identity summary, product access, continuity, and signed-in-only safety, and a
guest has one canonical `Connect Account AV` entry into the Apple/Google
provider sheet. Both size classes use the same hierarchy; iPad adapts it to the
shared utility sidebar.

The native Settings version row reads `CFBundleShortVersionString` and
`CFBundleVersion` from the installed app instead of hard-coding a candidate,
so every installed build reports its exact identity.
The React fallback and the shared Apple surface both describe the complete
bundled EN/ES/CA/FR/DE word-list set.

The iPhone footer embeds the same Apps AV SwiftUI tab capsule and separate Avi
control used by Tune AV, through the shared package's footer-only `floating`
configuration. Its surrounding host is transparent, so DuelWords content
remains visible beneath the native material instead of ending in an opaque
footer block. The full Tune scaffold keeps its existing backdrop behavior,
while iPad continues to use the shared persistent sidebar.

On 2026-07-24 an enabled preview run on dedicated iPhone 17 and iPad Pro 13
simulators proved create/review/join, event-driven lobby synchronization,
foreground presence, Ready/countdown, active boards on both devices, accepted
word submission, and the next-round transition. The pass removed a 1.5-second
lobby polling loop, preserved backend-issued realtime sessions across explicit
lobby refreshes, allowed the safe Convex pre-round projection (`roundNumber: 0`),
and began presence heartbeats while participants are still in the lobby. The
repository-owned preview flow smoke also passed timeout/open-next, rematch, and
both passive-abandonment paths. Canonical web `/i/c/:token` edge handling, the
matching native route, AASA, and Associated Domains are implemented and
deployed. The neutral fallback also offers the matching playable web route
without reading challenge state. Fresh signed physical Universal Link
acceptance, physical replacement-build validation on iPhone/iPad, and a
replacement TestFlight build remain open; local Simulator signing is already
covered separately below.

The current branding pass reviewed every public/common and gameplay surface on
dedicated iPhone and iPad simulators, including light/dark Home, the Tune-style
footer/sidebar, onboarding, Account, Settings, auth entry, Pro, deletion,
Practice, Play Avi, and Challenge. A final side-by-side pass also ran Tune AV in
its own iPhone 17 simulator and checked each shared surface individually. The
onboarding/auth pass translates the shared Apps AV metrics directly: centered
brand and hero copy, inset 30-point-radius panel, drag-to-dismiss behavior,
Apple then Google provider order, guest skip, legal copy, and the canonical
`AviV2LoginSheetPeek` artwork. Account entry reuses the same expanded
onboarding experience rather than opening a generic Clerk form.
DuelWords now uses the same shared hierarchy: Settings at the left of the
centered product wordmark, Account at the right, a three-destination phone
footer pill with Avi in its own circular control, persistent shell navigation
on Account and Settings, and sheet-style Pro/auth/deletion surfaces without
repeating the product lockup inside their content. iPad adapts the same
destinations to its persistent sidebar. The executable shared-surface contract
now fails if splash, onboarding/auth, footer/sidebar, Settings, Account, Pro, or
account deletion stops routing through the Apps AV native bridge; it also locks
the common foundation imports, canonical palette, floating footer, Avi assets,
and hidden duplicate Account/Settings tabs. Earlier deterministic checks covered all 18
exported web routes at desktop and narrow mobile widths and the current
public/game-preview surfaces in an Android Pixel 9 AVD.
Light/dark appearance, status and navigation bars, keyboard/board fit, the
native not-found route, browser keyboard focus, EN/ES/FR/DE narrow layouts, and
Android font scales through 150% were reviewed. This is local Expo Go, web, and
signed-to-run-locally Simulator evidence; it is not physical-device or
store-release evidence. The fresh Release build verified the replacement
native launch mark and bundled product onboarding on the dedicated iPhone 17.

On 2026-07-24 a second dedicated native pass exercised the branded Home and
common surfaces, Challenge and Daily fail-closed states, English and Spanish
Practice submissions, and a complete Play Avi round transition on iPhone 17
and iPad Pro 13. It removed a deprecated non-interactive-layer prop that showed
an Expo warning over the footer, compacted Play Avi so all keyboard rows remain
visible on iPhone, and localized its controls and state labels to the selected
interface language. The word-language selector remains only inside each game.
Light/dark appearance and extra-extra-large iPhone text were also checked and
restored to normal simulator settings after the pass.

On 2026-07-25 the shared-Apple integration was rebuilt from a fresh Expo
prebuild against the development identity. The resulting iPhone simulator
binary linked Apps AV, Expo Glass, Account AV/Clerk, and Sentry, embedded the
required Account AV client configuration without exposing it, and passed a
light/dark visual footer review. Accessibility-driven taps confirmed Home,
Rivals, Stats, and Avi remain reachable through the floating footer.

On 2026-07-26 the current preview-configured Release source was rebuilt with
normal Simulator ad-hoc signing and installed from scratch on the dedicated
iPhone 17 and iPad Pro 13. DuelWords and Tune AV were run side by side: their
collapsed onboarding and expanded Apple/Google provider sheet use the same
shared geometry, provider order, Avi treatment, guest skip, and legal layout.
Home, transparent floating footer, iPad sidebar, Settings, guest Account,
Pro, and delete-account also passed direct interaction. English Practice
accepted a bundled valid word; Play Avi accepted and resolved a valid bundled
word in each of EN/ES/CA/FR/DE, advanced the round automatically, and showed
only aggregate opponent clues. Changing the in-game language reset the local
duel correctly. That dated build kept connected Challenge limited to EN/ES. An
earlier unsigned compile-only install correctly failed Clerk keychain
access with OSStatus `-34018`; it is not valid auth evidence. Account AV became
available and the provider sheet opened normally after the exact same app was
signed to run locally, with no source patch or configuration change.

On 2026-07-27 the first interior-navigation contract was rebuilt and exercised
on the dedicated iPhone 17 and iPad Pro 13. That dated pass put the icon-only,
44-point Back control on Account and Settings as well as product screens. The
owner's 2026-07-28 side-by-side Tune AV review supersedes that common-screen
decision: Account, Settings, and footer destinations now remain in the shared
shell without Back, while DuelWords-specific routes retain `header.back`. Daily
still exposes secondary explanation behind its information button so the board
and keyboard remain primary. React and shared-Apple contract tests cover the
current boundary even when the ignored generated `ios/` tree is absent from a
clean checkout.

The same local candidate now resolves Avi's deterministic response
automatically after the scheduled thinking delay; the former manual
`Avi submits` development control is not part of the player experience. Avi's
attempt strip never reveals its word or letters. Each completed attempt exposes
only two aggregate counts: letters that belong to the target (including exact
matches) and the subset already in the correct position. The compact iPhone
keyboard also fills the dead space between keys, clamps rapid input inside the
atomic five-letter state update, and treats the native keyboard as one gesture
surface so overlapping fast taps cannot compete across independent responders.
A 75 ms guard removes only iOS's replay of the same touch/key identity while
distinct repeated letters remain valid. Board glyphs have explicit centered
width so Fabric cannot visually collapse a narrow `I`; native accessibility
activation remains explicit. Simulator acceptance covers rapid `RAISE` and
repeated-letter `APPLE` sequences.

On 2026-07-28 Office Openspace rebuilt public source `f9fc5ff` as a clean,
production-configured universal Release simulator artifact with Xcode 26.6 and
iOS 26.5. Dedicated iPhone and iPad simulators passed onboarding/guest skip,
the adaptive Home shell, Settings, guest Account, Official Daily, Practice,
Play Avi, and a live production guest Challenge. iPhone Practice accepted rapid
`RAISE`, then preserved both `P` inputs in `APPLE`; Delete, re-entry, and Enter
advanced the board. iPad repeated the `APPLE` acceptance through its persistent
sidebar layout. Official Daily made one explicit target request, accepted a
local guess, and restored its `1/6` board after process termination and relaunch.
Play Avi moved from submitted/thinking to clues-ready round `2/6`. The two
simulators created and joined one guest room, locked both Ready actions,
submitted `RAISE` and `APPLE`, revealed feedback, and opened round `2/6`.

That connected pass reproduced one client-only race: a late timeout rejection
could replace the correct next-round status with `Could not close timed-out
round` after gameplay had already advanced. `f9fc5ff` now ignores timeout
results that belong to a resolved or superseded round and includes a permanent
view-model regression. The full gate passes 71 test files / 366 tests,
TypeScript, Expo lint, SDK dependency alignment, and diff hygiene. React Doctor
0.9.2 reports zero issues in the current changed scope (100/100); its full scan
retains 73 pre-existing structural warnings (65/100).
No backend deploy, Cloudflare/Convex/Account AV/Sentry mutation, Infisical
write, TestFlight upload, or purchase ran. The physical iPhone was unavailable
and no physical iPad exists, so the post-fix device install was not claimed.

The follow-up restored the existing Apple team in Xcode and regenerated the
already-owned `DuelWords AV App Store` profile against the installed Apple
Distribution identity expiring 2027-06-08. The first signed retry exposed an
ignored `.xcode.env.local` path into a retired Homebrew Cellar. Public
`bd936f4` makes the canonical helper regenerate production runtime config,
refresh `NODE_BINARY`, and then check the effective configuration before
archiving; a permanent release-workflow regression covers that order and path.

Office Openspace rebuilt clean public source `bd936f4` as RC8. The canonical
archive passes version/build `0.1.0 (2)`, bundle `com.avalsys.duelwordsav`, team
`935PM55U6R`, arm64 app/dSYM UUID
`9692B671-438D-3DB8-9720-A68F84239BA1`, production Account AV/runtime config,
privacy manifest, entitlements, and deep signature validation. A local
App Store export then produced a 34,925,228-byte `DuelWordsAV.ipa` with SHA-256
`82d21dce279eda777014f45c9f2aaca8cc14f962c485a0ce50262f1ecac09439`,
profile UUID `56a98c4c-5187-433f-b042-f3f893f906a0`, `get-task-allow=false`, and
the matching Apple Distribution certificate. After exact owner authorization,
the same RC8 archive was uploaded locally to App Store Connect on 2026-07-28.
Apple completed processing, marked binary `0.1.0 (2)` as validated, reported
symbols included and non-exempt encryption `No`, and exposed it to the existing
internal `avalsys` group. The upload completed with eight non-blocking missing
third-party-framework dSYM warnings; application/dSYM parity remains verified,
but crash symbolication inside those vendor frameworks is a retained risk.
Sentry uploads remained disabled. No external group, App Review submission,
production deploy, purchase, or Infisical write occurred. The registered
physical iPhone remained unavailable, so no install or data mutation was
attempted.

The 2026-07-28 owner video review then compared the current DuelWords behavior
directly with Tune AV and corrected the navigation boundary described above.
On iPhone, Account and Settings now use the common Tune-style header and all
footer destinations retain the footer without Back. On regular-width iPad the
same destinations use only the persistent sidebar. Practice, Daily, Play Avi,
Challenge, and every other DuelWords game route keep Back and use an explicit
right-to-left entry with the inverse exit transition. A clean production-
configured Release artifact passed direct interaction on independent iPhone
and iPad simulators. Account, Settings, Avi, Rivals, Stats, Home, Practice,
Daily, Play Avi, and Challenge matched the intended chrome; Practice accepted
`RAISE` and repeated-letter `APPLE`, including Delete and Enter behavior. The
full gate passes 71 test files / 367 tests, TypeScript, Expo lint, static iOS
release configuration, archive-ready runtime checks, and diff hygiene. React
Doctor 0.9.2 reports no errors and eight existing structural advisories in the
changed scope (80/100); the focused navigation changes introduce no new class
of diagnostic. A production-identity Release then passed its built Account AV
configuration and deep signature checks and installed over the existing
`com.avalsys.duelwordsav` app on the connected iPhone 14 without uninstalling
or clearing data. The first automatic launch attempt was deferred because the
phone was locked; a later retry after unlock launched the installed bundle
successfully. Visual confirmation of the restored Account AV session and local
game data remains a physical-device interaction gate. No backend deploy,
Cloudflare/Convex/Account AV/Sentry
mutation, TestFlight upload, App Review action, purchase, or Infisical write
ran.

The 2026-07-26 content audit follows Tune AV's Avi composition rule precisely:
the cropped Avi navigation treatment in the shared phone footer is separate
chrome and does not count as a content illustration. Home, Rivals, Stats, Avi,
and Account may each show at most one contextual Avi inside their screen
content; the Play Avi mode card uses a compact `AV` mark instead of adding a
second illustration. The iPad sidebar keeps its system navigation glyph. An
executable source contract locks this distinction. The same pass reviewed the
complete English player-facing copy for implementation terminology, completed
the equivalent ES/CA/FR/DE interface copy, and exercised Spanish Practice plus
automatic Play Avi on iPhone and the adaptive Home/Play Avi layouts on iPad.
The follow-up player-copy pass fixed the base Stats labels, passes the selected
interface locale into the Practice keyboard, localizes its terminal actions,
and removes placeholder share links and the duplicate in-game share preview.
Fresh Release interaction proved Spanish `Enviar`, `Borrar`, and
`Abrir resultado` on iPhone. Result actions now stack at full width on compact
phones so translated labels never split awkwardly, while the same artifact
keeps a balanced horizontal action row on iPad.

The current-head common-surface matrix also ran DuelWords and Tune AV in
separate iPhone simulators. Both use one contextual Avi in Home plus the
separate cropped Avi navigation control; the footer treatment is chrome and is
not part of the per-screen content-artwork count. Settings contains no content
Avi, and the iPad sidebar uses the same system navigation glyph rather than a
second illustration. Account, paywall, and deletion were then exercised on
iPhone and iPad with deterministic no-network fixtures. Shared Apps AV commit
`d85fce7` lets long localized paywall titles wrap to two lines. DuelWords now
localizes account-deletion service notices and errors in EN/ES/CA/FR/DE and
uses player-facing fixture copy instead of protected-workflow terminology.
Spanish runtime evidence confirms that the eligible-deletion notice no longer
falls back to English. The full local gate passes 55 test files/301 tests,
TypeScript, Expo lint, both static iOS identities, Swift package tests, and diff
hygiene. React Doctor reports no issues in the current changed scope; its remote
score service was unavailable.

A fresh current-head follow-up on public commit `8e5d75a` repeated the direct
comparison using the installed DuelWords and Tune AV binaries on separate
iPhone 17 simulators. Home retains the same shared header and transparent
floating footer composition; the one contextual Home Avi is independent of the
footer's cropped Avi navigation control. Settings and guest Account contain no
additional Avi illustration, and the expanded Account AV sheet retains Tune's
geometry, provider order, companion placement, guest escape, and legal
hierarchy. The installed iPad build then revalidated Home, Settings, guest
Account, the persistent sidebar, and the centered five-language game picker;
Catalan `TAMBE` was accepted from the bundled local dictionary without a server
request. The current gate passes 56 test files/307 tests, TypeScript, Expo lint,
the development iOS identity check, and diff hygiene. React Doctor reports no
errors; its 72 full-scan findings are warnings, including the deliberately
stable Account AV callbacks that prevent identity request loops.

Public commit `e4f8881` adds a final Challenge lifecycle guard: countdown,
create, preview, join, refresh, Ready, share, and rematch completions no longer
publish React state after the player has left the screen. This changes no room
protocol or remote runtime. The focused Challenge/controller matrix, full
56-file/307-test suite, TypeScript, Expo lint, React Doctor changed-scope scan,
and diff hygiene pass locally. A fresh development-identity Release of the
documented head then completed with `BUILD SUCCEEDED`, installed on the
dedicated iPhone 17 simulator, and rendered Home plus the non-mutating
Challenge setup screen. Its captured logs contained no matching error or
repeated Account AV request; the task-owned 7.6 GB DerivedData was removed.

The same 2026-07-25 pass expands offline play to five languages. Bundled counts
are EN 8,734/750, ES 7,571/750, CA 5,481/500, FR 5,654/500, and DE 6,299/500
for valid guesses/targets. All five target decks are frequency-ranked from
pinned Mozilla Gaia sources with recorded hashes and target-only exclusions;
EN/ES ranking is intersected with their existing reviewed allowlists. Practice,
Solo Practice, and Play Avi share a persistent shuffled deck per language, so a device uses
every target once before beginning another cycle and never repeats at the cycle
boundary. A dedicated iPhone 17
completed a Catalan Play Avi game using accentless keyboard input, while the
iPad Pro 13 showed the five-choice centered picker without layout loss.
Connected Challenge was separately verified to show only EN/ES at that stage.
The current release candidate now renders all five choices on iPhone and iPad;
the later backend rollout closed the CA/FR/DE room/rematch gate with one bounded
production lifecycle smoke per language. This dated UI evidence is not itself
the remaining signed physical two-device acceptance.

The current cumulative status and remaining gates live in the private
`docs/avi-words/current-work-handoff.md`. Dated implementation records describe
their individual slice at the time and should not be read as the current
cumulative product state.

This repo currently contains the app shell, local Word Duel practice, a pure
TypeScript word engine, typed interface locale foundation, generated bundled
EN/ES/CA/FR/DE dictionaries with source/license notices plus deterministic test
fixtures, and a
local invite/lobby/Ready/countdown preview, active-duel preview screen for the
V1 1v1 mobile layout with a typed mock adapter for the approved round-scoped
active gameplay API contract plus a local mock adapter for the approved
Convex-safe realtime projection contract, an SDK-shaped injected Convex
realtime adapter for that same safe projection surface, and a local
post-finalization result preview with rematch proposal states. It also includes
a no-spoiler diagnostics facade backed by `@sentry/react-native`. Debug builds
and builds without a DSN remain disabled and create no provider traffic. A
client-safe realtime config boundary and backend-issued realtime session
envelope parser exist, and a closed real Convex SDK bridge can build the four
approved function references without generated API imports. Realtime and Apps
AV API runtime config are still disabled by default. A typed, injected Apps AV
API client boundary exists for invite, lobby, Ready, start, realtime-session
recovery, active round command flows, own-round snapshot recovery, and
participant-scoped final-result recovery after backend finalization. A
client-safe Apps AV API runtime config boundary exists, but it is disabled by default. A
lobby controller can now run against `local_mock`, `disabled_runtime`, or an
injected `apps_av_api` client, and `/word-duel/lobby-demo` uses that controller
in `local_mock` mode. The active-duel screen is also wired through a local
controller, so demo game/player/realtime ids are owned outside the UI. The
active controller can run against injected Apps AV API and realtime projection
clients for active commands and own-round snapshot recovery. A runtime-safe
assembler can create that active controller only from an Apps AV API lobby
state, player session, backend-issued realtime session, enabled runtime config,
and an injected Convex realtime adapter or SDK-shaped Convex client; otherwise
it fails closed. A composed runtime client factory and Expo hook now gate Apps
AV API plus Convex realtime construction from client-safe config; the Expo
hook supplies the real SDK bridge and disposes it on cleanup. A hidden internal
route at `/word-duel/connected-runtime` remains available as an engineering
console, while the public `/word-duel/challenge` route uses the same typed
controllers without exposing game ids, player ids, realtime sessions, or
rematch proposal ids in its UI. It requests complete results and rematch state
through explicit participant-scoped API actions and fails closed before backend
finalization.
For the internal MVP runtime, Convex may carry only the short-lived safe
finalized room summary and accepted next-game lobby/active projection. Complete
participant final results and current rematch discovery remain API-only explicit
actions. Post-finalization Convex rematch proposal projection and automatic
polling remain out of scope; each participant uses the public Refresh action.

It does not enable Apps AV API or Convex network calls by default. Account AV
is integrated through Clerk Expo and SecureStore. Native Apple and Google
provider flows use Clerk's Expo adapters, activate the returned session, and
complete the provider action at Clerk's awaited `setActive` boundary. The
subsequent observed auth-state transition resolves the internal Apps AV
identity through Account AV; provider ids are never published as product user
ids. Provider actions remain disabled until Clerk's auth, sign-in, and sign-up
resources are all ready. The client never inspects the pre-activation Clerk
snapshot to resolve the new session, and temporary Account AV unavailability
does not turn successful Apple or Google activation into a provider error. The
provider token getter is held behind a stable adapter, so publishing the
resolved account cannot retrigger `/v1/me` and `/v1/me/access` merely because
Clerk returns a new function reference. Regression tests preserve one bounded
resolution per signed-in session-state transition and keep Account AV refresh
failure separate from provider activation. Cross-device game-history sync,
real Pro purchases, post-V1 advertising, push, Sentry project/DSN verification,
canonical associated links, and any further production deploy remain outside
the current candidate. No provider key or backend deploy credential belongs in
this repository.

## Run Locally

```bash
pnpm install
pnpm run start
```

Useful checks:

```bash
pnpm run typecheck
pnpm run test
pnpm run verify
pnpm run lint
pnpm run web
pnpm run web:artifact
pnpm run web:app:check:preview
pnpm run web:app:check:production
pnpm run doctor:react:diff
# Use the full scan for a baseline or broad cleanup:
pnpm run doctor:react
```

Reproduce the checked-in Gaia-derived allowlists and the 15 editorial solution
decks:

```bash
pnpm run dictionary:generate:gaia
```

The command verifies the five pinned Gaia hashes before writing. For EN/ES
five-letter data it preserves the reviewed accepted-word base and rebuilds its
complete Gaia union; for every language and length it validates the exact
versioned deck in `src/game/dictionaries/curated-targets/`. Every generated
asset records the editorial deck path and SHA-256. See
[`docs/dictionary-solution-policy.md`](docs/dictionary-solution-policy.md).

The web dev server uses port `8098`. The deployable web architecture, host
separation, immutable artifact checks, and rollback rules are documented in
[`docs/web-app-deployment.md`](docs/web-app-deployment.md).

## Home and Office Openspace boundary

The **Home** computer may perform development, tests, signed runtime,
environment-backed smokes, deploys, and other approved work under the normal
preflight, runbook, no-spend, and explicit-approval gates. Only recurring or
operational automation—scheduled runners, monitors, dispatchers, cron jobs,
queue consumers, and equivalent background automation—must be installed,
enabled, executed, and verified exclusively on **Office Openspace**.

## Native URL scheme and link boundary

Expo declares the bundle identity itself as the native URL scheme:
`com.avalsys.duelwordsav.dev` for development and
`com.avalsys.duelwordsav` for production. Account AV Google SSO must pass the
exact matching `<bundle-id>://callback` redirect to Clerk; the generic
`duelwordsav://sso-callback` form is invalid. The generated iOS plist registers
`$(PRODUCT_BUNDLE_IDENTIFIER)`, so development and production cannot intercept
each other's callback when both builds are installed.

Expo Router uses `https://app.duelwords-av.avalsys.com` as its native handoff
origin. `web-edge` serves only the bounded AASA file and a neutral invitation
fallback; it has no bindings and never contacts Apps AV API, D1, Convex, or
Account AV. The app owns `/i/c/[token]` and opens the existing review-before-join
Challenge surface. The fallback provides a native-open action plus the exact
matching `play.duelwords-av` web route. It does not fetch room data or log the
token. Production TLS, Worker deployment, and AASA retrieval are closed; a
fresh signed-device reinstall remains a release gate. Android App Links remain
outside this iOS candidate.

The playable web application is a third isolated Worker surface at
`play.duelwords-av[-preview].avalsys.com`. It serves one immutable Expo export
with environment-specific client-safe runtime config, strict response headers,
and no backend bindings or logs. It does not replace either host above.

The separate `legal-edge` Worker owns the public commercial and legal site at
`duelwords-av.avalsys.com`. The commercial home is available in English,
Spanish, Catalan, French, and German at `/`, `/es/`, `/ca/`, `/fr/`, and
`/de/`; Privacy, Terms, Support, Delete account, and dictionary/open-source
Notices remain on their canonical public paths. The Worker is static and has no
bindings, browser JavaScript, forms, cookies, analytics, advertising, or
runtime API calls. Keeping it separate means publishing or rolling back the
commercial or legal pages cannot change the AASA or invitation Worker. Preview
and production configurations must be deployed only through the private
Avalsys runbook and exact remote authorization.
The combined App Store privacy inventory is documented in
[`docs/app-store-privacy.md`](docs/app-store-privacy.md).

## Simulator-only signed-in surface review

DuelWords follows Tune AV's explicit launch-environment pattern for reviewing
signed-in common surfaces without creating an account or contacting Account AV.
Set `DUELWORDSAV_UI_TESTS=1` when launching an iOS Simulator process, choose
`DUELWORDSAV_UI_TESTS_ACCOUNT_MODE=free` or `pro`, and optionally select one of
`eligible`, `blocked`, `inprogress`, `completed`, or `error` with
`DUELWORDSAV_UI_TEST_ACCOUNT_DELETION`.

This is visual and interaction evidence only. The runtime is compiled behind
`targetEnvironment(simulator)`, exports a tokenless local Account AV identity,
and suppresses provider sign-in, account refresh/sign-out, and every deletion
mutation. A physical device or a build without the explicit opt-in cannot
activate it. Never use the fixture as proof of Clerk persistence, real
entitlement restoration, StoreKit purchase/restore, or account deletion.

The reusable cross-app rule is the safety shape—not these DuelWords-prefixed
variables: explicit opt-in, compile-time Simulator isolation, a tokenless local
provider, blocked remote actions, and a final URL-only log check. Deterministic
manual runs are allowed on Home; recurring execution or monitoring belongs
exclusively on Office Openspace.

## iOS release-candidate configuration

The checked-in Expo configuration reserves version `0.1.0`, build `2`, bundle
identifier `com.avalsys.duelwordsav`, and iPhone/iPad device families for the
replacement internal candidate. The already-uploaded build `1` is immutable
historical evidence and must never be uploaded again. Build `2` is portrait and
full-screen on both device types; iPad landscape and multitasking are not part
of this candidate's acceptance contract. The next upload still requires the
exact source, production runtime and owner acceptance to be frozen together.

Development and simulator-native builds use the separate identifier
`com.avalsys.duelwordsav.dev`. `pnpm run ios` selects that variant explicitly,
and the EAS `simulator` profile does the same. Its Account AV keychain access
group is `935PM55U6R.com.avalsys.duelwordsav.dev`; Release/TestFlight stays on
`com.avalsys.duelwordsav` and its production access group. Direct Expo prebuild
commands default to the safer Release identity unless
`DUELWORDSAV_IOS_BUILD_VARIANT=development` is provided.

Keep normal Simulator signing enabled when validating Account AV or Clerk.
`CODE_SIGNING_ALLOWED=NO` is suitable only for compile checks: the resulting
app cannot use the configured keychain access group and may render Account AV
as unavailable even when its embedded client configuration is correct. A
runtime auth check must use Xcode's local ad-hoc signature (`Sign to Run
Locally`) or a development-signed physical build.

On 2026-07-27, the privacy-complete production Release built from public app
source `0f3a1b9` passed a signed-local simulator matrix on the dedicated iPhone
17 and iPad Pro 13, iOS 26.5. The same `.app` reported `0.1.0 (2)`, production
bundle `com.avalsys.duelwordsav`, device families `1,2`, and a valid embedded
production Account AV configuration. Account AV became available on both
devices, the provider sheet opened without starting a provider session, and
the bundled English dictionary accepted `SLATE` in Practice on both layouts.
Public follow-up `ad4a1c8` additionally verifies the Apple privacy manifest in
the signed device archive; it does not change the app runtime.

## Brand assets

Reviewed transparent PNG masters live in `assets/brand-source/`; the superseded
flat SVG family is retained under `assets/brand-source/legacy-flat/` for
provenance only. Runtime copies and generated splash/onboarding illustrations
live in `assets/images/brand/`.
Their private canonical promotion and review status are documented under
`private/avalsys-suite/docs/brand-system/duelwords-av/`. The product family
keeps a DuelWords-specific icon, mark, lockup, and editorial imagery. Every
common surface uses the same shared components, canonical palette, layout
grammar, Avi V2 assets, and footer behavior as Tune AV. The 2026-07-28 logo,
wordmark, symbol, and corrected splash pixels are owner-approved. Expo prebuild
wires the approved light/dark wordmark, lockup, and splash hero into the shared
Apple asset catalogs; signed iPhone/iPad crop review remains mandatory before a
replacement upload.

The 2026-07-28 implementation check regenerated the ignored iOS workspace and
confirmed byte-identical native-catalog copies for every wordmark, lockup, and
splash hero role. The generated launch screen visibly uses the approved full
lockup, and a minified development-identity iOS Metro bundle includes all five
approved React Native brand images among its 35 assets. The release gate now
pins both the asset hashes and their shared-Apple catalog mapping. Full
`xcodebuild` validation did not run on that workstation because it has Apple
Command Line Tools but not Xcode; no replacement TestFlight upload occurred.

`pnpm run config:ios:check` pins the promoted icon, product symbol, light/dark
wordmark and lockup sources, splash/onboarding art, and the exact shared Tune AV
Avi exports by SHA-256. It also requires the native launch screen to use the
full light product lockup on the canonical warm-paper background, matching Tune
AV rather than falling back to the standalone symbol. Changing those pixels or
that launch identity requires an intentional brand promotion; an unrelated
build must fail instead of silently drifting.

Validate the non-secret identity and assets before any native build:

```bash
pnpm run config:ios:check
pnpm run config:ios:check:dev
```

For a development native runtime, generate the ignored Xcode environment from
the private read-only config flow and validate the values Xcode will actually
export to Expo's JavaScript bundle phase. Run the generator after every Expo
prebuild, because prebuild recreates the ignored `ios/` tree:

```bash
pnpm run config:ios:generate:dev
pnpm run config:ios:runtime:dev
```

Pass `ios/Config/Local.xcconfig` to direct `xcodebuild`/XcodeBuildMCP builds.
The file is never committed. Raw `xcodebuild` startup output echoes custom
xcconfig values, so device/release commands must redirect that output to a
protected local log and expose only a redacted result. Preview-candidate
preparation uses `config:ios:generate:preview` and
`config:ios:runtime:preview`; it remains subject to the private TestFlight
runbook and exact-build approval.

Production-device diagnostics use `config:ios:generate:prod` followed by
`config:ios:runtime:prod`. That mode resolves the production Account AV
identity, API, and DuelWords Convex URL. Connected Challenge is enabled because
its separate production activation gate and controlled full-flow smoke passed
on 2026-07-26. Missing or malformed runtime values still fail closed.

After the approved preview values have been resolved read-only into the current
shell, require the complete connected-runtime contract without printing its
values:

```bash
pnpm run config:ios:check:preview
```

`eas.json` provides a local-versioned simulator profile and a store-distribution
profile named `testflight`. These profiles are build configuration only. They
do not authorize credentials changes, a remote build, upload, submission, or
spend. The private internal-TestFlight runbook and explicit approval for the
exact build remain mandatory.

## Runtime Config

`app.config.js` exposes only client-safe API and realtime config through Expo
`extra`:

- `EXPO_PUBLIC_DUELWORDSAV_API_BASE_URL`
- `EXPO_PUBLIC_DUELWORDSAV_API_DISABLED`
- `EXPO_PUBLIC_DUELWORDSAV_CONVEX_URL`
- `EXPO_PUBLIC_DUELWORDSAV_CONVEX_REALTIME_DISABLED`

Apps AV API calls remain disabled unless
`EXPO_PUBLIC_DUELWORDSAV_API_DISABLED=false` and
`EXPO_PUBLIC_DUELWORDSAV_API_BASE_URL` is a valid HTTPS URL without credentials,
query, or hash. The runtime factory returns no client while disabled, so local
previews cannot accidentally call Apps AV API/D1.

Realtime remains disabled unless
`EXPO_PUBLIC_DUELWORDSAV_CONVEX_REALTIME_DISABLED=false` and the URL is a valid
`https://*.convex.cloud` value. `DUELWORDSAV_CONVEX_DEPLOY_KEY` is backend-only
and must never be present in this public client repo or Expo runtime config.

`src/game/word-duel-active/convex-realtime-client.ts` defines the public
SDK-shaped Convex adapter boundary. It wraps an injected Convex client with
`query`, `mutation`, and `watchQuery`, and only targets the approved public
realtime functions:

- `duelwords:getActiveRoomView`
- `duelwords:sendPresenceHeartbeat`
- `duelwords:sendReaction`
- `duelwords:setReactionPreference`

The adapter parses only the safe room summary, own safe player summary,
opponent safe player summary, each side's current-match reaction preference,
presence, and closed-set reactions. The stable palette is `gg`, `nice`,
`close`, `almost`, `your_turn`, `tick_tock`, `no_pressure`, and `wow`.
Reactions carry authoritative round/time metadata so reconnects and later
rounds cannot replay stale animation. Pausing reception is projected to both
participants and `sendReaction` enforces the recipient preference server-side;
an absent preference in a rolling legacy projection defaults to receiving. If a Convex
payload includes target words, guesses, dictionary fields, real feedback,
identity fields, provider fields, deploy keys, auth tokens, push tokens, or
emails, the parser fails closed instead of exposing the payload. The adapter
does not publish gameplay commands; submit/timeout/open-next remain Apps AV
API/D1 authority paths.

`src/game/word-duel-runtime/runtime-clients.ts` composes the Apps AV API client
and realtime projection client for the hidden connected runtime path. It fails closed
unless both runtime configs are explicitly enabled and a Convex client factory
is present. `src/game/word-duel-runtime/convex-client-factory.ts` imports
`convex/react` and `convex/server`, creates a `ConvexReactClient`, maps only
the four approved public function names with `makeFunctionReference`, rejects
unapproved query/mutation refs, and exposes `close()` through the existing
SDK-shaped boundary. `src/game/word-duel-runtime/use-runtime-clients.ts` reads
Expo runtime config for UI code, supplies that real factory by default, and
disposes the runtime bundle when config changes or the hook unmounts.

`/word-duel/lobby-demo` and `/word-duel/active-demo` still force `local_mock`
and do not call the runtime hook. `/word-duel/connected-runtime` is a hidden
internal route that is not listed in `WORD_DUEL_ROUTE_PATHS` and is not linked
from `Play`. It creates no Apps AV API calls on mount. When explicitly opened
with enabled runtime config, user actions can create/join/refresh/Ready/start
through Apps AV API, recover a backend-issued realtime session if needed, and
then subscribe/heartbeat/react through Convex. It does not poll, and it fails
closed if API config, Convex config, or backend realtime session is missing.
The local connected runtime smoke wraps a fake React client with the real SDK
bridge to verify subscription, heartbeat, and reaction refs without calling
Convex.

The public `/word-duel/challenge` route accepts `lang`, `ui`, `invite`, and
`code` query parameters. `ui` accepts `en`, `es`, `ca`, `fr`, or `de` for a
link-scoped interface override without rewriting the user's stored preference.
Invite URLs are validated as exact HTTPS links for
`app.duelwords-av.avalsys.com/i/c/` or as bounded direct tokens; foreign hosts,
malformed percent encoding, and invalid room codes are rejected before any API
action. Preview is GET-only and joining always requires explicit confirmation.

The active-duel runtime adapter accepts only backend-issued realtime session
payloads shaped as:

```ts
{
  realtime: {
    realtimeSessionId: 'dwrs_...',
    roomToken: 'dwr_...',
    side: 'a' | 'b',
  },
}
```

The session envelope is room-scoped and in-memory only. It must not contain
account ids, guest ids, guesses, feedback, targets, dictionary data, provider
payloads, deploy keys, auth tokens, push tokens, or emails. If realtime is
disabled, missing, malformed, or unavailable, the client fails closed instead
of polling or inventing another realtime transport.

## Apps AV API Boundary

`src/game/word-duel-lobby/api-client.ts` defines the future HTTP client
boundary for the approved Apps AV API routes:

- `POST /v1/apps/duelwords/invites`
- `GET /v1/apps/duelwords/invites/:inviteToken`
- `POST /v1/apps/duelwords/invites/:inviteToken/join`
- `POST /v1/apps/duelwords/invites/:inviteToken/cancel`
- `GET /v1/apps/duelwords/room-codes/:roomCode`
- `GET /v1/apps/duelwords/games/:gameId/lobby`
- `POST /v1/apps/duelwords/games/:gameId/ready`
- `POST /v1/apps/duelwords/games/:gameId/start`
- `POST /v1/apps/duelwords/games/:gameId/realtime-sessions`
- `POST /v1/apps/duelwords/games/:gameId/rounds/:roundNumber/submit`
- `POST /v1/apps/duelwords/games/:gameId/rounds/:roundNumber/timeout`
- `POST /v1/apps/duelwords/games/:gameId/rounds/:roundNumber/open-next-if-due`
- `GET /v1/apps/duelwords/games/:gameId/rounds/:roundNumber/own-snapshot`
- `GET /v1/apps/duelwords/games/:gameId/final-result`
- `GET /v1/apps/duelwords/games/:gameId/rematch-proposals/current`
- `POST /v1/apps/duelwords/games/:gameId/rematch-proposals`
- `POST /v1/apps/duelwords/games/:gameId/rematch-proposals/:proposalId/accept`
- `POST /v1/apps/duelwords/games/:gameId/rematch-proposals/:proposalId/decline`
- `POST /v1/apps/duelwords/games/:gameId/rematch-proposals/:proposalId/cancel`

The client is fetch-injected for tests, sends the canonical app id
`duelwordsav`, accepts an optional bearer token provider, parses only safe
invite/lobby/game/realtime/active fields, rejects sensitive realtime payloads,
and drops unexpected target, dictionary, opponent guess, and opponent feedback
fields. Active command responses cover submit, timeout, and open-next summaries
only. The own-snapshot response can reveal the caller's own submitted display
word and own feedback after backend resolution, while the opponent remains only
`waiting`, `submitted`, or `timed_out`. The final-result response is
participant-scoped, rejected before backend finalization, and parsed into only
safe game summary, viewer outcome, target display word, and completed own/
opponent result boards. Malformed final-result feedback fails closed instead of
being rendered. Rematch proposal responses parse only safe owner/recipient
display summaries, locked shared settings, viewer permissions, expiry, status, and
the accepted safe next-game lobby summary; unexpected target, dictionary,
feedback-storage, actor, or provider fields are not retained.
Current rematch proposal discovery returns `null` or the same safe proposal
shape through participant-scoped actor query parameters.
`src/game/word-duel-lobby/runtime-api-client.ts` only constructs the HTTP client
when the runtime config is explicitly enabled.
`src/game/word-duel-lobby/controller.ts` wraps the local lobby preview, disabled
runtime, and injected Apps AV API client behind the same controller shape, and
maps API lobby/game payloads into UI-safe state without exposing game ids,
player ids, target ids, dictionary metadata, guesses, or feedback through the
lobby view-model. It can also build a connected next-lobby state from an
accepted rematch proposal's safe `nextGame` summary by taking the new viewer
`playerId` from the next game side while reusing the current actor in memory.
`/word-duel/lobby-demo` is wired through the controller using the `local_mock`
source only, so the app still makes no real Apps AV API calls by default.

`src/game/word-duel-active/handoff.ts` defines the local-safe handoff from
the lobby preview to the active duel preview. `/word-duel/lobby-demo` can only
open `/word-duel/active-demo` after the lobby reaches `active_round`, and the
handoff route params contain only public duel settings: language, `human_duel`,
word length, max attempts, and local demo source. They never carry game ids,
player ids, targets, dictionary metadata, guesses, feedback, realtime tokens,
sessions, account state, or provider state.

`src/game/word-duel-active/controller.ts` wraps active gameplay behind the same
source idea: `local_mock` for the demo, `disabled_runtime` for fail-closed
runtime attempts, and injected `apps_av_api` for connected active commands. It
owns the demo actor, game id, player id, room token, and realtime
session id in local mode, accepts backend-issued session details in runtime
mode, and exposes only high-level UI actions such as submit guess, heartbeat,
reaction, subscription, timeout, open-next-round, and own-round snapshot
refresh, finalized result recovery, and participant-scoped rematch proposal
discovery/commands. The injected Apps AV API source uses the typed HTTP client
plus a client-safe realtime projection client; it updates only the caller's
board from own snapshots, keeps opponent letters/feedback abstract during
active rounds, and only hands completed boards to the result screen after
backend finalization. Both the hidden engineering panel and public challenge
route can refresh the current API-only proposal and continue to the accepted
next lobby when a safe `nextGame` is present.
`src/game/word-duel-active/runtime-controller.ts` assembles that runtime source
from a safe lobby state only when API runtime, player session, realtime session,
and an injected Convex realtime adapter or SDK-shaped Convex client are present.
If any piece is missing, it returns the same `disabled_runtime` controller and
performs no fallback polling or alternate realtime transport.
`src/game/word-duel-active/runtime-smoke.test.ts` verifies that connected shape
locally with fake Apps AV API fetches and a fake React client routed through
the real Convex SDK bridge, without enabling UI network calls.
`src/game/word-duel-runtime/runtime-clients.test.ts` verifies the app-level
runtime gate: disabled by default, no Convex construction when the API is
disabled, pending without injection, fail-closed on factory errors, and ready
only with both configs plus an injected Convex client.
`/word-duel/active-demo` uses this controller in `local_mock` mode.

The hidden `/word-duel/connected-runtime` route includes an internal rematch
API panel once an active runtime controller is open. It can refresh the current
participant-scoped API proposal, create a proposal for the current participant,
accept/decline/cancel by proposal id, and display whether an accepted response
returned a safe next lobby. When accept or refresh returns a safe `nextGame`,
the route swaps back to a connected lobby state for that rematch so the same
participant can run Ready/start again. It does not discover remote proposals
through Convex, does not poll for post-finalization state, and does not expose
automatic post-finalization refresh. The public route exposes the same
participant permissions with product labels and no raw proposal-id input.

## Public connected route

- `/word-duel/challenge`: guest-first connected entry linked from Play. It
  fails closed while Apps AV API or Convex safe realtime is disabled and is not
  a local mock. It supports create/review/join/Ready/active/result/rematch with
  explicit refresh where the safe projection intentionally carries no result.

Active connected screens keep safe Convex presence alive every 10 seconds
while mounted, without overlapping heartbeat requests. When the rival
projection becomes disconnected, the public client can ask Apps AV API to
reconcile presence. The client never sends heartbeat timestamps, declares an
absent side, or chooses a winner: the API reads backend-only Convex evidence and
D1 owns the idempotent abandonment result. This slice is locally verified but
still requires its coordinated Convex/API preview deploy and two-device smoke.

## Local Preview Routes

- `/word-duel/practice`: offline practice engine with the bundled five-language
  dictionaries and persistent no-repeat target rotation shared with other
  non-Daily local modes.
- `/word-duel/daily`: official EN/ES/CA/FR/DE Daily with a game-scoped language
  picker, one explicit target retrieval, versioned device resume, fully local
  validation and scoring, final target reveal, participation streak, and
  no-spoiler share text. After start, the compact common Back header and
  disclosure control leave the complete board and keyboard visible without
  repeating the product logo.
- `/word-duel/lobby-demo`: local invite, join review, lobby, one-way Ready,
  countdown, and active-duel handoff preview through the lobby controller's
  `local_mock` source. It uses a safe demo invite link and room code only.
- `/word-duel/active-demo`: local active-duel UI preview with safe opponent
  summary, own board/keyboard, reactions, local
  mock submit handling through the typed active-duel adapter, and local
  mock realtime projection handling for timer, presence, opponent state, and
  reactions. It can open directly or through the local lobby-active handoff.
- `/word-duel/result-demo`: local finalized result preview with in-app target
  reveal, own/opponent completed-board review, safe share preview, and local
  rematch proposal states for draft, sent, accepted,
  declined, expired, and cancelled flows.
- `/word-duel/play-avi-demo`: deterministic local bot-duel preview that reuses
  synchronized-round UI and safe opponent summaries without API/D1 authority.
- `/word-duel/solo-daily-demo`: local Solo and Daily-style board preview. It
  uses non-production fixtures and does not create an official Daily result.

`/word-duel/active-demo` is not connected gameplay. Its adapter builds the
approved local command paths for submit, timeout, and open-next-if-due, but it
does not call Apps AV API/D1, Convex, ads, Pro, Account AV, Sentry, push, or
any remote provider. The realtime projection mock mirrors the client-safe
Convex room-view/heartbeat/reaction surface without importing or connecting the
Convex SDK/runtime. The screen explicitly uses the active controller's
`local_mock` source, so public runtime config cannot accidentally connect the
demo or leak local session details into UI code.

`/word-duel/lobby-demo` is local-only. It does not create real invite links,
join remote rooms, configure Universal Links/App Links, call Apps AV API/D1,
connect Convex, open native share sheets, use clipboard, request push, or touch
ads, Pro, Account AV, Sentry, signed runtime, deploys, or remote providers. Its
active-duel handoff is a typed local route boundary only, not a backend-issued
game session or realtime session.

`/word-duel/result-demo` is also local-only when opened directly. It does not
call result APIs, native share, public result links, Convex post-finalization
runtime, ad SDKs, Pro, Account AV, Sentry, push, or any remote provider. The
hidden connected runtime route may navigate to it with an API-derived local
result payload after backend finalization, but the result route itself still
does not make connected calls. The local rematch model does not create a new
game id; it only creates a start request after recipient acceptance.

## Remaining V1 release gates

- Internal TestFlight `0.1.0 (13)` remains immutable historical acceptance.
  The first public-review candidate `1.0.0 (14)` was archived and uploaded from
  exact source commit `3a59588`. Apple reports it `VALID` and
  `IN_BETA_TESTING` only in the internal `avalsys` group. It is superseded
  by `1.0.0 (15)`, archived and uploaded from exact source commit `28e6d6d`.
  Build 15 is superseded by `1.0.0 (16)` from exact source commit `437a6a5`.
  Apple reports build 16 `VALID`, encryption-exempt, and `IN_BETA_TESTING`
  only in the same internal group. Build 16 is attached to the prepared
  three-item review draft but has not been submitted; replace it with the
  corrected successor before the owner submits.
- Native iPhone/iPad V1 is subscription-first: it must ship the real localized
  StoreKit offer, purchase, Restore Purchases, redeem-code, Apple subscription
  management, Apps AV entitlement reconciliation, legal links, and in-app
  account deletion. Web remains informational and does not sell subscriptions.
- App Store Connect now uses EUR 2.99 as the Spain base-storefront price for
  `duelwordsav_pro_monthly`, with Apple's automatic equivalents across all 175
  territories. RevenueCat now reports the product `Ready to Submit`; product,
  entitlement, offering, package, and product id do not change. Physical build
  16 displayed the propagated USD 2.99 StoreKit price and completed purchase
  plus delayed-webhook reconciliation successfully.
- Automatic same-account Pro hydration passed on a physical iPad without
  repurchase. Cancellation plus accelerated Sandbox expiry returned the
  physical iPhone to Free, and Restore after expiry safely kept it Free. That
  Restore exposed misleading anti-repurchase copy in build 16; current source
  now reports that no active subscription was found. Explicit Restore with an
  active subscription, redeem code, account deletion, build-17 processing and
  physical acceptance, and the remaining lifecycle matrix stay open. The
  required subscription review screenshot and the four-iPhone/four-iPad commercial
  screenshot package are saved in App Store Connect.
- The standalone invitation edge is already deployed and its bounded origin
  verification is closed. Do not redeploy or repeat the rollout smoke. Fresh
  signed-device `/i/c/:token` Universal Link acceptance remains open; Android
  App Links remain separate from the iOS TestFlight candidate.
- Keep the public Play order fixed as official Daily, Challenge a Friend,
  Play Avi, Practice, then Avi help. All four modes and
  their public journeys are localized in EN/ES/CA/FR/DE.
- Keep advertising outside V1. Any later monetization experiment requires a
  new product decision, provider/privacy review, implementation, and signed
  acceptance gate; the V1 client must remain SDK- and placement-free. The V2
  Google AdMob plan retains the EUR 2.99 monthly target, keeps ads away from
  gameplay/lobby/reactions/result/rematch, and must use actual 90-day product
  data before any price change.
- Do not submit while purchase, restore, redeem-code, entitlement
  reconciliation, subscription management, or account deletion has an open
  failure. The current source includes those paths; the remaining gate is
  exact-candidate end-to-end acceptance, not removal of purchasing.
- Continue handling player/editorial reports through the versioned solution
  decks and exclusion regressions. All five languages now use the same 750
  solutions per length; accepted guesses remain broader by design.
- The five-language connected backend gate is closed: migrations `0071` and
  `0072`, the pinned CA/FR/DE dictionaries, matching Convex/API validators, and
  one bounded CA/FR/DE production lifecycle smoke are complete. Do not repeat
  those remote steps as a routine check; complete the signed physical
  iPhone+iPad Challenge matrix before shipping the replacement candidate.
- Preserve the closed local visual/accessibility baseline during signed-device
  work. Current deterministic evidence covers page titles, explicit H1/H2
  levels, one main landmark, visible input labels, live status announcements,
  browser focus indicators, 44px-or-larger actions, narrow localized layouts,
  Android text scaling through 150%, and no mobile horizontal overflow. Signed
  two-device validation must repeat the critical path on release-like builds.
- Approve and execute runtime/deploy/store/privacy/billing gates. Nothing in
  this repository grants permission for spend or remote state changes.

## Current Game Rules

- Word Duel practice uses 5-letter words and 6 attempts.
- Human Challenge and Play Avi allow 5, 6, or 7 letters with 4, 6, or 8
  attempts. The host chooses human-duel rules; both players see the same locked
  explanation, and rematches preserve those rules.
- Local game languages are English, Spanish, Catalan, French, and German.
- Connected Challenge source supports English, Spanish, Catalan, French, and
  German, and live production accepts all five through rematch and next lobby.
- Interface locale foundation exists for English, Spanish, Catalan, French,
  and German.
- Spanish input is accent-tolerant for vowels, while `ñ` remains distinct from
  `n`. Catalan, French, and German local lookup folds accents and umlauts to the
  corresponding five-key Latin spelling; German sharp s is excluded because it
  expands when normalized.
- Invalid guesses do not consume attempts.
- Practice and Solo Practice keep their five-letter rotations. Play Avi keeps a
  separate persistent shuffled target deck for each language and word length;
  no target repeats until that deck has been used.
- Play Avi resolves the opponent turn automatically and exposes only aggregate
  valid-letter/correct-position counts for Avi's completed attempts.
- New non-Daily games start from a setup screen. Settings stores this device's
  default game language, Avi difficulty, and optional human-challenge display
  name; none of those choices edits Account AV. Friendly Avi intentionally
  retains fewer clues and cannot solve before attempt four, while the game
  rules remain identical at every difficulty.
- Feedback uses a duplicate-letter-safe two-pass algorithm.

The bundled dictionaries are the offline native candidate. English and Spanish
five-letter accepted guesses retain their reviewed internal MVP bases plus the
complete eligible Gaia union; the other accepted-guess lists come from the
pinned Gaia sources. All languages now have an explicit 750-solution deck for
each of 5, 6, and 7 letters (2,250 per language; 11,250 total), selected under
the common noun/adjective policy in
[`docs/dictionary-solution-policy.md`](docs/dictionary-solution-policy.md).
Connected gameplay continues to use Apps AV API/D1 as dictionary and game
authority, with Convex only as a safe realtime projection. The matching
immutable server import is prepared but not deployed.

The diagnostics runtime installs the native Sentry SDK with native crash
handling, zero tracing, no default PII, an allowlisted breadcrumb vocabulary,
and payload scrubbing that rejects game words, guesses, boards, room/invite/
player/session identifiers, provider identity, URLs, and account data. It
initializes disabled in debug builds or when no DSN is present. A release-like
smoke against the owner-approved Sentry project is still required before the
next TestFlight candidate.
