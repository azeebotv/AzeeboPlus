# Azeebo+ — Deep Audit & Task List

> **Audit date:** 2026-08-14 · **Branch:** `Major-Upgrade`
> **Scope:** entire monorepo — 28 services, 4 apps, 23 shared packages, CI/CD, docker, docs
> **Focus:** feature flags first (per request), then general project health.
>
> **Verification performed during this audit (all green unless noted):**
>
> | Check | Command | Result |
> |---|---|---|
> | Flag key conventions | `pnpm check:flags` | ✅ 191 keys OK |
> | Flag-usage sweep | `pnpm sweep:flags` | ✅ 191 keys / 230 referenced (typed + literal) |
> | Registry docs appendix | `pnpm check:flags:docs` | ✅ fresh (32 domains, 191 keys) |
> | Typecheck (root) | `pnpm typecheck` | ✅ clean |
> | Swagger consistency | `node scripts/check-swagger-consistency.mjs` | ✅ 28 services |
> | feature-flags pkg tests | `pnpm --filter @azeebo/feature-flags test` | ✅ 55/55 |
> | content-service tests | `pnpm --filter @azeebo/content-service test` | ✅ 100/100 (⚠ open-handles warning) |
> | **Lint (repo-wide)** | `pnpm lint` | ✅ clean, read-only (see B-1/B-2) |
>
> **✅ Landmine cleared:** the ~11 `lint` scripts that ran `eslint src --fix` were
> converted to read-only `eslint src` (B-2); `pnpm lint` no longer mutates the tree.

---

## A. Feature-Flag Issues (priority — found in deep check)

### A-1 ✅ RESOLVED — Admin universe enable/disable never reached web/mobile nav gating for the **Creator** universe
**Fixed:** one canonical universe-slug map (`UNIVERSE_SLUGS` in `packages/shared-types/src/universe.ts`)
now keys everything — DB names are the single source of truth (`movie`, `creator` singular):

- `packages/shared-types` exports `UNIVERSE_SLUGS` + `universeEnabledKey`/`universeFlagKey`;
  `@azeebo/feature-flags` re-exports the builders (no local re-implementations).
- Gateway `app.module.ts` derives the sentinel `defaultFlags` + `publicFlagKeys` from
  `UNIVERSE_SLUGS` — including the previously **missing `music` sentinel** — so it serves
  exactly the keys the admin publishes (`universe.creator.enabled`, `universe.movie.enabled`,
  `universe.music.enabled`).
- Web `AppHeader` nav options derive from `UNIVERSE_SLUGS` (keys `creator`/`movie`); mobile
  `GuestHomepage` explore flags use the DB slugs. Both re-export the key builder from
  `@azeebo/shared-types` instead of re-declaring it.
- Tests/docs updated (web/mobile/gateway specs, contract-tests).

**Remaining (out of scope of this fix, tracked below):**
- `UniverseManagementService.updateUniverse` still doesn't publish the `enabled` sentinel when
  `isEnabled` changes via the edit path — only `toggleUniverse`/`bulkToggle`/`createUniverse`
  publish. See A-2.
- ✅ DONE: `check:flags` now validates universe sentinel slugs (see A-10 ✅ below).
- ✅ DONE: the `Universe` content union is now derived from `UNIVERSE_SLUGS` (see A-12 ✅ below).
- ✅ DONE: web + mobile now have `/music` routes and nav entries gated by `universe.music.enabled`
  (web `AppHeader` entry + `apps/web/src/app/music/`, mobile explore-grid card +
  `apps/mobile/app/music/` promoted from `lifestyle/music`).

### A-2 ✅ RESOLVED — `updateUniverse` now publishes the enabled sentinel to Redis
`updateUniverse` (the admin edit form path) now calls `publishUniverseEnabledToRedis` whenever
the edit touches `isEnabled` — same key (`feature_flags:universe.<name>.enabled`) and payload
the toggle/bulk/create paths publish — so nav gating follows edits, not just toggles. Edits
that don't change `isEnabled` skip the publish.

Regression tests added (`universe-management.update.spec.ts`): publishes on disable and on
re-enable, and skips when `isEnabled` isn't in the payload. Admin suite: 98 passed.

### A-3 ✅ RESOLVED — content-service had a duplicate `FeatureFlagModule` registration
Deleted the module-level registration in `content.module.ts`; `app.module.ts` remains the
single (global) registration providing `FeatureFlagService` + the content flag defaults.
`content.contract.spec.ts` now registers the mocked module globally in its own test harness
(mirroring production) so its `FeatureFlagService` override still resolves.

Verified: `pnpm --filter @azeebo/content-service test` passes (100/100, 9 suites), lint +
typecheck clean. Note: the jest "worker process failed to exit gracefully" warning was
intermittent (did not reproduce in re-runs), but the second unshared ioredis client — its
most likely cause — is now structurally gone: `FeatureFlagModule` appears in exactly one
place in content-service source.

