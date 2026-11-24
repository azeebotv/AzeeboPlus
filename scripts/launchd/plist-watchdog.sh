#!/usr/bin/env bash
# ============================================================================
# plist-watchdog.sh — self-healing guard for every com.azeebo.* LaunchAgent
#
# Why: com.azeebo plists VANISHED from ~/Library/LaunchAgents twice on
# 2026-09-22 (pool-audit in the morning, again minutes after a manual
# reinstall). The culprit couldn't be proven — no repo script deletes foreign
# plists, no crontab, empty Trash — so this watchdog makes the question moot:
# any missing plist is reinstalled within ~15 minutes, and every detection
# leaves evidence (notification + webhook + job_runs ledger row) even if the
# deleter strikes again.
#
# Legs:
#   services — `gen-service-plists.mjs --check` is the truth. On MISSING or
#     drifted plists: regenerate from the manifest and bootstrap only the
#     affected labels. Exit 2 (manifest contract violation) alerts without
#     healing — a contract bug needs a human, not a rewrite loop.
#   jobs — freshness, drill, retention, digest, orphan-blob, pool-audit,
#     ci-dark each reinstall ONLY when their plist file is missing, via their
#     own scripts' install modes (installers may bake env like
#     ALERT_WEBHOOK_URL at install time, so drift is left for humans).
#
# Every pass records a job_runs row ('plist-watchdog') via record-job-run.sh,
# through the pgbouncer port — so the Ops Health cadence watchdog and the
# nightly job-health gate police the watchdog itself.
#
# Usage:
#   plist-watchdog.sh run       # one pass (the LaunchAgent runs this)
#   plist-watchdog.sh status    # state + last log lines
#   plist-watchdog.sh install   # schedule every 15 min via LaunchAgent
#   plist-watchdog.sh uninstall
#
# Env: ALERT_WEBHOOK_URL (baked into the plist at install), PLIST_WATCHDOG_*,
# PGPORT for the ledger write (default 6432 — the pooler; record-job-run.sh's
# own default is 5432 and this watchdog practices what the fleet preaches).
# Exit: 0 = healthy or healed, 1 = alert-worthy problem persists, 2 = infra.
# ============================================================================
set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# TMPDIR convention (matches pool-audit + the Ops Health reader default):
# under launchd and shells alike TMPDIR is the per-user confstr dir.
LOG_FILE="${TMPDIR:-/tmp}/azeebo-plist-watchdog.log"
STATE_FILE="${TMPDIR:-/tmp}/azeebo-plist-watchdog.state"
PLIST_DIR="$HOME/Library/LaunchAgents"
WATCHDOG_PLIST_ID="com.azeebo.plist-watchdog"
WATCHDOG_PLIST_PATH="$PLIST_DIR/${WATCHDOG_PLIST_ID}.plist"
# Operator kill-switch for the SERVICE fleet (not the job agents): while this
# marker exists, the services leg reconciles KEEP only — it deletes strays and
# never resurrects the suppressed labels. Written by service-agents.sh.
SERVICE_DISABLE_MARKER="$PLIST_DIR/.com.azeebo.services.disabled"
REPEAT_HOURS="${PLIST_WATCHDOG_REPEAT_HOURS:-12}"

# Job plists: label → "script|args" (install mode = the recovery path).
JOB_INSTALLERS=(
  "com.azeebo.admin-data-freshness|scripts/database/admin-data-freshness.sh install"
  "com.azeebo.admin-federation-drill|scripts/database/admin-data-freshness.sh install-drill"
  "com.azeebo.audit-retention|scripts/database/audit-retention.sh install"
  "com.azeebo.ops-weekly-digest|scripts/database/ops-weekly-digest.sh install"
  "com.azeebo.orphan-blob-audit|scripts/orphan-blob-audit.sh install"
  "com.azeebo.data-retention|node_modules/tsx/dist/cli.mjs scripts/data-retention-enforcement.ts install"
  "com.azeebo.admin-pool-audit|scripts/database/pool-audit.sh install"
  "com.azeebo.ci-dark-watchdog|scripts/ci-dark-launcher.sh install"
)

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$LOG_FILE"; }

