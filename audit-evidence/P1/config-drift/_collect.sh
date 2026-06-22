#!/bin/bash
# Collect root + per-package config snapshots for diff.
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  for f in package.json tsconfig.json tsconfig.build.json eslint.config.js .eslintrc.json .prettierrc .npmrc .nvmrc .pnpmrc next.config.js next.config.mjs tailwind.config.js postcss.config.js playwright.config.js playwright.config.ts detox.setup.ts app.json eas.json jest.config.js docker-compose.yml docker-compose.services.yml docker-compose.test.yml docs-sync.config.json; do
    if [ -f "$f" ]; then
      echo "===== ROOT: $f ====="
      cat "$f"
      echo
    fi
  done
  echo "=== pnpm-workspace.yaml ==="
  cat pnpm-workspace.yaml
  echo
  for pkg in apps/admin apps/creator-portal apps/mobile apps/web services/core/auth-service services/core/content-service services/core/media-service services/core/payment-service services/core/search-service services/core/user-service services/core/wallet-service services/gateway/api-gateway; do
    echo "===== PKG: $pkg/package.json ====="
    if [ -f "$pkg/package.json" ]; then cat "$pkg/package.json"; fi
    echo
    echo "----- PKG: $pkg/tsconfig.json -----"
    if [ -f "$pkg/tsconfig.json" ]; then cat "$pkg/tsconfig.json"; fi
    echo
    echo "----- PKG: $pkg/tsconfig.build.json -----"
    if [ -f "$pkg/tsconfig.build.json" ]; then cat "$pkg/tsconfig.build.json"; fi
    echo
    echo "----- PKG: $pkg/jest.config.js -----"
    if [ -f "$pkg/jest.config.js" ]; then cat "$pkg/jest.config.js"; fi
    echo
  done
} > audit-evidence/P1/config-drift/_all-configs.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/config-drift/_all-configs.txt) lines"