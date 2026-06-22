#!/bin/bash
# Audit web pages for `'use client'` / `'use server'` boundaries, metadata exports, route handlers.
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== route handler files ==="
  find apps/web/src/app -type f -name "route.ts" 2>/dev/null
  echo
  echo "=== pages WITHOUT 'use client' / 'use server' directive (top of file) ==="
  # pages that import hooks but lack the directive are a critical class of bug.
  find apps/web/src/app -type f -name "page.tsx" 2>/dev/null | while read f; do
    head -n 5 "$f" | grep -E "^['\"]use (client|server)['\"]" >/dev/null && continue
    # crude: any page that imports from react (hooks) but lacks the directive is suspect
    if grep -qE "from ['\"]react['\"]" "$f" 2>/dev/null && grep -qE "use(State|Effect|Ref|Memo|Callback|Context|Reducer)" "$f" 2>/dev/null; then
      echo "$f"
    fi
  done
  echo
  echo "=== pages WITH 'use client' directive ==="
  find apps/web/src/app -type f -name "page.tsx" 2>/dev/null | while read f; do
    head -n 5 "$f" | grep -E "^['\"]use client['\"]" >/dev/null && echo "$f"
  done
  echo
  echo "=== pages with `export const metadata` ==="
  find apps/web/src/app -type f -name "page.tsx" 2>/dev/null | while read f; do
    grep -l "export const metadata" "$f" 2>/dev/null
  done
  echo
  echo "=== middleware.ts ==="
  if [ -f apps/web/src/middleware.ts ]; then
    echo "EXISTS: apps/web/src/middleware.ts"
    wc -l apps/web/src/middleware.ts
  else
    echo "MISSING: apps/web/src/middleware.ts"
  fi
  echo
  echo "=== apiError + api client ==="
  for f in apps/web/src/lib/api.ts apps/web/src/lib/apiError.ts apps/web/src/hooks/useApi.ts apps/web/src/context/AuthContext.tsx apps/web/src/context/ThemeContext.tsx apps/web/src/context/WalletContext.tsx apps/web/src/providers/QueryProvider.tsx; do
    if [ -f "$f" ]; then
      printf "%-60s %5d lines\n" "$f" "$(wc -l < "$f")"
    else
      printf "%-60s MISSING\n" "$f"
    fi
  done
} > audit-evidence/P1/web/_use-client-and-meta.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/web/_use-client-and-meta.txt) lines"