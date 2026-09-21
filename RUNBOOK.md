# Azeebo+ Operational Runbook

## Quick Reference

> Red CI job? Find the check and its fix in [CHECKS.md](CHECKS.md).

| Service | Port | Health Check |
|---------|------|--------------|
| API Gateway | 3013 | `curl http://localhost:3013/health` |
| Auth Service | 3000 | `curl http://localhost:3000/v1/health` |
| Web App | 4000 | `curl http://localhost:4000` |
| Admin Panel | 4100 | `curl http://localhost:4100` |
| Creator App | 4104 | `curl http://localhost:4104` |

## Incident Response

### Service Down

1. Check service status: `lsof -ti :<port> -sTCP:LISTEN`
2. Check logs: `tail -f /tmp/azeebo-<service>.log`
3. Restart service: `cd services/<category>/<service> && node dist/main.js`
4. Verify health: `curl http://localhost:<port>/v1/health`

### Database Connection Lost

1. Check PostgreSQL: `pg_isready`
2. Check connection pool: `SELECT count(*) FROM pg_stat_activity;`
3. If near `max_connections` (exhaustion), see [Postgres Connection Pool Limits](#postgres-connection-pool-limits) for the emergency procedure
4. Restart affected service
5. Monitor for connection leaks

### Redis Connection Lost

1. Check Redis: `redis-cli ping`
2. Check memory: `redis-cli info memory`
3. Clear cache if needed: `redis-cli FLUSHDB`
4. Restart affected services

### High Memory Usage

1. Check process memory: `ps aux | grep node`
2. Restart memory-heavy services
3. Check for memory leaks in logs
4. Scale horizontally if needed

### API Gateway Overload

1. Check rate limiting: `curl http://localhost:3013/metrics`
2. Increase rate limits if legitimate traffic
3. Check for DDoS patterns
4. Enable additional caching

## Common Operations

### Start All Services

```bash
./start-all.sh
```

### Shared Runners (dev, build, app, package)

Every service, schema-owning app, and package routes its dev/build scripts
through shared runner scripts. The wiring is enforced by CI (`check:dev-wiring`
in the Flag & Swagger Conventions job); per-service copies, inline chains, or
bare `tsc` builds fail the PR.

| Workspace | Script | Runner | What the runner owns |
|-----------|--------|--------|----------------------|
| `services/<group>/<svc>` | `pnpm start:dev` | `scripts/start-dev-service.sh` | First-run `prisma generate`, client mirror into `dist/prisma/client`, `nest start --watch` |
| `services/<group>/<svc>` | `pnpm run build` | `scripts/build-service.sh` | `prisma generate` (always) → `tsc -p tsconfig.build.json` → client mirror |
| `apps/admin`, `apps/creator` | `pnpm start:dev` | `scripts/start-dev-app.sh` | First-run `prisma generate` (client at `src/generated/prisma`), `tsx watch src/main.ts` |
| `packages/<name>` | `pnpm run build` | `scripts/build-package.sh` | `tsc -p tsconfig.json` (compile-only) |

Behavior common to all four runners:

- Must be invoked from the workspace directory (`pnpm run` guarantees this);
  direct invocation from elsewhere exits 2 with guidance.
- A failed `prisma generate` aborts before compile/start, prints the full
  generate output prefixed with `|`, and shows the fix hint — the workspace
  never boots or builds against a missing/stale client.
- Extra CLI args pass through to the underlying process (dev runners only).
- The package runner is deliberately compile-only: it never runs
  `prisma generate` or mirrors clients. Package clients (`packages/security`,
  `packages/shared-services`) are generated repo-wide by
  `scripts/generate-prisma-clients.sh` (CI's `prisma:generate` and the Docker
  build's T-1 step), not by package builds.

#### Contract of the two service runners

`start-dev-service.sh` and `build-service.sh` implement the same
generate/dist-mirror contract over the same paths:

| Path | Role |
|------|------|
| `prisma/schema.prisma` | schema consumed by generate |
| `src/prisma/client` | generated client output |
| `dist/prisma/client` | mirror target so compiled imports resolve |

These paths exist as canonical constants in `scripts/lib/dev-wiring-core.mjs`
(`SERVICE_SCHEMA_PATH` / `SERVICE_CLIENT_DIR` / `SERVICE_DIST_CLIENT_DIR`) and
are pinned in BOTH scripts by `scripts/__tests__/runner-parity.test.mjs` —
change them in both runners (and the constants) together, or the parity suite
fails CI.

The generate semantics differ on purpose:

| Runner | When it generates |
|--------|-------------------|
| `start-dev-service.sh` | First run only (client dir absent) — fast restarts |
| `build-service.sh` | Always — a build never trusts a pre-existing client |

The app runner (`start-dev-app.sh`) is intentionally different, not broken:
app clients live at `src/generated/prisma`, and there is no dist mirror
because apps import the client by relative path and tsx runs TypeScript
directly.

#### Contract of the app dev runner

`start-dev-app.sh` (apps/admin, apps/creator) shares the dev runner's
discipline but not the service layout:

| Aspect | Behavior |
|--------|----------|
| Invocation | `start:dev` is exactly `bash ../../scripts/start-dev-app.sh` (two levels up, enforced by `check:dev-wiring`) |
| Generate timing | First run only: runs when `prisma/schema.prisma` exists AND `src/generated/prisma` is absent |
| Client location | `src/generated/prisma` (the apps' own layout — not the service `src/prisma/client`) |
| Dist mirror | None — tsx imports the client by relative path; nothing is compiled before boot |
| Process | `exec tsx watch src/main.ts`; extra args pass through |
| Failure | A failed generate prints its output with `|` prefix + fix hint and exits 1 before tsx starts |

Enforcement specifics (`check:dev-wiring`, apps tier): a schema-owning app
without a `start:dev` at all is an error (that was the fresh-clone crash);
a schema-less app (e.g. `apps/web`, which runs Next's own dev model) is
reported informationally and must NOT wire through the app runner; the
constant's `../../` arithmetic is self-tested against the real repo root on
every run.

#### CI checks guarding the runners

All run on every PR: the conventions job runs `check:dev-wiring`,
`check:build-chain`, `check:git-hooks` and the runner test suites
(`node --test scripts/__tests__/*.test.mjs`); the stale-client check has its
own dedicated CI job and also gates the Docker build (T8 stage).

| Check | Fails the PR when | Fix |
|-------|-------------------|-----|
| `check:dev-wiring` | any `start:dev`/`build` script drifts from the exact runner invocation; a legacy per-service `start-dev.sh` reappears; a runner file is missing | set the script to the exact value the error names |
| runner-parity suite | a path changes in one service runner but not the other (or not in the canonical constants) | update both runners + the constants together |
| `check:build-chain` | the Docker all-in-one chain is out of topological order, missing a dist-exporting dependency, or references a deleted workspace; a per-service Dockerfile compiles by hand (`nest build`/`tsc`) instead of routing through the workspace build script | apply the reorder/addition the error names; build with `RUN pnpm --filter <svc> run build` |
| `check:prisma-client` | a generated client doesn't match its `prisma/schema.prisma` (dedicated CI job; also the Docker build's T8 gate) | `pnpm run prisma:generate` |
| `check:git-hooks` | the pre-commit hook file is missing, non-executable, untracked, or committed without mode 100755 | restore `scripts/hooks/pre-commit`, `chmod +x`, `git add` |

Local guard: the stale-client pre-commit hook installs itself on every
`pnpm install` via the root `prepare` script (verify:
`git config --get core.hooksPath` → `scripts/hooks`; opt out:
`git config --unset core.hooksPath`).

### Stop All Services

```bash
./stop-all.sh
```

### View Logs

```bash
tail -f /tmp/azeebo-*.log
```

### Run Tests

```bash
# Web app
cd apps/web && npx vitest run

# Admin app
cd apps/admin && npm run test

# Creator app
cd apps/creator && npm run test
```

### Admin Data Freshness (scheduled job)

The admin panel reads the live service databases through postgres_fdw
federation, so its data cannot go stale by design. A LaunchAgent guards the
federation itself: it verifies a cross-DB join every hour (at :07) and at
login, re-applies federation if a service DB was recreated, and falls back to
a mirror seed only on fresh checkouts that are not yet federated.

**Federated scope:** every shared table (users, wallets, content, …) is a
foreign table over its home service DB. Auth-service's own audit trail
(`azeebo_auth.audit_logs` — a different schema from admin's, holding
login/token events) is federated read-only as `auth_audit_logs` and merged
into the admin Audit Logs page, so auth events appear there live. Admin's own
`audit_logs`, plus `user_suspensions` and `saved_items`, stay local:
`user_suspensions` and `saved_items` have no home service DB, and
`audit_logs` is written by the panel itself.

```bash
# check state + last log lines
bash scripts/database/admin-data-freshness.sh status

# force a pass now
bash scripts/database/admin-data-freshness.sh run

# reinstall (bakes the machine's psql path into the job) / remove
bash scripts/database/admin-data-freshness.sh install
bash scripts/database/admin-data-freshness.sh uninstall

# also schedule the weekly self-heal drill (Saturdays 05:23)
bash scripts/database/admin-data-freshness.sh install-drill
bash scripts/database/admin-data-freshness.sh uninstall-drill

# run the drill once by hand
bash scripts/database/admin-data-freshness.sh drill
```

Log: `/tmp/azeebo-admin-freshness.log` (one line per pass). If the panel ever
shows empty data, run `status` first — a `WARN` line means the job healed the
federation on its next pass.

**Weekly drill pass:** `install-drill` adds a second LaunchAgent
(`com.azeebo.admin-federation-drill`) that runs the federation drill
(see below) every Saturday at 05:23, so the *self-heal path itself* is
exercised automatically, not just assumed. Drill failures fire the same
alert pipeline (macOS notification + optional webhook) under the label
"azeebo admin-federation-drill", tracked in their own alert state so an
hourly pass can never mask a broken drill (or vice versa). A lock makes the
drill and the hourly pass mutually exclusive — the drill repoints an FDW
server for a few seconds, and a concurrent probe would false-alert; stale
locks older than 15 minutes are stolen (launchd SIGKILL recovery).

**Alerting:** failures fire a macOS notification ("Azeebo Admin Freshness")
and, if `ALERT_WEBHOOK_URL` is set, a Slack-style `POST {"text": ...}`.
Alerts fire on the DOWN transition only — a persistent failure re-notifies
after 24h (`ALERT_REPEAT_HOURS`) — and recovery logs `RECOVERED` / posts a
RECOVERED webhook. Verify delivery anytime with:

```bash
bash scripts/database/admin-data-freshness.sh test-alert

# add webhook delivery (re-install bakes it into the LaunchAgent):
ALERT_WEBHOOK_URL='https://hooks.slack.com/services/…' \
  bash scripts/database/admin-data-freshness.sh install
```

### Federation Drill (drop + re-federate test)

Automated test that proves the admin panel's federation survives service-DB
failures, in two scenarios. Run it after changing `federate-admin-db.sh`, or
anytime you want proof the self-heal path works (the weekly freshness drill
does this automatically — see above):

```bash
bash scripts/database/federation-drill.sh                 # both scenarios
DRILL_SCENARIO=1 bash scripts/database/federation-drill.sh # drop only
DRILL_SCENARIO=2 bash scripts/database/federation-drill.sh # schema drift only
```

Safe by construction — live data is never modified beyond two marker users
that the exit trap deletes.

**Scenario 1 (drop):** snapshots `azeebo_auth`'s schema into a throwaway
clone (`azeebo_auth__drill`), repoints the FDW server at the clone and
verifies the panel now reads the clone, drops the clone (from postgres_fdw's
view, identical to a real service-DB drop), re-runs `federate-admin-db.sh`,
then asserts the full contract: all seven FDW servers point at their
canonical DBs, foreign tables answer, the cross-DB join works,
`auth_audit_logs` matches its source, and rows inserted into the live auth DB
before *and* after the heal are visible through the panel.

**Scenario 2 (schema drift):** simulates the service DB being recreated from
its Prisma baseline — the six admin-owned additive columns (`isSuspended`,
`suspendedAt`, `suspendedBy`, `suspendedUntil`, `suspensionReason`,
`notificationPreferences`) are dropped. A scratch pair (`azeebo_auth__drill2`
+ fresh `azeebo_admin__drill2`, via the `AUTH_DB`/`ADMIN_DB` overrides) is
then federated from scratch, proving the federate script's `ADD COLUMN IF
NOT EXISTS` repair converges the drift: all six columns visible through the
foreign table again, reads and inserts work, and the remote `DEFAULT false`
survives. `DRILL_KEEP=1` preserves the clones for debugging a failure.

One postgres_fdw behavior the drill documents: foreign tables imported via
`IMPORT FOREIGN SCHEMA` carry **no column defaults**, so an INSERT through a
foreign table must supply every NOT NULL value explicitly — NULL is sent
remotely for omitted columns. The panel's Prisma client already writes that
way, so this is invisible to the app; raw SQL writers against
`azeebo_admin` need to know it.

The drill's server-convergence assertion caught one real bug (now fixed):
re-running federation did not restore FDW server `dbname` options, so a
repointed or tampered server never healed — `federate-admin-db.sh` now
forces each server back to its canonical database on every run.

**In CI:** the `Federation Drill` workflow
(`.github/workflows/federation-drill.yml`) runs both scenarios on an
ephemeral postgres:16 container for every PR touching `scripts/database/**`.
It seeds the seven service DBs from the checked-in fixture
(`scripts/database/ci/drill-fixture.sql`) and bootstraps federation cold —
which doubles as a first-federation regression test. Locally you can
reproduce the CI path with a scratch admin DB:
`createdb azeebo_admin__ci && ADMIN_DB=azeebo_admin__ci bash scripts/database/federate-admin-db.sh`.

### Rollout Notes: Raw SQL Against `azeebo_admin`

For anyone writing one-off SQL, migration scripts, or psql sessions against
the admin database — two rules that only bite outside Prisma (both verified
against the live federation):

**1. Foreign tables carry no column defaults.** The shared tables (`users`,
`wallets`, `content_items`, …) are postgres_fdw foreign tables over the live
service DBs — relkind `f` in `pg_class`. Local (relkind `r`) tables are only
the admin-owned ones (`audit_logs`, `job_runs`, `payout_requests`,
`saved_items`, `safety_actions`, `user_suspensions`, `watch_history`) plus the
`*__local_backup` copies. `IMPORT FOREIGN SCHEMA` does not import column
defaults, so defaults that exist remotely are invisible locally. An INSERT
that omits such a column does not fail locally either — postgres_fdw silently
sends the **full** column list with explicit NULLs for everything omitted
(visible in the error's `remote SQL command:` context line), so on the remote:

- a remote-defaulted **NOT NULL** column → `null value in column … violates
  not-null constraint`, even though the identical INSERT works on the source
  DB;
- a remote-defaulted **nullable** column → NULL is stored and the remote
  default never fires (data goes in, just not the default you expected).

Example with `users`, whose remote defaults (`role 'user'`, `isVerified
false`, `mfaEnabled false`, `isSuspended false`, `createdAt
CURRENT_TIMESTAMP`, `password ''`) appear nowhere in the local definition:

```sql
-- FAILS on the remote: "null value in column \"isVerified\" … violates
-- not-null constraint" (isSuspended would fail next):
INSERT INTO users (id, email, password, "displayName", role, "updatedAt")
VALUES (gen_random_uuid()::text, '…', '…', '…', 'user', now());

-- WORKS: every NOT NULL column supplied explicitly:
INSERT INTO users (id, email, password, "displayName", role,
                   "isVerified", "mfaEnabled", "isSuspended",
                   "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, '…', '…', '…', 'user',
        false, false, false, now(), now());
```

Rule of thumb: through a foreign table, supply **every NOT NULL column
explicitly** — treat defaults as if they did not exist. To enumerate what a
table needs, query the *source* service DB (defaults live there, where they
belong — the federation drill's scenario 2 asserts they survive a heal):

```sql
-- run against the source DB, e.g. azeebo_auth:
SELECT column_name, column_default FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
  AND column_default IS NOT NULL;
```

**2. Quote camelCase identifiers.** Unquoted `displayName` folds to
`displayname` and fails with `column "displayname" of relation "users" does
not exist`. Every camelCase column (`"displayName"`, `"isVerified"`,
`"createdAt"`, …) needs double quotes in raw SQL.

**Prisma is unaffected** by both rules — the generated client writes every
column explicitly and quotes identifiers itself, which is why the admin panel
never trips on either. These notes apply only to hand-written SQL.

### Audit Trail Retention (scheduled job)

Both audit tables grow without bound otherwise — auth-service writes a row
per login — so `scripts/database/audit-retention.sh` enforces the policy
daily at 03:47 (LaunchAgent `com.azeebo.audit-retention`):

- `azeebo_admin.audit_logs` older than **365 days** (`AUDIT_RETENTION_DAYS`)
  is deleted, **except** `feature_flag.deleted` entries, which are never
  age-deleted: flag restore reads its archived snapshots out of audit logs.
- `azeebo_auth.audit_logs` older than **90 days** (`AUTH_AUDIT_RETENTION_DAYS`)
  is deleted; the federated `auth_audit_logs` view follows automatically.

Deletes run in batches (`BATCH`, default 5000) on the indexed time column so
long locks never block login writes. The federated admin audit page just
shows fewer old rows afterward — no other behavior changes.

```bash
bash scripts/database/audit-retention.sh status     # rows + oldest entry
bash scripts/database/audit-retention.sh dry-run    # what WOULD be deleted
bash scripts/database/audit-retention.sh run        # apply now
bash scripts/database/audit-retention.sh install    # (re)install schedule
bash scripts/database/audit-retention.sh uninstall
```

Log: `/tmp/azeebo-audit-retention.log`. Deletion-in-place (not native
partitioning) is deliberate: Prisma models expect plain tables, and the
indexed ranged deletes are plenty at this scale.

### Analytics/PII Retention (scheduled job)

`scripts/data-retention-enforcement.ts` enforces the platform retention
policies from `@azeebo/shared-types` (`DEFAULT_RETENTION_POLICIES`) against
the per-service databases, daily at 04:11 (LaunchAgent
`com.azeebo.data-retention`):

- **PII (3y):** `azeebo_analytics.product_events` past the cutoff are
  deleted; `device_info` rows cascade via the schema's `onDelete: Cascade`.
- **SENSITIVE_PII (2y):** `azeebo_analytics.session_summaries` past the
  cutoff are deleted.
- **INTERNAL (1y):** `azeebo_messaging.messages` past the cutoff are
  **soft-deleted** (`isDeleted = true`) — recoverable until a product
  decision says otherwise.

The job defaults to a dry run (`npx tsx scripts/data-retention-enforcement.ts`);
pass `--apply` to delete. It rewrites what the original dead script
imagined: there is no `AnalyticsEvent`/`PII_ACCESS` model in any Prisma
schema, no `PII_ACCESS` category in shared-types, and `Message` has no
`archived` column — the old code could never have run. Messaging uses raw
SQL here on purpose (the root `@prisma/client` is generated without the
messaging schema). Admin audit trails are covered separately by the
audit-retention job above. Log: `/tmp/azeebo-data-retention.log`.

```bash
npx tsx scripts/data-retention-enforcement.ts           # dry run
npx tsx scripts/data-retention-enforcement.ts --apply   # enforce
npx tsx scripts/data-retention-enforcement.ts install   # (re)install schedule
npx tsx scripts/data-retention-enforcement.ts uninstall
```

### Job Runs Ledger (`azeebo_admin.job_runs`)

Every scheduled admin job appends one row per pass to the `job_runs` table in
`azeebo_admin` (created by `federate-admin-db.sh` step 7): `freshness`,
`drill`, `audit-retention`, `data-retention` — with status, detail,
rows-purged, and duration. The Ops Health page (Admin panel → Ops Health)
charts the last 24h per job from this ledger (`GET /admin/ops/runs`). The
append helper is `scripts/database/record-job-run.sh` and is **best-effort by
design**: if the table or the DB is unavailable, the run is skipped and the
job itself still succeeds — the ledger must never break the job it records.
On a fresh checkout the table appears after the first
`federate-admin-db.sh` run.

### Weekly Ops Digest (scheduled macOS notification)

`scripts/database/ops-weekly-digest.sh` summarizes the past seven days and
pushes it as a macOS notification every Monday at 09:07 (LaunchAgent
`com.azeebo.ops-weekly-digest`), plus webhook delivery when
`ALERT_WEBHOOK_URL` is set. Three sections, computed standalone (no admin
backend required except the probe):

- **Job pass rate** — `COUNT(*) FILTER` over `azeebo_admin.job_runs` for the
  window: total runs, % ok, warn, failed across all four scheduled jobs.
- **Alert count** — `ALERT:`/`ERROR:`/`WARN:` lines in the freshness and
  audit-retention logs within the window (same timestamp format the backend
  parses for the Ops Health page).
- **Service fleet** — live probe through the admin backend's
  `GET /admin/ops/services` (login with `AUTH_EMAIL`/`AUTH_PASSWORD`, default
  the seeded demo admin): `N/28 healthy, X degraded, Y down`.

```bash
bash scripts/database/ops-weekly-digest.sh            # compute + notify now
bash scripts/database/ops-weekly-digest.sh install    # Mondays 09:07
bash scripts/database/ops-weekly-digest.sh status     # agent state + last digests
bash scripts/database/ops-weekly-digest.sh uninstall
# webhook delivery (re-install bakes it into the LaunchAgent):
ALERT_WEBHOOK_URL='https://hooks.slack.com/services/…' bash scripts/database/ops-weekly-digest.sh install
```

Log: `/tmp/azeebo-ops-weekly-digest.log`. Unlike the alerting jobs, the
digest always notifies on every run — there is no down-transition state;
it is a report, not an alarm.

### Database Migration

```bash
cd services/<service>
npx prisma migrate dev
npx prisma generate
```

### Deploy to Production

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Postgres Connection Pool Limits

**Status: applied.** Every service's `DATABASE_URL` carries an explicit
`connection_limit`, `pool_timeout=10000`, and `connect_timeout=5000`. Prisma
pool sizing is URL-driven, so the caps are in the env files themselves — no
code change needed.

**Why:** every service runs its own Prisma client against the same Postgres
instance. With Prisma's default pool (`num_cpus * 2 + 1`, ~10-11 locally) the
sum across 27 services exceeds Postgres `max_connections=100`, and idle
sessions accumulate until the next service to connect gets:

```
FATAL: remaining connection slots are reserved for roles with the SUPERUSER attribute
```

This hit dev on 2026-09-18 (106/100 slots used; support-service's dashboard
queries failed mid-flight).

**Sizing (worst-case budget: 78 of 100):**

| Tier | Limit | Services |
|------|-------|----------|
| primary | 6 | auth-service |
| hot | 6 | admin backend (`apps/admin`) |
| busy | 5 | user-service |
| medium | 4 | media, support (7 parallel dashboard counts) |
| default | 3 | wallet, payment, search, analytics, subscription, moderation, messaging, engagement, notification, gateway |
| quiet | 2 | all universe services, referral, reward, queue, recommendation, creator |

> This budget leaves ~20% headroom for superuser/psql/admin sessions and
> short-lived tooling. It is intentionally sized for the dev machine; for
> production, use pgbouncer (see below) instead of raising these numbers.

**Manage / verify:**

```bash
# Re-apply after adding a service (idempotent; never overwrites an existing cap)
node scripts/database/apply-pool-limits.mjs

# Preview + budget check against the live server (exit 2 if over 80% of max)
node scripts/database/apply-pool-limits.mjs --check

# What is using connections right now?
PGPASSWORD='change-me-in-production' psql -h localhost -U postgres -d postgres \
  -c "SELECT count(*), usename, datname FROM pg_stat_activity GROUP BY 2,3 ORDER BY 1 DESC;"

# Live per-service check: a service's pool must never exceed its cap
PGPASSWORD='change-me-in-production' psql -h localhost -U postgres -d postgres \
  -c "SELECT count(*) FROM pg_stat_activity WHERE datname='azeebo_auth';"   # auth cap = 6
```

**Sizing rules:**

- New services default to `connection_limit=2` (the script's `TIER_DEFAULTS.quiet`).
- The `--check` mode fails (exit 2) when the sum exceeds 80% of
  `max_connections` — run it after adding services or raising any tier.
- Never hand-edit a `connection_limit` in one env file without re-running
  `--check`; the budget is global, not per-service.

**Emergency: the server is already wedged**

```bash
# Show what would be killed (default: azeebo-user idle > 10 min)
node scripts/database/kill-idle-connections.mjs

# Actually terminate them
node scripts/database/kill-idle-connections.mjs --kill
```

Verified 2026-09-18: reclaimed 52 idle sessions (83 → 31 of 100) without
disrupting any live service. The tool never touches superuser sessions, your
own connection, or sessions younger than the idle threshold.

**pgbouncer (active locally, path for prod).** Pool-per-process does not scale
past a dozen or so services, so the dev stack now runs pgbouncer in
**transaction** mode on `127.0.0.1:6432` and every service `DATABASE_URL`
points at it (`pgbouncer=true` param included — required so Prisma skips
named prepared statements, which don't survive transaction pooling). Each
`DATABASE_URL` also keeps a `DIRECT_DATABASE_URL` pointing at Postgres
5432: that is the escape hatch for anything needing session state —
`prisma migrate`, `db push`, advisory locks, `LISTEN/NOTIFY`.

Dev setup (managed, do not hand-edit `userlist.txt`):

```bash
# config: scripts/database/pgbouncer.ini (transaction mode, ~20 server conns)
node scripts/database/start-pgbouncer.mjs           # start (idempotent)
node scripts/database/start-pgbouncer.mjs status    # running? pid?
node scripts/database/start-pgbouncer.mjs restart   # after ini edits
node scripts/database/start-pgbouncer.mjs stop

# point every service .env at the pooler (idempotent, reversible)
node scripts/database/apply-pgbouncer.mjs --dry-run # preview
node scripts/database/apply-pgbouncer.mjs           # enable (writes DIRECT_DATABASE_URL)
node scripts/database/apply-pgbouncer.mjs --status  # who's on the pooler
node scripts/database/apply-pgbouncer.mjs --revert  # restore direct URLs

# prove Prisma works through it (reads/writes/$transaction/concurrency)
node scripts/database/verify-pgbouncer-prisma.mjs
```

Watch the pooler live (login `pgbouncer`/any password locally):

```bash
psql -h 127.0.0.1 -p 6432 -U pgbouncer -d pgbouncer -c "SHOW POOLS;"
psql -h 127.0.0.1 -p 6432 -U pgbouncer -d pgbouncer -c "SHOW STATS;"
```

Restarted services pick the pooler up automatically (auth-service,
admin-backend verified live: DB-backed 401/200 responses flow through
`azeebo_auth`/`azeebo_admin` pools). Services still running with old env
adopt it on next restart — same per-service rollout as the pool caps. Two
caveats that carried over from the design: keep per-service
`connection_limit` even behind pgbouncer (it bounds client-side queuing),
and dev uses `auth_type = trust` because service .env passwords vary and
the backend Postgres itself is trust-auth on loopback — production must
use `md5`/`scram-sha-256` plus TLS instead. Keep the caps even after
pgbouncer: they bound client-side queuing per service.

### Prisma Ledger Reconciliation (failed-deploy tombstones)

When the nightly schema-lock report shows `BLOCKED-LEDGER` for a service, its
`_prisma_migrations` table contains a crashed-deploy tombstone: an unfinished
row (`finished_at IS NULL`, `applied_steps_count = 0`, logs matching
"A migration failed to apply…") that blocks **all** further `migrate deploy`
runs for that database until resolved.

```bash
# 1. Plan — always safe, zero writes:
node scripts/reconcile-prisma-ledger.mjs                 # all services, local dev
node scripts/reconcile-prisma-ledger.mjs wallet-service  # one service
LIVE_DB_URL_BASE=... node scripts/reconcile-prisma-ledger.mjs --env staging

# 2. Fix the migration that failed (the deploy will re-run it!)
#    — usually done in the repo BEFORE step 3; the plan refuses if the
#    tombstoned migration is missing from the migration folder.

# 3. Execute — backs up the ledger to a CSV artifact first, then
#    resolve → deploy → delete the resolved fossil row → verify:
node scripts/reconcile-prisma-ledger.mjs --apply wallet-service
```

Mechanics and guarantees (verified against prisma 6.19.3):

- `migrate resolve --rolled-back <name>` unblocks the ledger; a following
  `migrate deploy` re-applies the migration — but **inserts a new ledger row**
  instead of reusing the tombstone, leaving a resolved-but-unfinished fossil.
  The script deletes that fossil under an exact-shape predicate
  (`finished_at IS NULL AND applied_steps_count = 0 AND rolled_back_at IS NOT NULL`)
  only after a fresh applied row exists, so what remains is the canonical
  single applied row.
- Rows already resolved by an earlier manual `migrate resolve --rolled-back`
  (resolved fossils) are handled too: re-apply if the migration never ran,
  then delete the stale row.
- If `deploy` still fails, the script undoes its own resolves — the database
  is left exactly as found, tombstone included. Never worse than before.
- Absolute refusals: any unfinished row that is neither a tombstone nor a
  resolved fossil (a deploy may be running right now), and tombstoned
  migrations missing from the folder.
- Artifacts per run: ledger backup CSV + JSON report in
  `.reconcile-prisma-ledger-out/<env>/`.

## Monitoring

### Key Metrics

- Request latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- Active connections
- Memory usage
- CPU usage
- Database connection pool

### Alerts

- Error rate > 5%: Critical
- Latency p99 > 2s: Warning
- Memory > 80%: Warning
- Database connections > 80%: Critical

### CI dark watchdog

GitHub Actions can fail **before any step runs** — account billing blocks,
spending limits, runner-capacity loss. PRs then show red X's with no logs,
and every scheduled job that would alert dies the same way: CI goes dark
silently. The watchdog (`.github/workflows/ci-dark-watchdog.yml`, every
30 min) detects that signature — a failed run where every job executed zero
steps within minutes — and maintains one tracking issue (`ci-dark` label):
it opens on first darkness with the annotated cause, updates while it
persists, and closes itself when a sweep finds CI healthy.

It also comments directly on **open PRs whose head checks failed dark** (one
maintained comment per PR: "not a code failure — nothing to debug here"),
so authors don't burn time debugging an outage. Real step-executing failures
never get the comment.

**When the issue fires:**

1. Open the issue; the cause column names the blocker (usually "billing
   block" → a human fixes Settings → Billing & plans).
2. After fixing, re-run failed jobs from any battery, or just wait for the
   next sweep — the watchdog closes the issue automatically once no dark
   batteries remain.

**If the outage also kills the watchdog schedule (full account block):**
install the dev-machine heartbeat (preferred — no cron editing, runs every
30 min and at login, tokenless runs are a recorded skip):

```bash
scripts/ci-dark-launcher.sh install      # LaunchAgent com.azeebo.ci-dark-watchdog
scripts/ci-dark-launcher.sh status       # loaded? token? last sweeps
scripts/ci-dark-launcher.sh uninstall    # remove it
```

Or run the sweep from any machine with repo access as a one-off backstop:

```bash
GITHUB_TOKEN=<token-with-repo-scope> GITHUB_REPOSITORY=azeebotv/AzeeboPlus \
  pnpm check:ci-dark            # acts (creates/updates/closes the issue)
  # add --dry-run after the script name to preview only
  # set WATCHDOG_BRANCH=Major-Upgrade to scope the sweep to one branch
  # (the scheduled workflow pins it there; unset = repo-wide)
```

## Backup & Recovery

### Database Backup

```bash
pg_dump -U azeebo azeebo_auth > backup_$(date +%Y%m%d).sql
```

### Database Restore

```bash
psql -U azeebo azeebo_auth < backup_20260903.sql
```

### Redis Backup

```bash
redis-cli BGSAVE
```

## Archive Schema Retention Cleanup

Destructive migrations copy dropped tables into the `archive` schema before
dropping them (recovery window). Retention and sign-off rules are defined in
`docs/DEPRECATION_POLICY.md` — "Data Retention — Archived Tables". The
cleanup is automated by `scripts/archive-cleanup.mjs`.

### Nightly check (dev/staging)

```bash
# Plan mode — always safe, drops nothing:
node scripts/archive-cleanup.mjs
```

Add to crontab (dev/staging only): `0 3 * * * cd /srv/azeebo && RETENTION_DAYS=90 node scripts/archive-cleanup.mjs >> /var/log/azeebo-archive-cleanup.log 2>&1`

### Containerized nightly job (staging)

Staging runs the same script from a job container instead of crontab:

```bash
docker network create azeebo-network   # once — shared with the monitoring stack
docker compose -f docker-compose.prod.yml -p azeebo-staging up -d
docker compose -f docker-compose.staging-jobs.yml -p azeebo-staging up -d
```

- Schedule: runs 2h after boot, then every `ARCHIVE_CLEANUP_INTERVAL`
  (default 24h). Defaults: `--apply` with sign-off enforcement ON — nightly
  drops only tables that are past retention AND signed off in the state file.
- Adjust via `.env`: `ARCHIVE_CLEANUP_ARGS`, `ARCHIVE_CLEANUP_INTERVAL`,
  `ARCHIVE_CLEANUP_OFFSET`, `RETENTION_DAYS`.
- Logs ship to Loki via the job stack's promtail; query in Grafana with
  `{container="azeebo-archive-cleanup"}`. The `done`/`status:failed` event is
  the alert surface.
- The sign-off state file lives on the `archive-cleanup-state` volume —
  sign-offs recorded there survive redeploys; add new ones with
  `docker compose -f docker-compose.staging-jobs.yml exec archive-cleanup sh`
  or by editing the volume via a throwaway container.

### Executing drops (manual, after sign-off)

1. Run the plan and review every `→ DROP` line:
   ```bash
   node scripts/archive-cleanup.mjs
   ```
2. Sign off each table in `scripts/archive-cleanup.state.json`:
   ```json
   { "azeebo_user.archive.users_legacy_auth_20260908":
     { "approvedBy": "ops-oncall", "approvedAt": "2026-12-07", "ticket": "OPS-1234" } }
   ```
3. Confirm the pre-drop checklist in `docs/DEPRECATION_POLICY.md` (new path
   healthy, no legal hold, sign-off recorded).
4. Execute:
   ```bash
   node scripts/archive-cleanup.mjs --apply
   ```
   Drops run inside `BEGIN; LOCK TABLE ... ACCESS EXCLUSIVE; DROP; COMMIT;`
   and the audit log (rows before drop, approver, drop date) is appended to
   the state file automatically.
5. Only when a database's archive schema is completely empty **and** no future
   archives are planned there, append `--drop-schema` to also drop the schema.

### Emergency override (dev databases only)

`node scripts/archive-cleanup.mjs --apply --require-signoff=false` bypasses
sign-off for a single run. Never use against production.

### Recovery from an archive table

Before the retention window expires, a dropped table can be restored from the
archive schema with plain SQL:

```sql
CREATE TABLE public.<table> (LIKE archive.<table> INCLUDING ALL);
INSERT INTO public.<table> SELECT * FROM archive.<table>;
```

After expiry (drop + backup retention ~30–35 days), restore only via PITR to
a point before the drop.

## Security

### Rotate Secrets

1. Update `.env` files
2. Restart all services
3. Verify authentication works
4. Monitor for unauthorized access

### CSRF Token Registry (gateway)

The gateway's CSRF middleware (SEC-005) does **not** rely on an in-process secret.
Tokens are validated against a **Redis-backed registry** (`CsrfTokenRegistry`), so
**gateway restarts do NOT invalidate clients' cached tokens** — a deploy does not
force every admin/creator/web session to re-bootstrap CSRF.

How it works:

- Every minted token (gateway safe-method responses and `GET /api/v1/auth/csrf`)
  is registered in Redis under `csrf:token:<sha256(token)>` with a **24h TTL**.
- State-changing, cookie-authenticated requests must present a token that is
  still in the registry (in addition to the cookie==header double-submit check).
- Tokens that were never minted here are rejected with `403 CSRF token unknown`.
- The raw token is never stored — only its SHA-256 hash as the key.

**Requirements & failure posture:**

- `REDIS_URL` must be set on **both** the gateway and auth-service (they share
  one registry). Without it the gateway logs
  `REDIS_URL not set — CSRF registry disabled` at boot and validation degrades
  to the plain double-submit check (fails **open**, availability over strictness).
- If Redis goes down mid-flight the same fail-open applies; a single WARN is
  logged per validation failure. Reconnecting restores strict validation
  automatically (no restart needed).
- An emergency bypass still exists via the `gateway_csrf_enforce` feature flag.

**Ops notes:**

- Restart-safe: token keys live in Redis, not in the gateway process.
- Scale-safe: any gateway replica validates tokens minted by any other.
- Leaked-token blast radius is capped at the 24h TTL.
- To rotate immediately (suspected leak), flush only CSRF keys —
  clients transparently re-bootstrap on their next GET and retry:

  ```bash
  redis-cli --scan --pattern 'csrf:token:*' | xargs redis-cli del
  ```

- Sanity check that the registry is alive:

  ```bash
  curl -s -D - -o /dev/null http://localhost:3013/api/v1/auth/csrf | grep -i x-csrf-token
  redis-cli --scan --pattern 'csrf:token:*' | wc -l   # should be >= 1
  ```

### Gateway GET Cache: Deny-By-Default Policy

The gateway's response cache is an **allowlist, not a blacklist**: a GET is
cacheable only if its route is explicitly marked `publicCacheable: true` in
`proxy.controller.ts` (`SERVICE_CONFIGS`). Currently exactly two routes are:

- `/public/*` (content-service public settings, enabled universes)
- `/pricing/*` (anonymous pricing tables)

Three gates stack on top, in order:

1. **Route allowlist** - unmarked routes (`/content`, `/search`, `/universe`,
   everything else) are never cached, even for anonymous traffic.
2. **Authenticated requests bypass everything** - any `Authorization` header,
   session `Cookie`, or gateway-stamped `req.user` skips both cache reads and
   writes regardless of route marking. A shared cached body must never serve
   one user another user's data, and authenticated reads must re-issue right
   after mutations.
3. **Path exclusions remain as defense in depth** (`/admin/`, `/analytics/`,
   `/subscription/bundles`, user-specific paths) in case the policy is ever
   loosened back to caching authenticated traffic.

**Why:** every historical mutation-revert incident (create succeeded, list
refetch showed stale bytes) traced to a sensitive GET that was missing from
the old blacklist. A blacklist silently misses new endpoints; an allowlist
cannot.

**Operational notes:**

- Anonymous traffic on popular unmarked endpoints (e.g. `/content/home`) now
  always hits the upstream. If upstream latency becomes a problem, mark the
  route `publicCacheable: true` - do **not** re-add authenticated caching.
- Behavior is pinned by `proxy-cache-exclusions.spec.ts` (25 tests: never
  served / never written per gate, plus a positive control proving `/pricing`
  still caches).

### SSL Certificate Renewal

1. Check expiration: `openssl x509 -enddate -noout -in cert.pem`
2. Renew certificate
3. Update nginx/load balancer config
4. Test HTTPS endpoints
