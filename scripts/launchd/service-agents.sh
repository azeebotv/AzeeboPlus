#!/usr/bin/env bash
# ============================================================================
# service-agents.sh — one switch for the com.azeebo.* SERVICE LaunchAgents
#
# Why this exists: in local dev, scripts/local-dev.sh owns every service port.
# The 36 generated service LaunchAgents (KeepAlive + RunAtLoad) raced it for
# those ports, instantly respawned anything the launcher killed, and their
# accumulated watcher orphans drove the machine to 99.7% file descriptors
# (122,518/122,880) — which is what broke every launch attempt. Booting the
# labels out at runtime was not enough, because two things bring them back:
#   1. launchd loads ~/Library/LaunchAgents/*.plist at every login;
#   2. plist-watchdog.sh regenerates + bootstraps anything missing in <=15 min.
#
# So the policy lives in a marker file that BOTH of those paths honor:
#   ~/Library/LaunchAgents/.com.azeebo.services.disabled   (KEEP=<labels>)
# gen-service-plists.mjs deletes non-KEEP service plists in write mode and
# skips them in check mode; plist-watchdog.sh reconciles the kept set only.
#
# The 10 utility/retention agents are NEVER touched by this script's fleet
# logic: the 8 job installers + com.azeebo.plist-watchdog are not in the
# service manifest at all, and dev-virus-scanner is listed in KEEP.
#
# Usage:
#   service-agents.sh disable   # boot out services, write marker, delete plists
#   service-agents.sh enable    # drop marker, regenerate + bootstrap everything
#   service-agents.sh status    # marker, files, and loaded state
#
# Reversible: `enable` restores the previous behavior exactly (all 37 plists
# regenerated from the manifest and bootstrapped).
# ============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GENERATOR="$REPO_ROOT/scripts/launchd/gen-service-plists.mjs"
PLIST_DIR="${AZEEBO_LAUNCH_AGENTS_DIR:-$HOME/Library/LaunchAgents}"
MARKER="${AZEEBO_SERVICE_DISABLE_MARKER:-$PLIST_DIR/.com.azeebo.services.disabled}"
# Both seams are honored by gen-service-plists.mjs too, so a sandboxed run
# (tests) exercises the identical code path as the real ~/Library one.
UID_N="$(id -u)"
DOMAIN="gui/$UID_N"

# Manifest labels that stay generated AND loaded while the fleet is disabled
# (utilities the operator chose to keep). Everything else in the manifest is
# booted out and its plist file removed.
KEEP_LABELS="dev-virus-scanner"
DISABLE_REASON="local-dev.sh owns the service ports; duplicate keepalive agents raced it and leaked watcher orphans"

mkdir -p "$PLIST_DIR"

is_keep() { case " $KEEP_LABELS " in *" $1 "*) return 0 ;; *) return 1 ;; esac; }

service_labels() { node "$GENERATOR" --labels; }

loaded() { launchctl print "$DOMAIN/com.azeebo.$1" >/dev/null 2>&1; }

bootout() { launchctl bootout "$DOMAIN/com.azeebo.$1" 2>/dev/null || true; }

bootstrap() { # $1 = label — file must exist
  local f="$PLIST_DIR/com.azeebo.$1.plist"
  [ -f "$f" ] || return 0
  launchctl bootout "$DOMAIN/com.azeebo.$1" 2>/dev/null || true
  launchctl bootstrap "$DOMAIN" "$f" 2>/dev/null || launchctl load "$f" 2>/dev/null || true
}

cmd_disable() {
  # bash 3.2-compatible (macOS /bin/bash has no mapfile): manifest labels are
  # plain tokens, so word-splitting the list is safe.
  local labels n=0 kept=0
  labels="$(service_labels)"

  # 1. Marker FIRST: from here on gen-service-plists (watchdog, humans) stops
  #    regenerating the fleet, so nothing can resurrect what step 3 deletes.
  cat >"$MARKER" <<EOF
# Azeebo SERVICE LaunchAgents are intentionally disabled on this machine.
# Written by scripts/launchd/service-agents.sh — run
#   bash scripts/launchd/service-agents.sh enable
# to restore them. While this file exists, gen-service-plists.mjs deletes
# non-KEEP service plists and plist-watchdog.sh reconciles only the KEEP set.
DISABLED_AT="$(date '+%Y-%m-%dT%H:%M:%S%z')"
REASON=$DISABLE_REASON
KEEP=$KEEP_LABELS
EOF

  # 2. Boot every non-KEEP service label out of the launchd domain.
  local label total=0
  for label in $labels; do
    total=$((total + 1))
    if is_keep "$label"; then kept=$((kept + 1)); else bootout "$label"; fi
  done

  # 3. Let the generator delete the plist files (KEEP set refreshed).
  node "$GENERATOR" >/dev/null

  for label in $labels; do
    is_keep "$label" && continue
    [ -f "$PLIST_DIR/com.azeebo.$label.plist" ] && n=$((n + 1))
  done

  echo "Service fleet DISABLED: $total manifest labels ($kept kept, $((total - kept)) booted out)."
  echo "  marker:   $MARKER"
  echo "  leftover: $n suppressed plist file(s) still on disk (expected 0)"
  echo "  utilities untouched: job installers + plist-watchdog (not in the manifest), KEEP=$KEEP_LABELS"
  echo "  reverse with: bash scripts/launchd/service-agents.sh enable"
}

cmd_enable() {
  local labels n=0 total=0
  labels="$(service_labels)"

  # Marker must go BEFORE regeneration, otherwise the generator deletes them.
  rm -f "$MARKER"
  node "$GENERATOR" >/dev/null

  for label in $labels; do
    total=$((total + 1))
    bootstrap "$label"
    if loaded "$label"; then n=$((n + 1)); fi
  done

  echo "Service fleet ENABLED: $total plists regenerated, $n loaded (the rest start at next login)."
}

cmd_status() {
  local labels present=0 running=0 suppressed_files=0 total=0
  labels="$(service_labels)"

  if [ -f "$MARKER" ]; then
    echo "marker: DISABLED ($MARKER)"
    sed 's/^/  /' "$MARKER"
  else
    echo "marker: none (service fleet active — plists load at login)"
  fi

  local label
  for label in $labels; do
    total=$((total + 1))
    if [ -f "$PLIST_DIR/com.azeebo.$label.plist" ]; then present=$((present + 1)); fi
    if loaded "$label"; then running=$((running + 1)); fi
    if [ -f "$MARKER" ] && ! is_keep "$label" && [ -f "$PLIST_DIR/com.azeebo.$label.plist" ]; then
      suppressed_files=$((suppressed_files + 1))
      echo "  STRAY suppressed plist: com.azeebo.$label.plist"
    fi
  done

  echo "manifest services: $total total · $present plist file(s) on disk · $running loaded"
  echo "job/utility agents: $(ls "$PLIST_DIR"/com.azeebo.*.plist 2>/dev/null | wc -l | tr -d ' ') com.azeebo plist file(s) present overall"
  [ "$suppressed_files" -eq 0 ] || { echo "ERROR: $suppressed_files stray suppressed plist(s) — run disable again"; return 1; }
}

case "${1:-status}" in
  disable) cmd_disable ;;
  enable)  cmd_enable ;;
  status)  cmd_status ;;
  *) echo "usage: service-agents.sh [disable|enable|status]" >&2; exit 2 ;;
esac
