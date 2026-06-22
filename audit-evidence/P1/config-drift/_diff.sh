#!/bin/bash
# Compare each per-package tsconfig against the workspace root tsconfig.
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  for pkg in apps/admin apps/creator-portal apps/mobile apps/web services/core/auth-service services/core/content-service services/core/media-service services/core/payment-service services/core/search-service services/core/user-service services/core/wallet-service services/gateway/api-gateway; do
    if [ ! -f "$pkg/tsconfig.json" ]; then continue; fi
    echo "############### $pkg/tsconfig.json vs root tsconfig.json ###############"
    diff -u tsconfig.json "$pkg/tsconfig.json" 2>&1 | head -n 80
    echo
  done
} > audit-evidence/P1/config-drift/tsconfig-diff.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/config-drift/tsconfig-diff.txt) lines"