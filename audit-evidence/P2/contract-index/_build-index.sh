#!/bin/bash
# Build a consolidated contract index JSON from the controller dumps.
# Format: per-service array of {method,path,guards,line}.
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "{"
  echo '  "contract_index_version": "1.0",'
  echo "  \"captured_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
  echo "  \"commit\": \"fc01c8c (dirty tree)\","
  echo '  "services": {'
  first=1
  for svc in services/core/auth-service services/core/content-service services/core/media-service services/core/payment-service services/core/search-service services/core/user-service services/core/wallet-service services/gateway/api-gateway services/engagement/engagement-service services/engagement/messaging-service services/engagement/notification-service services/engagement/referral-service services/engagement/reward-service services/engagement/subscription-service services/intelligence/analytics-service services/intelligence/recommendation-service services/operations/moderation-service services/operations/queue-service services/operations/support-service services/universes/comedy-service services/universes/creator-service services/universes/games-service services/universes/lifestyle-service services/universes/movie-service services/universes/reality-service services/universes/sports-service services/universes/vertical-service apps/admin apps/creator-portal; do
    if [ "$first" -eq 0 ]; then echo ","; fi
    first=0
    # safe key
    key=$(echo "$svc" | tr '/' '_')
    echo -n "    \"$key\": ["
    firstc=1
    find "$svc" -type f -name "*.controller.ts" -not -path "*/generated/*" 2>/dev/null | sort | while read f; do
      # extract @Controller path
      ctrl_path=$(grep -oE "@Controller\(['\"][^'\"]+['\"]\)" "$f" 2>/dev/null | head -n 1 | sed -E "s/@Controller\(['\"]([^'\"]+)['\"]\)/\1/")
      [ -z "$ctrl_path" ] && ctrl_path=""
      # extract each method+path line
      grep -nE "@(Get|Post|Put|Patch|Delete|Options|Head)\(" "$f" 2>/dev/null | while read line; do
        lnum=$(echo "$line" | cut -d: -f1)
        rest=$(echo "$line" | cut -d: -f2-)
        method=$(echo "$rest" | grep -oE "@(Get|Post|Put|Patch|Delete|Options|Head)" | head -n 1 | tr -d '@')
        sub_path=$(echo "$rest" | grep -oE "['\"][^'\"]+['\"]" | head -n 1 | tr -d "'\"")
        [ -z "$sub_path" ] && sub_path=""
        # next lines: guard?
        guards=$(sed -n "$((lnum+1)),$((lnum+5))p" "$f" | grep -oE "@UseGuards\([^)]+\)" | tr '\n' ';' | sed 's/;$//')
        [ -z "$guards" ] && guards="(none)"
        echo
        echo -n "      {\"file\":\"$f\",\"ctrl\":\"$ctrl_path\",\"method\":\"$method\",\"path\":\"$sub_path\",\"guards\":\"$guards\"},"
      done
    done
    # close the array — but this is wrong; bash substitution inside for-loop is tricky
    # use simpler approach: emit raw lines, post-process with python/awk
    echo
    echo -n "    ]"
  done | python3 -c "
import sys, re, json
text = sys.stdin.read()
# crude: split by '    \"key\": [' then re-group
print(text)
"
  echo ""
  echo "  }"
  echo "}"
} > audit-evidence/P2/contract-index/_raw.json 2>&1
echo "wrote raw json"
echo "but python approach fragile; fallback: write a flat text instead"