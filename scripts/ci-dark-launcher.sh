#!/usr/bin/env bash
# ci-dark-launcher.sh — run the CI-dark watchdog on a local heartbeat.
#
# The CI-dark watchdog (scripts/ci-dark-watchdog.mjs) maintains issue #87-class
# alarms and per-PR "your checks never ran" comments. Its scheduled GitHub
# Actions workflow (.github/workflows/ci-dark-watchdog.yml, every 30 min) has
# two standing blind spots:
#
#   1. Registration: a NEW workflow file only registers on the default branch
#      (main). Until Major-Upgrade merges, GitHub never schedules it at all.
#   2. Coverage: when Actions itself is dark (billing block, runner quota),
#      the schedule dies with every other workflow — the exact outage it
#      exists to alert on.
#
# This launcher closes both the same way the repo's other must-run jobs do
# (federation-drill, audit-retention, data-freshness): a user LaunchAgent on
# a dev machine, independent of GitHub scheduling entirely. The watchdog CLI
# already works locally (it is the documented RUNBOOK backstop); this only
# gives it a 30-minute heartbeat. Nothing is created or modified in the
# repository by the launcher itself — the CLI talks to the GitHub API only.
#
# Usage:
#   ci-dark-launcher.sh run         # one sweep (cron / manual)
#   ci-dark-launcher.sh status      # token presence + last run outcome
#   ci-dark-launcher.sh install     # LaunchAgent: every 30 minutes + at login
#   ci-dark-launcher.sh uninstall   # remove the LaunchAgent
#
# The sweep needs a token with repo scope. Resolution order:
#   CI_DARK_LAUNCHER_TOKEN  →  GITHUB_TOKEN  →  GH_TOKEN
#   →  git credential fill for the origin remote
# On macOS the git-credential-osxkeychain helper usually holds it after a
# plain `git push`; tokenless runs are a recorded skip (exit 0), never an
# alarm — if the launcher has no identity, it says so in its own status.
#
# Scope: WATCHDOG_BRANCH (default: Major-Upgrade — the branch this outage
# runs on; unset in the environment = repo-wide).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${CI_DARK_LAUNCHER_LOG:-/tmp/azeebo-ci-dark-launcher.log}"
PLIST_ID="com.azeebo.ci-dark-watchdog"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_ID}.plist"
WATCHDOG_BRANCH="${WATCHDOG_BRANCH:-Major-Upgrade}"
INTERVAL_SECONDS="${CI_DARK_LAUNCHER_INTERVAL:-1800}"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >>"$LOG_FILE"; }

# launchd's minimal PATH lacks node/pnpm; resolve once (Homebrew + FlyEnv).
NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ] && [ -x /opt/homebrew/bin/node ]; then
  NODE_BIN=/opt/homebrew/bin/node
fi
[ -n "$NODE_BIN" ] || { log "FATAL: node not found in PATH or /opt/homebrew/bin"; exit 1; }

resolve_token() {
  if [ -n "${CI_DARK_LAUNCHER_TOKEN:-}" ]; then
    printf '%s' "$CI_DARK_LAUNCHER_TOKEN"
    return 0
  fi
  for v in GITHUB_TOKEN GH_TOKEN; do
    if [ -n "${!v:-}" ]; then
      printf '%s' "${!v}"
      return 0
    fi
  done
  printf 'protocol=https\nhost=github.com\n\n' \
    | PATH="$PATH" git credential fill 2>/dev/null \
    | sed -n 's/^password=//p'
  return 0
}

run_sweep() {
  local token
  token="$(resolve_token)"
  if [ -z "$token" ]; then
    log "skip: no token (CI_DARK_LAUNCHER_TOKEN / GITHUB_TOKEN / GH_TOKEN / keychain) — not an error"
    exit 0
  fi
  cd "$REPO_ROOT"
  log "sweep: starting (branch scope: ${WATCHDOG_BRANCH:-repo-wide})"
  if GITHUB_REPOSITORY="$(git -C "$REPO_ROOT" remote get-url origin \
      | sed 's#.*github\.com[:/]##; s#\.git$##')" \
     GITHUB_TOKEN="$token" \
     WATCHDOG_BRANCH="$WATCHDOG_BRANCH" \
     "$NODE_BIN" scripts/ci-dark-watchdog.mjs >>"$LOG_FILE" 2>&1; then
    log "sweep: ok"
  else
    log "sweep: FAILED (see the lines above)"
  fi
}

show_status() {
  echo "launcher plist : $PLIST_PATH"
  if launchctl print "gui/$(id -u)/$PLIST_ID" >/dev/null 2>&1; then
    echo "launchd state  : loaded"
  else
    echo "launchd state  : not loaded"
  fi
  if [ -n "${CI_DARK_LAUNCHER_TOKEN:-${GITHUB_TOKEN:-${GH_TOKEN:-}}}" ] \
     || printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | grep -q '^password='; then
    echo "token          : resolvable"
  else
    echo "token          : NOT resolvable — sweeps skip until one is"
  fi
  echo "branch scope   : ${WATCHDOG_BRANCH:-repo-wide}"
  echo "last log lines :"
  tail -8 "$LOG_FILE" 2>/dev/null | sed 's/^/  /' || echo "  (no log yet)"
}

case "${1:-run}" in
  run) run_sweep ;;
  status) show_status ;;
  install)
    mkdir -p "$HOME/Library/LaunchAgents"
    cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$PLIST_ID</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string><string>$REPO_ROOT/scripts/ci-dark-launcher.sh</string><string>run</string>
  </array>
  <key>StartInterval</key><integer>$INTERVAL_SECONDS</integer>
  <key>RunAtLoad</key><true/>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>StandardOutPath</key><string>$LOG_FILE</string>
  <key>StandardErrorPath</key><string>$LOG_FILE</string>
</dict></plist>
PLIST
    launchctl bootout "gui/$(id -u)/$PLIST_ID" >/dev/null 2>&1 || true
    launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH" 2>/dev/null || true
    launchctl kickstart -k "gui/$(id -u)/$PLIST_ID" >/dev/null 2>&1 || true
    echo "installed $PLIST_PATH (every ${INTERVAL_SECONDS}s, fires at load)"
    echo "log: $LOG_FILE — status: $0 status"
    ;;
  uninstall)
    launchctl bootout "gui/$(id -u)/$PLIST_ID" >/dev/null 2>&1 || true
    rm -f "$PLIST_PATH"
    echo "removed $PLIST_PATH"
    ;;
  *)
    echo "usage: ci-dark-launcher.sh [run|status|install|uninstall]" >&2
    exit 2
    ;;
esac
