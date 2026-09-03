#!/bin/bash
# storybook-visual-test.sh — Run visual regression tests against Storybook
# Usage: bash scripts/storybook-visual-test.sh [--update]

set -e

STORYBOOK_PORT=6006
STORYBOOK_URL="http://localhost:${STORYBOOK_PORT}"
SNAPSHOTS_DIR="__snapshots__"
DIFFS_DIR="__diffs__"

echo "=== Storybook Visual Regression Testing ==="
echo ""

# Check if Storybook is already running
if ! lsof -ti :${STORYBOOK_PORT} >/dev/null 2>&1; then
  echo "Starting Storybook on port ${STORYBOOK_PORT}..."
  pnpm storybook --ci &
  STORYBOOK_PID=$!

  # Wait for Storybook to be ready
  echo "Waiting for Storybook to start..."
  for i in $(seq 1 60); do
    if curl -s "${STORYBOOK_URL}" >/dev/null 2>&1; then
      echo "Storybook is ready!"
      break
    fi
    if [ $i -eq 60 ]; then
      echo "ERROR: Storybook failed to start within 60 seconds"
      kill $STORYBOOK_PID 2>/dev/null
      exit 1
    fi
    sleep 1
  done
else
  echo "Storybook already running on port ${STORYBOOK_PORT}"
  STORYBOOK_PID=""
fi

# Install test runner if needed
if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: npx not found"
  exit 1
fi

# Run visual regression tests
echo ""
echo "Running visual regression tests..."
echo "  Storybook: ${STORYBOOK_URL}"
echo "  Snapshots: ${SNAPSHOTS_DIR}"
echo ""

if [ "$1" = "--update" ]; then
  echo "Updating baseline snapshots..."
  npx test-storybook --url "${STORYBOOK_URL}" --update-snapshots
else
  echo "Running visual comparison..."
  npx test-storybook --url "${STORYBOOK_URL}"
fi

TEST_EXIT=$?

# Cleanup
if [ -n "$STORYBOOK_PID" ]; then
  echo ""
  echo "Stopping Storybook..."
  kill $STORYBOOK_PID 2>/dev/null
fi

# Report
echo ""
echo "=== Results ==="
if [ -d "${DIFFS_DIR}" ] && [ "$(ls -A ${DIFFS_DIR} 2>/dev/null)" ]; then
  echo "Visual differences found in ${DIFFS_DIR}"
  echo "Review diffs and run with --update to accept new baselines"
  exit 1
else
  echo "All visual tests passed!"
  exit 0
fi
