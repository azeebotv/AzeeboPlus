#!/usr/bin/env bash
# ============================================================
# Azeebo+ — git hook auto-install (runs via the `prepare` script)
# ============================================================
# Points core.hooksPath at scripts/hooks so the pre-commit hook
# (the stale-prisma-client guard) is active on every clone that
# runs `pnpm install`. Safety rules:
#   - never fails the install — every error path is a warning, exit 0
#   - no-op outside a git repo (Docker builds, exported tarballs)
#   - never clobbers a developer's existing core.hooksPath
#   - idempotent: already-installed clones produce no output
# Opt out at any time: git config --unset core.hooksPath
# ============================================================
set -uo pipefail

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  # Not a git checkout: Docker build context, npm tarball, artifact dir.
  exit 0
fi

current="$(git config --get core.hooksPath 2>/dev/null || true)"
if [ -n "$current" ] && [ "$current" != "scripts/hooks" ]; then
  echo "install-git-hooks: core.hooksPath is already '$current' — leaving it untouched"
  exit 0
fi
if [ "$current" = "scripts/hooks" ]; then
  exit 0
fi

if git config core.hooksPath scripts/hooks; then
  echo "install-git-hooks: pre-commit hook active (core.hooksPath=scripts/hooks)"
else
  echo "install-git-hooks: WARNING — could not set core.hooksPath; install manually with: git config core.hooksPath scripts/hooks" >&2
fi
exit 0
