#!/usr/bin/env bash
# pool-audit.sh — cron/launchd watchdog for pgbouncer pool discipline.
#
# Complements the Ops Health live probes (admin-backend /admin/ops/pgbouncer,
# which only run while the backend is up) with a headless periodic audit of
# the two connection-hygiene failure modes:
#
#   1. Pooler saturation  — client connections vs pgbouncer max_client_conn,
#      same 80%/95% bands as the backend's gradePgbouncerUsage.
#   2. Pooler bypasses    — repo-owned processes holding ESTABLISHED sockets
#      DIRECTLY to Postgres :5432 (connection limits and pool budgeting do
#      not apply to them). pgbouncer itself is allowlisted; foreign projects
#      sharing the host are reported but never flagged as ours.
#
# One LOG_LINE-format line per pass ([YYYY-MM-DD HH:MM:SS] LEVEL message):
# WARN/ERROR lines surface in the Ops Health Recent-alerts feed (registered
# as the 'pool-audit' source) and the pass is recorded in the job_runs
# ledger via record-job-run.sh. A persistent problem does NOT re-WARN every
# pass — state is kept in POOL_AUDIT_STATE and a WARN repeats at most once
# per REPEAT_HOURS (freshness-style repeat suppression).
#
# Usage:
#   pool-audit.sh run         # one audit pass (cron/launchd/"Run now")
#   pool-audit.sh install     # write LaunchAgent (hourly at :21 + at login)
#   pool-audit.sh uninstall   # remove the LaunchAgent
#   pool-audit.sh status      # last log lines + current state
#
# Env: PGBOUNCER_HOST/PORT/ADMIN_USER/ADMIN_PASSWORD (admin console),
#      PGHOST/PGPORT/PGUSER/PGPASSWORD (ledger), POOL_LIMITS_ROOT (repo root
#      for bypass cwd attribution), ALERT_WEBHOOK_URL (optional, Slack-style).
set -uo pipefail

REPO_ROOT="${POOL_LIMITS_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
LOG_FILE="${POOL_AUDIT_LOG:-${TMPDIR:-/tmp}/azeebo-admin-pool-audit.log}"
STATE_FILE="${POOL_AUDIT_STATE:-${TMPDIR:-/tmp}/azeebo-admin-pool-audit.state}"
PLIST_ID="com.azeebo.admin-pool-audit"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_ID}.plist"
REPEAT_HOURS="${POOL_AUDIT_REPEAT_HOURS:-24}"

# Pooler admin console (SHOW POOLS / SHOW CONFIG).
PB_HOST="${PGBOUNCER_HOST:-127.0.0.1}"
PB_PORT="${PGBOUNCER_PORT:-6432}"
PB_USER="${PGBOUNCER_ADMIN_USER:-pgbouncer}"
PB_PASS="${PGBOUNCER_ADMIN_PASSWORD:-whatever}"
PG_DIRECT_PORT=5432

# Ledger credentials (record-job-run.sh shares these defaults).
export PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-azeebo}" PGPASSWORD="${PGPASSWORD:-azeebo_dev_2024}"

PSQL_BIN="${PSQL_BIN:-$(command -v psql || true)}"
if [ -z "$PSQL_BIN" ]; then
  for candidate in /opt/homebrew/bin/psql /usr/local/bin/psql "$HOME/Library/FlyEnv/env/postgresql/bin/psql"; do
    if [ -x "$candidate" ]; then PSQL_BIN="$candidate"; break; fi
  done
fi

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$LOG_FILE"; }

notify_alert() { # $1 = message
  osascript -e "display notification \"$1\" with title \"Azeebo Pool Audit\"" >/dev/null 2>&1 || true
}
send_webhook() { # $1 = message
  [ -n "${ALERT_WEBHOOK_URL:-}" ] || return 0
  curl -sS -m 10 -H 'Content-Type: application/json' \
    -d "{\"text\":\"[azeebo pool-audit] $1\\nhost: $(hostname)\"}" \
    "$ALERT_WEBHOOK_URL" >/dev/null 2>&1 || log "WARN: alert webhook delivery failed"
}

