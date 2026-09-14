#!/usr/bin/env bash
# audit-retention.sh — keep the audit trails from growing unbounded.
#
# Two audit tables grow forever without this job:
#   - azeebo_admin.audit_logs   — admin-panel events (flag changes, content edits…)
#   - azeebo_auth.audit_logs    — auth-service events (a row PER LOGIN/token use;
#                                 the fast-growing one, federated into the admin
#                                 audit page as auth_audit_logs)
#
# Policy (dev defaults, override via env):
#   AUDIT_RETENTION_DAYS       — admin audit rows older than this are deleted
#                                (default 365)
#   AUTH_AUDIT_RETENTION_DAYS  — auth trail rows older than this are deleted
#                                (default 90)
#   BATCH                      — delete in batches of this many rows so long
#                                locks never block login writes (default 5000)
#
# Safety: `feature_flag.deleted` admin entries are NEVER deleted regardless of
# age — feature-flags restore() reads its archived flag snapshots out of audit
# logs (apps/admin/src/modules/feature-flags/feature-flags.service.ts), so
# removing them would silently break flag restoration.
#
# Why delete-in-place instead of native partitioning: both tables sit under
# Prisma models whose single-column PKs and result mapping assume plain tables;
# declarative partitioning would force composite PKs and a migration per
# service for no benefit at dev scale. The createdAt/timestamp indexes make
# ranged deletes cheap; BATCH caps lock time if volumes grow. Revisit only if
# a trail ever outgrows simple deletion.
#
# Usage:
#   audit-retention.sh            # apply the policy
#   audit-retention.sh dry-run    # print what WOULD be deleted, change nothing
#   audit-retention.sh status     # row counts + oldest row per table
#   audit-retention.sh install    # write LaunchAgent (daily at 03:47)
#   audit-retention.sh uninstall  # remove the LaunchAgent
#
# Dev-only: uses the shared dev credentials, same as seed-all.sh.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_FILE="${RETENTION_LOG:-/tmp/azeebo-audit-retention.log}"
PLIST_ID="com.azeebo.audit-retention"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_ID}.plist"

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-azeebo}"
PGPASSWORD="${PGPASSWORD:-azeebo_dev_2024}"
ADMIN_DB="${ADMIN_DB:-azeebo_admin}"
AUDIT_RETENTION_DAYS="${AUDIT_RETENTION_DAYS:-365}"
AUTH_AUDIT_RETENTION_DAYS="${AUTH_AUDIT_RETENTION_DAYS:-90}"
BATCH="${BATCH:-5000}"
export PGHOST PGPORT PGUSER PGPASSWORD

# psql is not on launchd's minimal PATH — resolve it like the freshness job.
PSQL_BIN="${PSQL_BIN:-$(command -v psql || true)}"
if [ -z "$PSQL_BIN" ]; then
  for candidate in /opt/homebrew/bin/psql /usr/local/bin/psql "$HOME/Library/FlyEnv/env/postgresql/bin/psql"; do
    if [ -x "$candidate" ]; then PSQL_BIN="$candidate"; break; fi
  done
