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
- **Pool saturation gate** (nightly, schema-lock-nightly.yml →
  "Fail on sustained pooler saturation"): reads the `pool-audit` job_runs
  ledger for the last 24h and fails when the longest run of consecutive
  `error` passes spans ≥2h with ≥3 passes — sustained critical saturation
  the repeat-suppressed watchdog can't escalate further. Locally:
  `LIVE_DB_URL_BASE=postgresql://…@127.0.0.1:6432 node scripts/database/pool-saturation-gate.mjs`.
- **Pool bypass gate** (nightly, schema-lock-nightly.yml → "Fail on
  sustained pooler bypasses"): matching gate over the same ledger for the
  bypass detector. Parses the bypass segment out of pass detail regardless
  of status (repeat suppression logs persisting bypasses as `ok` rows with
  full detail) and fails when one workspace is flagged in consecutive
  passes spanning ≥24h (`POOL_BYPASS_MIN_SPAN_H`), with runs broken by a
  >3h ledger gap (`POOL_BYPASS_MAX_GAP_H`) so isolated blips can't fake
  persistence. The 30h window (`POOL_BYPASS_GATE_HOURS`) exceeds the span
  threshold on purpose: hourly passes filling a 24h window span at most
  23h. Locally:
  `LIVE_DB_URL_BASE=postgresql://…@127.0.0.1:6432 node scripts/database/pool-bypass-gate.mjs`.
- **Pool tracking issue** (nightly, schema-lock-nightly.yml → "Update
  pool-health tracking issue", production leg): a persistent home for the
  pool gates' verdicts, mirroring the production-drift tracker — ONE
  marker-scoped GitHub issue under the azeebo-drift-bot App, created when a
  sustained violation first appears, updated only when the (kind, identity)
  violation set changes (detail churn never triggers edits), closed when
  all pass, reopened on return. The bot RE-EVALUATES all three decision
  cores against the ledger (one source of truth) rather than parsing CI
  step exits — saturation, sustained repo bypasses, and now FOREIGN
  DIALERS: another project on this host holding direct-Postgres
  connections for 24h+ (the YCN-fleet shape) gets its own `foreign` row,
  because someone else's clients land in OUR connection budget. Foreign
  rows use the same sustained-only rule (one sniff never tracks; only a
  24h+ persistence does) with their own threshold
  (POOL_FOREIGN_MIN_SPAN_H, default 24, mirroring the bypass span) and
  gap (POOL_FOREIGN_MAX_GAP_H). APPROVED dialers: POOL_FOREIGN_ALLOWLIST
  (comma-separated exact workspace paths, whitespace tolerated; parsed by
  pool-issue-tracker.mjs parseAllowlist) waives TRACKING, not visibility —
  an approved workspace is still counted in offenders/passes (the budget
  impact is real) but can never read as `sustained`, so the tracker never
  opens, updates, or keeps an issue for it and the gate passes with an
  "approved (allowlist), not tracked" reason when the only ≥threshold
  dialer is approved. Matching is exact-path (no globbing) so an entry can
  never approve a sibling path. The admin Ops Health card mirrors the
  same list: approved rows show an "approved — not tracked" tag instead
  of "sustained — tracked nightly" (see apps/admin/src/modules/ops/
  ops.service.ts parseForeignAllowlist — a local copy; the admin build is
  hermetic and cannot import scripts/). The foreign parser lives in
  pool-bypass-gate.mjs alongside the bypass parser it mirrors (job-health
  gate re-exports it — one segment-anchor semantic to evolve). Degrades
  silently when the ledger is unreachable (the gates own the blocking
  signal). Runs under `always()` so a gate trip still updates the issue.
  Locally:
  `LIVE_DB_URL_BASE=postgresql://…@127.0.0.1:6432 node scripts/pool-issue-tracker.mjs --dry-run`.
- **Scheduled-job health gate** (nightly, schema-lock-nightly.yml → "Fail
  on error-heavy scheduled jobs"): extends the pool-gate idea to every
  known ledger job — freshness, drill, audit-retention, data-retention,
  pool-audit, plist-watchdog — each with a per-cadence fail profile: hourly
  jobs need a sustained streak (≥3 consecutive error passes spanning ≥2h,
  mirroring the saturation gate), plist-watchdog fails on 2 consecutive
  error passes (15-min cadence, fleet-stakes), nightly and weekly jobs fail
  on 2 consecutive error passes. Runs are broken by ledger gaps > cadence ×
  1.5 so a job that stopped recording isn't read as a health streak (the
  Ops Health cadence watchdog covers silence). warn rows never fail but do
  break error runs. Also alerts when a NEW foreign workspace (another
  project on this machine) starts dialing Postgres directly: pool-audit
  records foreign direct clients as a context detail segment, and a
  workspace not present in the pre-window ledger baseline fails the gate
  after ≥JOB_HEALTH_MIN_FOREIGN_PASSES (default 2) passes — repo bypasses
  stay the bypass gate's job; this is the "who else is dialing" signal.
  Locally: `LIVE_DB_URL_BASE=postgresql://…@127.0.0.1:6432
  JOB_HEALTH_HOURS=56 node scripts/database/job-health-gate.mjs`.
- **Plist watchdog** (local, LaunchAgent `com.azeebo.plist-watchdog`, every
  15 min): self-healing guard for every `com.azeebo.*` agent — the response
  to plists vanishing twice on 2026-09-22. Services: any MISSING/drifted
  plist is regenerated from the manifest and the affected labels
  re-bootstrapped (manifest contract violations alert without healing —
  that's a code bug, not drift). Jobs: a missing plist is reinstalled via
  its script's own install mode (installers may bake env at install time,
  so job-plist drift is left for humans). Every pass records a
  `plist-watchdog` row in the job_runs ledger through the pooler, so the
  Ops Health card, the cadence watchdog, and this gate all police the
  watchdog itself. Alerts repeat-suppressed (12h) via notification +
  optional webhook. Manage: `scripts/launchd/plist-watchdog.sh
  [run|status|install|uninstall]`.
- **Exit codes** — `0` = invariant holds (or advisory-only findings), `1` =
  violation. Checks that need a database (migrations/deployed-schema/drift)
  create and drop throwaway shadow databases; they never touch real data.

---

## Where each check runs

| Check | CI job (`.github/workflows/pr-checks.yml`) | Other gates |
|-------|--------------------------------------------|-------------|
| `check:flags` | Flag & Swagger Conventions | — |
| `check:flags:docs` | (flag registry doc sync) | — |
| `check:lint-ratchet` | Lint PR + lint.yml backend lint (right after `pnpm -r lint`) | per-rule baselines; fully-gated rules canary at 0 |
| `check:rule-promotion` | Lint PR + lint.yml backend lint (right after the ratchet) | listed rules must stay `error` for every service |
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
| route-contracts (`check:route-contracts`) | Flag & Swagger Conventions | client↔gateway contract audit + dead-route advisory; ratchet baseline |
| expo-routes (`check:expo-routes`) | Flag & Swagger Conventions | every mobile/TV navigation target must resolve to an Expo Router route file |
| typed routes (`tv-bundle-pr` typecheck steps) | TV Metro Graph Check | compiler-level route validation: `Href` params typed, invalid targets are type errors |
| federation-drill | Federation Drill (`.github/workflows/federation-drill.yml`) | weekly LaunchAgent on dev machines |

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

**Invariant:** for every rule with a `ratchet` path in
`scripts/promotion-rules.json`, the per-workspace warning count never exceeds
the committed baseline, and the baseline only moves down.

A plain `--max-warnings` cannot enforce this ratchet: it counts ALL warnings,
so an unrelated `console.log` could mask growth (or hide a real regression).
This gate counts warnings **per rule and per workspace**.

Two postures, one mechanism:

- **Migrating rule** (`warn` repo-wide) — the baseline is a floor that only
  moves down; conversions lower it via `--update` until it reaches 0.
- **Fully-gated rule** (`error` in the base config — `require-map-and-throw`
  since its migration completed) — the baseline sits at total **0** as a
  canary: live warnings should be impossible, so the first one fails CI
  immediately, meaning the severity regressed somewhere.

Fails when: any workspace's count exceeds its baseline. Workspaces absent
from the baseline are compared against **0** — new services cannot ship with
warnings. Dropping below the baseline does not fail; run `--update` to lock
in the improvement (otherwise a later PR could grow back to the old count).

**Fix:** for a migrating rule, convert the flagged catch blocks (or lower
the floor with `node scripts/check-lint-warning-ratchet.mjs --update` after
a genuine reduction). For a fully-gated rule, the warning itself is the bug —
fix the catch block (see `packages/eslint-rules/README.md`), never lower the
floor to make it pass.

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

### federation-drill — federation survives service-DB failures

**Invariant:** the admin panel's postgres_fdw federation (live foreign
tables over the per-service DBs) heals from both failure classes — a
dropped service DB, and a service DB recreated without the admin-owned
additive columns.

Runs when: a PR touches `scripts/database/**` or the workflow itself
(`workflow_dispatch` for manual runs). The job boots an ephemeral
postgres:16 container, creates the seven service DBs from the checked-in
fixture (`scripts/database/ci/drill-fixture.sql`), bootstraps federation
cold (which is itself the first-federation test), then runs
`scripts/database/federation-drill.sh` — both scenarios, with its
assertion-style exit code deciding the job.

Fails when: any drill assertion fails — an FDW server not pointing at its
canonical DB, a foreign table broken, the cross-DB `users ⋈ wallets` join
empty, `auth_audit_logs` diverged from its source, or (scenario 2) the six
admin-owned `users` columns not repaired after the drift.

**Fix:** the failing assertion names the contract; run the drill locally
against a scratch pair to reproduce (see RUNBOOK "Federation Drill"), patch
`federate-admin-db.sh`, re-push.

### route-contracts (`check:route-contracts`)

**Invariant (pass 3, gateway↔backend, gating):** every SERVICE_CONFIGS
endpoint entry must match an actual backend NestJS controller route, and
every backend controller route on a proxied upstream must be declared.
The proxy forwards purely by service prefix (`/api/v1/{service}/...` →
`{upstream}/v1/{service}/...`), so the declarations are documentation — when
documentation and backend disagree, the failure is silent (404/502 from the
upstream, or invisible surface). The diff reconstructs the upstream path
from each service's own `pathStrategy` + version + `pathRewrite` (mirroring
`forwardRequest()`), extracts `@Controller`/`@Get`/`@Post`/... routes from
the backend directories (`envKey` → dir map in
`scripts/lib/gateway-backend-contracts.mjs`), and compares both sides in
upstream form. Backend routes are prefixed with `/v{version}` only —
Nest bakes the service slug into the controller path (e.g.
`@Controller('lifestyle/celebrities')`). Shared upstreams (public/content/
universe → content-service) pool their declarations. Verb drift (declared
PATCH vs backend PUT) fails both directions. Rule core is unit-tested in
`scripts/__tests__/route-contracts-gateway-backend.test.mjs`; known debt is
ratcheted in the baseline (`gatewayGhostEndpoints`,
`gatewayUndeclaredBackendRoutes` — dir-scoped keys, may only shrink).

