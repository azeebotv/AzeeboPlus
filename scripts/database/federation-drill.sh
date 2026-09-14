#!/usr/bin/env bash
# federation-drill.sh — prove azeebo_admin federation survives a service-DB drop.
#
# Simulates the failure WITHOUT touching live data:
#   1. Snapshot azeebo_auth's schema into a throwaway clone (azeebo_auth__drill).
#   2. Repoint azeebo_admin's FDW server at the clone and verify admin now
#      reads the clone (clone markers visible, live rowcount differs).
#   3. Drop the clone. From postgres_fdw's point of view this is exactly the
#      broken state a real service-DB drop produces: connections fail because
#      the target database no longer exists.
#   4. Re-run federate-admin-db.sh (the healing action the freshness job uses).
#   5. Assert the full contract is restored: every FDW server points at its
#      canonical DB, foreign tables answer, the cross-DB join works,
#      auth_audit_logs matches azeebo_auth.audit_logs, and rows inserted into
#      the LIVE auth DB before AND after the heal are both visible through
#      admin (no stale connection reuse).
#
# The only writes to live data are two marker users (drill-marker-pre/-post),
# deleted on exit by the cleanup trap; everything else happens in the clone.
#
# Usage:
#   bash scripts/database/federation-drill.sh
#   DRILL_KEEP=1 bash scripts/database/federation-drill.sh  # keep clone DB on failure
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

TMP_SQL="$(mktemp "${TMPDIR:-/tmp}/federation-drill.XXXXXX.sql")"
HEAL_LOG="$(mktemp "${TMPDIR:-/tmp}/federation-drill-heal.XXXXXX.log")"
REPOINTED=0
FAILURES=0

psql_admin() { psql -q -d "$ADMIN_DB" "$@"; }
psql_at()    { local db="$1"; shift; psql -q -d "$db" "$@"; }
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
    psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
      -c "DROP DATABASE IF EXISTS \"$DRILL_DB\" WITH (FORCE)" >/dev/null 2>&1
  fi
  psql_at azeebo_auth -c "DELETE FROM users WHERE id IN ($LIVE_MARKERS)" >/dev/null 2>&1
  rm -f "$TMP_SQL" "$HEAL_LOG"
}
trap cleanup EXIT

usage() {
  cat <<'EOF'
federation-drill.sh — verify azeebo_admin federation survives a service-DB drop.

  bash scripts/database/federation-drill.sh                 # run the drill
  DRILL_KEEP=1 bash scripts/database/federation-drill.sh    # keep the clone DB on failure

Env: PGHOST PGPORT PGUSER PGPASSWORD ADMIN_DB DRILL_DB DRILL_KEEP SUPERUSER SUPERUSER_PASSWORD
EOF
}
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then usage; exit 0; fi

# ---------------------------------------------------------------------------
log "0. preconditions"
command -v pg_dump >/dev/null || die "pg_dump not on PATH"
psql_admin -tAc "SELECT 1" >/dev/null || die "cannot reach $ADMIN_DB"
psql_admin -tAc "SELECT 1 FROM pg_foreign_table ft JOIN pg_class c ON c.oid=ft.ftrelid WHERE c.relnamespace='public'::regnamespace AND c.relname='users'" \
  | grep -q 1 || die "$ADMIN_DB is not federated (run federate-admin-db.sh first)"
# drop a leftover clone from any crashed previous run
psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
  -c "DROP DATABASE IF EXISTS \"$DRILL_DB\" WITH (FORCE)" >/dev/null
echo "ok"

# ---------------------------------------------------------------------------
log "1. snapshot azeebo_auth schema -> $DRILL_DB"
pg_dump --schema-only --no-owner --no-privileges \
  -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d azeebo_auth > "$TMP_SQL" \
  || die "pg_dump of azeebo_auth failed"
psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
  -c "CREATE DATABASE \"$DRILL_DB\"" || die "could not create $DRILL_DB"
if ! psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$DRILL_DB" \
     -v ON_ERROR_STOP=1 -f "$TMP_SQL" >/dev/null; then
  echo "  non-superuser restore failed (extension in dump?) — retrying as superuser"
  psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
    -c "DROP DATABASE IF EXISTS \"$DRILL_DB\" WITH (FORCE)" >/dev/null
  psql -q -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
    -c "CREATE DATABASE \"$DRILL_DB\"" >/dev/null
  PGPASSWORD="$SUPERUSER_PASSWORD" psql -q -h "$PGHOST" -p "$PGPORT" -U "$SUPERUSER" \
    -d "$DRILL_DB" -v ON_ERROR_STOP=1 -f "$TMP_SQL" >/dev/null \
    || die "schema restore failed (also as superuser)"
fi
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

# ---------------------------------------------------------------------------
log "6. assertions: federation contract restored"

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

# ---------------------------------------------------------------------------
log "summary"
if [ "$FAILURES" -eq 0 ]; then
  echo "ALL ASSERTIONS PASSED — federation intact across drop + re-federate cycle"
  echo "(live azeebo_auth data untouched; marker users removed by cleanup)"
  exit 0
else
  echo "$FAILURES assertion(s) FAILED" >&2
  exit 1
fi