notify_alert() { # $1 = message
  osascript -e "display notification \"$1\" with title \"Azeebo Plist Watchdog\"" >/dev/null 2>&1 || true
}
send_webhook() { # $1 = message
  [ -n "${ALERT_WEBHOOK_URL:-}" ] || return 0
  curl -sS -m 10 -H 'Content-Type: application/json' \
    -d "{\"text\":\"[azeebo plist-watchdog] $1\\nhost: $(hostname)\"}" \
    "$ALERT_WEBHOOK_URL" >/dev/null 2>&1 || log "WARN: alert webhook delivery failed"
}

# Repeat suppression (pool-audit pattern): one alert per REPEAT_HOURS.
suppress_alert() { # $1 = message — notifies only if the quiet period passed
  local now last
  now="$(date +%s)"
  last="$(cat "$STATE_FILE" 2>/dev/null || echo 0)"
  if [ $((now - last)) -ge $((REPEAT_HOURS * 3600)) ]; then
    echo "$now" >"$STATE_FILE"
    notify_alert "$1"
    send_webhook "$1"
  else
    log "SUPPRESSED (repeat window ${REPEAT_HOURS}h): $1"
  fi
}

record_ledger() { # $1 = status(ok|warn|error)  $2 = detail  $3 = durationMs
  export PGHOST="${PGHOST:-localhost}" PGPORT="${PLIST_WATCHDOG_PGPORT:-6432}"
  export PGUSER="${PGUSER:-azeebo}" PGPASSWORD="${PGPASSWORD:-azeebo_dev_2024}"
  bash "$REPO_ROOT/scripts/database/record-job-run.sh" plist-watchdog "$1" "$2" "" "${3:-}" >/dev/null 2>&1 || true
}

bootstrap_service() { # $1 = label
  local uid f
  uid="$(id -u)"
  f="$PLIST_DIR/com.azeebo.$1.plist"
  launchctl bootout "gui/$uid/com.azeebo.$1" 2>/dev/null || true
  launchctl bootstrap "gui/$uid" "$f" 2>/dev/null || launchctl load "$f" 2>/dev/null || true
}

