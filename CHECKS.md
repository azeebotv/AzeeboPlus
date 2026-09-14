# Check Reference

Every `check:*` script in this repo, the invariant it enforces, and where it
fails. If a CI job is red, find the check below — the **Fails when** list is
exhaustive and the **Fix** is the remedy that made CI green before you.

Two conventions hold across all of them:

- **Core/CLI split** — rule logic lives in `scripts/lib/<name>-core.mjs`, the
  CLI entry in `scripts/check-<name>.mjs` only resolves paths, prints, and
  exits. Every core module has fixture-based unit tests in
  `scripts/__tests__/` (run by CI's conventions job via
  `node --test scripts/__tests__/*.test.mjs`).
- **Exit codes** — `0` = invariant holds (or advisory-only findings), `1` =
  violation. Checks that need a database (migrations/deployed-schema/drift)
  create and drop throwaway shadow databases; they never touch real data.

---

## Where each check runs

| Check | CI job (`.github/workflows/pr-checks.yml`) | Other gates |
|-------|--------------------------------------------|-------------|
| `check:flags` | Flag & Swagger Conventions | — |
| `check:flags:docs` | (flag registry doc sync) | — |
| `check:lint-ratchet` | Lint PR + lint.yml backend lint (right after `pnpm -r lint`) | baseline may only move down |
| `check:prisma` | Flag & Swagger Conventions | — |
| `check:dev-wiring` | Flag & Swagger Conventions | — |
| `check:build-chain` | Flag & Swagger Conventions | — |
| `check:git-hooks` | Flag & Swagger Conventions | — |
| `check:ci-dark` | CI Dark Watchdog (schedule + workflow_dispatch) | — |
| `check:env` | Flag & Swagger Conventions | — |
| `check:seed-image-hosts` | Flag & Swagger Conventions | — |
| swagger-consistency | Flag & Swagger Conventions (invoked directly) | — |
| `check:prisma-client` | Type Check PR (runs first, right before `pnpm run typecheck`) | Docker build T8 stage; opt-in pre-commit hook |
| `check:prisma-migrations` | Prisma Migrations Drift | posts drift comment + artifacts on failure |
| `check:deployed-schema` | Prisma Migrations Drift | the literal "schema lock" |
| `check:live-drift` | Prisma Live Drift (advisory, `--seed` mode) | nightly-style live sweep |
| `check:live-schema-lock` | none (report only, never fails a PR) | read-only probe of live DBs |
| `check:upstreams` | none (startup advisory; `--strict` for CI) | run after `start-all.sh` |
| route-contracts | none (manual dev tool) | client↔gateway contract audit |

---

## Code & conventions

### `check:flags` — flag conventions

**Invariant:** feature flags are registered, named, and guarded uniformly.

Fails when:

1. a flag key is used in code but missing from the registry in
   `packages/feature-flags/src/registries.ts` (or vice versa);
2. universe sentinels drift — canonical `UNIVERSE_SLUGS`, sentinel keys,
   builder args, nav-config `flag:` values, or gateway derivation disagree;
3. a shared dynamic NestJS module is registered more than once per workspace;
4. `FeatureFlagGuard` appears without a matching `@FeatureFlag` (A-8).

**Fix:** the error names the registry entry or decoration to add.

### `check:flags:docs` — flag registry docs sync

