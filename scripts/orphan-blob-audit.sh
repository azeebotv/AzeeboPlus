#!/bin/bash
# ============================================================================
# orphan-blob-audit.sh — weekly launchd wrapper for find-orphan-blobs.mjs
#
# Report-only: find-orphan-blobs.mjs never deletes without the --delete flag,
# which this wrapper deliberately does NOT pass. Output lands in
# /tmp/azeebo-orphan-blobs.log (StandardOutPath in the com.azeebo.orphan-blob-audit
# LaunchAgent). Exit codes pass through from the node script:
#   0 = no orphans, 1 = orphans found, 2 = operational error
#
# Modes:
#   orphan-blob-audit.sh run         # one pass (the LaunchAgent runs this)
#   orphan-blob-audit.sh install     # (re)install the weekly LaunchAgent
#   orphan-blob-audit.sh uninstall
# ============================================================================
set -u

NODE="${NODE_BIN:-$(command -v node)}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG=/tmp/azeebo-orphan-blobs.log
PLIST_ID="com.azeebo.orphan-blob-audit"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_ID}.plist"

run_audit() {
  echo "=== $(date '+%Y-%m-%d %H:%M:%S %Z') orphan blob audit start ===" >>"$LOG"

  cd "$REPO_ROOT" || { echo "cannot cd to $REPO_ROOT" >>"$LOG"; exit 2; }

  "$NODE" scripts/find-orphan-blobs.mjs >>"$LOG" 2>&1
  CODE=$?

  case $CODE in
    0) echo "=== $(date '+%Y-%m-%d %H:%M:%S %Z') result: clean (no orphans) ===" >>"$LOG" ;;
    1) echo "=== $(date '+%Y-%m-%d %H:%M:%S %Z') result: ORPHANS FOUND — see list above (report-only; run with --delete manually after review) ===" >>"$LOG" ;;
    *) echo "=== $(date '+%Y-%m-%d %H:%M:%S %Z') result: OPERATIONAL ERROR (exit $CODE) ===" >>"$LOG" ;;
  esac

  exit $CODE
}

write_plist() {
  # PATH needs the node dir: launchd's default PATH has no node, and the
  # wrapper resolves NODE via command -v (the plist-vanished incident class:
  # this plist was hand-made with no install mode, so it was unrecoverable
  # by script — hence install/uninstall here).
  local JOB_PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${HOME}/Library/FlyEnv/env/node/bin:${HOME}/Library/FlyEnv/env/postgresql/bin"
  mkdir -p "$HOME/Library/LaunchAgents"
  cat >"$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$PLIST_ID</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string><string>$REPO_ROOT/scripts/orphan-blob-audit.sh</string><string>run</string>
  </array>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>$JOB_PATH</string>
  </dict>
  <key>StartCalendarInterval</key><dict>
    <key>Weekday</key><integer>1</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>17</integer>
  </dict>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict></plist>
PLIST
}

case "${1:-run}" in
  run) run_audit ;;
  install)
    write_plist
    launchctl bootout "gui/$(id -u)/$PLIST_ID" 2>/dev/null || launchctl unload "$PLIST_PATH" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH" 2>/dev/null || launchctl load "$PLIST_PATH"
    echo "Installed $PLIST_ID: runs Mondays 08:17. Log: $LOG"
    ;;
  uninstall)
    launchctl bootout "gui/$(id -u)/$PLIST_ID" 2>/dev/null || launchctl unload "$PLIST_PATH" 2>/dev/null || true
    rm -f "$PLIST_PATH"
    echo "Removed $PLIST_ID"
    ;;
  *) echo "usage: orphan-blob-audit.sh [run|install|uninstall]" >&2; exit 2 ;;
esac