# --- services leg -----------------------------------------------------------
reconcile_services() { # sets SERVICES_STATUS / SERVICES_DETAIL
  local out rc labels
  if [ -f "$SERVICE_DISABLE_MARKER" ]; then
    # Fleet disabled by the operator (local-dev.sh owns the ports). Two-phase
    # reconcile so this leg enforces the disable instead of fighting it:
    #   1. bootout any suppressed label that is still loaded (a stray plist
    #      re-imported at login can already be running);
    #   2. run write mode — it deletes every non-KEEP service plist on disk.
    # Only then check, so a stray is never mistaken for missing-plist drift
    # (the heal path below would otherwise bootstrap it back to life).
    local label keep
    keep="$(sed -n 's/^KEEP=//p' "$SERVICE_DISABLE_MARKER" 2>/dev/null || true)"
    for label in $(node "$REPO_ROOT/scripts/launchd/gen-service-plists.mjs" --labels); do
      case " $keep " in *" $label "*) continue ;; esac
      launchctl bootout "gui/$(id -u)/com.azeebo.$label" 2>/dev/null || true
    done
    if ! node "$REPO_ROOT/scripts/launchd/gen-service-plists.mjs" >>"$LOG_FILE" 2>&1; then
      SERVICES_STATUS="error"; SERVICES_DETAIL="disabled-fleet reconcile failed (generator error)"
      return 1
    fi
  fi
  out="$(node "$REPO_ROOT/scripts/launchd/gen-service-plists.mjs" --check 2>&1)"
  rc=$?
  if [ "$rc" -eq 0 ]; then
    SERVICES_STATUS="ok"
    if [ -f "$SERVICE_DISABLE_MARKER" ]; then
      SERVICES_DETAIL="service fleet disabled by marker (KEEP only)"
    else
      SERVICES_STATUS="ok"; SERVICES_DETAIL=""
    fi
    # "gen-service-plists --check: all 19 service plists match the manifest"
    SERVICES_COUNT="$(printf '%s\n' "$out" | grep -oE 'all [0-9]+' | grep -oE '[0-9]+')"
    return 0
  fi
  if [ "$rc" -eq 2 ]; then
    # Manifest contract violation (forbidden key, missing .env, …): do NOT
    # regenerate — the generator would refuse anyway. Human territory.
    SERVICES_STATUS="error"
    SERVICES_DETAIL="manifest contract violation: $(echo "$out" | head -1 | cut -c1-160)"
    return 1
  fi
  # rc=1: drift and/or missing plists. Labels parse from the "  - <label>: …" lines.
  labels="$(printf '%s\n' "$out" | sed -n 's/^  - \([a-z0-9-]*\):.*/\1/p' | paste -sd, -)"
  log "service plist drift/missing: ${labels:-unknown}"
  node "$REPO_ROOT/scripts/launchd/gen-service-plists.mjs" >/dev/null 2>&1 || {
    SERVICES_STATUS="error"; SERVICES_DETAIL="regeneration failed — see $LOG_FILE"
    return 1
  }
  local IFS=','
  for lbl in $labels; do
    [ -n "$lbl" ] && bootstrap_service "$lbl"
    log "reinstalled + bootstrapped service: $lbl"
  done
  unset IFS
  out="$(node "$REPO_ROOT/scripts/launchd/gen-service-plists.mjs" --check 2>&1)"
  if [ $? -eq 0 ]; then
    SERVICES_STATUS="warn"
    SERVICES_DETAIL="healed: reinstalled ${labels} from the manifest"
    return 0
  fi
  SERVICES_STATUS="error"
  SERVICES_DETAIL="heal incomplete, still drifting: ${labels}"
  return 1
}

# --- jobs leg ----------------------------------------------------------------
reconcile_jobs() { # sets JOBS_STATUS / JOBS_DETAIL
  local missing=() entry label cmd
  for entry in "${JOB_INSTALLERS[@]}"; do
    label="${entry%%|*}"
    cmd="${entry#*|}"
    if [ ! -f "$PLIST_DIR/${label}.plist" ]; then
      missing+=("$label")
      log "job plist missing: $label — reinstalling via: $cmd"
      # bash (not exec-bit): several installers are 644 and launching via
      # $cmd directly would hit "Permission denied" under launchd's minimal env.
      ( cd "$REPO_ROOT" && bash -c "bash $cmd" ) >>"$LOG_FILE" 2>&1 || log "ERROR: reinstall failed for $label"
      if [ -f "$PLIST_DIR/${label}.plist" ]; then
        log "job plist restored: $label"
      else
        log "ERROR: job plist still missing after reinstall: $label"
      fi
    fi
  done
  if [ "${#missing[@]}" -eq 0 ]; then
    JOBS_STATUS="ok"; JOBS_DETAIL=""
    return 0
  fi
  local still_missing=() restored=()
  for label in "${missing[@]}"; do
    if [ -f "$PLIST_DIR/${label}.plist" ]; then restored+=("$label"); else still_missing+=("$label"); fi
  done
  if [ "${#still_missing[@]}" -eq 0 ]; then
    JOBS_STATUS="warn"
    JOBS_DETAIL="healed: reinstalled job plists $(printf '%s, ' "${restored[@]}" | sed 's/, $//')"
  else
    JOBS_STATUS="error"
    JOBS_DETAIL="job plists STILL MISSING after reinstall: $(printf '%s, ' "${still_missing[@]}" | sed 's/, $//')"
  fi
  return 0
}