**Invariant (passes 1–2, gating + advisory):** every API call extracted from client code —
including template literals and raw query strings — matches a route declared
in the gateway's `SERVICE_CONFIGS` on **path AND HTTP method**. Exit 1 on any
NEW mismatch: an unmatched path 404s at runtime, a wrong verb (POST vs PUT)
405s — both often only in environments the developer didn't try.
Known-unmatched calls live in `scripts/route-contracts-baseline.json`, a
ratchet that may only shrink (regenerate with `--update` after fixing routes);
a new unmatched call always fails. Baseline entries carry the client verb
(`[POST]`) or `[ANY]` when the method couldn't be inferred at the call site.
Method extraction is best-effort: it recognizes the options-object shape
(`request('/x', { method: 'PUT' })`, only when `method` is the object's first
key) and axios-style helpers (`.patch('/x')`); anything indirect matches any
documented method for the path. Gateway entries may omit `method:` to opt a
path out of verb checking (matches any client verb).

**Advisory pass (dead routes):** gateway endpoints no client code calls are
listed but never gate — they may serve partners, scripts, or mobile releases.

**Run:** in the Flag & Swagger Conventions job (PRs) and via
`pnpm check:route-contracts` locally (all three passes run in one invocation;
`--update` regenerates all baseline sections).

