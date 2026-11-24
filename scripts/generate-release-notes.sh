#!/bin/bash
# generate-release-notes.sh — Generate release notes from commits
# Usage: bash scripts/generate-release-notes.sh v1.0.0

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 v1.0.0"
  exit 1
fi

OUTPUT="release-notes-${VERSION}.md"
PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

echo "# Release Notes — $VERSION" > "$OUTPUT"
echo "" >> "$OUTPUT"
echo "**Release Date:** $(date +%Y-%m-%d)" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Summary
echo "## Summary" >> "$OUTPUT"
echo "" >> "$OUTPUT"
TOTAL_COMMITS=$(git log "${PREV_TAG}..HEAD" --oneline 2>/dev/null | wc -l | tr -d ' ')
echo "This release includes **${TOTAL_COMMITS} commits** with the following changes:" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Features
echo "## New Features" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "${PREV_TAG}..HEAD" --pretty=format:"- %s" --grep="^feat" 2>/dev/null >> "$OUTPUT" || echo "- None" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Bug Fixes
echo "## Bug Fixes" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "${PREV_TAG}..HEAD" --pretty=format:"- %s" --grep="^fix" 2>/dev/null >> "$OUTPUT" || echo "- None" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Performance
echo "## Performance Improvements" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "${PREV_TAG}..HEAD" --pretty=format:"- %s" --grep="^perf" 2>/dev/null >> "$OUTPUT" || echo "- None" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Breaking Changes
BREAKING=$(git log "${PREV_TAG}..HEAD" --pretty=format:"- %s" --grep="BREAKING CHANGE" 2>/dev/null)
if [ -n "$BREAKING" ]; then
  echo "## Breaking Changes" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  echo "$BREAKING" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  echo "> **Note:** This release contains breaking changes. Please review the migration guide." >> "$OUTPUT"
  echo "" >> "$OUTPUT"
fi

# Contributors
echo "## Contributors" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "${PREV_TAG}..HEAD" --pretty=format:"- @%an" --no-merges 2>/dev/null | sort -u >> "$OUTPUT" || echo "- @vmnl" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Installation
echo "## Installation" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo '```bash' >> "$OUTPUT"
echo "# Pull latest changes" >> "$OUTPUT"
echo "git pull origin main" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "# Install dependencies" >> "$OUTPUT"
echo "pnpm install" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "# Run database migrations" >> "$OUTPUT"
echo "pnpm prisma migrate deploy" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "# Start services" >> "$OUTPUT"
echo "bash start-all.sh" >> "$OUTPUT"
echo '```' >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Upgrade Notes
echo "## Upgrade Notes" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "1. Update environment variables if any new ones were added" >> "$OUTPUT"
echo "2. Run database migrations" >> "$OUTPUT"
echo "3. Clear Redis cache if caching strategy changed" >> "$OUTPUT"
echo "4. Restart all services" >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "---" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "Full changelog: [CHANGELOG.md](CHANGELOG.md)" >> "$OUTPUT"
echo "Documentation: [docs/](docs/)" >> "$OUTPUT"

echo "=== Generated $OUTPUT ==="
