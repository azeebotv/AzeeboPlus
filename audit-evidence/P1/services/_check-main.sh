#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== service directories discovered ==="
  find services -maxdepth 3 -type d \( -name "src" -o -name "test" -o -name "__tests__" \) 2>/dev/null | sort
  echo
  echo "=== main.ts files ==="
  find services -type f -name "main.ts" 2>/dev/null
  echo
  echo "=== app.module.ts files ==="
  find services apps/admin apps/creator-portal -type f -name "app.module.ts" 2>/dev/null
  echo
  echo "=== per-service: ValidationPipe presence ==="
  for f in $(find services apps/admin apps/creator-portal -type f -name "main.ts" 2>/dev/null); do
    printf "%-70s " "$f"
    grep -E "ValidationPipe|useGlobalPipes" "$f" >/dev/null 2>&1 && echo "ValidationPipe: present" || echo "ValidationPipe: MISSING"
  done
  echo
  echo "=== per-service: helmet presence ==="
  for f in $(find services apps/admin apps/creator-portal -type f -name "main.ts" 2>/dev/null); do
    printf "%-70s " "$f"
    grep -E "helmet|app.use\(helmet" "$f" >/dev/null 2>&1 && echo "helmet: present" || echo "helmet: ABSENT (not configured in main.ts; may be in app.module via middleware)"
  done
  echo
  echo "=== per-service: global guards (APP_GUARD) ==="
  for f in $(find services apps/admin apps/creator-portal -type f -name "app.module.ts" 2>/dev/null); do
    printf "%-70s " "$f"
    if grep -E "APP_GUARD|APP_INTERCEPTOR|APP_FILTER|APP_PIPE" "$f" >/dev/null 2>&1; then
      grep -E "APP_GUARD|APP_INTERCEPTOR|APP_FILTER|APP_PIPE" "$f" | head -n 5
    else
      echo "(no APP_GUARD/INTERCEPTOR/FILTER/PIPE)"
    fi
  done
  echo
  echo "=== per-service: controller count + endpoint count ==="
  for svc_dir in services/core/auth-service services/core/content-service services/core/media-service services/core/payment-service services/core/search-service services/core/user-service services/core/wallet-service services/gateway/api-gateway services/universes/games-service services/universes/movie-service; do
    if [ -d "$svc_dir/src" ]; then
      c=$(find "$svc_dir/src" -type f -name "*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
      e=$(grep -rE "@(Get|Post|Put|Patch|Delete|Options|Head)\(" "$svc_dir/src" --include="*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
      printf "%-60s controllers=%s endpoints=%s\n" "$svc_dir" "$c" "$e"
    fi
  done
  echo
  echo "=== controllers WITHOUT @UseGuards anywhere in file ==="
  for f in $(find services apps/admin apps/creator-portal -type f -name "*.controller.ts" 2>/dev/null); do
    if ! grep -qE "@UseGuards|@Public|@skipAuth" "$f" 2>/dev/null; then
      printf "%s\n" "$f"
    fi
  done
} > audit-evidence/P1/services/_main-and-modules.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/services/_main-and-modules.txt) lines"