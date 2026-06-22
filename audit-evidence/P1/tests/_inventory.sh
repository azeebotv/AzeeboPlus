#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== test files per package (count) ==="
  printf "%-60s %s\n" "package" "test_files"
  for pkg in apps/admin apps/creator-portal apps/mobile apps/web services/core/auth-service services/core/content-service services/core/media-service services/core/payment-service services/core/search-service services/core/user-service services/core/wallet-service services/engagement/engagement-service services/engagement/messaging-service services/engagement/notification-service services/engagement/referral-service services/engagement/reward-service services/engagement/subscription-service services/gateway/api-gateway services/intelligence/analytics-service services/intelligence/recommendation-service services/operations/moderation-service services/operations/queue-service services/operations/support-service services/universes/comedy-service services/universes/creator-service services/universes/games-service services/universes/lifestyle-service services/universes/movie-service services/universes/reality-service services/universes/sports-service services/universes/vertical-service; do
    n=$(find "$pkg" -type f \( -name "*.spec.ts" -o -name "*.e2e-spec.ts" -o -name "*.test.ts" -o -name "*.e2e.ts" -o -name "*.spec.tsx" \) -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
    e=$(find "$pkg/e2e" -type f 2>/dev/null | wc -l | tr -d ' ')
    printf "%-60s spec=%s e2e=%s\n" "$pkg" "$n" "$e"
  done
  echo
  echo "=== shared package test files ==="
  printf "%-60s %s\n" "package" "test_files"
  for pkg in packages/analytics-sdk packages/api-client packages/auth packages/design-tokens packages/error-handling packages/feature-flags packages/internal-clients packages/logger packages/observability packages/opentelemetry packages/security packages/shared-services packages/shared-types packages/test-utils packages/ui packages/utils packages/validation; do
    n=$(find "$pkg" -type f \( -name "*.spec.ts" -o -name "*.test.ts" \) -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
    printf "%-60s spec=%s\n" "$pkg" "$n"
  done
  echo
  echo "=== jest config presence ==="
  for f in $(find . -maxdepth 4 -name "jest.config.js" -not -path "*/node_modules/*" -not -path "./audit-evidence/*" 2>/dev/null); do
    printf "%s\n" "$f"
  done
  echo
  echo "=== coverage thresholds ==="
  grep -rE "coverageThreshold|coverage:" --include="jest.config.js" --include="jest.config.ts" --include="package.json" -l . 2>/dev/null | grep -v node_modules | grep -v audit-evidence | head -n 30
  echo
  echo "=== mutation testing (stryker) presence ==="
  find . -name "stryker.config*" -not -path "*/node_modules/*" 2>/dev/null
} > audit-evidence/P1/tests/_coverage-matrix.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/tests/_coverage-matrix.txt) lines"