### expo-routes (`check:expo-routes`)

**Invariant (gating):** every navigation target extracted from
`apps/mobile` + `apps/tv` source — `router.push/replace/navigate('/...')`
(string or template literal) and `href="/..."` — resolves to a route file
in that app's Expo Router `app/` directory. A target with no route throws
"Unhandled route" at runtime: the user taps a visible button and nothing
happens. Matching understands route groups `(tabs)`, dynamic segments
(`[param]` fills from either a literal or `${...}` target segment), catch-alls
(`[...all]` / `[[...all]]`), and ignores query strings. Layouts, private
folders (`_*`), `+specials`, test files and dot-directories (`.expo`) are
excluded on both sides. `apps/*` workspaces without an `app/` directory are
skipped. `scripts/lib/expo-routes-core.mjs` is the tested rule core; the CLI
accepts `--root` for fixtures. The only escape hatch is `EXPO_ROUTE_ALLOWLIST`
in the core (each entry must carry a `reason`) — keep it empty and create the
missing route instead.

**Run:** in the Flag & Swagger Conventions job (PRs) and via
`pnpm check:expo-routes` locally.

### typed routes (Expo Router, compile time)

**Invariant (gating):** `experiments.typedRoutes: true` is set in both
`apps/mobile/app.json` and `apps/tv/app.json`, so expo-router generates the
full route union into `.expo/types/router.d.ts` (gitignored) and `Href` stops
being plain `string`: `router.push('/definitely-not-a-route')` is a TS2322/2345
compile error, dynamic-route params become required, and object-href calls are
param-checked. Enforcement was proven with a throwaway probe file (bogus
`push` target errors under the app tsconfig; valid targets pass). Generated
types are not committed — the `tv-bundle-pr` job runs
`pnpm --filter @azeebo/{mobile,tv} exec expo customize tsconfig.json` before
typechecking both apps (regenerates route types without touching the committed
tsconfigs). Without that step CI's tsc would silently run with the loose
`Href = string | HrefObject` fallback and enforce nothing.

