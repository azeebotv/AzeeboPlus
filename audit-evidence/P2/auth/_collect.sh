#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== web AuthContext (head) ==="
  head -n 100 apps/web/src/context/AuthContext.tsx
  echo
  echo "=== mobile AuthContext (head) ==="
  head -n 100 apps/mobile/src/contexts/AuthContext.tsx
  echo
  echo "=== packages/auth ==="
  wc -l packages/auth/src/index.ts packages/auth/src/*.ts 2>/dev/null
  echo
  echo "=== auth-service controllers + DTOs ==="
  find services/core/auth-service/src -type f \( -name "*.controller.ts" -o -name "*.dto.ts" -o -name "*.service.ts" -o -name "*strategy*" -o -name "*guard*" \) 2>/dev/null | sort
  echo
  echo "=== refresh / token / jwt across services ==="
  grep -rlE "refreshToken|jwt-refresh|@nestjs/jwt" services/core/auth-service services/core/user-service packages/auth packages/api-client apps/web/src apps/mobile/src 2>/dev/null | head -n 30
  echo
  echo "=== OAuth / social providers ==="
  grep -rlE "googleAuth|facebookAuth|appleAuth|oauth|pkce" services/core/auth-service packages/auth apps/web/src apps/mobile/src 2>/dev/null | head -n 20
} > audit-evidence/P2/auth/_trace.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P2/auth/_trace.txt) lines"