# Adding a game language to DuelWords AV

This is the client-safe implementation guide for extending DuelWords AV beyond
its current EN/ES/CA/FR/DE catalog. It covers the public Expo/native repository.
The private Apps AV repository owns the API, D1, Convex, remote smoke,
deployment, and rollback procedure; complete its mandatory
`docs/duelwords-av/game-language-expansion-runbook.md` before describing a new
language as supported end to end.

This guide is not deployment, signed-runtime, TestFlight, provider, or remote
state authorization.

## Keep the two language settings separate

- `InterfaceLocale` controls app text and is selected in Settings.
- `GameLanguage` controls accepted words and targets and is selected inside a
  game.

The Home screen must not gain a game-language selector. Adding one concept does
not automatically add the other.

Use one lowercase canonical code across the client and backend. If a language
needs a region or script subtag, agree the cross-stack identifier first; the
current implementation and generated filenames use two-letter codes.

## 1. Define the word contract first

Before code or generated assets, record:

- alphabet and any dedicated keyboard key;
- case, accents, apostrophes, ligatures, and normalization;
- how a displayed word becomes exactly five normalized game letters;
- dictionary source, pinned revision, source path, license, and SHA-256;
- valid-guess policy versus the smaller target-word policy;
- target count, frequency/ranking source, exclusions, and human curation state.

Local native modes bundle their word lists. Practice, Solo Practice, and Play
Avi must not request a server word list during play. Connected Challenge is
server-authoritative. Daily is the only mode allowed to obtain its one selected
word from the server, once per uncached local date/time-zone/language scope;
every guess and result remains device-local.

Current generators are:

- `scripts/generate-local-dictionaries.mjs` for reviewed JSONL fixtures;
- `scripts/generate-gaia-local-dictionaries.mjs` for the pinned Mozilla Gaia
  sources currently used by the five-language bundle.

The Gaia generator contains explicit `SOURCES`, `TARGET_COUNTS`, and
`TARGET_EXCLUSIONS` entries. Update all three when that source is appropriate.
Use a separate generator when it is not; do not label another source as Gaia.
Generation must be deterministic and its source hashes must be pinned.

Add the resulting checked-in file at
`src/game/dictionaries/generated/<code>.json` and update
`THIRD_PARTY_NOTICES.md` with source, license, counts, target policy, and local
modifications.

## 2. Update the complete client catalog

The main implementation surfaces are:

| Concern | File or directory |
| --- | --- |
| Closed game-language type | `src/game/word-duel-engine/types.ts` |
| Normalization/allowed letters | `src/game/word-duel-engine/normalize.ts` |
| Picker catalog/native label | `src/i18n/locales.ts` (`GAME_LANGUAGES`) |
| Connected catalog | `src/features/word-duel/connected-languages.ts` |
| Bundled imports/profile | `src/game/dictionaries/local-fixtures.ts` |
| Persistent shuffled targets | `src/game/dictionaries/target-rotation.ts` |
| Picker/accessibility/adaptive layout | `src/features/word-duel/components/game-language-picker.tsx` |
| Local modes | `src/features/word-duel/` and `src/game/word-duel-*` |
| Official Daily target/cache/streak | `src/game/word-duel-daily/` |
| Connected API parsing | `src/game/word-duel-lobby/`, `word-duel-active/`, `word-duel-result/`, `word-duel-runtime/` |
| Route parameters | `src/features/word-duel/word-duel-route-params.ts` |
| Source/release docs | `README.md`, `THIRD_PARTY_NOTICES.md`, this guide |

Run a broad discovery before editing. Closed unions, exhaustive records, mock
words, route parsers, and tests may exist outside the table above:

```bash
rg -n "GameLanguage|GAME_LANGUAGES|CONNECTED_GAME_LANGUAGES|language.*en|en.*es|dictionary|target" \
  src scripts README.md THIRD_PARTY_NOTICES.md
```

Do not merely append a picker option. Prove all of these behaviors:

