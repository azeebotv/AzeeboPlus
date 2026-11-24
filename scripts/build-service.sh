#!/usr/bin/env bash
# ============================================================
# Azeebo+ — shared build runner for every NestJS service
# ============================================================
# Single source of truth for `pnpm run build` in all services.
# Replaces the 28 per-service inline build chains whose only
# protection against drift was that they happened to be identical.
#
# What it does (in the service directory it is run from):
#   1. `prisma generate` — only when prisma/schema.prisma exists
#      (schema-less services like api-gateway skip this entirely)
#   2. `tsc -p tsconfig.build.json`
#   3. Mirrors the generated client into dist/prisma/client so
#      compiled imports resolve at runtime (schema-bearing services)
#
# Usage (pnpm run sets cwd to the service dir):
#   cd services/core/auth-service && pnpm run build
# or directly:
#   bash ../../../scripts/build-service.sh
#
# PATH CONTRACT: SCHEMA / CLIENT_DIR / the dist mirror destination are
# shared with start-dev-service.sh and pinned by runner-parity.test.mjs
# (canonical constants in scripts/lib/dev-wiring-core.mjs) — change them
# in BOTH scripts together or CI fails the parity suite.
# ============================================================
set -euo pipefail

SERVICE_DIR="$(pwd -P)"
if [ ! -f "$SERVICE_DIR/package.json" ]; then
  echo "build-service.sh: no package.json in $(pwd -P) — run from a service directory (pnpm run build does this) or cd there first" >&2
  exit 2
fi

SVC_NAME="$(basename "$SERVICE_DIR")"
SCHEMA="prisma/schema.prisma"
CLIENT_DIR="src/prisma/client"

# --- 1. Generate -------------------------------------------------------
# Output is captured and echoed on failure (with a fix hint) rather than
# streaming silently; a failure aborts BEFORE tsc, so a build never
# "succeeds" against a stale or missing client.
if [ -f "$SCHEMA" ]; then
  echo "[$SVC_NAME] build: generating Prisma client..."
  if ! gen_output="$(pnpm exec prisma generate 2>&1)"; then
    printf '%s\n' "$gen_output" | sed 's/^/  | /'
    echo "[$SVC_NAME] prisma generate FAILED — build aborted." >&2
    echo "  Fix the schema/datasource error above, then re-run 'pnpm run build'." >&2
    exit 1
  fi
  printf '%s\n' "$gen_output" | grep -v '^$' | tail -1 | sed 's/^/  /' || true
fi

# --- 2. Compile --------------------------------------------------------
echo "[$SVC_NAME] build: tsc -p tsconfig.build.json..."
if ! tsc_output="$(pnpm exec tsc -p tsconfig.build.json 2>&1)"; then
  printf '%s\n' "$tsc_output" | sed 's/^/  | /'
  echo "[$SVC_NAME] tsc FAILED — build aborted." >&2
  exit 1
fi
# Surface type errors even when tsc exits 0 (shouldn't happen, but a
# swallowed error is worse than a duplicated line).
if [ -n "$tsc_output" ]; then
  printf '%s\n' "$tsc_output" | sed 's/^/  | /'
fi

# --- 3. Mirror client into dist ----------------------------------------
# Same copy the 28 inline chains performed; idempotent, and skipped for
# schema-less services (no client to mirror).
if [ -d "$CLIENT_DIR" ]; then
  mkdir -p dist/prisma
  rm -rf dist/prisma/client
  cp -R "$CLIENT_DIR" dist/prisma/client
  echo "[$SVC_NAME] build: client mirrored to dist/prisma/client"
fi

echo "[$SVC_NAME] build: OK"