**Notes:**
- Type-escape hatches (`as never` / `as any` on push targets) defeat the gate;
  none remain in either app. When adding a screen, write the literal path —
  tsc rejects it immediately if the route doesn't exist.
- The runtime `check:expo-routes` gate still runs on every PR: it covers
template-literal and variable targets tsc can't see, and guards against the
route types going stale (typed routes is only as fresh as the last
generation).
- Keep `href` state typed as `Href` (from `expo-router`), not `string` — a
plain `string` field silently re-opens the loose-type hole at the call site.

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

### `gen-service-plists` — service LaunchAgent contract (PR gate + local check)

**Invariant:** every `com.azeebo.*` SERVICE LaunchAgent plist is a pure
emission of `scripts/launchd/service-manifest.mjs` — no hand-edited plists.
Three rules are enforced mechanically, because each one already caused an
incident:

1. **No inline env secrets.** launchd `EnvironmentVariables` override
   `node --env-file`, so an inline `DATABASE_URL` pins a service to direct
   5432 *even when its .env points at pgbouncer* — exactly how 11 plists
   silently bypassed the pooler (2026-09-21). The generator hard-fails on
   any `FORBIDDEN_ENV_KEYS` key (`DATABASE_URL`, JWT/AWS/Gateway secrets,
   passwords) in any entry or emitted plist.
2. **`--env-file` is forced by construction** for every DB-backed service:
   membership in `DB_SERVICES` guarantees the argv contains
   `--env-file=<svc>/.env`, and the audit verifies the .env exists and
   defines `PORT`.
3. **Drift tripwire** (`--check`, run locally / in CI as `--ci`): the
   installed plist must match the manifest byte-for-byte — or be MISSING,
   which also fails (a LaunchAgent vanished twice on the dev machine before
   this gate existed).

Where it runs: `pr-checks.yml` → Postgres Pool Budget job
(`--ci`, machine-independent — emits to a temp dir, no plutil/
`~/Library/LaunchAgents`/`.env` needed) and `node
scripts/launchd/gen-service-plists.mjs [--check]` locally (write mode
generates + you re-bootstrap; `--check` diffs without writing).

Tests: `node --test scripts/__tests__/launchd-plists.test.mjs`.

