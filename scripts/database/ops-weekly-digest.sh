#!/usr/bin/env bash
# ops-weekly-digest.sh — weekly ops-health digest as a macOS notification.
#
# Once a week, summarize how the platform actually behaved over the past
# seven days and push it via a macOS notification (plus webhook when
# ALERT_WEBHOOK_URL is configured). The digest covers the three things the
# Ops Health page watches, computed so the script stays standalone — it
# answers "how healthy was the week" even if admin-backend is down:
#
#   1. Job pass rate     — from the shared azeebo_admin.job_runs ledger
#                          (freshness, drill, audit-retention, data-retention).
#   2. Alert count       — WARN/ERROR lines in the freshness + retention logs
#                          over the window (same log format the backend parses).
#   3. Service fleet     — server-side probe of every service's health
#                          endpoint (mirrors GET /admin/ops/services).
#
# Usage:
#   ops-weekly-digest.sh             # compute + notify now
#   ops-weekly-digest.sh install     # LaunchAgent: Mondays 09:07
#   ops-weekly-digest.sh uninstall   # remove the LaunchAgent
#   ops-weekly-digest.sh status      # install state + last digest preview
#
# Env: PG* / ADMIN_DB (same defaults as the other admin jobs),
#      ALERT_WEBHOOK_URL (optional Slack-compatible delivery),
#      ADMIN_BACKEND_URL (default http://localhost:4016) for the probe,
#      AUTH_EMAIL / AUTH_PASSWORD for the probe login.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLIST_ID="com.azeebo.ops-weekly-digest"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_ID}.plist"
DIGEST_LOG="${DIGEST_LOG:-/tmp/azeebo-ops-weekly-digest.log}"
FRESHNESS_LOG="${FRESHNESS_LOG:-/tmp/azeebo-admin-freshness.log}"
RETENTION_LOG="${RETENTION_LOG:-/tmp/azeebo-audit-retention.log}"
WINDOW_DAYS=7

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-azeebo}"
PGPASSWORD="${PGPASSWORD:-azeebo_dev_2024}"
ADMIN_DB="${ADMIN_DB:-azeebo_admin}"
export PGHOST PGPORT PGUSER PGPASSWORD

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$DIGEST_LOG"; }

# launchd's minimal PATH lacks psql — same resolution as the other jobs.
PSQL_BIN="${PSQL_BIN:-$(command -v psql || true)}"
if [ -z "$PSQL_BIN" ]; then
  for candidate in /opt/homebrew/bin/psql /usr/local/bin/psql "$HOME/Library/FlyEnv/env/postgresql/bin/psql"; do
    if [ -x "$candidate" ]; then PSQL_BIN="$candidate"; break; fi
  done
fi
psql_conn() { [ -n "$PSQL_BIN" ] && "$PSQL_BIN" -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -X -q "$@"; }

notify_digest() { # $1 = notification body
  osascript -e "display notification \"$1\" with title \"Azeebo Weekly Ops Digest\" sound name \"Pop\"" >/dev/null 2>&1 || true
}

send_webhook() { # $1 = full digest text
  [ -n "${ALERT_WEBHOOK_URL:-}" ] || return 0
  curl -sS -m 10 -H 'Content-Type: application/json' \
    -d "$(printf '{"text":"Azeebo Weekly Ops Digest\\n%s\\nhost: %s"}' "$1" "$(hostname)")" \
    "$ALERT_WEBHOOK_URL" >/dev/null 2>&1 \
    || log "WARN: webhook delivery failed"
}

SINCE="$(date -v-${WINDOW_DAYS}d '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d "$WINDOW_DAYS days ago" '+%Y-%m-%d %H:%M:%S')"

run_digest() {
# ── 1. Job pass rate from the ledger ───────────────────────────────────────
job_line="job ledger: unavailable"
if [ -n "$PSQL_BIN" ]; then
  LEDGER="$(psql_conn -d "$ADMIN_DB" -tAc "
    SELECT COUNT(*) || ' runs, ' ||
           ROUND(100.0 * COUNT(*) FILTER (WHERE status='ok') / GREATEST(COUNT(*),1)) || '% ok, ' ||
           COUNT(*) FILTER (WHERE status='warn') || ' warn, ' ||
           COUNT(*) FILTER (WHERE status='error') || ' failed'
    FROM job_runs
    WHERE \"ranAt\" >= '$SINCE'::timestamp" 2>/dev/null)"
  # ranAt is a naive timestamp written in local time, same as $SINCE above.
  if [ -n "${LEDGER:-}" ] && [ "$LEDGER" != "0 runs, 0% ok, 0 warn, 0 failed" ]; then
    job_line="jobs: $LEDGER"
  elif [ -n "${LEDGER:-}" ]; then
    job_line="jobs: no runs recorded this week"
  fi
