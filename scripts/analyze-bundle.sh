#!/usr/bin/env bash
set -euo pipefail

echo "Analyzing bundle for @azeebo/web..."
ANALYZE=true pnpm --filter @azeebo/web build
echo "Done. Check apps/web/.next/analyze/ for the report."
