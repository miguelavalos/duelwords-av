# DuelWords AV

Mobile-first Expo client for DuelWords AV.

## Current Status

Current as of 2026-07-26: this repository has a public, guest-first Word Duel
V1 branding and hardening candidate, but is not yet ready for another
TestFlight upload. **Challenge a Friend**
is linked from Play and opens `/word-duel/challenge`. With the safe runtime
enabled, that route can create a room-scoped guest, create or review an invite
without auto-joining, join explicitly, Ready, start, play connected rounds,
recover the finalized result, share a no-spoiler summary, and create or answer
a participant-scoped rematch. Room-code lookup and canonical invite-token
parsing are included. With runtime disabled—the repository default—the same
surface fails closed and performs no network calls.

The public Play catalog contains Challenge a Friend and offline Practice.
Practice, Solo Practice, and deterministic Play Avi use bundled
EN/ES/CA/FR/DE dictionaries and make no word-list request. Native word
acceptance and non-Daily local target selection stay on-device; the app must
never download an allowed-word list per round. Daily is the only planned mode
allowed to fetch its selected word before play. Challenge remains
server-arbitrated for fairness. The release candidate now supports
EN/ES/CA/FR/DE end to end, but the live API/D1 deployment remains EN/ES until
the separately reviewed five-language backend rollout is approved. The client
does not fetch its target during gameplay; it receives only the authorized
reveal in the finalized result. Lobby, active-duel, result,
Solo/Daily, Play Avi, and connected-runtime engineering previews remain
available by direct internal route when they are not linked from Play.

Interface language (EN/ES/CA/FR/DE) and appearance (system/light/dark) are
versioned local preferences. Web uses browser
`localStorage`; native uses Expo SQLite's `localStorage` compatibility layer.
The Home screen deliberately has no word-language selector. Word language is
selected from a compact, accessible Game settings picker inside Challenge,
Practice, Solo/Daily, or Play Avi; it applies only to that game and Challenge
locks it when the room is created. Local modes and the connected Challenge
candidate offer EN/ES/CA/FR/DE; the candidate must not ship before matching
API/D1 dictionaries and validators are deployed.
The picker is list-based rather than a segmented control so all choices remain
clear on phones and iPads. The shell, Settings, and public
challenge/lobby/game/result/rematch path react to their applicable choices.
English, Spanish, Catalan, French, and German each
cover the complete public challenge/lobby/game/result/rematch journey; module
initialization fails in tests if a locale omits a public-journey key.

The native shell now includes the canonical-candidate DuelWords icon, separate
light/dark logo and wordmark exports, a paper-and-ink branded splash, onboarding
with guest skip, the canonical Tune AV Account AV provider sheet, Account,
Settings, an adaptive Apps AV footer/sidebar with Avi, and an honest DuelWords
Pro preview with no purchase call. The identity boundary is strict: game boards,
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

Home, Settings, and Account now follow Tune AV's common-screen ordering as
well as its shared shell. Home puts Avi's brief directly below the title.
Settings begins with one compact App preferences card (app language,
appearance, haptics), followed by on-device data and help/legal; Account and
Pro no longer appear as duplicate Settings destinations. Account orders the
identity summary, product access, continuity, and signed-in-only safety, and a
guest has one canonical `Connect Account AV` entry into the Apple/Google
provider sheet. Both size classes use the same hierarchy; iPad adapts it to the
shared utility sidebar.

The native Settings version row reads `CFBundleShortVersionString` and
`CFBundleVersion` from the installed app instead of hard-coding candidate `1`,
so a future build `2` cannot continue to identify itself as the first upload.
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
both passive-abandonment paths. Canonical web `/i/c/:token` edge routing,
Universal Links, physical replacement-build validation on iPhone/iPad, and a
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

