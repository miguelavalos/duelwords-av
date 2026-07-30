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

- Recurrent connected-round rule: Convex publishes the authoritative
  `serverNow`/round-deadline pair only when safe room state changes; it is not a
  one-second clock. Anchor the foreground UI clock from that server delta and
  tick it locally. When the safe projection becomes `round_resolving`, recover
  the caller's private round snapshot and request the idempotent
  `open-next-if-due` transition after the server pause. If another device opens
  the next round first, the newer projection must also recover and merge every
  skipped private snapshot without replacing the new round's interactive
  state. A late snapshot may resolve an older row but must never disable the
  current keyboard. Never require manual Refresh/Sync/Next actions for normal round progression, and keep
  `active-duel-live-round.test.ts` green.

- Recurrent configurable-board rule: the active controller must construct its
  first view model from the lobby handoff's `wordLength` and `maxAttempts`.
  Never fall back to the five-letter/six-attempt engine constants after a
  connected lobby has selected different rules. Every later row replacement,
  timeout, reveal, and local/mock safe-game projection must preserve that
  configured shape. Keep the connected 7-letter/8-attempt assembler regression
  in `runtime-controller.test.ts` and the row/marker regression in
  `view-model.test.ts` green.

- Recurrent rematch handoff rule: an accepted rematch proposal carries the
  safe `nextGame` but no realtime session. Recover a backend-issued realtime
  session for each participant before presenting the next lobby; otherwise the
  recipient cannot observe the host's countdown/start transition and remains
  stranded in the lobby. Keep the recovery helper shared with active-duel
  opening and cover lobby-time recovery in `connected-runtime.test.ts`.
  Rematch state is participant-scoped API state rather than part of the safe
  realtime room projection. While both players remain on the result, keep its
  detection interval bounded to one second instead of backing off, make the
  first request/accept tap visibly busy, and keep sent/received/accepted sync
  state prominent until both players enter the next lobby.

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
- Official five-language Daily at `/word-duel/daily`. It obtains only the
  selected target once per uncached local date, time zone, and game language;
  validates that target against the bundled allowlist; and keeps guesses,
  feedback, resume state, completion, participation streak, and safe sharing
  on the device. Keep Daily free of Convex, polling, heartbeat, per-guess API
  calls, account identifiers, and automatic fetches on render.
- Navigation contract: the full product wordmark belongs only to Home chrome,
  splash, and onboarding. Every product-facing interior route must use
  `InteriorScreenHeader` with the icon-only 44-point Back control; never add a
  visible top `Done`/`Close` label. Active games hide shell navigation and give
  the board plus complete keyboard priority. Secondary Daily metadata belongs
  behind its information disclosure. Keep
  `src/ui/screen-navigation-contract.test.ts` green when adding routes.
  The connected Challenge route is additionally protected from native
  swipe-back while a player may be in a live journey. Keep iOS back gestures
  disabled for that route, confirm every explicit exit from a joined/created
  lobby or active round, and retain only a volatile resumable lobby snapshot.
  React Native Web's `Alert.alert` is a no-op, so browser confirmation must use
  the platform-specific web confirmation boundary and retain its cancel/confirm
  regression. Never infer web protection from the native Alert path.
  The web game board must accept physical letter keys, Enter, and
  Backspace/Delete through the platform hardware-keyboard hook. Do not capture
  modified shortcuts, repeated keydown events, or typing inside editable fields.
  Never persist or reuse realtime credentials; recovery must request a fresh
  backend-issued session before resubscribing. Home must expose a direct return
  action while that volatile session exists.
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
- Stats and Rivals use a bounded device-only activity store. Keep at most 100
  completed summaries and derive at most 20 recent human opponents. Persist
  only mode, game language, outcome, attempts, completion time, and an optional
  safe opponent display name; never add targets, guesses, feedback, boards,
  raw game/player ids, invite tokens, email, provider subjects, public profiles,
  contact search, or presence. Account sign-in must not be required or imply
  cross-device sync for these V1 summaries.
- Hidden connected final-result recovery and rematch API panel. Participant
  result and current rematch discovery remain explicit Apps AV API/D1 reads;
  accepted `nextGame` can continue into the next connected lobby. This flow is
  still hidden and is not public result-screen navigation.
- Local Solo/Daily demo and deterministic Play Avi bot-duel preview. The demo
  remains a non-production fixture route; the public Daily route is the
  official `DW-013` implementation, while Play Avi remains device-local.
