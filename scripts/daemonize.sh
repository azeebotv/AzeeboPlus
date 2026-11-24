#!/bin/bash
# ============================================================
# Daemonize - Fully detach a process from the parent shell
# Usage: daemonize.sh <log_file> <command> [args...]
# ============================================================
# Uses double-fork + setsid (if available) to ensure the
# spawned process survives the parent shell exit.
# ============================================================

LOG_FILE="$1"
shift
CMD="$@"

# Double-fork to fully detach from parent
(
  # First fork - child
  if [ "$(id -u)" -ne 0 ]; then
    # Not root, use setsid if available for process group isolation
    if command -v setsid >/dev/null 2>&1; then
      setsid sh -c "$CMD" < /dev/null > "$LOG_FILE" 2>&1 &
    else
      # macOS without setsid: double-fork technique
      (sh -c "$CMD" < /dev/null > "$LOG_FILE" 2>&1 &) &
    fi
  else
    setsid sh -c "$CMD" < /dev/null > "$LOG_FILE" 2>&1 &
  fi
) &
