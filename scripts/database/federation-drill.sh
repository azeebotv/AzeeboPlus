#!/usr/bin/env bash
# federation-drill.sh — prove azeebo_admin federation survives service-DB drops.
#
# Scenario 1 (drop): a throwaway clone of azeebo_auth's schema is created,
#   the FDW server repointed at it, then the clone is dropped — from
#   postgres_fdw's view, byte-for-byte the failure a real service-DB drop
#   produces. federate-admin-db.sh must heal it; assertions verify the full
#   contract afterwards (canonical servers, foreign tables answering,
#   cross-DB join, auth_audit_logs, pre/post-heal live inserts visible).
#
# Scenario 2 (schema drift): the service DB is RECREATED from its Prisma
#   baseline — the admin-owned additive columns (isSuspended, suspendedAt,
#   suspendedBy, suspendedUntil, suspensionReason, notificationPreferences)
#   are GONE. A scratch admin DB is federated against the drifted auth DB
#   with env overrides, proving federate-admin-db.sh's ADD COLUMN IF NOT
#   EXISTS repair converges the drift — without touching the live pair.
#
# The only writes to live data are two marker users (drill-marker-pre/-post),
# deleted on exit by the cleanup trap; everything else happens in clones.
#
# Usage:
#   bash scripts/database/federation-drill.sh
#   DRILL_KEEP=1 bash scripts/database/federation-drill.sh        # keep clones on failure
#   DRILL_SCENARIO=1|2 bash scripts/database/federation-drill.sh  # one scenario only
#
# Exit code: 0 = all assertions passed, 1 = one or more failed.
# Dev-only: uses the shared dev credentials, same as seed-all.sh.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-azeebo}"
PGPASSWORD="${PGPASSWORD:-azeebo_dev_2024}"
ADMIN_DB="${ADMIN_DB:-azeebo_admin}"
DRILL_DB="${DRILL_DB:-azeebo_auth__drill}"
DRILL_KEEP="${DRILL_KEEP:-0}"
SUPERUSER="${SUPERUSER:-postgres}"
SUPERUSER_PASSWORD="${SUPERUSER_PASSWORD:-postgres}"
export PGHOST PGPORT PGUSER PGPASSWORD

AUTH_SERVER="azeebo_fdw_azeebo_auth"
LIVE_MARKERS="'drill-marker-pre','drill-marker-post'"
# Scenario 2 scratch pair (never touch live azeebo_auth / azeebo_admin)
DRILL_AUTH_DB="${DRILL_AUTH_DB:-azeebo_auth__drill2}"
DRILL_ADMIN_DB="${DRILL_ADMIN_DB:-azeebo_admin__drill2}"
SCENARIO="${DRILL_SCENARIO:-both}"

# launchd/cron PATHs lack the postgres binaries; resolve the bin dir once and
# prepend it so every bare psql/pg_dump call below works from a clean shell
# (and spawned children — federate-admin-db.sh — inherit it). Mirrors
# admin-data-freshness.sh's PSQL_BIN resolution (Homebrew + FlyEnv layouts).
for _pgdir in "$(dirname "$(command -v psql 2>/dev/null || true)")" \
  /opt/homebrew/bin /usr/local/bin "$HOME/Library/FlyEnv/env/postgresql/bin"; do
  if [ -x "$_pgdir/psql" ] && [ -x "$_pgdir/pg_dump" ]; then
    case ":$PATH:" in *":$_pgdir:"*) ;; *) PATH="$_pgdir:$PATH"; export PATH ;; esac
    break
  fi
done

TMP_SQL="$(mktemp "${TMPDIR:-/tmp}/federation-drill.XXXXXX.sql")"
HEAL_LOG="$(mktemp "${TMPDIR:-/tmp}/federation-drill-heal.XXXXXX.log")"
REPOINTED=0
FAILURES=0