- a known valid word is accepted locally;
- invalid words remain rejected locally;
- every curated target is in the valid-guess allowlist;
- normalization handles the language's difficult letters and agrees with the
  server contract;
- the keyboard can enter every supported normalized letter;
- Practice, Solo Practice, and Play Avi can complete a full game offline;
- Play Avi reveals only aggregate opponent clues, never its word or letters;
- target rotation persists separately per language, exhausts a shuffled deck
  before reuse, and avoids a repeat at the cycle boundary;
- changing game language resets the game but does not change interface locale;
- Challenge create, invite preview, join, active play, final result, sharing,
  and rematch preserve the selected language;
- the picker remains readable, scrollable, and accessible on compact iPhone and
  adaptive iPad layouts.

`src/game/five-language-game-contract.test.ts` is the current executable parity
guard even though its filename reflects the present catalog. Update its
expected catalog and assertions. Update every exhaustive test fixture found by
the discovery command, especially dictionary, target rotation, engine, picker,
route-param, connected journey, result, and rematch tests.

## 3. Add an interface locale only when intended

If the app interface is also being translated, update:

- `InterfaceLocale`, `INTERFACE_LOCALES`, and `copy` in
  `src/i18n/locales.ts`;
- product copy maps such as `src/i18n/experience-copy.ts`, public Challenge
  copy, result copy, account/deletion copy, and shared Apple localization;
- preference parsing/migration and system-locale selection;
- native shared-Apple strings in `native/shared-apple/`;
- locale completeness and no-English-fallback tests.

Review new English player-facing copy first, then translate that approved
meaning. User surfaces must not mention implementation concepts such as API,
D1, Convex, Worker, runtime, schema, projection, token, deployment, or provider
state. Reuse shared Apps AV wording for common Account, Settings, paywall,
deletion, legal, support, splash, onboarding, and auth surfaces; only game
content is DuelWords-specific.

## 4. Validate locally before backend rollout

Run the repository gate:

```bash
pnpm test
pnpm run typecheck
pnpm run lint
pnpm run doctor:react:diff
```

Regenerate dictionaries only with the reviewed deterministic command, then
require no unexpected diff on a second generation. Check generated counts and
hashes and review the notice changes.

Native acceptance must cover:

- compact iPhone and adaptive iPad;
- light/dark appearance where affected;
- the complete picker without clipping;
- one valid Practice submission;
- one complete automatic Play Avi response;
- fast five-letter entry and immediate submit;
- language change/reset;
- connected two-client create-to-rematch after the backend has been deployed;
- background/foreground and session restoration without duplicate requests.

Follow the private preflight and native cache-hygiene rules before signed or
simulator work.

## 5. Coordinate the server rollout

The client can be source-complete while production is not. The private rollout
must independently add and verify:

- API validators, service type, normalization, and route tests;
- every D1 table with a language constraint, including dictionaries, games,
  and rematch proposals;
- deterministic server dictionary import and immutable release metadata;
- both the workspace Convex schema and the isolated schema embedded in the
  DuelWords deploy wrapper;
- the full create-to-rematch lifecycle smoke for the new language;
- bounded Worker/Convex logs and normal Cloudflare request/error/CPU volume;
- exact Worker rollback and a client gate that keeps the language unshipped
  until the backend passes.

Never infer D1 constraints from TypeScript. The live `sqlite_master` definitions
must be inspected because SQLite `CHECK` constraints can remain narrower than
the application type, as happened with rematches during the CA/FR/DE rollout.

## Definition of done

A game language is end-to-end supported only after:

- its source, license, hashes, normalization, valid guesses, and curated targets
  are recorded;
- all local modes complete offline on iPhone and iPad;
- all connected phases through accepted rematch pass against the intended
  backend;
- client, API, every D1 constraint, Convex workspace schema, isolated deploy
  schema, and smoke catalog agree on the same code;
- logs show no secret/word leak, request storm, retry loop, or abnormal CPU;
- public notices and private rollout/handoff docs are current;
- every added interface locale is complete and player-facing.

Until then, call the language prepared, client-ready, or partially rolled out;
do not call it fully supported.
