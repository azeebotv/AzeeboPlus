#!/usr/bin/env bash
# record-job-run.sh — append one row to azeebo_admin.job_runs (best-effort).
#
# Shared ledger for the scheduled admin DB jobs: freshness passes, federation
# drills, audit retention, and data retention. The Ops Health page reads it
# (GET /admin/ops/runs) to chart pass history.
#
# ALWAYS exits 0: the ledger must never fail the job it records. If the table
# doesn't exist yet (fresh checkout before federate-admin-db.sh), the run is
# simply not recorded this once.
#
# Usage:
#   record-job-run.sh <job> <status> [detail] [rowsPurged] [durationMs]
#     job:    freshness | drill | audit-retention | data-retention
#     status: ok | warn | error
#
# Env: PGHOST/PGPORT/PGUSER/PGPASSWORD/ADMIN_DB (same defaults as seed-all.sh).
set -uo pipefail

JOB="${1:?usage: record-job-run.sh <job> <status> [detail] [rowsPurged] [durationMs]}"
STATUS="${2:?usage: record-job-run.sh <job> <status> [detail] [rowsPurged] [durationMs]}"
DETAIL="${3:-}"
ROWS="${4:-}"
DURATION="${5:-}"

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-azeebo}"
PGPASSWORD="${PGPASSWORD:-azeebo_dev_2024}"
ADMIN_DB="${ADMIN_DB:-azeebo_admin}"
export PGHOST PGPORT PGUSER PGPASSWORD

PSQL_BIN="${PSQL_BIN:-$(command -v psql || true)}"
if [ -z "$PSQL_BIN" ]; then
  for candidate in /opt/homebrew/bin/psql /usr/local/bin/psql "$HOME/Library/FlyEnv/env/postgresql/bin/psql"; do
    if [ -x "$candidate" ]; then PSQL_BIN="$candidate"; break; fi
  done
fi
[ -n "$PSQL_BIN" ] || exit 0

# Explicit TCP + explicit DB — the default socket connects as the OS user and
# psql -c without -d defaults to a DB named after the role (which doesn't
# exist here); both failure modes were silent under the 2>/dev/null.
PSQL_CONN=("$PSQL_BIN" -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres)

ID="$(date +%s)-$JOB-$$-$RANDOM"
VALUES_JOB=$("${PSQL_CONN[@]}" -v ON_ERROR_STOP=1 -qAt -c "SELECT quote_literal('$JOB')" 2>/dev/null) || exit 0
VALUES_STATUS=$("${PSQL_CONN[@]}" -v ON_ERROR_STOP=1 -qAt -c "SELECT quote_literal('$STATUS')" 2>/dev/null) || exit 0
VALUES_DETAIL=$("${PSQL_CONN[@]}" -v ON_ERROR_STOP=1 -qAt -c "SELECT COALESCE(quote_literal('$DETAIL'),'NULL')" 2>/dev/null) || exit 0
VALUES_ROWS=$("${PSQL_CONN[@]}" -v ON_ERROR_STOP=1 -qAt -c "SELECT COALESCE(NULLIF('$ROWS','')::int::text,'NULL')" 2>/dev/null) || exit 0
VALUES_DUR=$("${PSQL_CONN[@]}" -v ON_ERROR_STOP=1 -qAt -c "SELECT COALESCE(NULLIF('$DURATION','')::int::text,'NULL')" 2>/dev/null) || exit 0

"${PSQL_CONN[@]}" -q -d "$ADMIN_DB" -v ON_ERROR_STOP=1 -c "
INSERT INTO \"job_runs\" (id, job, status, detail, \"rowsPurged\", \"durationMs\")
VALUES ('$ID', $VALUES_JOB, $VALUES_STATUS, $VALUES_DETAIL, $VALUES_ROWS, $VALUES_DUR)
" >/dev/null 2>&1 || true

exit 0