**Invariant:** the generated per-service flag reference appendix matches the
registry byte-for-byte (it's `generate-flag-registry-table.mjs --check`).

**Fix:** `node scripts/generate-flag-registry-table.mjs` (regenerates), commit.

### `check:lint-ratchet` — per-rule lint warning ratchet

**Invariant:** the count of `azeebo-custom/require-map-and-throw` warnings
per workspace never exceeds the committed baseline
(`scripts/lint-warning-baseline.json`) — and the baseline only moves down.

A plain `--max-warnings` cannot enforce this ratchet: it counts ALL warnings,
so an unrelated `console.log` could mask ratchet growth (or hide a real
regression). This gate counts warnings **per rule and per workspace**.

Fails when: any workspace's count exceeds its baseline. Workspaces absent
from the baseline are compared against **0** — new services cannot ship with
warnings. Dropping below the baseline does not fail; run `--update` to lock
in the improvement (otherwise a later PR could grow back to the old count).

**Fix:** migrate the flagged catch blocks to `mapAndThrow` — or, if you
reduced warnings, `node scripts/check-lint-warning-ratchet.mjs --update` to
lower the floor. Fully-converted services move to the `error` block in
`eslint.config.js` and can be deleted from the baseline.

### `check:seed-image-hosts` — seeder media hosts ↔ web image allowlist

**Invariant:** every seeder media URL is built through the shared registry
(`scripts/seeders/seed-image-hosts.ts` → `seedImageUrl()`/`seedImages`), and
every host registered in `SEED_IMAGE_HOSTS` is allowlisted in
`apps/web/next.config.js` → `images.remotePatterns`.

**Fails when:**
- a registered seed host is missing from the web allowlist
  (`HOST_NOT_ALLOWLISTED`) — seeded records using it crash `next/image` at
  render time (the `cdn.azeebo.test` music-cover incident);
- a TS seeder emits a raw URL literal instead of routing through the module
  (`HARDCODED_MEDIA_URL`) — flagged even when the host is already registered,
  so emission cannot drift out of the single source;
- **any** seed-data source emits a URL the web allowlist doesn't cover
  (`EMISSION_NOT_ALLOWLISTED`) — scans `scripts/demo-content` and
  `scripts/database` recursively (SQL/CSV/backups/TS), the raw-SQL layer that
  can't route through the TS module. Matching models Next.js remotePatterns
  semantics exactly: `*.suffix` covers exactly one label (never the apex,
  never two), `**.suffix` covers one-or-more (never the apex);
- an allowlist entry fully covered by another entry
  (`REDUNDANT_ALLOWLIST_ENTRY`) — literal duplicate, exact host under a
  wildcard, `*` shadowed by `**` (same or deeper suffix). Keeps the config
  minimal so every entry earns its place and the authorizing entry for a
  host stays unambiguous. Wildcards never cover their own apex, so
  `azeeboplus.com` + `*.azeeboplus.com` is a legal pair.

**Exemptions (links, never optimizer input):** instagram.com / youtube.com
hosts, and link-shaped URLs (`/terms`, `/privacy`, `/live/...`) such as the
apex-domain terms-of-service settings rows.

**Fix:** register the host in `SEED_IMAGE_HOSTS` **and** the web allowlist,
then build the URL with a `seedImages` builder — or use an existing builder.
For non-TS seed data: allowlist the host, or add the URL's path shape to
`LINK_URL_EXEMPTIONS` (scripts/lib/seed-image-hosts-core.mjs) when it is a
page/stream link rather than media.

### `check:prisma` — unique-key lookups

**Invariant:** a `findFirst`/`findFirstOrThrow`/`findMany` whose `where`
filters on exactly the field(s) of a `@id`/`@unique`/`@@unique` constraint
should be `findUnique` — same result, indexed path, one-row guarantee.

**Fix:** switch the call to `findUnique`/`findUniqueOrThrow` with the
constraint's compound-key shape.

### swagger-consistency (no `check:` alias)

**Invariant:** every service with a NestJS `main.ts` sets up Swagger docs
(`/docs`) and declares an OpenAPI version in its `DocumentBuilder` config.
API versioning is owned by the api-gateway; services don't call
`setGlobalPrefix`.

**Fix:** add the `SwaggerModule.setup` / version declaration the error names.

### route-contracts (manual)

**Invariant:** every API call extracted from client code matches a route
declared in the gateway's `SERVICE_CONFIGS`. Exit 1 on mismatch.

**Run:** `node scripts/check-route-contracts.mjs`

---

## Dev & build infrastructure

### `check:dev-wiring` — shared runner wiring

**Invariant:** every workspace's dev/build scripts route through the shared
runners — the anti-drift guard for the bug class that produced 28 diverged
`start-dev.sh` copies.

Fails when:

- a service's `start:dev` ≠ exactly `bash ../../scripts/start-dev-service.sh`,
  or its `build` ≠ `bash ../../scripts/build-service.sh`;
- a package's `build` ≠ `bash ../../scripts/build-package.sh`;
- an app's `start:dev` ≠ `bash ../../scripts/start-dev-app.sh` — schema-owning
  apps (admin/creator) must wire it; a schema-owning app with **no**
  `start:dev` is also an error; schema-less apps (web) must *not* wire it;
- a legacy per-service `start-dev.sh` reappears;
- a shared runner file itself is missing.

**Fix:** set the script to the exact value the error names. There is no
per-workspace variant to choose — that's the point.

### `check:build-chain` — Docker build topology

**Invariant (all-in-one):** the `Dockerfile.all-in-one` build chain
topologically matches the real workspace dependency graph (56 workspaces,
dist-exporting packages built before their consumers).

Fails when: `ORDER_VIOLATION` (built before a dist-exporting dep),
`MISSING_FROM_CHAIN` (consumed dist package never built),
`UNKNOWN_PACKAGE` (chain references a deleted workspace), `DUPLICATE_BUILD`,
`CYCLE`, or `EMPTY_CHAIN`.

**Invariant (per-service Dockerfiles):** every `services/<group>/<svc>`
Dockerfile builds the service by routing through the workspace build script —
`pnpm --filter <svc> run build` from `/app`, or `WORKDIR …/<svc>` + bare
`pnpm run build` — and that script is still the shared runner
(`scripts/build-service.sh`). A hand-rolled `nest build`/`tsc` inside an
image skips prisma generate and the `dist/prisma/client` mirror, so the image
can ship a stale client even when every host build is correct.

Fails when: `NO_DOCKERFILE` (buildable service has no Dockerfile),
`NO_BUILD_STEP` (never routes through the workspace build script),
`DIRECT_BUILD_PROHIBITED` (any `nest build`/`tsc` compile line, even alongside
a routed step), or `RUNNER_NOT_ROUTED` (the Dockerfile faithfully executes a
build script that drifted off the runner — checked against the same
`EXPECTED_BUILD` constant `check:dev-wiring` enforces).

**Fix:** for the chain, apply the reorder/addition the error names
(source-exporting workspaces like `packages/auth` legitimately need no chain
entry — the check knows the difference). For per-service files, build with
`RUN pnpm --filter <svc> run build` following the sibling template.

### `check:git-hooks` — pre-commit hook integrity

**Invariant:** `scripts/hooks/pre-commit` exists, is executable, is tracked
with mode 100755 (fresh clones materialize an executable hook), and invokes
the stale-client checker. Any regression silently disables the local guard
for every new clone, so CI is the backstop.

**Fix:** restore/`chmod +x`/`git add scripts/hooks/pre-commit`.

---

### `check:ci-dark` — Actions darkness watchdog (scheduled, not a PR gate)

**Invariant:** CI cannot go dark silently. A "dark battery" is a workflow run
whose jobs all fail **without executing a single step** within minutes — the
signature of account billing blocks, spending-limit exhaustion, or runner
capacity loss. Not a code failure, and invisible to PR triage (red X, no log).

Behavior: a scheduled sweep (`.github/workflows/ci-dark-watchdog.yml`, every
30 min) classifies recent failed runs via
`scripts/lib/ci-dark-watchdog-core.mjs`, extracts the cause from job
annotations (e.g. the canonical billing message), and maintains ONE tracking
issue (`ci-dark` label): creates on first darkness, updates while it
persists, closes automatically when a sweep finds CI healthy, reopens if it
returns. During a full account outage the schedule itself can't run — the
same script doubles as a local-cron backstop (see RUNBOOK.md). A dev-machine
heartbeat — `scripts/ci-dark-launcher.sh install` (LaunchAgent, every 30 min,
`status`/`uninstall` to manage) — removes the two schedule blind spots
entirely: new workflows only register on the default branch, and a full
Actions outage kills the schedule itself.

The sweep also lifts stranded PRs: every **open PR whose head sha has dark
batteries** gets ONE marker comment (`azeebo:ci-dark-watchdog:pr`) — created
on first darkness, updated in place as the outage changes, no duplicate and
no churn on unchanged sweeps. PR heads are probed independently of the
issue sweep's branch scope (PR batteries attach to head shas, not the base
branch). Runs where jobs executed real steps are never commented — that's
author-triage territory, not darkness.