fi
case "$PSQL_BIN" in */*) ;; *) echo "psql not found; install PostgreSQL client or set PSQL_BIN" >&2; exit 1 ;; esac

# append-only (no tee): launchd already redirects stdout to the same file
log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$LOG_FILE"; }

psql_admin() { "$PSQL_BIN" -q -d "$ADMIN_DB" "$@"; }
psql_auth()  { "$PSQL_BIN" -q -d azeebo_auth "$@"; }

# Batched ranged delete on the time column. $1 = db fn, $2 = table, $3 = time
# column, $4 = cutoff (SQL literal), $5 = extra AND condition ("" allowed).
# Returns total deleted.
purge() {
  local dbfn="$1" table="$2" col="$3" cutoff="$4" extra="$5" total=0 batch=0
  while :; do
    # CTE + RETURNING: -q suppresses psql's DELETE command tag, so count the
    # deleted rows in SQL instead of parsing psql output.
    batch=$("$dbfn" -tAc "WITH d AS (
      DELETE FROM \"$table\" WHERE \"$col\" < $cutoff $extra AND \"$col\" IN (
        SELECT \"$col\" FROM \"$table\" WHERE \"$col\" < $cutoff $extra ORDER BY \"$col\" LIMIT $BATCH
      ) RETURNING 1
    ) SELECT count(*) FROM d") || { log "ERROR: purge failed on $table"; return 1; }
    [ "$batch" -gt 0 ] 2>/dev/null || break
    total=$((total + batch))
  done
  echo "$total"
}

DRY_RUN=0
MODE="${1:-run}"
case "$MODE" in
  run) DRY_RUN=0 ;;
  dry-run) DRY_RUN=1 ;;
  status)
    echo "== azeebo_admin.audit_logs"
    psql_admin -tAc "SELECT count(*) || ' rows, oldest: ' || COALESCE(min(\"createdAt\")::date::text,'-') FROM audit_logs"
    echo "   (feature_flag.deleted entries: $(psql_admin -tAc "SELECT count(*) FROM audit_logs WHERE action='feature_flag.deleted'") — always kept)"
    echo "== azeebo_auth.audit_logs"
    psql_auth -tAc "SELECT count(*) || ' rows, oldest: ' || COALESCE(min(\"timestamp\")::date::text,'-') FROM audit_logs"
    exit 0 ;;
  install|uninstall) ;;
  *) echo "usage: audit-retention.sh [run|dry-run|status|install|uninstall]" >&2; exit 2 ;;
esac

if [ "$MODE" = "install" ] || [ "$MODE" = "uninstall" ]; then
  if [ "$MODE" = "uninstall" ]; then
    launchctl bootout "gui/$(id -u)/$PLIST_ID" >/dev/null 2>&1 || true
    rm -f "$PLIST_PATH"
    echo "removed $PLIST_PATH"
    exit 0
  fi
  PSQL_DIR="$(dirname "$PSQL_BIN")"
  mkdir -p "$HOME/Library/LaunchAgents"
  cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$PLIST_ID</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string><string>$REPO_ROOT/scripts/database/audit-retention.sh</string>
  </array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>47</integer></dict>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>$PSQL_DIR:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>StandardOutPath</key><string>$LOG_FILE</string>
  <key>StandardErrorPath</key><string>$LOG_FILE</string>
</dict></plist>
PLIST
  launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH" 2>/dev/null || true
  launchctl kickstart -k "gui/$(id -u)/$PLIST_ID" >/dev/null
  echo "installed $PLIST_PATH (daily at 03:47) — first pass fired"
  exit 0
fi

# ---------------------------------------------------------------------------
# apply the policy
log "audit retention: admin > ${AUDIT_RETENTION_DAYS}d, auth > ${AUTH_AUDIT_RETENTION_DAYS}d, batch=$BATCH"

if [ "$DRY_RUN" = "1" ]; then
  a=$(psql_admin -tAc "SELECT count(*) FROM audit_logs WHERE \"createdAt\" < now() - interval '$AUDIT_RETENTION_DAYS days' AND action <> 'feature_flag.deleted'")
  f=$(psql_admin -tAc "SELECT count(*) FROM audit_logs WHERE \"createdAt\" < now() - interval '$AUDIT_RETENTION_DAYS days' AND action = 'feature_flag.deleted'")
  t=$(psql_auth -tAc "SELECT count(*) FROM audit_logs WHERE \"timestamp\" < now() - interval '$AUTH_AUDIT_RETENTION_DAYS days'")
  echo "DRY-RUN (nothing deleted):"
  echo "  azeebo_admin.audit_logs: $a row(s) would be deleted ($f old feature_flag.deleted entry/ies exempt)"
  echo "  azeebo_auth.audit_logs:  $t row(s) would be deleted"
  exit 0
fi

# admin side — feature_flag.deleted entries are exempt (flag-restore source)
deleted_admin=$(purge psql_admin audit_logs createdAt "now() - interval '$AUDIT_RETENTION_DAYS days'" "AND action <> 'feature_flag.deleted'")
log "azeebo_admin.audit_logs: deleted $deleted_admin row(s) (feature_flag.deleted exempt)"

# auth side — its own home table; the federated view follows automatically
deleted_auth=$(purge psql_auth audit_logs timestamp "now() - interval '$AUTH_AUDIT_RETENTION_DAYS days'" "")
log "azeebo_auth.audit_logs: deleted $deleted_auth row(s)"

log "ok: retention applied"