**Regression guard (check:flags Part 3):** `scripts/check-flag-conventions.mjs` now fails CI
if any deployable workspace (`apps/<name>`, `services/<group>/<name>`) calls
`FeatureFlagModule.register(...)` more than once in its production source (test files and
comments excluded) — each `register()` news its own `FeatureFlagService` + Redis client. The
guard immediately caught the same bug still present in **reality-service** (`app.module.ts` +
`reality.module.ts`), which is fixed here the same way: module-level registration removed, the
app's global registration is the single source, and `reality.contract.spec.ts` registers the
mocked module in its own harness. Reality-service 110/110 tests, lint + typecheck clean.

Probe-verified: a temporary second `FeatureFlagModule.register()` in sports-service fails the
gate with file:line references; removing it restores green.

**Runtime regression test (`src/app.feature-flag-instance.spec.ts`):** compiles the real
`AppModule` graph (ioredis faked, PrismaService overridden) with `FeatureFlagModule.register`
wrapped in a call counter, and asserts exactly one registration before/after compile,
init, and teardown — each `register()` news one `FeatureFlagService` + Redis client, so the
count is a faithful instance proxy. Verified it fails (Expected 1, Received 2) when the
content.module duplicate is re-introduced; content-service suite is stable across repeated
runs and passes `jest --detectOpenHandles` with no open-handle warnings.

**Same spec pattern applied to auth-service** (`services/core/auth-service/src/
app.feature-flag-instance.spec.ts`): asserts exactly one `FeatureFlagModule.register` AND one
`RateLimiterModule.forRoot` (both wrapped with counters over the real packages) across the
full AppModule graph — auth-service was the A-13 case that double-registered
RateLimiterModule.forRoot. Verified it fails (Expected 1, Received 2 on the rateLimiter
counter) when the auth.module duplicate is re-introduced. Auth-service 153/153.

**Wired into CI:** `pnpm --filter @azeebo/auth-service test:openhandles` runs this spec with
`jest --detectOpenHandles` (which implies `--runInBand`) as a dedicated `test-pr` step with a
3-minute timeout, so a leaked client both fails the counter assertion directly and surfaces any
open handle (a hang → step timeout). The spec saves/restores its `process.env` mutations in
`beforeAll`/`afterAll` so serial-mode execution never contaminates sibling specs.

### A-13 ✅ RESOLVED — Shared dynamic-module double-registration audit (leaks a second client)
Audited every NestJS package that supports global/dynamic registration for the
client-leaking pattern (each `register()/forRoot()` news its own service instance + often its
own Redis client):

- **RateLimiterModule.forRoot** — auth-service registered it in BOTH `app.module.ts` and
  `auth.module.ts` (each call pulls a fresh `@nestjs-modules/ioredis` client). Removed the
  `auth.module.ts` one; the app-level `@Global()` registration is the single instance.
  Auth-service 152/152 tests, lint + typecheck clean. Probe-verified the guard catches it.
- **FeatureFlagModule.register** — clean (see A-3; reality-service fixed there).
- **FlagMetricsModule.register** — exactly one per service, always in `app.module.ts`. Clean.
- **EventBusModule.forRoot** — single use (wallet-service only). Clean.
- **BullModule.forRoot** — one per workspace (queue/engagement). The dead
  `@azeebo/shared-queue` package (zero consumers) was **removed** (see A-14) — its
  `QueueModule`/toggles duplicated queue-service's richer hand-rolled config, and its
  `queueProcessFlagKey('content-processing')` even produced a wrong key
  (`queue_process_content_processing` vs the canonical `queue_process_content`).
  queue-service consumes the `queue_*` flags directly via `queueFlags`.
- **JwtConfigModule / RedisModule / CacheModule / DatabaseModule** — plain `@Global()` class
  modules; Nest instantiates them once, so repeated imports are safe (no leak). `JwtModule
  .register` is stateless (no client).

**Guard extended (check:flags Part 3):** the per-workspace single-registration check now
covers `FeatureFlagModule.register`, `FlagMetricsModule.register`, `RateLimiterModule.forRoot/
register`, `EventBusModule.forRoot/forRootAsync`, `SharedFeatureFlagsModule.register/forRoot`,
and `BullModule.forRoot/forRootAsync` — all enforced in the `conventions-pr` CI job. Each has
a fixture test in `scripts/__tests__/flag-conventions.test.mjs` (13 tests total), incl. an
explicit `FlagMetricsModule.register` duplicate case (each call news its own FlagMetricsService
+ controller). Probe-verified on the real repo: a second `FlagMetricsModule.register` in
sports-service fails with file:line; removing it restores green.

