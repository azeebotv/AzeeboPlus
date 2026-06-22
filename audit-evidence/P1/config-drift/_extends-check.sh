#!/bin/bash
# Which packages extend root tsconfig vs duplicate it?
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== extends check (does the per-package tsconfig extend the root?) ==="
  for pkg in apps/admin apps/creator-portal apps/mobile apps/web services/core/auth-service services/core/content-service services/core/media-service services/core/payment-service services/core/search-service services/core/user-service services/core/wallet-service services/gateway/api-gateway packages/analytics-sdk packages/api-client packages/auth packages/design-tokens packages/error-handling packages/feature-flags packages/internal-clients packages/logger packages/observability packages/security packages/shared-services packages/shared-types packages/test-utils packages/ui packages/utils packages/validation; do
    if [ -f "$pkg/tsconfig.json" ]; then
      ext=$(node -e "try{const t=require('./$pkg/tsconfig.json');console.log(t.extends||'(no extends)')}catch(e){console.log('parse-err:'+e.message)}" 2>/dev/null)
      printf "%-50s %s\n" "$pkg/tsconfig.json" "$ext"
    fi
  done
  echo
  echo "=== which configs set strict / noImplicitAny independently (drift risk) ==="
  for pkg in apps/admin apps/creator-portal apps/mobile apps/web services/core/auth-service services/gateway/api-gateway packages/api-client packages/shared-types; do
    if [ -f "$pkg/tsconfig.json" ]; then
      printf "%-50s " "$pkg/tsconfig.json"
      node -e "try{const t=require('./$pkg/tsconfig.json');const o=t.compilerOptions||{};console.log(JSON.stringify({strict:o.strict,noImplicitAny:o.noImplicitAny,exactOptionalPropertyTypes:o.exactOptionalPropertyTypes,noUncheckedIndexedAccess:o.noUncheckedIndexedAccess}))}catch(e){console.log('parse-err:'+e.message)}" 2>/dev/null
    fi
  done
  echo
  echo "=== engines.node across all package.json ==="
  for pkg in apps/admin apps/creator-portal apps/mobile apps/web services/core/auth-service services/gateway/api-gateway; do
    if [ -f "$pkg/package.json" ]; then
      printf "%-50s " "$pkg/package.json"
      node -e "try{const p=require('./$pkg/package.json');console.log(JSON.stringify(p.engines||{}))}catch(e){console.log('parse-err:'+e.message)}" 2>/dev/null
    fi
  done
  echo
  echo "=== packageManager / node version declarations ==="
  for f in .nvmrc .node-version package.json pnpm-workspace.yaml; do
    printf "%-30s : " "$f"
    if [ -f "$f" ]; then
      if [ "$f" = "package.json" ]; then
        node -e "const p=require('./package.json');console.log(JSON.stringify({packageManager:p.packageManager||null,engines:p.engines||null}))" 2>/dev/null
      else
        cat "$f" 2>/dev/null
      fi
    else
      echo "(missing)"
    fi
  done
} > audit-evidence/P1/config-drift/_extends-analysis.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/config-drift/_extends-analysis.txt) lines"