**Fix:** after any manifest edit run `node scripts/launchd/gen-service-plists.mjs`,
then `launchctl bootout gui/$(id -u)/com.azeebo.<label>; launchctl bootstrap
gui/$(id -u) ~/Library/LaunchAgents/com.azeebo.<label>.plist` for each
changed service. To recover a vanished plist, just regenerate (then re-run
`--check` to confirm the deleter hasn't struck again).

### `transport-drill` — service prober contract drill (nightly)

**Invariant:** the Ops Health service prober compiles, attributes
transports, and detects re-bind flips. The drill (runs nightly in
schema-lock-nightly.yml → "Transport drill (service prober contract)")
proves four things on a fresh runner:

1. The REAL `service-probe.ts` compiles standalone with the workspace tsc —
   a type error or a new dependency that breaks standalone compilation
   fails here, before it can break the page.
2. A REAL v4-only listener on a spare port probed with the real
   `probeAcrossTransports` + real fetch comes back **healthy** with a
   transport recorded — a family-narrow bind must never read as `down`
   (the exact bug the prober was written to fix). The listener first
   proves its own narrowness (v4 answers, v6 refuses) so the result can't
   be a stolen port.
3. The REAL `mergeTransportHistory` core, fed the real sweep-1 outcome and
   a modeled sweep-2 re-bind, emits the flip — including a crossing-family
   flip with `familyChanged: true` (the banner's data path).
4. First sightings never flip; impossible transports (`ipv6` against a
   v4-only listener) are rejected.

The sweep-2 socket layer is scripted rather than bound live: no stock
resolver can make `localhost` fail while an explicit candidate answers
(macOS tries both families — see "Loopback transport" in RUNBOOK.md), so
the re-bind is modeled at the outcome layer and driven through the same
compiled production merge code the banner renders from. Honest limit
(verified by mutation drill): removing the explicit CANDIDATES alone does
NOT fail this drill on a dual-stack-resolver runner — `localhost` still
answers — so the candidate list's breadth is policed by the unit tests
(`probeCandidates` ordering) and code review, not by CI. What the drill
uniquely catches is a compile break and lost TRANSPORT ATTRIBUTION (the
field is optional, so tsc passes) — verified: dropping `transport` from
the outcome fails with exit 1. Fail closed: exit 1 with a `::error`
annotation; exit 2 only on environment errors (missing tsc). Locally:
`node scripts/ops/transport-drill.mjs`. Tests:
`node --test scripts/__tests__/transport-drill.test.mjs`.

### `transport-flip` ledger — flip persistence + trend (event-driven)

**Invariant:** a transport flip outlives its 10-minute hold window. The
Redis flips hash (`ops:transport:flips`) answers "what changed just now"
for the banner; the job_runs ledger (job `transport-flip`) answers "what
changed all month". `OpsService.recordTransportSweep` (apps/admin/src/
modules/ops/ops.service.ts) fires on EVERY successful probe sweep —
steady states included, so a gap in the ledger means "sweeps stopped",
never "nothing happened" — and UPSERT-merges ONE row per (service, UTC
day): counters accumulate (sweeps in `durationMs`, flips in `rowsPurged`
AND as `sweeps=`/`flips=`/`familyFlips=` keys in `detail` — the detail is
the trend's single source of truth), the `last=from->to@ms` pair and the
ending `transport` refresh to the newest observation, and `status` reads
`ok` (steady) or `warn` (day saw a flip). The concurrent-replica race is
serialized by a `SELECT … FOR UPDATE` on the row id before the merge, so
two replicas sweeping simultaneously write the same merged truth.
`getTransportFlipTrend` parses rows back for GET /admin/ops/transport-
flips and the Ops Health "Transport flip trend" card (flip-only services,
loudest first). Deliberately NOT in KNOWN_JOBS: the ledger-cadence
watchdog and "Run now" targets are for scheduled jobs, and for an
event-driven job silence IS the healthy state — a day with zero flips
writes no row and must not page anyone. The job-health gate ignores the
job (no JOB_PROFILES entry). Row growth is bounded at ~(services × days
in the window) by the UPSERT — no retention entry needed. The ledger
write is fire-and-forget: a failed write warns and never fails (or slows)
the health sweep. Tests: `cd apps/admin && npx jest transport-flip`
(codec) and the ops.test.tsx trend-card render tests.

### `prober-coverage-gate` — Ops Health fleet ⊆ launchd manifest (PR gate)

**Invariant:** every entry in `PROBED_SERVICES`
(`apps/admin/src/modules/ops/ops.service.ts`) has a matching entry in the
launchd manifest (`scripts/launchd/service-manifest.mjs`). Join key is
**port** (prober names and manifest labels are deliberately different
vocabularies — `payment-service` vs `payment` — while ports are unique in
both lists). This closes the gap where the 15 newer services were added to
the prober but not the manifest: Ops Health reported them permanently down
because nothing would ever start them.

Runs as a static parse of committed sources — no DB, no launchd, no node
modules — so it's safe in CI and cannot false-green on environment
differences. Unparseable or empty `PROBED_SERVICES`/`SERVICES` blocks FAIL
the gate rather than skip it, so a refactor that renames the array can't
silently void the check. Duplicate ports within either list also fail (a
prober dup double-probes; a manifest dup means two agents fight over one
port). Runs in `pr-checks.yml` right after the plist contract check.

Locally: `node scripts/launchd/prober-coverage-gate.mjs`.
Tests: `node --test scripts/__tests__/prober-coverage-gate.test.mjs`
(14 cases: parse fail-loud rules, port join semantics, duplicate detection,
and subprocess runs — the real fleet must pass at HEAD; fake-tree drills
for every failure mode).

---

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