# --- saturation leg --------------------------------------------------------
# Returns "LEVEL|total|max" (LEVEL: ok|degraded|critical) or "unavailable|0|0".
probe_saturation() {
  [ -n "$PSQL_BIN" ] || { echo "unavailable|0|0"; return; }
  local pools max_cfg total
  pools=$("$PSQL_BIN" -h "$PB_HOST" -p "$PB_PORT" -U "$PB_USER" -d pgbouncer -X -qAt \
    -c 'SHOW POOLS' 2>/dev/null) || { echo "unavailable|0|0"; return; }
  max_cfg=$("$PSQL_BIN" -h "$PB_HOST" -p "$PB_PORT" -U "$PB_USER" -d pgbouncer -X -qAt \
    -c 'SHOW CONFIG' 2>/dev/null | awk -F'|' '$1=="max_client_conn"{print $2}') || max_cfg=""
  case "$max_cfg" in ''|*[!0-9]*) echo "unavailable|0|0"; return;; esac
  # Clients = cl_active + cl_waiting across ALL rows (the pgbouncer admin
  # console row itself consumes budget too — same semantics as the backend).
  total=$(printf '%s\n' "$pools" | awk -F'|' '{ s += $3 + $4 } END { print s + 0 }')
  local pct=$(( 100 * total / max_cfg ))
  local level=ok
  [ "$pct" -ge 95 ] && level=critical
  [ "$pct" -ge 80 ] && [ "$pct" -lt 95 ] && level=degraded
  echo "$level|$total|$max_cfg"
}

