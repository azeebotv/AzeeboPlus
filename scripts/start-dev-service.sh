#!/usr/bin/env bash
# ============================================================
# Azeebo+ — shared dev runner for every NestJS service
# ============================================================
# Single source of truth for `pnpm start:dev` in all services.
# Replaces the 28 per-service start-dev.sh copies whose template
# drift caused: live-event-service checking a phantom generated/
# dir, and knowledge-service's package.json bypassing its script.
#
# What it does (in the service directory it is run from):
#   1. `prisma generate` — only when prisma/schema.prisma exists
#      and the client output dir (src/prisma/client) does not
#      (first run on a fresh clone; the build script covers the rest)
#   2. Mirrors the generated client into dist/prisma/client so
#      compiled imports resolve before the first watch rebuild
#   3. exec's `nest start --watch`; extra args pass through
#
# Usage (pnpm run sets cwd to the service dir):
#   cd services/core/auth-service && pnpm start:dev
# or directly:
#   bash ../../scripts/start-dev-service.sh [nest args...]
#
# PATH CONTRACT: SCHEMA / CLIENT_DIR / the dist mirror destination are
# shared with build-service.sh and pinned by runner-parity.test.mjs
# (canonical constants in scripts/lib/dev-wiring-core.mjs) — change them
# in BOTH scripts together or CI fails the parity suite.
# ============================================================
set -euo pipefail

SERVICE_DIR="$(pwd -P)"
if [ ! -f "$SERVICE_DIR/package.json" ]; then
  echo "start-dev-service.sh: no package.json in $(pwd -P) — run from a service directory (pnpm start:dev does this) or cd there first" >&2
  exit 2
fi
cd "$SERVICE_DIR"

SCHEMA="prisma/schema.prisma"
CLIENT_DIR="src/prisma/client"

if [ -f "$SCHEMA" ] && [ ! -d "$CLIENT_DIR" ]; then
  echo "[$(basename "$SERVICE_DIR")] Generating Prisma client (first run)..."
  # Output streams live; a failure aborts here (set -e) BEFORE nest starts —
  # the service never boots against a missing/stale client with a cryptic
  # "Cannot find module '.prisma/client'"-style runtime error.
  if ! gen_output="$(pnpm exec prisma generate 2>&1)"; then
    printf '%s\n' "$gen_output" | sed 's/^/  | /'
    echo "[$(basename "$SERVICE_DIR")] prisma generate FAILED — not starting." >&2
    echo "  Fix the schema/datasource error above, then either re-run 'pnpm start:dev' or generate manually: pnpm run prisma:generate" >&2
    exit 1
  fi
  printf '%s\n' "$gen_output" | grep -v '^$' | tail -2 | sed 's/^/  /' || true
fi

if [ -d "$CLIENT_DIR" ]; then
  mkdir -p dist/prisma/client
  cp -R "$CLIENT_DIR/." dist/prisma/client/
fi

exec pnpm exec nest start --watch "$@"
