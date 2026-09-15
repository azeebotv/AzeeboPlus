#!/usr/bin/env bash
# admin-data-freshness.sh — keep the admin panel's data fresh, automatically.
#
# Since federation (scripts/database/federate-admin-db.sh), azeebo_admin's shared
# tables are postgres_fdw foreign tables over the LIVE service databases, so
# "staleness" can only mean one of two failure modes:
#
#   1. Federated (normal): the foreign tables broke — e.g. a service DB was
#      dropped/recreated so the FDW mapping points at nothing. Fix: re-run the
#      federate script (it re-creates servers, mappings and foreign tables).
#   2. Non-federated (fresh checkout / fallback): azeebo_admin holds local
#      mirror tables that go stale. Fix: run `seed-all.sh admin` to re-mirror.
#
# This job detects which mode applies and heals accordingly, then appends a
# one-line status to /tmp/azeebo-admin-freshness.log.
#
# Usage:
#   admin-data-freshness.sh            # run one freshness pass (cron/launchd)
#   admin-data-freshness.sh install    # write LaunchAgent (hourly + at login)
#   admin-data-freshness.sh uninstall  # remove the LaunchAgent
#   admin-data-freshness.sh status     # last log lines + job state
#   admin-data-freshness.sh test-alert # fire a synthetic alert to verify delivery
#
# Dev-only: uses the shared dev credentials, same as seed-all.sh.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_FILE="${FRESHNESS_LOG:-/tmp/azeebo-admin-freshness.log}"
PLIST_ID="com.azeebo.admin-data-freshness"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_ID}.plist"

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-azeebo}"
PGPASSWORD="${PGPASSWORD:-azeebo_dev_2024}"
ADMIN_DB="${ADMIN_DB:-azeebo_admin}"
export PGHOST PGPORT PGUSER PGPASSWORD

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$LOG_FILE"; }

# --- alerting -------------------------------------------------------------
# A failing pass fires a macOS notification and (if configured) a POST to
# ALERT_WEBHOOK_URL (Slack-compatible: {"text": ...}). Fires on the DOWN
# transition only — state is kept in ALERT_STATE_FILE so a persistent failure
# doesn't re-alert every hour; it re-notifies after ALERT_REPEAT_HOURS.
# Recovery clears the state and logs "RECOVERED". A trap also catches the
# case where the whole script dies unexpectedly (e.g. launchd SIGKILL),
# because no pass-level WARN would have been logged in that path.
ALERT_STATE_FILE="${ALERT_STATE_FILE:-${TMPDIR:-/tmp}/azeebo-admin-freshness.alert-state}"
ALERT_REPEAT_HOURS="${ALERT_REPEAT_HOURS:-24}"
# Which job is speaking (payload prefix + death-trap message). The weekly
# federation-drill pass overrides this and ALERT_STATE_FILE so drill failures
# are tracked independently of the hourly freshness pass.
ALERT_SOURCE_LABEL="${ALERT_SOURCE_LABEL:-azeebo admin-freshness}"

alert_state() { [ -f "$ALERT_STATE_FILE" ] && cat "$ALERT_STATE_FILE" 2>/dev/null || echo "OK"; }

notify_alert() { # $1 = message shown to the user
  osascript -e "display notification \"$1\" with title \"Azeebo Admin Freshness\" sound name \"Basso\"" >/dev/null 2>&1 || true
}

send_webhook() { # $1 = reason, $2 = status text (DOWN | DOWN(still) | RECOVERED)
  [ -n "${ALERT_WEBHOOK_URL:-}" ] || return 0
  local payload reason="$1" status="$2"
  payload=$(printf '{"text":"[%s] %s\\n%s\\nhost: %s"}' "$ALERT_SOURCE_LABEL" "$status" "$reason" "$(hostname)")
  curl -sS -m 10 -H 'Content-Type: application/json' -d "$payload" "$ALERT_WEBHOOK_URL" >/dev/null 2>&1 \
    || log "WARN: alert webhook delivery failed"
}

