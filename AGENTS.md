# DuelWords AV Agent Notes

This is the public Expo client for DuelWords AV. Keep it client-safe.

Before touching signed native runtime, Account AV, billing, ads, Sentry,
Convex, Cloudflare/D1 remote state, push, TestFlight, store metadata, deploys,
or any paid/provider surface, run the private preflight from the workspace root:

```bash
bash private/avalsys-suite/scripts/agent-preflight.sh --app duelwords-av --intent code
```

Then read every document printed by that preflight and the relevant private
DuelWords AV runbook.

Current implementation slice:

- Expo Router SDK 57 shell.
- Versioned local preferences for interface locale (EN/ES/CA/FR/DE) and
  system/light/dark appearance. Word language is game-scoped: local modes and
  connected Challenge use EN/ES/CA/FR/DE. Web uses browser
  `localStorage`; native uses `expo-sqlite/localStorage/install`. Keep the
  platform-specific boundary so web never imports the SQLite WASM worker.
- Public guest-first `/word-duel/challenge` entry linked from Play. It supports
  canonical invite preview without auto-join, room-code lookup, explicit join,
  lobby/Ready/countdown, connected rounds, participant-scoped result recovery,
  no-spoiler sharing, and explicit refresh/rematch. It fails closed with no
  network calls while runtime config is disabled.
- Local Word Duel practice.
- Local invite/lobby/Ready/countdown preview wired through the lobby
  controller's `local_mock` source, with no real links, share sheet, API, or
  Convex runtime.
- Local active-duel preview with typed mock active gameplay API adapter.
- Local active-duel realtime projection mock aligned with the client-safe
  Convex room-view, heartbeat, and reaction surface.
- SDK-shaped Convex realtime projection adapter boundary. It wraps only an
  injected client with `query`, `mutation`, and `watchQuery`, targets only
  `getActiveRoomView`, `sendPresenceHeartbeat`, and `sendReaction`, parses
  only safe room/player/presence/reaction fields, and fails closed on target,
  guess, dictionary, real feedback, identity, provider, deploy-key, auth-token,
  push-token, or email payloads.
- Client-safe realtime config boundary for
  `EXPO_PUBLIC_DUELWORDSAV_CONVEX_URL` and
  `EXPO_PUBLIC_DUELWORDSAV_CONVEX_REALTIME_DISABLED`, with realtime still
  disabled by default and no deploy-key exposure. Only the hidden internal
  connected route may construct an app-level Convex client, and only when
  explicit runtime config is enabled.
- Real Convex SDK bridge under `src/game/word-duel-runtime/convex-client-factory.ts`.
  It uses `ConvexReactClient` plus `makeFunctionReference`, maps only
  `getActiveRoomView`, `sendPresenceHeartbeat`, and `sendReaction`, rejects
  unapproved query/mutation refs, imports no generated Convex API files, and
  exposes `close()` for lifecycle cleanup.
- Composed runtime client factory plus Expo hook under
  `src/game/word-duel-runtime/`. It may create the Apps AV API client and
  Convex realtime projection only when client-safe API and realtime configs are
  both enabled and a Convex client factory is present. The Expo hook supplies
  the real SDK bridge by default and disposes the bundle on cleanup. It fails
  closed by default and is not wired into the demo routes.
- Client-side parser for backend-issued active-duel realtime session envelopes:
  `realtimeSessionId`, `roomToken`, and `side` only.
- Typed, fetch-injected Apps AV API client boundary for invite preview, room
  code lookup, create/join/cancel invite, lobby, Ready, start, and realtime
  session recovery, plus round-scoped active submit, timeout, and
  open-next-if-due commands and own-round snapshot recovery. It is tested with
  fake fetches and is used by the public challenge route and hidden internal
  connected route only behind explicit runtime config.
- Client-safe Apps AV API runtime config boundary for
  `EXPO_PUBLIC_DUELWORDSAV_API_BASE_URL` and
  `EXPO_PUBLIC_DUELWORDSAV_API_DISABLED`. API calls stay disabled by default,
  and the runtime factory returns no HTTP client unless explicitly enabled with
  a valid HTTPS base URL.
- Lobby controller boundary with `local_mock`, `disabled_runtime`, and injected
  `apps_av_api` sources. It maps API lobby/start payloads into UI-safe lobby
  state, keeps the demo on local mock, and powers the public challenge route
  only when the explicit runtime gate is enabled.
- Local lobby-to-active handoff boundary. `/word-duel/lobby-demo` can open
  `/word-duel/active-demo` only through typed public V1 route params; the
  handoff never carries game ids, player ids, targets, dictionary metadata,
  guesses, feedback, realtime tokens, account state, provider state, or a real
  runtime session.
