#!/bin/bash
# Start live-event-service in development mode with hot reload

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Live Event Service in development mode..."

# Generate Prisma client if needed
if [ ! -d "generated" ]; then
  echo "Generating Prisma client..."
  npx prisma generate
fi

# Start with ts-node-dev for hot reloading
exec npx ts-node-dev --respawn --transpile-only -r tsconfig-paths/register src/main.ts
