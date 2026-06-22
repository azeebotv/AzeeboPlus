#!/bin/bash
# Extract every NestJS controller across all services + their @Controller/@Get/@Post/...
# decorators into one JSON-per-service.
# Read-only; no installs required.
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== service directory listing ==="
  find services apps/admin apps/creator-portal -type f -name "*.controller.ts" \
    -not -path "*/node_modules/*" -not -path "*/generated/*" 2>/dev/null | sort
  echo
  echo "=== count of controller files ==="
  find services apps/admin apps/creator-portal -type f -name "*.controller.ts" \
    -not -path "*/node_modules/*" -not -path "*/generated/*" 2>/dev/null | wc -l | tr -d ' '
  echo
  echo "=== count of controllers per service ==="
  for svc in services/core/auth-service services/core/content-service services/core/media-service services/core/payment-service services/core/search-service services/core/user-service services/core/wallet-service services/gateway/api-gateway services/engagement/engagement-service services/engagement/messaging-service services/engagement/notification-service services/engagement/referral-service services/engagement/reward-service services/engagement/subscription-service services/intelligence/analytics-service services/intelligence/recommendation-service services/operations/moderation-service services/operations/queue-service services/operations/support-service services/universes/comedy-service services/universes/creator-service services/universes/games-service services/universes/lifestyle-service services/universes/movie-service services/universes/reality-service services/universes/sports-service services/universes/vertical-service apps/admin apps/creator-portal; do
    n=$(find "$svc" -type f -name "*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
    e=$(grep -rE "@(Get|Post|Put|Patch|Delete|Options|Head)\(" "$svc" --include="*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
    printf "%-50s controllers=%s endpoints=%s\n" "$svc" "$n" "$e"
  done
} > audit-evidence/P2/contract-index/_summary.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P2/contract-index/_summary.txt) lines"