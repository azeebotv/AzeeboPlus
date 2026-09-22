#!/bin/bash
# ============================================================================
# orphan-blob-audit.sh — weekly launchd wrapper for find-orphan-blobs.mjs
#
# Report-only: find-orphan-blobs.mjs never deletes without the --delete flag,
# which this wrapper deliberately does NOT pass. Output lands in
# /tmp/azeebo-orphan-blobs.log (StandardOutPath in the com.azeebo.orphan-blob-audit
# LaunchAgent). Exit codes pass through from the node script:
#   0 = no orphans, 1 = orphans found, 2 = operational error
# ============================================================================
set -u

NODE="${NODE_BIN:-$(command -v node)}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG=/tmp/azeebo-orphan-blobs.log

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