**Fix:** read the tracking issue's cause column; billing blocks need a human
in Settings → Billing & plans.

## Prisma client & schema

### `check:prisma-client` — generated client freshness

**Invariant:** the schema copy embedded in each generated client
(`<output>/schema.prisma`, or `node_modules/.prisma/client/schema.prisma` for
the default location) matches the workspace's `prisma/schema.prisma`
token-for-token (whitespace/comments ignored, so Prisma's formatter never
false-positives). All 33 schema-owning workspaces are verified.

Fails when: a client is `STALE` (generated from an older schema — CI's fresh
regeneration would otherwise mask it) or a custom-output client is `MISSING`.
Default-location workspaces report `UNVERIFIED` (not a failure) on a fresh
clone.

**Fix:** `pnpm run prisma:generate` (repo-wide) — the same command the Docker
build's T-1 step and the pre-commit hook's block message point at.

### `check:prisma-migrations` — migrations ↔ schema gate

**Invariant:** for every service, replaying `prisma/migrations` into a
throwaway shadow database reproduces `prisma/schema.prisma` exactly.

Fails when: `DRIFTED` (replayed shape ≠ schema — missing/hand-edited
migrations) or `BROKEN` (migrations can't replay from empty: failed
statement, unguarded destructive op, order bug). `BASELINE` is the explicit
opt-in escape hatch (`--update-baseline` writes the missing drift migration
and exits 0).

