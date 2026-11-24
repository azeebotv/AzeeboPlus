#!/usr/bin/env bash
# ============================================================
# Create GitHub Release for v1.0.0
# ============================================================
# Requires: gh CLI (brew install gh) and gh auth login
#
# Usage: ./scripts/create-release.sh
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v gh &>/dev/null; then
  echo "ERROR: gh CLI not found. Install with: brew install gh"
  echo "Then authenticate: gh auth login"
  exit 1
fi

if ! gh auth status &>/dev/null 2>&1; then
  echo "ERROR: Not authenticated. Run: gh auth login"
  exit 1
fi

echo "Creating GitHub release v1.0.0..."

gh release create v1.0.0 \
  --title "v1.0.0 — Azeebo+ Entertainment Platform" \
  --notes-file /tmp/v1.0.0-release-notes.md \
  --draft=false \
  --prerelease=false \
  azeebotv/AzeeboPlus

echo ""
echo "Release created! View at:"
echo "https://github.com/azeebotv/AzeeboPlus/releases/tag/v1.0.0"
