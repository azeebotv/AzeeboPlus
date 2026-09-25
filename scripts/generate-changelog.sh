#!/bin/bash
# generate-changelog.sh — Auto-generate CHANGELOG.md from git commits
# Usage: bash scripts/generate-changelog.sh

set -e

OUTPUT="CHANGELOG.md"
REPO_URL="https://github.com/vmnl/azeebo+"

echo "# Changelog" > "$OUTPUT"
echo "" >> "$OUTPUT"
echo "All notable changes to this project will be documented in this file." >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)," >> "$OUTPUT"
echo "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)." >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Get the latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -z "$LATEST_TAG" ]; then
  echo "No tags found. Generating changelog for all commits."
  RANGE="HEAD"
else
  echo "Generating changelog since $LATEST_TAG"
  RANGE="${LATEST_TAG}..HEAD"
fi

# Get current date
CURRENT_DATE=$(date +%Y-%m-%d)

echo "## [Unreleased] - $CURRENT_DATE" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Group commits by type
echo "### Features" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "$RANGE" --pretty=format:"- %s (%h)" --grep="^feat" 2>/dev/null >> "$OUTPUT" || echo "- No new features" >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "### Bug Fixes" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "$RANGE" --pretty=format:"- %s (%h)" --grep="^fix" 2>/dev/null >> "$OUTPUT" || echo "- No bug fixes" >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "### Documentation" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "$RANGE" --pretty=format:"- %s (%h)" --grep="^docs" 2>/dev/null >> "$OUTPUT" || echo "- No documentation changes" >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "### Refactoring" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "$RANGE" --pretty=format:"- %s (%h)" --grep="^refactor" 2>/dev/null >> "$OUTPUT" || echo "- No refactoring" >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "### Testing" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "$RANGE" --pretty=format:"- %s (%h)" --grep="^test" 2>/dev/null >> "$OUTPUT" || echo "- No test changes" >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "### Performance" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "$RANGE" --pretty=format:"- %s (%h)" --grep="^perf" 2>/dev/null >> "$OUTPUT" || echo "- No performance improvements" >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "### Chores" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "$RANGE" --pretty=format:"- %s (%h)" --grep="^chore" 2>/dev/null >> "$OUTPUT" || echo "- No chores" >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "### CI/CD" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "$RANGE" --pretty=format:"- %s (%h)" --grep="^ci" 2>/dev/null >> "$OUTPUT" || echo "- No CI/CD changes" >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "### Breaking Changes" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log "$RANGE" --pretty=format:"- %s (%h)" --grep="BREAKING CHANGE" 2>/dev/null >> "$OUTPUT" || echo "- No breaking changes" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Add link to compare
if [ -n "$LATEST_TAG" ]; then
  echo "---" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  echo "## Previous Releases" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  echo "For older releases, see [GitHub Releases]($REPO_URL/releases)." >> "$OUTPUT"
fi

echo "" >> "$OUTPUT"
echo "Generated on $(date)" >> "$OUTPUT"

echo "=== Generated $OUTPUT ==="
echo "Changes included:"
git log "$RANGE" --oneline 2>/dev/null | wc -l | tr -d ' '
echo "commits"