**Runtime regression specs added to ALL 28 services (A-13 as a runtime check):**
Every service now has `src/app.shared-module-instance.spec.ts` (content-service and
auth-service keep their original `app.feature-flag-instance.spec.ts` names) — a jest spec
that wraps the REAL `FeatureFlagModule.register`, `FlagMetricsModule.register`,
`RateLimiterModule.forRoot`, `EventBusModule.forRoot`, and `BullModule.forRoot/forRootAsync`
with call counters (ioredis faked so no connection opens), compiles the full AppModule
graph, and asserts each count is exactly the service's expected value (0 for unused
modules) before and after compile (and after init/close for services whose graphs allow
it; queue-service is compile-only because its BullMQ workers boot at init).

Surfaced and fixed two real latent boot bugs:
- **search-service**: `PopulationModule` exported `SchedulerRegistry` from a module that
  only imports `ScheduleModule.forRoot()` — Nest's `validateExportedProvider` rejects
  that (the token isn't a provider of the module or an imported module class), so the
  app could not compile. Fixed: drop the export; `RepairModule` now imports
  `ScheduleModule.forRoot()` itself (identical forRoot calls share one module instance,
  so the registry is still shared). Search 124/124 (7 skipped) across 2 runs.
- **wallet-service**: `WalletService` injects `RedisService` but `WalletModule` never
  imported the (non-global) `RedisModule` — the real app could not resolve it (wallet's
  e2e spec had always overridden `RedisService`, hiding it). Fixed by adding
  `RedisModule` to `WalletModule` imports. Wallet 106/106.

Spec details worth knowing: `@azeebo/security`-mock in creator-service must MUTATE the
real `RateLimiterModule` class and return the actual module (not replace the class with a
plain object) because `creators.module.ts` imports the bare class as a module import;
engagement's ioredis fake extends a real `EventEmitter` + `disconnect`/`duplicate` because
BullMQ exercises the full emitter surface at queue close. Probe-verified: a second
`FeatureFlagModule.register` in games-service's graph fails the spec (`Expected 1,
Received 2`) and reverting restores green. All 28 specs pass; each service's full suite,
lint, and root `tsc --noEmit` clean.

**Remaining module families audited (no active duplicates — report-only):**
- `RedisModule` / `CacheModule` (shared-services) / `JwtConfigModule` — plain `@Global()`
  class modules; Nest instantiates once per app, repeated imports are safe (no forRoot/register
  variants). `JwtConfigModule`'s internal `JwtModule.registerAsync` runs exactly once.
- `ScheduleModule.forRoot` — one per service (search population, payment scheduled-tasks,
  subscription), each in a single imported module; the population module documents why (a
  second forRoot would create an independent scheduler).
- `JwtModule.register/registerAsync` — gateway, support-service, creator, admin each exactly
  once in their live graphs. support-service keeps a **dead `CommonModule`** (zero imports,
  zero spec refs) that would add a second `JwtModule.registerAsync` + `PassportModule.register`
  if ever wired — cleanup candidate, not an active double.
- `CacheModule.register` (gateway, @nestjs/cache-manager) — once, in-memory, no Redis store.
- `PassportModule.register` — support-service source has it twice (app.module + dead
  CommonModule) but once in the live graph; harmless static strategy config.
- `ConfigModule.forRoot` — user-service calls it twice (app.module + admin.module); duplicate
  local ConfigService, no client, minor cleanup.

### A-14 ✅ RESOLVED — `@azeebo/shared-queue` dead package removed
The `@azeebo/shared-queue` package (zero consumers) was deleted. Its `QueueModule`/toggle helpers
duplicated queue-service's richer hand-rolled BullMQ config, and its
`queueProcessFlagKey('content-processing')` produced a wrong key (`queue_process_content_processing`
vs the canonical `queue_process_content`), so wiring it would have broken the content queue's
kill-switch. queue-service consumes the `queue_*` flags directly via `queueFlags`, so removal
orphans nothing. Also removed the tsconfig path alias, the Dockerfile COPY line, the README
package-table row, and pruned the lockfile. Verified: root typecheck clean, `check:flags` green,
flag-conventions tests 18/18, queue-service suite green.

**Post-removal audit of `packages/shared-services`:** it ships **no queue module and no duplicate
queue code** — no QueueModule, no bullmq/bull dependency, no queue processors/toggles/names, and
zero `@azeebo/shared-queue` references (lockfile: 0 refs). Its only "queue" traces are generic
infrastructure, not shared-queue duplicates: the `queue_depth` gauge in `metrics.service.ts` (watched
by `@azeebo/observability` anomaly detection) and the dormant `queue:` entry in the live
`CACHE_STRATEGIES` registry (queue-service never calls `cacheKey('queue', …)`; several other domain
entries are equally dormant). queue-service imports only Email/Firebase/JWT/SMS from shared-services
and keeps its own richer hand-rolled BullMQ config. No removal needed.

### A-4 ✅ RESOLVED — Frontend flag keys are hand-duplicated raw strings — drift undetectable
**Fixed:** added a browser-safe `./registries` subpath export to `@azeebo/feature-flags` and replaced
the hand-duplicated `WEB_FLAG_KEYS` (web), `MOBILE_FLAG_KEYS` (mobile), `ADMIN_FLAG_KEYS` (admin
client) and `CREATOR_FLAG_KEYS` (creator client, a UI subset) with imports of the canonical
`webFlags`/`mobileFlags`/`adminFlags`/`creatorFlags` registry consts. Added the `@azeebo/feature-flags`
dependency to web/mobile and explicit tsconfig path entries (root + web + mobile) so the subpath
resolves under both `node` and `bundler` module resolution. All four apps typecheck + test green.
`apps/web/src/lib/flags.ts` (`WEB_FLAG_KEYS`), `apps/mobile/src/api/flags.ts`
(`MOBILE_FLAG_KEYS`) and `apps/admin/client/src/hooks/useAdminFlags.ts` each re-declare the
registry keys as raw strings with "mirrors the registry" comments. `check:flags` and the
typechecker can't see them — a typo silently breaks a UI feature (e.g. `mobile_dark_mode`).
**Fix:** export a browser-safe registries module from `@azeebo/feature-flags`
(pure constants, no ioredis — e.g. a `./registries` subpath export) and import
`webFlags`/`mobileFlags`/`adminFlags` in the three apps. Consider extending `check:flags` to
assert the frontend copies match the registries while the migration is in flight.

### A-5 ✅ RESOLVED — `FeatureFlagService` has no Redis-error fallback — outage 500s instead of failing closed
**Fixed:** `getFlag`/`listFlags`/`scanKeys` read paths now try/catch Redis errors and degrade to the
registered defaults (getFlag→null ⇒ defaultFlags/defaultValues, listFlags→[]) instead of rejecting
(which 500'd every guarded route). Each failure fires a new `onRedisError` hook (wired to a
`flag_redis_error_total` counter in `@azeebo/flag-metrics`) and a throttled console warning. Writes
still throw. Added a `failClosedOnRedisError` option (default true). 5 new tests (feature-flags 60/60,
flag-metrics 21/21).
`getFlag`/`listFlags`/`scanKeys` (`packages/feature-flags/src/core.ts`) call `redis.get/scan`
without try/catch. On a Redis outage, `isEnabled()` rejects, so every `@FeatureFlag`-guarded
route returns **500** rather than degrading to the registered default (kill-switch stays closed,
opt-in features 500 instead of gracefully off). The rollout policy promises "flags fail closed
where the service treats a store outage as safe default" — the implementation 500s instead.
**Fix:** wrap read paths in try/catch → serve `defaultFlags`/`defaultValues`, log throttled
warning, emit a metric (e.g. `flag_redis_error_total`); keep writes failing loudly. Consider a
`failClosedOnRedisError` module option.

### A-6 ✅ RESOLVED — `sweep-flag-usage.mjs` misses the real usage pattern (typed constants)
**Fixed:** the sweep now parses the registry into const→prop→key (incl. frontend aliases and
whole-const `Object.values(...)`/`...spread` consumption), resolves typed `Const.prop` references, and
reports BOTH directions — used-but-unregistered (literal keys + removed/renamed props) and
registered-but-unused (dead flags). Dynamic prefix exemptions preserved. Verified: 191 keys / 0 issues
on the clean repo; negative probes catch both a dead key and a removed `paymentFlags.x` prop.
The sweep only regexes **literal strings** (`isEnabled('...')`, `@FeatureFlag('...')`, …) and
reports 14 usage sites, but the codebase consumes flags almost entirely via typed constants
(`paymentFlags.xxx`, `searchFlags.yyy`). After a flag is removed, orphan typed references would
**not** be caught. It also never reports *registered-but-unused* flags.
**Fix:** resolve each registry const+prop to its key, scan for `ConstName.prop` references and
report both directions (used-but-unregistered AND registered-but-unused); keep the dynamic
prefix exemptions (`queue_process_*`, `events_consume_*`, `universe.*`).

### A-7 ✅ RESOLVED — Frontend bootstrap cache ignores the anonymous id
**Fixed:** web (prior pass) and mobile (this pass) bootstrap cache keys now include the stable visitor
id (`anon_<visitorId>` instead of a shared `anon`), so anonymous visitors can no longer share a cache
entry within the TTL. Web + mobile flag tests green.
Web (`apps/web/src/lib/flags.ts`) and mobile (`apps/mobile/src/api/flags.ts`) cache bootstrap
flags under `userId || 'anon'`, but the server buckets on the `x-anonymous-id` header. Two
anonymous visitors (or one visitor after the id rotates) share the `anon` cache entry for the
5-minute TTL → rollout buckets leak across visitors.
**Fix:** include the visitor id in the cache key.

### A-8 ✅ RESOLVED — Legacy `x-feature-flag` opt-in header still honored by `FeatureFlagGuard`
**Fixed:** added a `check:flags` Part 4 rule that fails when `@UseGuards(...FeatureFlagGuard...)`
appears without a matching `@FeatureFlag` on the same class/method (methods may inherit a class-level
`@FeatureFlag`). 2 new fixture tests; the real repo passes (every guard is paired). The inert
legacy-header path is left in place but can no longer be reached without a decorator.
By design (opt-in experimentation on public endpoints) — but any controller that applies
`FeatureFlagGuard` **without** `@FeatureFlag` lets a client self-enable any stored flag via the
header. Verified today: every `@UseGuards(FeatureFlagGuard)` site has a matching `@FeatureFlag`
decorator, so the surface is inert. **Fix (hardening):** add a `check:flags` rule that fails when
`FeatureFlagGuard` appears without `@FeatureFlag` on the class/method, or remove the header path
entirely and ship only the decorator.

### A-9 ✅ RESOLVED — Flag lifecycle hygiene gaps
**Fixed (docs):** `packages/feature-flags/README.md` Environments table deduped (single Production
row) and the kebab-case example keys (`new-payment-flow`, `dark-mode`) replaced with typed registry
keys; Best Practices #5 now states every flag must carry an `owner` (and default-on kill-switches a
`staleAfter`). **Deferred:** statically *requiring* owner/staleAfter in `check:flags` needs a per-flag
metadata catalog — owner/staleAfter are runtime Redis/admin fields, not static registry data — so it
stays documented convention + admin DTO/rollout-policy enforcement rather than 191 fabricated owners.
- 0/191 flags are dead (verified by script — every registered key is referenced somewhere), ✅.
- But almost every new-feature flag (defaults off) ships with **no `owner` and no `staleAfter`**
  → the admin stale report and owner-notification sweep can't track them. Consider requiring
  `owner` (+ `staleAfter` for default-on kill-switches) in `check:flag-conventions.mjs`.
- `packages/feature-flags/README.md` has a duplicated **Production** row in the Environments
  table and uses non-convention example keys (`'new-payment-flow'`, `'dark-mode'`) that
  contradict "typed keys, never string literals". Fix the docs.

### A-10 ✅ RESOLVED — `check:flags` validates universe sentinel slugs
`scripts/check-flag-conventions.mjs` (run by the `conventions-pr` CI job on every PR) now
verifies, alongside the registry-key checks:
- `UNIVERSE_SLUGS` itself: snake_case slugs, no duplicates (currently 9 slugs).
- Every `universe.<slug>.enabled` sentinel KEY literal repo-wide (src, tests, docs) must use a
  canonical slug — catches drift back to the old plural nav slugs (`creators`, `movies`).
- Every literal first argument to `universeEnabledKey(...)` / `universeFlagKey(...)` must be a
  canonical slug.
- Bare nav-config `flag:` values in client universe grids (mobile `GuestHomepage`) must be a
  canonical slug or an explicitly allowlisted non-universe surface (`NAV_FLAG_ALLOWLIST`,
  currently `cinemaxis`). Probe-verified: a misspelled slug such as `cinemaxes` fails with
  file:line.
- The gateway must derive its sentinels from `UNIVERSE_SLUGS.map(universeEnabledKey)` — a
  hand-maintained list that silently drops a slug (e.g. `music`) fails the gate.

**Testable core + unit harness:** the rules moved to `scripts/lib/flag-conventions-core.mjs`
(`runFlagConventionChecks(root)`), and the CLI is a thin wrapper; `scripts/__tests__/
flag-conventions.test.mjs` (node:test, no new deps) builds fixture trees and asserts bad-slug
fixtures fail / clean fixtures pass — 12 tests covering every rule family. Run via
`pnpm test:flag-conventions`, wired into the `conventions-pr` CI job. Also fixed a latent bug:
`collectWorkspaces` only scanned `services/*/*` while the docs/errors claimed `apps/*` were
covered — `apps/*` are now scanned too (apps/admin + apps/creator each have exactly one
registration, so the real repo stays green).

### A-11 ✅ RESOLVED — Universe flags: `UniverseFeatureFlag` schema files had drifted
Regenerated the drifted Prisma clients so schema, generated copies, and admin code agree:
- `services/core/content-service/src/prisma/client` regenerated via `prisma generate` — the
  stale copy was missing `@@unique([countryCode])` on `GeoRestriction` (had `@@index` only)
  and carried a pre-`music` `Universe.name` comment; both now match the source schema.
- `apps/admin/src/generated/prisma` regenerated the same way (admin code imports it via
  `../../generated/prisma` in universe-management).
- Deleted the stale duplicate `services/core/content-service/prisma/client` — the schema's
  generator `output` points at `src/prisma/client` and every import resolves there (G-6
  duplicate-client cleanup for content-service, in part).
- Root `prisma/combined-schema.prisma` already matches (not CI-gated; docs artifact).

Verified: full normalized diff (whitespace/attr-order insensitive) of schema vs regenerated
copy is identical for both workspaces; `geoRestriction.findUnique` present in the fresh
client types; monorepo typecheck clean; content-service 101/101 and admin 98 passed (6
opt-in skips); `check:flags` green (191 keys, 9 slugs).

### A-12 ✅ RESOLVED — `Universe` content union reconciled with `UNIVERSE_SLUGS`
`packages/shared-types/src/universe.ts` now defines `Universe` as a derived alias of
`UNIVERSE_SLUGS` (`(typeof UNIVERSE_SLUGS)[number]`) and `index.ts` re-exports it — the
type-level union can never drift from the canonical slug list again.

Runtime universe values also reconciled to the canonical singular names (the demo-content
seed was the outlier, using plural `movies`):
- `scripts/demo-content/migrations/002_seed_demo_data.sql` — universe row, watch-history rows,
  and a user-preferences JSON array (`movies` → `movie`).
- `scripts/demo-content/deploy-per-service.ts` / `.py` — movie universe rows.
- `user-service` interests DTO example + integration spec; `subscription-service` bundle DTO
  example + spec (all `movies` → `movie`).
- content-service `schema.prisma` comment now lists all 9 canonical slugs (incl. `music`).

Verified: typecheck, lint, `check:flags`, user-service (73 tests) + subscription-service (80)
all green. Display names / routes / swagger tags (`Movies`, `/movies`) intentionally unchanged.

---

## B. General Project Issues (found during the deep check)

### B-1 ✅ RESOLVED — `pnpm lint` is now a read-only green gate (exit 0, 0 errors, 0 warnings)
Removing `--fix` from every lint script exposed the full prettier formatting drift (~200
files); a one-time `eslint --fix` migration cleaned it, and the non-fixable errors were
fixed deliberately:

- `no-explicit-any`: typed test-access helpers (`TestableEventBus`, `MockAxiosInstance`,
  `TestableServiceClient`) in `event-bus.spec.ts` / `http-client.spec.ts`; typed
  `SpecRequest` in `auth.controller.spec.ts`; `JwtSignOptions['expiresIn']` cast in
  `jwt-config.module.ts`; typed `$queryRaw` cast in `health-check.service.ts`.
- `azeebo-custom/no-console-log`: logger implementations exempted in `eslint.config.js`
  (`**/logger/**`, `**/logger.ts`, `**/scripts/**` — the custom rule now matches the
  existing `no-console: off` intent); intentional console in opt-in e2e specs and the
  test harness uses targeted `eslint-disable-next-line` comments.
- `azeebo-custom/no-hex-colors`: `TippingModal` / `LanguageSwitcher` now use theme tokens
  (`colors.bg.surface`, `colors.text.tertiary`).
- `no-console` warnings: `'no-console': 'off'` for test files (spies + skip guidance),
  targeted disables in `auth-client.ts`.

`apps/web` migrated from deprecated `next lint` to `eslint src` (root flat config).
All 51 workspaces lint clean; typecheck + affected test suites pass.

### B-2 ✅ RESOLVED — every lint script is read-only
All 51 workspaces with a lint script now run plain `eslint src` / `eslint .` (no `--fix`);
`apps/web` uses `eslint src` instead of `next lint`. Running `pnpm lint` never mutates the
tree. For on-demand formatting, run `eslint <dir> --fix` explicitly (as was done once for
the migration in B-1).

### B-3 ✅ RESOLVED — Orphan `services/core/support-service`
**Fixed:** deleted the orphan stub (only `prisma/schema.prisma`); zero references remain; the real
`services/operations/support-service` is canonical.
Contains **only** `prisma/schema.prisma` — a leftover stub duplicating the real
`services/operations/support-service` (which has the full src, Dockerfile, jest config).
No `package.json`, so it's invisible to the workspace, but any doc/tool that globs
`services/core/*` (or future CI) can be confused, and the two schemas can drift.
**Fix:** delete `services/core/support-service/` (the operations copy is canonical) and confirm
nothing references the core path.

### B-4 ✅ RESOLVED — Root vs deploy `docker-compose.all-in-one.yml` drifted
**Fixed:** synced the root compose with deploy — added `WEBHOOK_SECRET` and the passwordless
`redis://localhost:6379` env defaults so flag-store/event-bus connectivity no longer breaks.
`docker-compose.all-in-one.yml` (root — the one README.md tells users to run) lacks
`WEBHOOK_SECRET` and uses **passwordless** `redis://localhost:6379` for
`FEATURE_FLAG_REDIS_URL`/`EVENT_BUS_REDIS_URL`, while `deploy/docker-compose.all-in-one.yml`
passes `WEBHOOK_SECRET` and uses `redis://:${REDIS_PASSWORD}@localhost:6379`
(`deploy/entrypoint.sh` also defaults to password auth). With `REDIS_PASSWORD` set, the root
compose breaks flag-store and event-bus connectivity.
**Fix:** sync the two files (make root delegate to `deploy/`, or apply the same env defaults).

### B-5 ✅ RESOLVED — `docs/remaining-tasks.md` header points at the deleted `todo.md`
**Fixed:** the stale "superseded by todo.md" header was corrected (points at the current task list).
Header says "superseded by `todo.md` audit" — the file was deleted. Point it at this file (or
drop the superseded note).

### B-6 ✅ RESOLVED — `next lint` deprecated (removed in Next.js 16)
`apps/web` was migrated off the deprecated `next lint` to plain `eslint src` (root flat config)
as part of B-1/B-2; web now lints clean like the other 50 workspaces and no longer invokes the
deprecated CLI.

### B-7 ✅ RESOLVED — Content-service teardown warning gone
Re-verified after A-3: content-service passes `jest --detectOpenHandles` with **zero open-handle
warnings** (only a pre-existing ts-jest `.js`-dist transform WARN, unrelated). The second
unshared ioredis client — the likely cause — was structurally removed by A-3's single
`FeatureFlagModule` registration, and the runtime instance-count spec pins it to exactly one.

### B-8 ✅ RESOLVED — `pnpm lint` isn't in the local pre-commit hook
**Fixed:** `scripts/pre-commit-hook.sh` now runs read-only lint + `pnpm typecheck` (post-B-2, both
are green gates).
`scripts/pre-commit-hook.sh` only scans staged files for hardcoded secrets. Add lint (read-only,
post-B-2) + `pnpm typecheck` to the local hook so B-1-class regressions can't reach CI.

---

## C. Verification & Regression Tasks (once fixes land)

### C-1 ✅ RESOLVED — full flag gate re-run, all green (2026-08-14)
```bash
pnpm check:flags              # ✅ 191 unique keys, 9 universe slugs
pnpm sweep:flags              # ✅ 191 registered keys, 230 referenced
pnpm check:flags:docs         # ✅ fresh (32 domains, 191 keys)
node scripts/check-swagger-consistency.mjs  # ✅ 28 services
pnpm check:prisma             # ✅ 236 models, 520 unique finders, 1832 files
pnpm test:flag-conventions    # ✅ 33/33 guard tests
```

**Bonus fix surfaced by the re-run:** `pnpm test:flag-conventions` failed 9/33 on
Windows because the new guard cores emitted `path.relative` results with
backslash separators while the tests (and the macOS/CI output) expect forward
slashes. Added a `toPosix()` normalization in `scripts/lib/flag-conventions-core.mjs`
(4 emission sites) and `scripts/lib/prisma-find-first-core.mjs` (1 site) so
violation `file:line` output is platform-independent. 33/33 green; the real repo
still passes `check:flags` + `check:prisma` on both path styles.

### C-2 ⏸ BLOCKED (infra) — dockerized e2e suites
```bash
pnpm test:flags:redis          # admin → Redis → service chain
pnpm test:payments:failover    # Paystack → Flutterwave failover
pnpm test:e2e:pgtrgm           # search fuzzy search on real Postgres
```
No Docker engine is available in this environment (`docker` not found; no
Docker Desktop/Engine on the Windows host). These three suites bring up Redis +
Postgres + mocks via `docker compose -f docker-compose.test.yml` and cannot run
here. Run on a host with Docker (CI `dockerized-e2e.yml` or the dev Mac).

### C-3 ⏸ BLOCKED (infra) — flag load/thrash checks
```bash
node scripts/flag-eval-load-test.local.mjs   # vs real Redis (0.95 hit-ratio thresholds)
node scripts/flag-cache-thrash-check.mjs     # staging gateway, ≤10% Redis read share
```
Both scripts need a live Redis (first) and a reachable staging gateway (second).
No Redis or staging deployment is reachable from this environment.

### C-4 ✅ RESOLVED — full serial test sweep
```bash
pnpm test:sweep  # one-line C-4 sweep: prisma:generate + per-workspace
                 # jest --runInBand --forceExit / vitest run (web), serially
pnpm test        # root `test` runs prisma:generate first, then all suites
```
`scripts/test-sweep.mjs` (root `test:sweep`) reproduces the exact C-4 run:
regenerates Prisma clients, sweeps every workspace serially with the direct
jest invocation (dodging the pnpm `--` leak), prints per-workspace
pass/fail + totals, and exits non-zero on any failure. Executed 2026-08-17 on
the macOS host: `pnpm install --frozen-lockfile` (option 1 below) rebuilt
`node_modules`, then every workspace's suite ran serially with
`--runInBand --forceExit` (jest) / `vitest run` (web).

**Current baseline: 54 workspaces, 306 suites/files, 3,473 passed /
18 opt-in skipped / 0 failed.** (The 18 opt-in skips are the 3 dockerized e2e
suites — admin Redis, payment failover, search pg_trgm — which need Docker,
see C-2. 305 suites / 3,470 tests before `packages/test-utils` gained its own
spec for the `bootTestApp` helper below.)

**Flake found & fixed (not just re-run green):** `referral.kill-switch.spec.ts`
failed once with "socket hang up". Root cause: supertest 7 closes the HTTP
server after EVERY request when given the server object
(`request(app.getHttpServer())`), which races keep-alive sockets and
ephemeral port reuse → intermittent `ECONNRESET`. Fixed by binding the app
once in `beforeAll` and using `request(baseUrl)` with a URL string (see the
spec's header comment).

**Repo-wide fix landed 2026-08-17:** the deterministic pattern was applied to
all 55 spec files / 420 `request(<server>.getHttpServer())` call sites
(shared apps: `let baseUrl: string;` + `await app.listen(0)` in
`beforeAll`/`beforeEach`, requests by URL string; per-test apps: per-test
`const <var>Url` after `listen(0)`; helper-built apps: return
`{ app, url }`). Root `pnpm typecheck` clean; all 26 affected workspaces'
suites green. New specs should use the shared helper
`bootTestApp(moduleFixture, configure?)` from `@azeebo/test-utils`
(`packages/test-utils/src/supertest-utils.ts`), which boots the app once via
`listen(0)` and returns `{ app, baseUrl }` — this is the same pattern, so the
flake cannot be reintroduced.

**Per-test-app churn eliminated 2026-08-17:** the last churn class — specs
that built a *fresh app per test* (each `listen(0)`/`close()` cycling
ephemeral ports) — was removed from all 10 such files. They now run against a
single app whose guards/middleware read mutable state (`authEnabled`,
`currentRole`, `rejectAll`, …): `roles.guard.integration`, payments/wallet/
games `*.authorization`, `subscription.contract`, `creators.contract`,
`notifications.authorization`, `moderation.authorization` +
`moderation.validation`, and `flag-metrics.service` (whose module tests need
different service/path configs, so each app binds once and stays alive,
closed in `afterAll`). Verified: root `pnpm typecheck` clean; all 9 affected
workspaces green ×3 rounds; full sweeps 306 suites / 3,473 tests, 0 failed,
4 of 5 consecutive post-change sweeps fully clean. Remaining theoretical
residual is now OS-level only: an ephemeral port handed out in a bad
TIME_WAIT state from OTHER processes on a shared host (once in ~4-5 full
sweeps, e.g. a raw `Parse Error: Expected HTTP/` on a fresh connection) —
independent of request style and not addressable from test code.

Two gotchas found while unblocking, both now handled:
1. **pnpm 10 `--` leak** — `pnpm -r test -- --runInBand --forceExit` passes a
   literal `--` to jest (`jest -- --runInBand`), so jest treats the flags as
   filename patterns and runs NOTHING. Invoke the runner directly
   (`pnpm exec jest --runInBand --forceExit`) instead.
2. **Fresh install wipes generated Prisma clients** — after `pnpm install`,
   `@prisma/client` imports failed ("Cannot find module '.prisma/client/default'")
   and payment/wallet e2e + integration suites crashed at load. Fixed by
   `scripts/generate-prisma-clients.sh` (root script `pnpm run prisma:generate`),
   which runs `prisma generate` for all 30 schemas; the root `test` script now
   chains it and every CI job already calls it. `packages/shared-services` is
   the one schema without a custom output and is what populates the shared
   `node_modules/.prisma/client` that `@prisma/client` imports resolve to.

---

## D. Suggested Execution Order

1. **A-1 + A-2** (universe sentinel naming — one shared slug map, publish on update) — highest
   user-visible impact, touches gateway/admin/web/mobile.
2. **B-2 then B-1** (make lint read-only, then fix the 12 failing workspaces) — unblocks CI
   `lint-pr`.
3. **A-3** (content-service double registration) — small, removes a real leak.
4. **A-6 + A-7** (sweep improvement, frontend cache key) — cheap hardening.
5. **A-4 + A-5** (typed frontend registries; Redis-error fallback) — medium, safety.
6. **B-3 / B-4 / B-5** (orphan stub, compose drift, doc pointer) — quick cleanups.
7. **A-8 / A-9 / A-11, B-6 / B-7 / B-8** — hardening + hygiene, do opportunistically.
8. **C-1 → C-4** — full verification.

---

## E. Things Verified CLEAN (no action needed)

- **No dead flags:** all 191 registered keys are referenced outside `registries.ts` (script check).
- **No used-but-unregistered keys:** every flag consumed in services/apps is registered, and
  every consumed flag has a registered default in its owning service's `FeatureFlagModule.register`
  (spot-checked per service).
- **Flag metrics wired into all 28 services** (`FlagMetricsModule` present everywhere).
- **`.env` files gitignored**; only `.env.example` variants are tracked (no committed secrets).
- **Typecheck clean** at root; **feature-flags package tests 55/55**.
- **CI flag workflows** (`pr-checks.yml`, `dockerized-e2e.yml`) are complete and well-documented.
- **Admin flag pages** exist: `/feature-flags/global` + legacy `/feature-flags`; API
  `GET/PUT/DELETE /api/v1/admin/feature-flags(/:key)` + `/stale`.
- **Port assignments consistent** (e.g. live-event 3027 in `.env.example` + `main.ts`).
- **Rollout policy** (`docs/feature-flag-rollout-policy.md`) is in place and coherent.