- Sentry diagnostics facade backed by `@sentry/react-native`, disabled in debug
  builds or without a DSN and scrubbed against game/account secrets.
- Bundled offline EN/ES/CA/FR/DE allowlists and versioned curated target decks.
  Every language has exactly 750 solutions at each supported 5/6/7-letter
  length. Keep accepted guesses broader than solutions; edit the authoritative
  `src/game/dictionaries/curated-targets/` deck instead of allowing the Gaia
  generator to re-rank targets. Preserve the common-noun/adjective policy,
  proper-name/verbal-form exclusions, embedded deck SHA, and
  `curated-targets.test.ts` parity gate.
  Practice, Solo Practice, and Play Avi share a persistent shuffled deck per language and must
  not repeat a target before exhausting that deck. Keep target selection local;
  only official Daily may obtain its chosen word from the server, and only
  once before device-local play begins.
- Any future playable or interface language must follow
  `docs/game-language-expansion.md` and the mandatory private
  `docs/duelwords-av/game-language-expansion-runbook.md`. A picker option is
  never sufficient: client/local data, API, every D1 language constraint,
  isolated Convex schema, create-to-rematch smoke, observability, and rollback
  must agree before it is called supported end to end.
- Account AV/Clerk native integration and the already-uploaded internal build 1
  exist. DuelWords production API/Convex runtime was separately activated and
  passed its controlled full-flow smoke on 2026-07-26. The later five-language
  rollout applied D1 migrations `0071` and `0072`, activated the pinned
  CA/FR/DE dictionaries and matching validators, and passed one bounded
  production lifecycle smoke per new language through rematch and next lobby.
  Production native config may therefore enable all five Challenge languages.
  Signed physical iPhone+iPad acceptance, post-V1 advertising, real Pro purchase, push, a
  replacement TestFlight build, or any further production deploy still
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
- The dedicated `web-edge` Worker is an invitation handoff boundary, not an API
  or app backend. It may serve only AASA, a neutral `/i/c/<token>` fallback,
  and method/not-found responses. It must not bind or call Apps AV API, D1,
  Convex, Account AV, analytics, ads, or any other service; must not log invite
  tokens; and must keep invocation logs off. A production deploy still requires
  its own preflight and exact approval.
- The separate `legal-edge` Worker may serve only the public DuelWords
  commercial home in EN/ES/CA/FR/DE, Privacy, Terms, Support, Delete account,
  Notices, and bounded method/not-found responses. It must remain static and
  binding-free, with no browser JavaScript, forms, cookies, analytics, ads, or
  runtime API calls. It owns `duelwords-av*.avalsys.com`; never add that domain,
  commercial content, or legal content to the invitation/AASA Worker. Preview
  and production deployment each require the private legal-edge runbook and
  exact approval.

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

Recurrent native keyboard issue: rapid alternating fingers could leave a
five-letter row visually incomplete even though the atomic input buffer held
all five letters. There were two native causes: independent Pressable responders
competed during overlapping touches, and Fabric could collapse the intrinsic
width of the narrow `I` board glyph. Keep the keyboard inside the root
`GestureHandlerRootView`, route keys through its single manual gesture surface,
retain the short per-touch replay guard and native accessibility activation,
and preserve explicit width/centering on board letters. The keyboard regression
must continue to cover replayed native events and legitimate repeated letters;
native acceptance must cover rapid `RAISE` and repeated-letter `APPLE` entry.

The generated Expo Xcode project does not persist a development team. Keep the
canonical `scripts/ios/archive-release.sh` command explicit about the expected
Avalsys team and automatic signing; the release-workflow regression must fail
if either setting disappears. Do not fall back to an ad hoc archive command.
The canonical helper must regenerate the ignored production runtime before its
effective-config check so `.xcode.env.local` refreshes `NODE_BINARY`; never
preserve a stale Homebrew Cellar path across archive attempts.

A validated `.xcarchive` may still use an Apple Development profile because
App Store export re-signs it. Before calling a local TestFlight candidate
distribution-ready, run the no-upload canonical
`scripts/ios/export-release-ipa.sh` and require its exact App Store profile,
Apple Distribution authority, `get-task-allow=false`, production entitlements,
deep signature and IPA hash checks. Do not infer distribution readiness from
the archive signature alone.