**Fix:** generate a migration for the schema change; never hand-edit applied
migration SQL. Requires a reachable PostgreSQL server.

### `check:deployed-schema` — the literal schema lock

**Invariant:** `prisma migrate deploy` into a throwaway database, then diff
deployed-DB ↔ `schema.prisma`, yields **zero** statements. Catches ledger
drift the shape check can't see: a failed migration `resolve`d as applied
without its SQL running, or migration files edited after being applied.

**Fix:** make the deployed ledger tell the truth — no advisory mode, no
classification: a clean chain deploys into the exact schema shape.

### `check:live-drift` — live-DB ↔ schema sweep

**Invariant (CI mode):** a database provisioned purely from the migration
chain matches `schema.prisma` — so a live-DB sweep can never find surprises.
Against real live DBs (local/advisory), classifies drift: `ADDITIVE` (safe,
exit 0), `DESTRUCTIVE`/`REVIEW` (exit 1; `--strict` fails on any drift).
Writes per-service SQL to `.drift-live-out/`.

### `check:live-schema-lock` — nightly live report (never fails a PR)

**Invariant (reported, not enforced):** each service's *real* database still
satisfies the schema lock right now. Read-only: ledger comparison
(unfinished migrations → `BLOCKED-LEDGER`, fossil rows / folder↔ledger
mismatch → `LEDGER-MISMATCH`) plus a `migrate diff`, classified with the
same regexes as `check:live-drift`.

---

## Environment & topology

### `check:env` — `.env.example` ↔ code ↔ env-validator

**Invariant:** following a service's `.env.example` verbatim produces a
service that boots.

Fails when: `MISSING-REQUIRED` (code `getOrThrow`s a key the example omits),
`MISSING-VALIDATOR-REQUIRED` (`validateEnvironment()` requires it, example
omits it), or `VALIDATOR-OVERREACH` (validator requires a key nothing reads
or injects). Warns on `MISSING-SOFT` and `STALE-EXAMPLE`.

**Fix:** document the key in `.env.example` (or drop the dead requirement).

### `check:upstreams` — gateway upstream health probe

**Invariant (advisory by default):** every `SERVICE_CONFIGS` upstream the
gateway proxies to answers a health probe. Exists because the gateway accepts
traffic even when upstreams are dead (502s surface in the browser far from
the cause). Default exit 0; `--strict` exits 1 on any dead/unconfigured
upstream (scripted boots, CI).

**Run:** after `start-all.sh` — `node scripts/check-gateway-upstreams.mjs`.

---

## Keeping the checks honest

- New check → follow the core/CLI split, add fixture tests, wire it into the
  conventions job (or its own job if it needs infrastructure), and add a row
  to both tables here.
- A check that stops matching reality is worse than no check: when an
  invariant legitimately changes (e.g. a new export style), update the check
  *and* its tests in the same PR.