psql_admin() { psql -q -d "$ADMIN_DB" "$@"; }
psql_at()    { local db="$1"; shift; psql -q -d "$db" "$@"; }
drop_db() { # $1 = db name (safe-for-identifier usage; drill-controlled names)
  psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
    -c "DROP DATABASE IF EXISTS \"$1\" WITH (FORCE)" >/dev/null 2>&1 || true
}
log()  { printf '\n== %s\n' "$*"; }
die()  { printf 'FATAL: %s\n' "$1" >&2; exit 1; }
fail() { printf '  FAIL: %s\n' "$1" >&2; FAILURES=$((FAILURES+1)); }
ok()   { printf '  ok: %s\n' "$1"; }

cleanup() {
  set +e
  # restore the canonical server target no matter where we died
  if [ "$REPOINTED" = "1" ]; then
    psql_admin -c "ALTER SERVER $AUTH_SERVER OPTIONS (SET dbname 'azeebo_auth')" >/dev/null 2>&1
  fi
  if [ "$DRILL_KEEP" != "1" ]; then
    drop_db "$DRILL_DB"
    drop_db "$DRILL_AUTH_DB"
    drop_db "$DRILL_ADMIN_DB"
  fi
  # live-data touch limited to the two marker users, removed on every path
  psql_at azeebo_auth -c "DELETE FROM users WHERE id IN ($LIVE_MARKERS)" >/dev/null 2>&1
  rm -f "$TMP_SQL" "$HEAL_LOG"
}
trap cleanup EXIT

usage() {
  cat <<'EOF'
federation-drill.sh — verify azeebo_admin federation survives service-DB drops.

  bash scripts/database/federation-drill.sh                 # both scenarios
  DRILL_SCENARIO=1 bash scripts/database/federation-drill.sh # drop+re-federate only
  DRILL_SCENARIO=2 bash scripts/database/federation-drill.sh # schema-drift repair only
  DRILL_KEEP=1 bash scripts/database/federation-drill.sh     # keep the clone DBs on failure

Env: PGHOST PGPORT PGUSER PGPASSWORD ADMIN_DB DRILL_DB DRILL_KEEP DRILL_SCENARIO
     DRILL_AUTH_DB DRILL_ADMIN_DB SUPERUSER SUPERUSER_PASSWORD
EOF
}
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then usage; exit 0; fi

# ---------------------------------------------------------------------------
log "0. preconditions"
RUN_S1=1; [ "$SCENARIO" = "2" ] && RUN_S1=0
RUN_S2=1; [ "$SCENARIO" = "1" ] && RUN_S2=0
command -v pg_dump >/dev/null || die "pg_dump not on PATH"
psql_admin -tAc "SELECT 1" >/dev/null || die "cannot reach $ADMIN_DB"
if [ "$RUN_S1" = "1" ]; then
  psql_admin -tAc "SELECT 1 FROM pg_foreign_table ft JOIN pg_class c ON c.oid=ft.ftrelid WHERE c.relnamespace='public'::regnamespace AND c.relname='users'" \
    | grep -q 1 || die "$ADMIN_DB is not federated (run federate-admin-db.sh first)"
fi
# drop leftover clones from any crashed previous run
drop_db "$DRILL_DB"
drop_db "$DRILL_AUTH_DB"
drop_db "$DRILL_ADMIN_DB"
echo "ok (scenario: $SCENARIO)"

# restore_schema <target_db> — load the snapshot in TMP_SQL, retrying as
# superuser if the non-superuser restore trips on ownership/extension lines.
restore_schema() {
  local target="$1"
  if psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$target" \
       -v ON_ERROR_STOP=1 -f "$TMP_SQL" >/dev/null; then return 0; fi
  echo "  non-superuser restore failed (ownership/extension in dump?) — retrying as superuser"
  drop_db "$target"
  psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
    -c "CREATE DATABASE \"$target\"" >/dev/null || return 1
  PGPASSWORD="$SUPERUSER_PASSWORD" psql -q -h "$PGHOST" -p "$PGPORT" -U "$SUPERUSER" \
    -d "$target" -v ON_ERROR_STOP=1 -f "$TMP_SQL" >/dev/null
}

if [ "$RUN_S1" = "1" ]; then
# ---------------------------------------------------------------------------
log "1. snapshot azeebo_auth schema -> $DRILL_DB"
pg_dump --schema-only --no-owner --no-privileges \
  -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d azeebo_auth > "$TMP_SQL" \
  || die "pg_dump of azeebo_auth failed"
psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
  -c "CREATE DATABASE \"$DRILL_DB\"" || die "could not create $DRILL_DB"
restore_schema "$DRILL_DB" || die "schema restore failed (also as superuser)"
# clone markers make the step-2 readback observable
psql_at "$DRILL_DB" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
INSERT INTO users (id, email, password, "displayName", role, "updatedAt") VALUES
  ('drill-marker-clone-1', 'drill-marker-clone-1@drill.invalid', '', 'Drill Clone Marker 1', 'user'::"UserRole", now()),
  ('drill-marker-clone-2', 'drill-marker-clone-2@drill.invalid', '', 'Drill Clone Marker 2', 'user'::"UserRole", now());
SQL
echo "ok"

# ---------------------------------------------------------------------------
log "2. repoint $AUTH_SERVER at the clone (the simulated drop target)"
psql_admin -c "ALTER SERVER $AUTH_SERVER OPTIONS (SET dbname '$DRILL_DB')" >/dev/null
REPOINTED=1
clone_seen=$(psql_admin -tAc "SELECT count(*) FROM users") \
  || die "admin cannot read users after repoint"
live_n=$(psql_at azeebo_auth -tAc "SELECT count(*) FROM users")
[ "$clone_seen" = "2" ] || die "expected admin to see the 2 clone markers, saw $clone_seen"
[ "$live_n" != "2" ] || die "live azeebo_auth unexpectedly has 2 users; cannot prove repoint"
ok "admin reads the clone ($clone_seen rows) while live azeebo_auth has $live_n"

# ---------------------------------------------------------------------------
log "3. insert pre-heal marker into the LIVE azeebo_auth"
psql_at azeebo_auth -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
INSERT INTO users (id, email, password, "displayName", role, "updatedAt")
VALUES ('drill-marker-pre', 'drill-marker-pre@drill.invalid', '', 'Drill Pre Marker', 'user'::"UserRole", now());
SQL
echo "ok"

# ---------------------------------------------------------------------------
log "4. drop the clone — federation is now broken (target DB gone)"
psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
  -c "DROP DATABASE \"$DRILL_DB\" WITH (FORCE)" >/dev/null
echo "ok"

# ---------------------------------------------------------------------------
log "5. heal: re-run federate-admin-db.sh"
if bash "$REPO_ROOT/scripts/database/federate-admin-db.sh" >"$HEAL_LOG" 2>&1; then
  echo "ok"
else
  echo "--- federate log (tail) ---" >&2
  tail -20 "$HEAL_LOG" >&2
  die "federate-admin-db.sh failed"
fi

if [ "$RUN_S2" = "1" ]; then
# ===========================================================================
# SCENARIO 2 — service DB recreated from its Prisma baseline: the six
# admin-owned columns are gone. Prove federate-admin-db.sh repairs the drift
# in a scratch pair (drifted auth DB + fresh admin DB), never touching live.
# ===========================================================================
log "S2-1. build the drifted service DB ($DRILL_AUTH_DB): baseline schema minus admin columns"
pg_dump --schema-only --no-owner --no-privileges \
  -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d azeebo_auth > "$TMP_SQL" \
  || die "pg_dump of azeebo_auth failed"
psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
  -c "CREATE DATABASE \"$DRILL_AUTH_DB\"" || die "could not create $DRILL_AUTH_DB"
restore_schema "$DRILL_AUTH_DB" || die "drifted-DB schema restore failed"
# A real recreation-from-baseline loses exactly the additive admin columns:
psql_at "$DRILL_AUTH_DB" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
ALTER TABLE users DROP COLUMN IF EXISTS "isSuspended";
ALTER TABLE users DROP COLUMN IF EXISTS "suspendedAt";
ALTER TABLE users DROP COLUMN IF EXISTS "suspendedBy";
ALTER TABLE users DROP COLUMN IF EXISTS "suspendedUntil";
ALTER TABLE users DROP COLUMN IF EXISTS "suspensionReason";
ALTER TABLE users DROP COLUMN IF EXISTS "notificationPreferences";
SQL
drifted=$(psql_at "$DRILL_AUTH_DB" -tAc "SELECT count(*) FROM information_schema.columns WHERE table_name='users' AND column_name IN ('isSuspended','suspendedAt','suspendedBy','suspendedUntil','suspensionReason','notificationPreferences')")
[ "$drifted" = "0" ] || die "drift setup failed: $drifted admin column(s) still present"
ok "drifted DB ready — 0 of the 6 admin-owned columns present"

