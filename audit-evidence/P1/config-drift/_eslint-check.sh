#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== root ESLint configs ==="
  ls -la .eslintrc.json eslint.config.js .eslintrc.js 2>&1 | head -n 20
  echo
  echo "=== per-package ESLint configs ==="
  for pkg in apps/admin apps/creator-portal apps/mobile apps/web services/core/auth-service services/core/content-service services/gateway/api-gateway packages/api-client packages/shared-types; do
    for f in eslint.config.js eslint.config.mjs .eslintrc.json .eslintrc.js .eslintrc; do
      if [ -f "$pkg/$f" ]; then
        printf "%-60s exists (%s)\n" "$pkg/$f" "$(wc -l < "$pkg/$f") lines"
      fi
    done
  done
  echo
  echo "=== .prettierrc presence ==="
  for f in .prettierrc .prettierrc.json .prettierrc.js .prettierrc.cjs prettier.config.js apps/web/.prettierrc; do
    if [ -f "$f" ]; then printf "%-40s exists (%s lines)\n" "$f" "$(wc -l < "$f")"; fi
  done
} > audit-evidence/P1/config-drift/_eslint-check.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/config-drift/_eslint-check.txt) lines"