#!/bin/bash
# dependency-audit.sh — Audit dependencies for vulnerabilities and outdated packages
# Usage: bash scripts/dependency-audit.sh

set -e

echo "=== Azeebo+ Dependency Audit ==="
echo "Time: $(date)"
echo ""

# Check npm audit
echo "--- npm audit ---"
if command -v npm &> /dev/null; then
  cd apps/web && npm audit --json 2>/dev/null | head -50 || true
  cd ../..
else
  echo "npm not found"
fi

echo ""

# Check for outdated packages
echo "--- Outdated Packages ---"
if command -v pnpm &> /dev/null; then
  pnpm outdated 2>/dev/null | head -30 || true
else
  echo "pnpm not found"
fi

echo ""

# Check for known vulnerabilities in production dependencies
echo "--- Production Dependency Check ---"
for dir in apps/web apps/admin apps/creator; do
  if [ -f "$dir/package.json" ]; then
    echo "Checking $dir..."
    cd "$dir"
    npm audit --production 2>/dev/null | head -10 || true
    cd ../..
  fi
done

echo ""

# Check bundle size
echo "--- Bundle Size Analysis ---"
if [ -f "apps/web/.next/BUILD_ID" ]; then
  echo "Next.js build found"
  du -sh apps/web/.next/ 2>/dev/null || true
else
  echo "No Next.js build found"
fi

echo ""
echo "=== Audit Complete ==="