The same local candidate now resolves Avi's deterministic response
automatically after the scheduled thinking delay; the former manual
`Avi submits` development control is not part of the player experience. Avi's
attempt strip never reveals its word or letters. Each completed attempt exposes
only two aggregate counts: letters that belong to the target (including exact
matches) and the subset already in the correct position. The compact iPhone
keyboard also fills the dead space between keys and clamps rapid input inside
the atomic five-letter state update.

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
CA/FR/DE room creation remains a production deployment gate, not shipped state.

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
envelope parser exist, and a closed real Convex SDK bridge can build the three
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
failure separate from provider activation. Account-only persistence,
real Pro purchases, ads, push, Sentry project/DSN verification, canonical
associated links, and production runtime remain outside the current candidate. No provider
key or backend deploy credential belongs in this repository.

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
pnpm run doctor:react:diff
# Use the full scan for a baseline or broad cleanup:
pnpm run doctor:react
```

Reproduce the checked-in Gaia-derived target ranking and CA/FR/DE allowlists:

```bash
pnpm run dictionary:generate:gaia
```

The command verifies the five pinned source hashes before writing. For EN/ES
it preserves the checked-in reviewed allowlists and only rebuilds the
frequency-ranked target decks; for CA/FR/DE it rebuilds both allowlists and
targets. Regenerating the reviewed EN/ES allowlists themselves remains a
private fixture-pipeline operation.

The web dev server uses port `8098`.

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
origin. This does not configure or prove the `/i/c/:token` edge rewrite,
Universal Links, or Android App Links, which remain separate release gates.

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

The checked-in Expo configuration still describes the already-uploaded first
internal iOS candidate as version `0.1.0`, build `1`, bundle identifier
`com.avalsys.duelwordsav`, and iPhone/iPad device families. RC0 is portrait and
full-screen on both device types; iPad landscape and multitasking are not part
of this candidate's acceptance contract. Build `1` must not be uploaded again;
the next approved TestFlight candidate must increment to build `2` after its
exact source and runtime configuration are frozen.

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

## Brand assets

Deterministic SVG masters live in `assets/brand-source/`. Runtime PNG exports
and generated splash/onboarding illustrations live in `assets/images/brand/`.
Their private canonical promotion and review status are documented under
`private/avalsys-suite/docs/brand-system/duelwords-av/`. The product family
keeps a DuelWords-specific icon, mark, lockup, and editorial imagery. Every
common surface uses the same shared components, canonical palette, layout
grammar, Avi V2 assets, and footer behavior as Tune AV. Final owner visual
sign-off on the exact pixels remains mandatory before build `2`.

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

The adapter parses only the safe room summary, own safe player summary,
opponent safe player summary, presence, and closed-set reactions. If a Convex
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
the three approved public function names with `makeFunctionReference`, rejects
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
display summaries, locked V1 settings, viewer permissions, expiry, status, and
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
handoff route params contain only public V1 settings: language, `human_duel`,
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
- `/word-duel/lobby-demo`: local invite, join review, lobby, one-way Ready,
  countdown, and active-duel handoff preview through the lobby controller's
  `local_mock` source. It uses a safe demo invite link and room code only.
- `/word-duel/active-demo`: local active-duel UI preview with safe opponent
  summary, own board/keyboard, reactions, a compact reserved ad slot, local
  mock submit handling through the typed active-duel adapter, and local
  mock realtime projection handling for timer, presence, opponent state, and
  reactions. It can open directly or through the local lobby-active handoff.
- `/word-duel/result-demo`: local finalized result preview with in-app target
  reveal, own/opponent completed-board review, safe share preview, reserved
  result ad slot, and local rematch proposal states for draft, sent, accepted,
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

- Run the two-device signed iOS/Android happy path and recovery matrix on an
  available workstation against an explicitly approved preview runtime.
- Configure and verify the canonical `/i/c/:token` web edge/deep-link rewrite
  to `/word-duel/challenge?invite=:token`, Universal Links, and Android App Links.
- Keep the public Play catalog limited to Challenge a Friend and offline
  Practice until a secondary mode has authoritative V1 runtime and acceptance
  evidence. The public journey and both catalog entries are localized in
  EN/ES/CA/FR/DE.
- Complete final launch curation for all five target decks. Their bundled
  allowlists and 500/750-word target pools are reproducible from pinned,
  license-reviewed sources, but the current frequency ranking and auditable
  exclusions are internal-candidate evidence rather than final human approval.
- Deploy migration `0071`, import the pinned CA/FR/DE dictionaries, deploy the
  matching Convex/API validators, and pass one bounded production smoke per new
  language before shipping the five-language connected Challenge candidate.
  The source candidate already exposes all five choices; live production still
  accepts EN/ES only.
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
- Local game languages are English, Spanish, Catalan, French, and German.
- Connected Challenge source supports English, Spanish, Catalan, French, and
  German. Live CA/FR/DE rooms remain gated on the prepared backend deployment.
- Interface locale foundation exists for English, Spanish, Catalan, French,
  and German.
- Spanish input is accent-tolerant for vowels, while `ñ` remains distinct from
  `n`. Catalan, French, and German local lookup folds accents and umlauts to the
  corresponding five-key Latin spelling; German sharp s is excluded because it
  expands when normalized.
- Invalid guesses do not consume attempts.
- Practice, Solo Practice, and Play Avi share one persistent shuffled target deck per language;
  no target repeats until that language's full deck has been used.
- Play Avi resolves the opponent turn automatically and exposes only aggregate
  valid-letter/correct-position counts for Avi's completed attempts.
- Feedback uses a duplicate-letter-safe two-pass algorithm.

The bundled dictionaries are the offline native candidate. English and Spanish
use reviewed internal MVP allowlists; their 750-target decks are ranked by the
pinned Gaia frequency source after intersection with those allowlists. Catalan,
French, and German use pinned Gaia-derived allowlists and 500-target decks. All
target decks still require a final human launch-curation pass. Connected
gameplay continues to use Apps AV API/D1 as dictionary and game authority, with
Convex only as a safe realtime projection.

The diagnostics runtime installs the native Sentry SDK with native crash
handling, zero tracing, no default PII, an allowlisted breadcrumb vocabulary,
and payload scrubbing that rejects game words, guesses, boards, room/invite/
player/session identifiers, provider identity, URLs, and account data. It
initializes disabled in debug builds or when no DSN is present. A release-like
smoke against the owner-approved Sentry project is still required before the
next TestFlight candidate.
