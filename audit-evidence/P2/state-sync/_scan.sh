#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== BigInt in schemas + code ==="
  grep -rE "BigInt|bigint|BIGINT|@db\\.BigInt" services apps packages --include="*.ts" --include="*.prisma" -l 2>/dev/null | head -n 30
  echo
  echo "=== Decimal in schemas + code ==="
  grep -rE "@db\\.Decimal|Decimal\\s*\\(\\s*\\d" services apps packages --include="*.ts" --include="*.prisma" -l 2>/dev/null | head -n 30
  echo
  echo "=== Decimal WITHOUT @db.Decimal (precision leak) ==="
  grep -rnE "^\\s+(balance|amount|price|total|fee|reward)\\s+Decimal" services apps --include="*.prisma" 2>/dev/null | head -n 30
  echo
  echo "=== JSON.stringify of object containing potentially-big numbers ==="
  grep -rnE "JSON\\.stringify" apps/web/src apps/mobile/src --include="*.ts" --include="*.tsx" 2>/dev/null | head -n 20
  echo
  echo "=== TanStack Query usage in web (useQuery/useMutation/invalidateQueries) ==="
  grep -rnE "useQuery|useMutation|invalidateQueries|optimisticUpdate" apps/web/src --include="*.ts" --include="*.tsx" 2>/dev/null | head -n 40
  echo
  echo "=== WalletContext (web + mobile) race surface ==="
  grep -nE "useState|useEffect|setBalance|setWallet|refresh" apps/web/src/context/WalletContext.tsx 2>/dev/null | head -n 30
  echo
  echo "=== Mutation without onError / rollback (web) ==="
  grep -rnE "mutationFn" apps/web/src --include="*.ts" --include="*.tsx" -A 5 2>/dev/null | head -n 40
} > audit-evidence/P2/state-sync/_scan.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P2/state-sync/_scan.txt) lines"