# --- bypass leg ------------------------------------------------------------
# Repo-owned client processes whose ESTABLISHED sockets dial :5432 directly.
# Prints "COUNT|summary" where summary lists up to 5 "workspace(cmd pid, N conns)".
probe_bypasses() {
  local raw pids pid cmd cwd block summary="" count=0 item
  raw=$(lsof -nP -iTCP:$PG_DIRECT_PORT -sTCP:ESTABLISHED -Fpcn 2>/dev/null) || { echo "0|"; return; }
  # Parse lsof -F output: per-process blocks of p/c/f/n lines; count only
  # sockets whose REMOTE end is :5432 (server-side rows have it as local end).
  pids=$(printf '%s\n' "$raw" | awk -v P=$PG_DIRECT_PORT '
    /^p/ { pid=substr($0,2); cmd="" }
    /^c/ { cmd=substr($0,2) }
    /^n/ {
      v=substr($0,2); if (v !~ /->/) next
      remote=v; sub(/^.*->/,"",remote)
      port=remote; sub(/^.*:/,"",port)
      if (port == P && cmd != "pgbouncer" && cmd != "postgres") print pid
    }' | sort -u)
  [ -n "$pids" ] || { echo "0|"; return; }
  for pid in $pids; do
    cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | awk '/^n/{print substr($0,2); exit}')
    case "$cwd" in
      "$REPO_ROOT") workspace="(repo root)" ;;
      "$REPO_ROOT"/*) workspace="${cwd#"$REPO_ROOT"/}" ;;
      *) continue ;; # foreign project — context for the card, not a violation
    esac
    cmd=$(ps -p "$pid" -o command= 2>/dev/null | awk '{print $1}' | awk -F/ '{print $NF}')
    conns=$(printf '%s\n' "$raw" | awk -v P=$PG_DIRECT_PORT -v pid="p$pid" '
      $0 ~ "^p" { cur=substr($0,2) }
      /^n/ {
        v=substr($0,2); if (v !~ /->/) next
        remote=v; sub(/^.*->/,"",remote)
        port=remote; sub(/^.*:/,"",port)
        if (port == P && cur == substr(pid,2)) n++
      } END { print n + 0 }')
    count=$((count + 1))
    item="$workspace(${cmd:-node} $pid, ${conns:-?} conns)"
    if [ -z "$summary" ]; then summary="$item"; elif [ "$(printf '%s' "$summary" | awk -F';' '{print NF}')" -lt 5 ]; then
      summary="$summary; $item"
    fi
  done
  echo "$count|$summary"
}

# --- state + repeat suppression -------------------------------------------
# State file: "flagged|epoch" where flagged is the last WARN'd fingerprint
# (saturation level or bypass pid-set) and epoch is its first-WARN time.
read_state() { [ -f "$STATE_FILE" ] && tr -d '\n' <"$STATE_FILE" || echo "|0"; }
write_state() { printf '%s|%s\n' "$1" "$(date +%s)" >"$STATE_FILE"; }

# decide_new <fingerprint> <is_flagged_now>  → echoes "new|persist|clear|same-ok"
decide() { # $1 = current fingerprint ("" = clean)
  local prev epoch now
  IFS='|' read -r prev epoch <<<"$(read_state)"
  now=$(date +%s)
  if [ -z "$1" ]; then
    [ -n "$prev" ] && { echo clear; return; }
    echo same-ok
  elif [ "$prev" = "$1" ]; then
    if [ $(( (now - epoch) / 3600 )) -ge "$REPEAT_HOURS" ]; then echo repeat; else echo persist; fi
  else
    echo new
  fi
}

# --- one pass --------------------------------------------------------------
# Message composition: both legs always report (saturation + bypasses), the
# LEVEL prefix reflects whether anything is newly flagged. A persisting
# known condition stays quiet (repeat suppression) but still appears in the
# pass detail — the history shows the audit ran and what it saw.
run_pass() {
  local start=$(date +%s)
  local sat bypass sat_level sat_total sat_max bp_count bp_summary
  sat=$(probe_saturation); IFS='|' read -r sat_level sat_total sat_max <<<"$sat"
  bypass=$(probe_bypasses); IFS='|' read -r bp_count bp_summary <<<"$bypass"

  local sat_part bp_part fingerprint=""
  case "$sat_level" in
    ok)
      sat_part="pgbouncer ${sat_total}/${sat_max} clients" ;;
    degraded|critical)
      sat_part="saturation ${sat_level}: ${sat_total}/${sat_max} clients"
      fingerprint="sat-$sat_level" ;;
    *)
      sat_part="pgbouncer console unreachable (${PB_HOST}:${PB_PORT})"
      fingerprint="sat-unavailable" ;;
  esac
  if [ "$bp_count" -gt 0 ]; then
    bp_part="${bp_count} repo process(es) bypassing pgbouncer: ${bp_summary}"
    fingerprint="${fingerprint:+$fingerprint+}bp:$bp_count"
  else
    bp_part="no pooler bypasses"
  fi

  local status=ok level=ok notify=""
  if [ -n "$fingerprint" ]; then
    case "$(decide "$fingerprint")" in
      new|repeat)
        case "$fingerprint" in
          *sat-critical*|*sat-unavailable*) level=ERROR; status=error ;;
          *) level=WARN; status=warn ;;
        esac
        notify="$bp_part; $sat_part"
        write_state "$fingerprint" ;;
      persist)
        # Already alerted on exactly this condition — stay quiet (the WARN
        # is already in the feed); record the pass as ok with full detail.
        level=ok ;;
    esac
  else
    # Everything clean: clear any previously flagged state (recovery is
    # logged as a normal ok pass; recoveries do not re-alert).
    [ -n "$(read_state | cut -d'|' -f1)" ] && rm -f "$STATE_FILE"
  fi

  log "$level: $sat_part; $bp_part"
  if [ "$level" != ok ]; then
    notify_alert "$notify"
    send_webhook "$notify"
  fi

  local dur=$(( $(date +%s) - start ))
  # Invoke THROUGH bash — the script ships without the exec bit in this
  # checkout, and a direct exec would exit 126 (silently, under || true).
  [ -n "$PSQL_BIN" ] && bash "$REPO_ROOT/scripts/database/record-job-run.sh" pool-audit "$status" \
    "$sat_part; $bp_part" "" "$dur" >/dev/null 2>&1 || true
}

status_job() {
  echo "state: $(read_state)"
  echo "log: $LOG_FILE (last 12 lines)"
  tail -12 "$LOG_FILE" 2>/dev/null || echo "(no log yet)"
}

write_plist() { # $1 = calendar dict xml
  PSQL_DIR="$(dirname "${PSQL_BIN:-/usr/bin/true}")"
  JOB_PATH="/usr/local/bin:/usr/bin:/bin:${PSQL_DIR}"
  cat >"$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${PLIST_ID}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${REPO_ROOT}/scripts/database/pool-audit.sh</string>
    <string>run</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>${JOB_PATH}</string>
    <key>POOL_LIMITS_ROOT</key><string>${REPO_ROOT}</string>${ALERT_WEBHOOK_URL:+
    <key>ALERT_WEBHOOK_URL</key><string>${ALERT_WEBHOOK_URL}</string>}
  </dict>
  <key>StartCalendarInterval</key>
  $1
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>${LOG_FILE}</string>
  <key>StandardErrorPath</key><string>${LOG_FILE}</string>
</dict>
</plist>
EOF
}

install_job() {
  # Hourly at :21 — offset from the freshness job's :07 so the two audits
  # never stack their lsof/psql bursts.
  write_plist '<dict>
    <key>Minute</key><integer>21</integer>
  </dict>'
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  launchctl load "$PLIST_PATH"
  echo "Installed ${PLIST_ID}: runs hourly (at :21) and at login. Log: ${LOG_FILE}"
}

uninstall_job() {
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  rm -f "$PLIST_PATH"
  echo "Removed ${PLIST_ID}"
}

case "${1:-run}" in
  run)       run_pass ;;
  install)   install_job ;;
  uninstall) uninstall_job ;;
  status)    status_job ;;
  *) echo "usage: $0 {run|install|uninstall|status}" >&2; exit 2 ;;
esac
