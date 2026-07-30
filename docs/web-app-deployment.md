# DuelWords AV web application

The playable web application is a static Expo Router export served by a small
Cloudflare Worker with Static Assets. It reuses the same screens, local game
engine, dictionaries, preferences, Account AV boundary, and connected
Challenge clients as iPhone and iPad.

## Public surfaces

| Purpose | Preview | Production |
| --- | --- | --- |
| Playable application | `play.duelwords-av-preview.avalsys.com` | `play.duelwords-av.avalsys.com` |
| Commercial and legal | `duelwords-av-preview.avalsys.com` | `duelwords-av.avalsys.com` |
| AASA and invitation handoff | `app.duelwords-av-preview.avalsys.com` | `app.duelwords-av.avalsys.com` |

These are deliberately separate Workers. The playable host cannot change the
commercial/legal site or the iOS association file. The invitation fallback
offers both the native handoff and a link into the matching playable host, but
does not read challenge state or log the invitation token.

## Runtime and security boundary

`pnpm run web:artifact` creates one environment-neutral `dist/` export and an
ignored provenance stamp containing its source commit and content hash. No API
URL, Convex URL, Clerk publishable key, private credential, or server secret is
baked into that export.

The app-host Worker serves a blocking `/runtime-config.js` before the Expo
bundle. Deployment resolves only client-safe values through the private,
read-only Infisical/Varlock workflow and writes an ephemeral mode-600 Wrangler
config. The Worker validates the environment, exact API origin, Clerk key
class, and Convex HTTPS host; invalid config returns `503` and the client fails
closed. The temporary config is deleted on exit.

The Worker accepts only `GET` and `HEAD`, has only the `ASSETS` binding, and has
no D1, KV, R2, service, queue, cron, analytics, or logging binding. HTML is
revalidated, hashed assets are immutable, runtime config is `no-store`, and
responses receive CSP, frame, referrer, MIME, opener, and permissions headers.
Account AV uses Clerk's browser session and the existing Apps AV identity and
access endpoints. Guest play never requires sign-in. DuelWords Pro remains an
informational web surface: the web app does not sell, restore, or redeem a
subscription.

The shared Apps AV API explicitly allows only the two playable web origins.
Adding an origin requires the private runbook and an API Worker deployment; a
wildcard is not permitted.

## Build and validate

Use Node 22 and pnpm 11.9. From a clean, approved public commit:

```bash
pnpm install --frozen-lockfile
pnpm run verify
pnpm run lint
pnpm run doctor:react:diff
pnpm run web:types
pnpm run web:artifact
pnpm run web:artifact:verify
pnpm run web:app:check:preview
pnpm run web:app:check:production
pnpm run web:edge:check:preview
pnpm run web:edge:check
git diff --check
```

The artifact verifier refuses a dirty repository, a changed source commit, or
a changed `dist/`. Both deployment commands must consume the exact same stamp
and hash.

## Deploy and roll back

Deployment is preview-first and stops on the first failed gate. The private
runbook owns authorization, CORS/API ordering, remote baselines, bounded smoke,
version evidence, and rollback.

```bash
pnpm run web:deploy:preview
# Validate HTTP headers, runtime fail-closed behavior, Account AV UI,
# local modes, and a complete preview Challenge journey.
pnpm run web:deploy:production
```

Production may run only while the repository commit and artifact stamp still
match the already accepted preview artifact. Rollback selects the recorded
previous Worker version; it does not rebuild. On a first deployment with no
previous version, remove only the newly created app-host Worker/custom domain
after recording evidence. API CORS and invitation-edge rollback are separate
operations and must use their own recorded versions.