run_pass() {
  local start dur
  start="$(date +%s)"
  SERVICES_STATUS="ok"; SERVICES_DETAIL=""
  JOBS_STATUS="ok"; JOBS_DETAIL=""
  reconcile_services; services_rc=$?
  reconcile_jobs

  # Combine: worst of the two legs decides the row status + alert.
  local status detail
  if [ "$SERVICES_STATUS" = "error" ] || [ "$JOBS_STATUS" = "error" ]; then
    status="error"
  elif [ "$SERVICES_STATUS" = "warn" ] || [ "$JOBS_STATUS" = "warn" ]; then
    status="warn"
  else
    status="ok"
  fi
  detail="$(printf '%s%s%s' \
    "$([ -n "$SERVICES_DETAIL" ] && printf 'services: %s; ' "$SERVICES_DETAIL")" \
    "$([ -n "$JOBS_DETAIL" ] && printf 'jobs: %s' "$JOBS_DETAIL")" \
    | sed 's/; $//')"
  [ -n "$detail" ] || detail="all ${SERVICES_COUNT:-?} service plists + ${#JOB_INSTALLERS[@]} job plists present"

  dur=$(( $(date +%s) - start ))
  record_ledger "$status" "$detail" "$((dur * 1000))"

  case "$status" in
    ok) log "ok: $detail" ;;
    warn)
      log "WARN: $detail"
      suppress_alert "$detail"
      ;;
    error)
      log "ERROR: $detail"
      suppress_alert "$detail"
      ;;
  esac
  [ "$status" = "ok" ] && exit 0
  [ "$status" = "warn" ] && exit 0
  exit 1
}

status_report() {
  echo "state file: $STATE_FILE ($(cat "$STATE_FILE" 2>/dev/null || echo 'no alerts'))"
  echo "last alert: $([ -f "$STATE_FILE" ] && date -r "$(cat "$STATE_FILE")" '+%Y-%m-%d %H:%M:%S' || echo 'none')"
  echo "log: $LOG_FILE (last 12 lines)"
  tail -12 "$LOG_FILE" 2>/dev/null || echo "(no log yet)"
  echo "service plists: $(node "$REPO_ROOT/scripts/launchd/gen-service-plists.mjs" --check 2>&1 | tail -1)"
  local entry label
  for entry in "${JOB_INSTALLERS[@]}"; do
    label="${entry%%|*}"
    [ -f "$PLIST_DIR/${label}.plist" ] && echo "  ok      $label" || echo "  MISSING $label"
  done
}

install_job() {
  mkdir -p "$PLIST_DIR"
  local JOB_PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:${HOME}/Library/FlyEnv/env/node/bin:${HOME}/Library/FlyEnv/env/postgresql/bin"
  cat >"$WATCHDOG_PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${WATCHDOG_PLIST_ID}</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string>
    <string>${REPO_ROOT}/scripts/launchd/plist-watchdog.sh</string>
    <string>run</string>
  </array>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>${JOB_PATH}</string>${ALERT_WEBHOOK_URL:+
    <key>ALERT_WEBHOOK_URL</key><string>${ALERT_WEBHOOK_URL}</string>}
  </dict>
  <key>StartInterval</key><integer>900</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>${LOG_FILE}</string>
  <key>StandardErrorPath</key><string>${LOG_FILE}</string>
</dict></plist>
PLIST
  launchctl bootout "gui/$(id -u)/${WATCHDOG_PLIST_ID}" 2>/dev/null || launchctl unload "$WATCHDOG_PLIST_PATH" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$WATCHDOG_PLIST_PATH" 2>/dev/null || launchctl load "$WATCHDOG_PLIST_PATH"
  echo "Installed ${WATCHDOG_PLIST_ID}: runs every 15 min + at login. Log: ${LOG_FILE}"
}

uninstall_job() {
  launchctl bootout "gui/$(id -u)/${WATCHDOG_PLIST_ID}" 2>/dev/null || launchctl unload "$WATCHDOG_PLIST_PATH" 2>/dev/null || true
  rm -f "$WATCHDOG_PLIST_PATH"
  echo "Removed ${WATCHDOG_PLIST_ID}"
}

case "${1:-run}" in
  run)       run_pass ;;
  status)    status_report ;;
  install)   install_job ;;
  uninstall) uninstall_job ;;
  *) echo "usage: plist-watchdog.sh [run|status|install|uninstall]" >&2; exit 2 ;;
esac
