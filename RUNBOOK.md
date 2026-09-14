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
3. Restart affected service
4. Monitor for connection leaks

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
```

Log: `/tmp/azeebo-admin-freshness.log` (one line per pass). If the panel ever
shows empty data, run `status` first — a `WARN` line means the job healed the
federation on its next pass.

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

Automated test that proves the admin panel's federation stays intact across a
service-DB drop and re-federate cycle — the exact failure mode the freshness
job above is meant to heal. Run it after changing `federate-admin-db.sh`, or
anytime you want proof the self-heal path works:

```bash
bash scripts/database/federation-drill.sh
```

Safe by construction: it snapshots `azeebo_auth`'s schema into a throwaway
clone (`azeebo_auth__drill`), repoints the FDW server at the clone and
verifies the panel now reads the clone, drops the clone (from postgres_fdw's
view, identical to a real service-DB drop), re-runs `federate-admin-db.sh`,
then asserts the full contract: all seven FDW servers point at their
canonical DBs, foreign tables answer, the cross-DB join works,
`auth_audit_logs` matches its source, and rows inserted into the live auth DB
before *and* after the heal are visible through the panel (no stale
connections). The only writes to live data are two marker users that the
exit trap deletes; `DRILL_KEEP=1` preserves the clone for debugging a
failure. Live data is never modified beyond those markers.

The drill exposed one real convergence gap (now fixed): re-running
federation did not restore FDW server `dbname` options, so a repointed or
tampered server never healed — `federate-admin-db.sh` now forces each server
back to its canonical database on every run.

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
run the sweep from any machine with repo access as a backstop:

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

### SSL Certificate Renewal

1. Check expiration: `openssl x509 -enddate -noout -in cert.pem`
2. Renew certificate
3. Update nginx/load balancer config
4. Test HTTPS endpoints
