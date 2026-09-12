#!/usr/bin/env bash
# ============================================================
# Azeebo+ — shared build runner for packages/* workspaces
# ============================================================
# Single source of truth for `pnpm run build` in every package.
# Replaces four textual variants of the same command (bare tsc vs
# `tsc -p tsconfig.json` — equivalent, since tsc with no input files
# reads ./tsconfig.json).
#
# What it does (in the package directory it is run from):
#   1. `tsc -p tsconfig.json` — compile only.
#
# Deliberately NO prisma generate and NO dist mirroring: package
# builds never generated (the repo-wide generation lives in
# scripts/generate-prisma-clients.sh, run by CI's prisma:generate
# and the Docker build's T-1 step), and clients live where the
# package's schema emits them.
#
# Usage (pnpm run sets cwd to the package dir):
#   cd packages/utils && pnpm run build
# or directly:
#   bash ../../scripts/build-package.sh
# ============================================================
set -euo pipefail

PKG_DIR="$(pwd -P)"
if [ ! -f "$PKG_DIR/package.json" ]; then
  echo "build-package.sh: no package.json in $(pwd -P) — run from a package directory (pnpm run build does this) or cd there first" >&2
  exit 2
fi

PKG_NAME="$(basename "$PKG_DIR")"

# Incremental tsc keeps its build-info NEXT to tsconfig.json (not in dist/),
# so `pnpm run clean` (rm -rf dist) leaves it behind — and the next build then
# trusts that the deleted outputs still exist and silently emits NOTHING
# (dependents then fail with TS2307 on a package whose dist is gone). The
# packages are small enough that a full compile costs seconds; correctness
# beats the caching.
rm -f "$PKG_DIR/tsconfig.tsbuildinfo"

echo "[$PKG_NAME] build: tsc -p tsconfig.json..."
if ! tsc_output="$(pnpm exec tsc -p tsconfig.json 2>&1)"; then
  printf '%s\n' "$tsc_output" | sed 's/^/  | /'
  echo "[$PKG_NAME] tsc FAILED — build aborted." >&2
  exit 1
fi
# Surface type errors even when tsc exits 0 (shouldn't happen, but a
# swallowed error is worse than a duplicated line).
if [ -n "$tsc_output" ]; then
  printf '%s\n' "$tsc_output" | sed 's/^/  | /'
fi

echo "[$PKG_NAME] build: OK"
