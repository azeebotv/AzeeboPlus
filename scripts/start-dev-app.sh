#!/usr/bin/env bash
# ============================================================
# Azeebo+ — shared dev runner for schema-owning frontend apps
# ============================================================
# Single source of truth for `pnpm start:dev` in apps/admin and
# apps/creator: hybrid Vite(+React)+NestJS workspaces that run
# their NestJS side via `tsx watch` (a different runtime model
# from the services, which use nest start --watch).
#
# What it does (in the app directory it is run from):
#   1. `prisma generate` — only on first run (schema present and
#      the client output dir src/generated/prisma absent). These
#      apps previously booted with NO generation at all; on a
#      fresh clone the first start:dev crashed on imports like
#      `import { PrismaClient } from '../generated/prisma'`.
#   2. exec's `tsx watch src/main.ts`; extra args pass through.
#
# Deliberate differences from the service runner
# (scripts/start-dev-service.sh):
#   - client output is src/generated/prisma (apps' own layout),
#     not src/prisma/client, and there is no dist mirror (tsx
#     imports the client by relative path; nothing is compiled
#     before boot)
#   - process is tsx, not nest
#
# Usage (pnpm run sets cwd to the app dir):
#   cd apps/admin && pnpm start:dev
# or directly:
#   bash ../../scripts/start-dev-app.sh [tsx args...]
# ============================================================
set -euo pipefail

APP_DIR="$(pwd -P)"
if [ ! -f "$APP_DIR/package.json" ]; then
  echo "start-dev-app.sh: no package.json in $(pwd -P) — run from an app directory (pnpm start:dev does this) or cd there first" >&2
  exit 2
fi

APP_NAME="$(basename "$APP_DIR")"
SCHEMA="prisma/schema.prisma"
CLIENT_DIR="src/generated/prisma"

# First-run generation. Output is captured and echoed on failure with a
# fix hint; a failure aborts BEFORE tsx starts — the app never boots
# against a missing client with a cryptic import error.
if [ -f "$SCHEMA" ] && [ ! -d "$CLIENT_DIR" ]; then
  echo "[$APP_NAME] Generating Prisma client (first run)..."
  if ! gen_output="$(pnpm exec prisma generate 2>&1)"; then
    printf '%s\n' "$gen_output" | sed 's/^/  | /'
    echo "[$APP_NAME] prisma generate FAILED — not starting." >&2
    echo "  Fix the schema/datasource error above, then either re-run 'pnpm start:dev' or generate manually: pnpm run prisma:generate" >&2
    exit 1
  fi
  printf '%s\n' "$gen_output" | grep -v '^$' | tail -1 | sed 's/^/  /' || true
fi

exec pnpm exec tsx watch src/main.ts "$@"
