# DuelWords AV

Mobile-first Expo client for DuelWords AV.

This repo currently contains the early local client slices: app shell, local
Word Duel practice, a pure TypeScript word engine, typed interface locale
foundation, tiny hand-authored EN/ES fixtures for tests and practice, and a
local invite/lobby/Ready/countdown preview, active-duel preview screen for the
V1 1v1 mobile layout with a typed mock adapter for the approved round-scoped
active gameplay API contract plus a local mock adapter for the approved
Convex-safe realtime projection contract, an SDK-shaped injected Convex
realtime adapter for that same safe projection surface, and a local
post-finalization result preview with rematch proposal states. It also includes
a local Sentry-shaped diagnostics facade with no provider traffic. A
client-safe realtime config boundary and backend-issued realtime session
envelope parser exist, and a closed real Convex SDK bridge can build the three
approved function references without generated API imports. Realtime and Apps
AV API runtime config are still disabled by default. A typed, injected Apps AV
API client boundary exists for invite, lobby, Ready, start, realtime-session
recovery, active round command flows, and own-round snapshot recovery. A
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
route at `/word-duel/connected-runtime` can use those clients when runtime
config is explicitly enabled, but it is not linked from public play navigation
and the demo routes remain local.

It does not contain production dictionaries, enabled-by-default Apps AV API
network calls, enabled-by-default Convex runtime connections, generated Convex
API imports, Account AV login, Sentry SDK wiring, Sentry DSNs, ads, Pro, push
notifications, store metadata, bundle ids, provider keys, or deploy
configuration.

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
pnpm run web
```

The web dev server uses port `8098`.

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

The client is fetch-injected for tests, sends the canonical app id
`duelwordsav`, accepts an optional bearer token provider, parses only safe
invite/lobby/game/realtime/active fields, rejects sensitive realtime payloads,
and drops unexpected target, dictionary, opponent guess, and opponent feedback
fields. Active command responses cover submit, timeout, and open-next summaries
only. The own-snapshot response can reveal the caller's own submitted display
word and own feedback after backend resolution, while the opponent remains only
`waiting`, `submitted`, or `timed_out`.
`src/game/word-duel-lobby/runtime-api-client.ts` only constructs the HTTP client
when the runtime config is explicitly enabled.
`src/game/word-duel-lobby/controller.ts` wraps the local lobby preview, disabled
runtime, and injected Apps AV API client behind the same controller shape, and
maps API lobby/game payloads into UI-safe state without exposing game ids,
player ids, target ids, dictionary metadata, guesses, or feedback through the
lobby view-model. `/word-duel/lobby-demo` is wired through the controller using
the `local_mock` source only, so the app still makes no real Apps AV API calls
by default.

`src/game/word-duel-active/handoff.ts` defines the local-safe handoff from
the lobby preview to the active duel preview. `/word-duel/lobby-demo` can only
open `/word-duel/active-demo` after the lobby reaches `active_round`, and the
handoff route params contain only public V1 settings: language, `human_duel`,
word length, max attempts, and local demo source. They never carry game ids,
player ids, targets, dictionary metadata, guesses, feedback, realtime tokens,
sessions, account state, or provider state.

`src/game/word-duel-active/controller.ts` wraps active gameplay behind the same
source idea: `local_mock` for the demo, `disabled_runtime` for fail-closed
runtime attempts, and injected `apps_av_api` for future connected active
commands. It owns the demo actor, game id, player id, room token, and realtime
session id in local mode, accepts backend-issued session details in runtime
mode, and exposes only high-level UI actions such as submit guess, heartbeat,
reaction, subscription, timeout, open-next-round, and own-round snapshot
refresh. The injected Apps AV API source uses the typed HTTP client plus a
client-safe realtime projection client; it updates only the caller's board from
own snapshots and keeps opponent letters/feedback abstract.
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

`/word-duel/result-demo` is also local-only. It does not call result APIs,
native share, public result links, Convex post-finalization runtime, ad SDKs,
Pro, Account AV, Sentry, push, or any remote provider. The local rematch model
does not create a new game id; it only creates a start request after recipient
acceptance.

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

The diagnostics facade is local-only. It defines the no-spoiler Sentry privacy
contract and initializes disabled when no DSN is present; it does not install
the Sentry SDK or send events.
