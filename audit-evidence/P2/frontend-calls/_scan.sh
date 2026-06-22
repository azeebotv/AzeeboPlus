#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== mobile API modules (16) ==="
  ls -la apps/mobile/src/api/*.ts 2>/dev/null | grep -v ".spec.ts"
  echo
  echo "=== web api + contexts + hooks (line counts) ==="
  for f in apps/web/src/lib/api.ts apps/web/src/lib/apiError.ts apps/web/src/lib/admin-types.ts apps/web/src/hooks/useApi.ts apps/web/src/context/AuthContext.tsx apps/web/src/context/ThemeContext.tsx apps/web/src/context/WalletContext.tsx apps/web/src/providers/QueryProvider.tsx; do
    if [ -f "$f" ]; then printf "%-60s %5d lines\n" "$f" "$(wc -l < "$f")"; fi
  done
  echo
  echo "=== apps/admin NestJS controllers + service files ==="
  find apps/admin/src -type f \( -name "*.service.ts" -o -name "*.controller.ts" \) -not -path "*/generated/*" 2>/dev/null | sort
  echo
  echo "=== apps/creator-portal NestJS controllers + service files ==="
  find apps/creator-portal/src -type f \( -name "*.service.ts" -o -name "*.controller.ts" \) 2>/dev/null | sort
  echo
  echo "=== shared api-client + internal-clients ==="
  wc -l packages/api-client/src/index.ts packages/internal-clients/src/index.ts
} > audit-evidence/P2/frontend-calls/_summary.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P2/frontend-calls/_summary.txt) lines"