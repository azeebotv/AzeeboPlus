#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== web apiError.ts ==="
  cat apps/web/src/lib/apiError.ts
  echo
  echo "=== mobile apiClient.ts (error shape) ==="
  grep -nE "ApiError|errorResponse|error:|statusCode|message" apps/mobile/src/api/client.ts | head -n 40
  echo
  echo "=== packages/error-handling ==="
  cat packages/error-handling/src/index.ts
  echo
  echo "=== NestJS default exception filter usage ==="
  grep -rlE "HttpException|@Catch|ExceptionFilter" services apps/admin apps/creator-portal 2>/dev/null --include="*.ts" -l | head -n 20
  echo
  echo "=== validation pipe usage ==="
  grep -rlE "ValidationPipe|exceptionFactory" services apps/admin apps/creator-portal 2>/dev/null --include="*.ts" -l | head -n 20
  echo
  echo "=== RFC 7807 ProblemDetails usage ==="
  grep -rlE "ProblemDetails|application/problem" services apps/admin apps/creator-portal 2>/dev/null --include="*.ts" | head -n 10
} > audit-evidence/P2/errors/_diff.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P2/errors/_diff.txt) lines"