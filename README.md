# DuelWords AV

Mobile-first Expo client for DuelWords AV.

## Current Status

Current as of 2026-07-25: this repository has a public, guest-first Word Duel
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
Practice and deterministic Play Avi use bundled EN/ES dictionaries and make no
word-list request. Native word acceptance and non-Daily target selection stay
on-device; the app must never download an allowed-word list per round. Daily is
the only planned mode allowed to fetch its selected word before play. Challenge
remains server-arbitrated for fairness, but the client does not fetch its target
during gameplay; it receives only the authorized reveal in the finalized
result. Lobby, active-duel, result,
Solo/Daily, Play Avi, and connected-runtime engineering previews remain
available by direct internal route when they are not linked from Play.

Interface language (EN/ES/CA/FR/DE) and appearance (system/light/dark) are
versioned local preferences. Web uses browser
`localStorage`; native uses Expo SQLite's `localStorage` compatibility layer.
The Home screen deliberately has no word-language selector. EN/ES word
language is selected within a compact Game settings section in Challenge,
Practice, or Play Avi; it applies only to that game and Challenge locks it when
the room is created. The shell, Settings, and public
challenge/lobby/game/result/rematch path react to their applicable choices.
English, Spanish, Catalan, French, and German each
cover the complete public challenge/lobby/game/result/rematch journey; module
initialization fails in tests if a locale omits a public-journey key.

The native shell now includes the canonical-candidate DuelWords icon, separate
light/dark logo and wordmark exports, a paper-and-ink branded splash, onboarding with
guest skip, the canonical Tune AV Account AV provider sheet, Account, Settings, an
adaptive Apps AV footer/sidebar with Avi, and an honest DuelWords Pro preview
with no purchase call. Account and Pro unavailable states use product language
rather than deployment terminology. Opening a new invite while the Challenge screen
is already mounted replaces the previous invite instead of reusing stale room
state, and guests receive a local editable room alias by default.

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
Universal Links, signed replacement-build validation, physical-iPad validation,
and a replacement TestFlight build remain open.

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
destinations to its persistent sidebar. Earlier deterministic checks covered all 18
exported web routes at desktop and narrow mobile widths and the current
public/game-preview surfaces in an Android Pixel 9 AVD.
Light/dark appearance, status and navigation bars, keyboard/board fit, the
native not-found route, browser keyboard focus, EN/ES/FR/DE narrow layouts, and
Android font scales through 150% were reviewed. This is local Expo Go and web
evidence plus an unsigned native Release-simulator build; it is not
signed-runtime, physical-device, deep-link, or store-release evidence. The
fresh Release build verified the replacement native launch mark and bundled
product onboarding on the dedicated iPhone 17.

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

The current cumulative status and remaining gates live in the private
`docs/avi-words/current-work-handoff.md`. Dated implementation records describe
their individual slice at the time and should not be read as the current
cumulative product state.

This repo currently contains the app shell, local Word Duel practice, a pure
TypeScript word engine, typed interface locale foundation, generated bundled
EN/ES dictionaries with source/license notices plus small deterministic test
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
then resolve the internal Apps AV identity through Account AV; provider ids are
never published as product user ids. Account-only persistence,
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
```

The web dev server uses port `8098`.

## Home and Office Openspace boundary

The **Home** computer may perform development, tests, signed runtime,
environment-backed smokes, deploys, and other approved work under the normal
preflight, runbook, no-spend, and explicit-approval gates. Only recurring or
operational automation—scheduled runners, monitors, dispatchers, cron jobs,
queue consumers, and equivalent background automation—must be installed,
enabled, executed, and verified exclusively on **Office Openspace**.

## Native URL scheme and link boundary

Expo declares the local native URL scheme `duelwordsav`. This prevents the
framework `Linking` warning and gives native builds a stable custom-scheme
boundary. Expo Router uses `https://app.duelwords-av.avalsys.com` as its native
handoff origin; this removes the release-build fallback alert and matches the
planned canonical public invite/result host. It does not configure or prove
the `/i/c/:token` edge rewrite, Universal Links, or Android App Links, which
remain separate release gates.

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

## Brand assets

Deterministic SVG masters live in `assets/brand-source/`. Runtime PNG exports
and generated splash/onboarding illustrations live in `assets/images/brand/`.
Their private canonical promotion and review status are documented under
`private/avalsys-suite/docs/brand-system/duelwords-av/`. The family follows Tune
AV's shell mechanics and shared Avi V2/footer behavior while keeping a
DuelWords-specific icon and editorial imagery. Final owner visual sign-off on
the exact pixels remains mandatory before build `2`.

Validate the non-secret identity and assets before any native build:

```bash
pnpm run config:ios:check
pnpm run config:ios:check:dev
```

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

- `/word-duel/practice`: local practice engine with tiny non-production
  fixtures.
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
  EN/ES/CA/FR/DE; game language remains independent at EN/ES.
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
- Game languages are English and Spanish.
- Interface locale foundation exists for English, Spanish, Catalan, French,
  and German.
- Spanish input is accent-tolerant for vowels, while `ñ` remains distinct from
  `n`.
- Invalid guesses do not consume attempts.
- Feedback uses a duplicate-letter-safe two-pass algorithm.

The local fixtures are non-production test data. Connected gameplay will use
Apps AV API/D1 as dictionary and game authority, with Convex only as a safe
realtime projection.

The diagnostics runtime installs the native Sentry SDK with native crash
handling, zero tracing, no default PII, an allowlisted breadcrumb vocabulary,
and payload scrubbing that rejects game words, guesses, boards, room/invite/
player/session identifiers, provider identity, URLs, and account data. It
initializes disabled in debug builds or when no DSN is present. A release-like
smoke against the owner-approved Sentry project is still required before the
next TestFlight candidate.
