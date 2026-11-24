#!/bin/sh
# Nightly loop for the scheduled job containers (archive-cleanup,
# data-retention). Emits one JSON line per lifecycle event so promtail's
# json stage can label them in Loki.
#
# The container selects its job via env:
#   JOB_SCRIPT — absolute path to the job script to run
#   JOB_NAME   — job label used in the emitted JSON lines
set -u

STATE_DIR="${STATE_FILE_DIR:-/var/lib/azeebo/job}"
INTERVAL="${JOB_INTERVAL:-${ARCHIVE_CLEANUP_INTERVAL:-86400}}"
OFFSET="${JOB_OFFSET:-${ARCHIVE_CLEANUP_OFFSET:-7200}}"
SCRIPT="${JOB_SCRIPT:-/opt/azeebo/scripts/archive-cleanup.mjs}"
JOB="${JOB_NAME:-archive-cleanup}"
ARGS="${JOB_ARGS:-${ARCHIVE_CLEANUP_ARGS:---apply}}"

now_iso() { date -u +%Y-%m-%dT%H:%M:%SZ; }
emit() { echo "{\"ts\":\"$(now_iso)\",\"job\":\"$JOB\",\"event\":\"$1\"${2:+,$2}}"; }

mkdir -p "$STATE_DIR" 2>/dev/null || true
chown -R 70:70 "$STATE_DIR" 2>/dev/null || true

emit "boot" "\"interval\":${INTERVAL},\"offset\":${OFFSET},\"args\":\"${ARGS}\""
sleep "$OFFSET"

while true; do
  emit "start"
  if su-exec 70:70 node "$SCRIPT" $ARGS; then
    emit "done" "\"status\":\"ok\""
  else
    emit "done" "\"status\":\"failed\""
  fi
  sleep "$INTERVAL"
done