fire_failure_alert() { # $1 = reason
  local reason="$1" prev now elapsed
  PASS_ALERTED=1
  prev=$(alert_state)
  now=$(date +%s)
  if [ "$prev" = "OK" ]; then
    printf 'DOWN %s\n' "$now" >"$ALERT_STATE_FILE"
    log "ALERT: $reason — notifying (macOS${ALERT_WEBHOOK_URL:+ + webhook})"
    notify_alert "$reason"
    send_webhook "$reason" "DOWN"
  else
    elapsed=$(( (now - ${prev#* }) / 3600 ))
    if [ "$elapsed" -ge "$ALERT_REPEAT_HOURS" ]; then
      printf 'DOWN %s\n' "$now" >"$ALERT_STATE_FILE"
      log "ALERT: $reason — still failing after ${elapsed}h; re-notifying"
      notify_alert "$reason (still failing after ${elapsed}h)"
      send_webhook "$reason" "DOWN(still)"
    else
      log "ALERT: $reason — already alerted; staying quiet"
    fi
  fi
}

clear_failure() { # $1 = recovery reason
  if [ "$(alert_state)" != "OK" ]; then
    rm -f "$ALERT_STATE_FILE"
    log "RECOVERED: $1"
    send_webhook "$1" "RECOVERED"
  fi
}

PASS_OK=1       # zeroed only while a "run" pass is in flight; the EXIT trap alerts only then
PASS_ALERTED=0 # set when a pass-level failure already fired an alert this run

on_unexpected_death() {
  local rc=$?
  if [ "$PASS_OK" != 1 ] && [ "$PASS_ALERTED" != 1 ]; then
    fire_failure_alert "$ALERT_SOURCE_LABEL died unexpectedly (exit $rc), no healing ran"
  fi
}

# Mutual exclusion between the hourly freshness pass and the weekly drill:
# the drill repoints the auth FDW server at a throwaway clone for a few
# seconds — a concurrent probe would see the clone and false-alert. A lock
# older than 15 min is stale (launchd SIGKILL) and gets stolen.
LOCK_DIR="${TMPDIR:-/tmp}/azeebo-admin-freshness.lock"
release_lock() { rm -rf "$LOCK_DIR" 2>/dev/null; }
acquire_lock() {
  mkdir "$LOCK_DIR" 2>/dev/null && return 0
  local mtime
  mtime=$(stat -f %m "$LOCK_DIR" 2>/dev/null || echo 0)
  if [ $(( $(date +%s) - mtime )) -gt 900 ]; then
    rm -rf "$LOCK_DIR"; mkdir "$LOCK_DIR" 2>/dev/null
  fi
  return 1  # lock held by another pass (or un-stealable)
}
trap 'release_lock; on_unexpected_death' EXIT


# Explicit TCP connection — the default socket user is not the DB owner.
admin_psql() { "${PSQL_BIN}" -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$ADMIN_DB" -X -q "$@"; }

# launchd's minimal PATH lacks psql; resolve it once. Homebrew + FlyEnv layouts.
PSQL_BIN="${PSQL_BIN:-$(command -v psql || true)}"
if [ -z "$PSQL_BIN" ]; then
  for candidate in /opt/homebrew/bin/psql /usr/local/bin/psql "$HOME/Library/FlyEnv/env/postgresql/bin/psql"; do
    if [ -x "$candidate" ]; then PSQL_BIN="$candidate"; break; fi
  done
fi
case "$PSQL_BIN" in */*) ;; *) echo "psql not found; install PostgreSQL client or set PSQL_BIN" >&2; exit 1 ;; esac

# The one table whose mode decides everything (same probe seed-all.sh uses).
is_federated() {
  admin_psql -tAc \
    "SELECT 1 FROM pg_foreign_table ft JOIN pg_class c ON c.oid=ft.ftrelid WHERE c.relnamespace='public'::regnamespace AND c.relname='users'" \
    2>/dev/null | grep -q 1
}

# Health probe: a federated setup is only "fresh" if a live cross-DB join works.
# users lives in azeebo_auth, wallets in azeebo_wallet — both via azeebo_admin.
# Exit-code based so an empty-but-working federation (fresh checkout) is healthy.
federation_healthy() {
  admin_psql -tAc \
    "SELECT 1 FROM users u JOIN wallets w ON w.\"userId\" = u.id LIMIT 1" >/dev/null 2>&1 \
  && admin_psql -tAc \
    "SELECT 1 FROM auth_audit_logs LIMIT 1" >/dev/null 2>&1
}

RUN_STARTED=""
record_run() { # $1 = job name (freshness|drill), $2 = status, $3 = detail
  local dur=""
  if [ -n "${RUN_STARTED:-}" ]; then
    dur=$(( ($(date +%s) - RUN_STARTED) * 1000 ))
  fi
  bash "$REPO_ROOT/scripts/database/record-job-run.sh" "$1" "$2" "$3" "" "$dur"
}

run_pass() {
  mkdir -p "$(dirname "$LOG_FILE")"
  RUN_STARTED=$(date +%s)

  if ! "${PSQL_BIN}" -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$ADMIN_DB" -tAc 'SELECT 1' >/dev/null 2>&1; then
    log "ERROR: cannot connect to ${PGHOST}:${PGPORT}/${ADMIN_DB} — is Postgres up?"
    fire_failure_alert "cannot connect to ${PGHOST}:${PGPORT}/${ADMIN_DB}"
    record_run freshness error "cannot connect to ${PGHOST}:${PGPORT}/${ADMIN_DB}"
    return 1
  fi

  if is_federated; then
    if federation_healthy; then
      log "ok: federated and healthy (foreign tables answering)"
      record_run freshness ok "federated and healthy"
      clear_failure "federation healthy again"
      return 0
    fi
    log "WARN: federated but foreign tables failing — re-applying federation"
    if bash "$REPO_ROOT/scripts/database/federate-admin-db.sh" >>"$LOG_FILE" 2>&1; then
      log "ok: federation re-applied"
      record_run freshness warn "federation was broken and has been re-applied"
      clear_failure "federation was failing and has been re-applied — verify the panel"
    else
      log "ERROR: federation re-apply failed; next pass will retry"
      record_run freshness error "federation broken and re-apply failed"
      fire_failure_alert "federation broken and re-apply failed — admin panel may show empty data"
      return 1
    fi
  else
    log "WARN: azeebo_admin not federated — refreshing mirror seed (fallback mode)"
    record_run freshness warn "not federated — mirror seed fallback path"
    if bash "$REPO_ROOT/scripts/database/seed-all.sh" admin >>"$LOG_FILE" 2>&1; then
      log "ok: mirror seed refreshed"
      if bash "$REPO_ROOT/scripts/database/federate-admin-db.sh" >>"$LOG_FILE" 2>&1; then
        log "ok: federation (re-)established over live DBs"
      fi
    else
      log "ERROR: mirror seed failed; next pass will retry"
      fire_failure_alert "mirror seed failed and admin DB is not federated"
      return 1
    fi
  fi
}

write_plist() { # $1=plist id  $2=plist path  $3=calendar dict (xml)  $4=RunAtLoad true/false  $5=subcommand ("" = default run)
  # Child scripts (seed-all.sh, federate-admin-db.sh, federation-drill.sh) call
  # psql/pg_dump from PATH, so bake this machine's psql dir into the job's PATH
  # at install time.
  PSQL_DIR="$(dirname "${PSQL_BIN}")"
  JOB_PATH="/usr/local/bin:/usr/bin:/bin:${PSQL_DIR}"
  local progargs=("<string>/bin/bash</string>" "<string>${REPO_ROOT}/scripts/database/admin-data-freshness.sh</string>")
  [ -n "$5" ] && progargs+=("<string>$5</string>")
  cat >"$2" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$1</string>
  <key>ProgramArguments</key>
  <array>
    ${progargs[@]}
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>${JOB_PATH}</string>${ALERT_WEBHOOK_URL:+
    <key>ALERT_WEBHOOK_URL</key><string>${ALERT_WEBHOOK_URL}</string>}
  </dict>
  <key>StartCalendarInterval</key>
  $3
  <key>RunAtLoad</key><$4/>
  <key>StandardOutPath</key><string>${LOG_FILE}</string>
  <key>StandardErrorPath</key><string>${LOG_FILE}</string>
</dict>
</plist>
EOF
}

install_job() {
  if [ -z "${ALERT_WEBHOOK_URL:-}" ]; then
    echo "Note: ALERT_WEBHOOK_URL not set — alerts are macOS notifications only." >&2
    echo "      Add webhook delivery with: ALERT_WEBHOOK_URL='https://hooks.slack.com/services/…' bash $0 install" >&2
  fi
  write_plist "$PLIST_ID" "$PLIST_PATH" '<dict>
    <key>Minute</key><integer>7</integer>
  </dict>' true ''
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  launchctl load "$PLIST_PATH"
  echo "Installed ${PLIST_ID}: runs hourly (at :07) and at login. Log: ${LOG_FILE}"
  echo "Note: the environment used is this shell's PG* settings baked at install time;"
  echo "      the script re-derives defaults itself, so it also works standalone."
  echo "Tip: also install the weekly self-heal drill with: bash $0 install-drill"
}

DRILL_PLIST_ID="com.azeebo.admin-federation-drill"
DRILL_PLIST_PATH="$HOME/Library/LaunchAgents/${DRILL_PLIST_ID}.plist"

install_drill_job() {
  # Saturdays 05:23 (launchd Weekday 6 = Saturday) — far from the hourly :07
  # passes, and the run_drill lock guards the overlap case anyway.
  write_plist "$DRILL_PLIST_ID" "$DRILL_PLIST_PATH" '<dict>
    <key>Weekday</key><integer>6</integer>
    <key>Hour</key><integer>5</integer>
    <key>Minute</key><integer>23</integer>
  </dict>' false drill
  launchctl unload "$DRILL_PLIST_PATH" 2>/dev/null || true
  launchctl load "$DRILL_PLIST_PATH"
  echo "Installed ${DRILL_PLIST_ID}: runs Saturdays at 05:23. Log: ${LOG_FILE}"
}

uninstall_drill_job() {
  launchctl unload "$DRILL_PLIST_PATH" 2>/dev/null || true
  rm -f "$DRILL_PLIST_PATH"
  echo "Removed ${DRILL_PLIST_ID}."
}

uninstall_job() {
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  rm -f "$PLIST_PATH"
  echo "Removed ${PLIST_ID}."
}

status_job() {
  echo "=== LaunchAgent ==="
  launchctl list 2>/dev/null | grep "$PLIST_ID" || echo "(not installed)"
  echo "=== drill LaunchAgent (weekly) ==="
  launchctl list 2>/dev/null | grep "$DRILL_PLIST_ID" || echo "(not installed — enable with: bash $0 install-drill)"
  echo "=== alert state ==="
  if [ -n "${ALERT_WEBHOOK_URL:-}" ]; then echo "webhook: configured"; else echo "webhook: not set (macOS notifications only)"; fi
  local st
  st=$(alert_state)
  case "$st" in
    OK)    echo "state: OK (no unresolved failure)" ;;
    DOWN*) echo "state: ${st%% *} since $(date -r "${st#* }" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'unknown epoch')" ;;
    *)     echo "state: $st" ;;
  esac
  local dst
  dst=$(cat "${TMPDIR:-/tmp}/azeebo-admin-drill.alert-state" 2>/dev/null || echo OK)
  case "$dst" in
    OK)    echo "drill state: OK" ;;
    DOWN*) echo "drill state: ${dst%% *} since $(date -r "${dst#* }" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'unknown epoch')" ;;
    *)     echo "drill state: $dst" ;;
  esac
  echo "=== last drill lines ==="
  grep "drill:" "$LOG_FILE" 2>/dev/null | tail -5 || echo "(none yet)"
  echo "=== last log lines ==="
  tail -15 "$LOG_FILE" 2>/dev/null || echo "(no log yet at ${LOG_FILE})"
}

run_drill() {
  log "drill: weekly federation drill starting (drop + re-federate simulation)"
  RUN_STARTED=$(date +%s)
  if bash "$REPO_ROOT/scripts/database/federation-drill.sh" >>"$LOG_FILE" 2>&1; then
    log "drill: ok — federation contract held across drop + re-federate"
    record_run drill ok "both scenarios passed"
    clear_failure "federation drill passed again — self-heal path verified"
    return 0
  else
    log "ERROR: federation drill FAILED — the self-heal path is broken; see the drill output above"
    record_run drill error "drill assertions failed — self-heal path broken"
    fire_failure_alert "federation drill failed — federation may not survive a service-DB drop (see ${LOG_FILE})"
    return 1
  fi
}

test_alert() {
  log "test: firing a synthetic alert (requested via test-alert)"
  notify_alert "test notification — alerting pipeline works"
  send_webhook "manual test-alert invocation" "TEST"
  echo "Sent macOS notification${ALERT_WEBHOOK_URL:+ and webhook POST to ALERT_WEBHOOK_URL}. Check the channel / notification center."
}

case "${1:-run}" in
  install)         install_job ;;
  uninstall)       uninstall_job ;;
  install-drill)   install_drill_job ;;
  uninstall-drill) uninstall_drill_job ;;
  status)          status_job ;;
  test-alert)      test_alert ;;
  run)
    PASS_OK=0; PASS_ALERTED=0
    if acquire_lock; then run_pass && PASS_OK=1; release_lock
    else log "skip: drill or another pass already in flight"; PASS_OK=1; fi ;;
  drill)
    # Independent alert state + label so a drill failure is never cleared by
    # the hourly freshness pass (and a drill success never clears a real
    # freshness DOWN).
    ALERT_STATE_FILE="${TMPDIR:-/tmp}/azeebo-admin-drill.alert-state"
    ALERT_SOURCE_LABEL="azeebo admin-federation-drill"
    PASS_OK=0; PASS_ALERTED=0
    if acquire_lock; then run_drill && PASS_OK=1; release_lock
    else log "drill: skipped — freshness pass already in flight"; PASS_OK=1; fi ;;
esac