log "S2-2. federate a fresh scratch admin DB ($DRILL_ADMIN_DB) against the drifted DB"
psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
  -c "CREATE DATABASE \"$DRILL_ADMIN_DB\" OWNER \"$PGUSER\"" || die "could not create $DRILL_ADMIN_DB"
if ADMIN_DB="$DRILL_ADMIN_DB" AUTH_DB="$DRILL_AUTH_DB" \
   bash "$REPO_ROOT/scripts/database/federate-admin-db.sh" >"$HEAL_LOG" 2>&1; then
  echo "ok"
else
  echo "--- federate log (tail) ---" >&2
  tail -20 "$HEAL_LOG" >&2
  die "federate failed against the drifted pair"
fi

dadm() { psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$DRILL_ADMIN_DB" "$@"; }

log "S2-3. assertions: additive-column repair converged the drift"

# B1 — the six columns exist again on the (otherwise baseline) users table
repaired=$(dadm -tAc "SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name IN ('isSuspended','suspendedAt','suspendedBy','suspendedUntil','suspensionReason','notificationPreferences')")
if [ "$repaired" = "6" ]; then ok "all 6 admin-owned columns repaired via foreign table"
else fail "expected 6 repaired columns through federation, saw $repaired"; fi

# B2 — users is foreign in the scratch admin and answers (count works even on an empty table)
if dadm -tAc "SELECT 1 FROM pg_foreign_table ft JOIN pg_class c ON c.oid=ft.ftrelid WHERE c.relnamespace='public'::regnamespace AND c.relname='users'" | grep -q 1 \
  && [ -n "$(dadm -tAc 'SELECT count(*) FROM users' 2>/dev/null)" ]; then
  ok "users is a working foreign table in the scratch admin"
else fail "users foreign table broken in the scratch admin"; fi

# B3 — an INSERT through the federation works. postgres_fdw sends explicit
# NULL for any omitted column lacking a LOCAL default (foreign tables carry
# no remote defaults), so the probe supplies every NOT NULL value explicitly —
# exactly how the panel's Prisma client writes (all scalar fields, every time).
if dadm -v ON_ERROR_STOP=1 -c "INSERT INTO users (id, email, password, \"displayName\", role, \"isVerified\", \"mfaEnabled\", \"isSuspended\", \"createdAt\", \"updatedAt\") VALUES ('s2-marker', 's2-marker@drill.invalid', '', 'S2 Marker', 'user'::\"UserRole\", false, false, false, now(), now())" >/dev/null 2>&1 \
  && [ -n "$(dadm -tAc "SELECT 1 FROM users WHERE id='s2-marker'")" ]; then
  ok "insert through the repaired federation works"
else fail "insert through the repaired federation failed"; fi

# B4 — the repair statement preserves the baseline defaults on the REMOTE DB
# (ADD COLUMN IF NOT EXISTS "isSuspended" boolean NOT NULL DEFAULT false).
def=$(psql_at "$DRILL_AUTH_DB" -tAc "SELECT column_default FROM information_schema.columns WHERE table_name='users' AND column_name='isSuspended'")
if echo "$def" | grep -q false; then ok "repaired column default present on the service DB ($def)"
else fail "repaired isSuspended default missing/changed: '$def'"; fi
fi # RUN_S2

# A1 — every FDW server points at its canonical database (the drill repointed
# the auth server; re-running federation must have converged it back)
for db in azeebo_auth azeebo_wallet azeebo_content azeebo_notification azeebo_payment azeebo_moderation azeebo_creator; do
  dbname=$(psql_admin -tAc "SELECT option_value FROM pg_options_to_table((SELECT srvoptions FROM pg_foreign_server WHERE srvname='azeebo_fdw_${db}')) WHERE option_name='dbname'" || true)
  if [ "$dbname" = "$db" ]; then ok "server azeebo_fdw_${db} -> $db"
  else fail "server azeebo_fdw_${db} points at '$dbname'"; fi
done

# A2 — users is still a foreign table
if psql_admin -tAc "SELECT 1 FROM pg_foreign_table ft JOIN pg_class c ON c.oid=ft.ftrelid WHERE c.relnamespace='public'::regnamespace AND c.relname='users'" \
   | grep -q 1; then ok "users is a foreign table"
else fail "users is no longer a foreign table"; fi

# A3 — rowcounts match the live DB
live_n=$(psql_at azeebo_auth -tAc "SELECT count(*) FROM users")
adm_n=$(psql_admin -tAc "SELECT count(*) FROM users") || adm_n="QUERY FAILED"
if [ "$live_n" = "$adm_n" ]; then ok "users: admin sees $adm_n rows = live"
else fail "users count mismatch: admin=$adm_n live=$live_n"; fi

# A4 — the pre-heal marker (inserted into the LIVE DB before the drop) is visible
if [ -n "$(psql_admin -tAc "SELECT 1 FROM users WHERE id='drill-marker-pre'")" ]; then
  ok "pre-heal marker visible through admin (reads live DB, not the dead clone)"
else fail "pre-heal marker not visible through admin"; fi

# A5 — an insert AFTER the heal is visible immediately (fresh connections)
psql_at azeebo_auth -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
INSERT INTO users (id, email, password, "displayName", role, "updatedAt")
VALUES ('drill-marker-post', 'drill-marker-post@drill.invalid', '', 'Drill Post Marker', 'user'::"UserRole", now());
SQL
if [ -n "$(psql_admin -tAc "SELECT 1 FROM users WHERE id='drill-marker-post'")" ]; then
  ok "post-heal insert visible through admin immediately"
else fail "post-heal insert not visible through admin"; fi

# A6 — the cross-DB join the freshness job probes
j=$(psql_admin -tAc 'SELECT count(*) FROM users u JOIN wallets w ON w."userId" = u.id' || echo 0)
if [ "${j:-0}" -gt 0 ] 2>/dev/null; then ok "cross-DB join users ⋈ wallets: $j rows"
else fail "cross-DB join users ⋈ wallets returned no rows"; fi

# A7 — the federated auth audit trail still matches its source
a_adm=$(psql_admin -tAc "SELECT count(*) FROM auth_audit_logs") || a_adm="QUERY FAILED"
a_live=$(psql_at azeebo_auth -tAc "SELECT count(*) FROM audit_logs")
if [ "$a_adm" = "$a_live" ]; then ok "auth_audit_logs: $a_adm rows (matches azeebo_auth.audit_logs)"
else fail "auth_audit_logs mismatch: admin=$a_adm live=$a_live"; fi

# A8 — other services untouched by the drill (spot check two more)
for spec in "wallets|azeebo_wallet" "content_items|azeebo_content"; do
  t="${spec%%|*}"; db="${spec##*|}"
  x=$(psql_admin -tAc "SELECT count(*) FROM \"$t\"") || x="QUERY FAILED"
  y=$(psql_at "$db" -tAc "SELECT count(*) FROM \"$t\"")
  if [ "$x" = "$y" ]; then ok "$t: admin=$x (matches $db)"
  else fail "$t mismatch: admin=$x $db=$y"; fi
done
fi # RUN_S1 (assertions A1–A8 belong to the drop scenario)

# ---------------------------------------------------------------------------
log "summary"
if [ "$FAILURES" -eq 0 ]; then
  echo "ALL ASSERTIONS PASSED — federation intact (drop + re-federate, schema-drift repair)"
  echo "(live azeebo_auth/azeebo_admin untouched; markers removed by cleanup)"
  exit 0
else
  echo "$FAILURES assertion(s) FAILED" >&2
  exit 1
fi