fi

# ── 2. Alerts in the window ────────────────────────────────────────────────
alerts=0
for lf in "$FRESHNESS_LOG" "$RETENTION_LOG"; do
  [ -f "$lf" ] || continue
  n=$(awk -v since="$SINCE" '
    /^\[[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}\]/ { ts=substr($0,2,19) }
    ts >= since && /ALERT:|ERROR:|WARN:/ { c++ }
    END { print c+0 }' "$lf")
  alerts=$((alerts + n))
done
alert_line="alerts (7d): $alerts"

# ── 3. Server-side fleet probe (via the admin backend, like the panel) ─────
probe_line="services: probe skipped (backend unreachable)"
BASE_URL="${ADMIN_BACKEND_URL:-http://localhost:4016}"
LOGIN_EMAIL="${AUTH_EMAIL:-admin@azeeboplus.com}"
LOGIN_PASSWORD="${AUTH_PASSWORD:-Demo123!}"

login_payload=$(printf '{"email":"%s","password":"%s"}' "$LOGIN_EMAIL" "$LOGIN_PASSWORD")
TOKEN=$(curl -sS -m 8 -X POST "$BASE_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' -d "$login_payload" 2>/dev/null |
  { python3 -c "import sys,json;print(json.load(sys.stdin).get('data',{}).get('access_token',''))" 2>/dev/null || true; })

if [ -n "${TOKEN:-}" ]; then
  PROBE=$(curl -sS -m 30 -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/admin/ops/services" 2>/dev/null |
    { python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)['data']['services']
    up = sum(1 for s in d if s['status'] == 'healthy')
    dg = sum(1 for s in d if s['status'] == 'degraded')
    dn = sum(1 for s in d if s['status'] == 'down')
    print(f'{up}/{len(d)} healthy, {dg} degraded, {dn} down')
except Exception:
    print('')
" 2>/dev/null || true; })
  [ -n "${PROBE:-}" ] && probe_line="services: $PROBE"
  unset TOKEN
fi

DIGEST="$job_line; $alert_line; $probe_line"

log "DIGEST: $DIGEST"
notify_digest "$DIGEST"
send_webhook "$DIGEST"
echo "$DIGEST"
}

# ── LaunchAgent plumbing ───────────────────────────────────────────────────
write_plist() {
  # Child scripts (none today, but the probe uses curl; keep psql resolvable)
  PSQL_DIR="$(dirname "${PSQL_BIN:-/usr/bin/true}")"
  JOB_PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PSQL_DIR}"
  cat >"$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$PLIST_ID</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${REPO_ROOT}/scripts/database/ops-weekly-digest.sh</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>${JOB_PATH}</string>${ALERT_WEBHOOK_URL:+
    <key>ALERT_WEBHOOK_URL</key><string>${ALERT_WEBHOOK_URL}</string>}
  </dict>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Weekday</key><integer>1</integer>
    <key>Hour</key><integer>9</integer>
    <key>Minute</key><integer>7</integer>
  </dict>
  <key>StandardOutPath</key><string>${DIGEST_LOG}</string>
  <key>StandardErrorPath</key><string>${DIGEST_LOG}</string>
</dict>
</plist>
EOF
}

install_job() {
  if [ -z "${ALERT_WEBHOOK_URL:-}" ]; then
    echo "Note: ALERT_WEBHOOK_URL not set — digest is a macOS notification only." >&2
  fi
  write_plist
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  launchctl load "$PLIST_PATH"
  echo "Installed ${PLIST_ID}: digest Mondays at 09:07. Log: ${DIGEST_LOG}"
  echo "Preview one now with: bash $0"
}

uninstall_job() {
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  rm -f "$PLIST_PATH"
  echo "Removed ${PLIST_ID}."
}

status_job() {
  echo "=== LaunchAgent ==="
  launchctl list 2>/dev/null | grep "$PLIST_ID" || echo "(not installed — enable with: bash $0 install)"
  echo "=== last digest lines ==="
  tail -3 "$DIGEST_LOG" 2>/dev/null || echo "(no digest run yet)"
}

case "${1:-run}" in
  install)   install_job ;;
  uninstall) uninstall_job ;;
  status)    status_job ;;
  run)       run_digest ;;
  *) echo "usage: $0 [run|install|uninstall|status]" >&2; exit 2 ;;
esac