- Active-duel controller boundary with `local_mock`, `disabled_runtime`, and
  injected `apps_av_api` sources. The screen must call high-level controller
  methods and must not own demo game ids, player ids, room tokens, realtime
  session ids, actor details, target data, dictionary data, opponent guesses,
  or opponent feedback.
- Runtime-safe active-duel controller assembler. It may create `apps_av_api`
  only from an Apps AV API lobby state, player session, backend-issued realtime
  session, enabled runtime config, and injected Convex realtime adapter or
  SDK-shaped Convex client; missing pieces must fail closed to
  `disabled_runtime`, without polling or alternate realtime transports.
- Hidden internal connected route `/word-duel/connected-runtime`. It is
  registered in the stack but not linked from Play and not included in
  `WORD_DUEL_ROUTE_PATHS`. It uses the composed runtime hook, creates no API
  calls on mount, sends create/join/refresh/Ready/start/submit/timeout/open-next/
  own-snapshot through Apps AV API user actions, recovers backend-issued
  realtime sessions before active subscription, and uses Convex only for safe
  room-view subscription, heartbeat, and closed-set reactions.
- Local connected-runtime smoke test for Apps AV API lobby create/Ready/start
  into active runtime with a fake React client routed through the real Convex
  SDK bridge. It remains local-only and must not call live Convex or Apps AV
  API.
- Runtime client gate tests covering disabled config, partial config, missing
  Convex injection, factory failure, and ready injected runtime. Keep these
  tests green before any activation step.
- Real Convex SDK bridge activation followed the private
  `docs/duelwords-av/convex-sdk-activation-plan.md`. Do not import generated
  Convex API files, enable realtime config in committed runtime, wire demo
  routes to runtime clients, run Convex deploy/codegen ad hoc, or expose
  connected gameplay outside the hidden route and approved activation gates.
- Local finalized result preview with post-finalization target reveal,
  completed-board review, safe share preview, and local rematch proposal state
  machine.
- Hidden connected final-result recovery and rematch API panel. Participant
  result and current rematch discovery remain explicit Apps AV API/D1 reads;
  accepted `nextGame` can continue into the next connected lobby. This flow is
  still hidden and is not public result-screen navigation.
- Local Solo/Daily preview and deterministic Play Avi bot-duel preview. These
  are local product-shape slices only; they do not implement the authoritative
  API/D1 modes planned by `DW-013` and `DW-014`.
- Sentry diagnostics facade backed by `@sentry/react-native`, disabled in debug
  builds or without a DSN and scrubbed against game/account secrets.
- Bundled offline EN/ES/CA/FR/DE allowlists and frequency-ranked target decks.
  Practice, Solo Practice, and Play Avi share a persistent shuffled deck per language and must
  not repeat a target before exhausting that deck. Keep target selection local;
  only a future official Daily may obtain its chosen word from the server.
- Account AV/Clerk native integration and the already-uploaded internal build 1
  exist. DuelWords production API/Convex runtime was separately activated and
  passed its controlled full-flow smoke on 2026-07-26; production native config
  may therefore enable connected Challenge. Live ads, real Pro purchase, push,
  a replacement TestFlight build, or any further production deploy still
  requires its own explicit authorization.
- Expo provider buttons must remain unavailable until Clerk's auth, legacy
  sign-in, and legacy sign-up resources are all loaded. After Apple or Google
  returns a created session, activate that exact session and end the provider
  action at the awaited `setActive` boundary. Resolve the internal Account AV
  user from the subsequent observed auth-state transition through the stable
  token adapter. Never inspect the pre-activation Clerk snapshot to resolve the
  new session, and never report temporary Account AV API failure as an Apple or
  Google provider failure.
- Treat `account.user`, not `account.user.displayName`, as the signed-in signal
  on gameplay surfaces. An Account AV user may legitimately have no display
  name; use a localized bounded player label and never fall back to a random
  guest alias, provider subject, or email for an authenticated room actor.

This machine is **Home**. Home may perform development, tests, signed runtime,
environment-backed smokes, deploys, and other approved work under the normal
preflight, runbook, no-spend, and explicit-approval gates. Only recurring or
operational automation—scheduled runners, monitors, dispatchers, cron jobs,
queue consumers, and equivalent background automation—must be installed,
enabled, executed, and verified exclusively on **Office Openspace**.

Current cumulative status and blockers are owned by the private
`docs/avi-words/current-work-handoff.md`. Planning documents and dated slice
records are historical evidence; do not interpret an early scope exclusion as
the cumulative current state.

Read the exact versioned Expo docs at
https://docs.expo.dev/versions/v57.0.0/ before framework-level changes.
