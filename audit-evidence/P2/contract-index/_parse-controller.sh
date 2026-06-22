#!/bin/bash
# For each controller file: extract @Controller decorator + every @Get/@Post/.../method
# with their path, guard decorators, and any adjacent comment.
# Output: one .txt per controller (read-only, no parsing beyond regex).
mkdir -p audit-evidence/P2/contract-index/controllers-by-service
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  find services apps/admin apps/creator-portal -type f -name "*.controller.ts" \
    -not -path "*/node_modules/*" -not -path "*/generated/*" 2>/dev/null | sort | while read f; do
    svc=$(echo "$f" | sed -E 's#^([^/]+/[^/]+)/.*#\1#')
    bn=$(basename "$f" .controller.ts)
    out="audit-evidence/P2/contract-index/controllers-by-service/${bn}.txt"
    echo "===== $f =====" > "$out"
    # Strip block comments to make regex cleaner
    grep -nE "@(Controller|Get|Post|Put|Patch|Delete|Options|Head)\(|@UseGuards|@Public|@skipAuth|@Throttle" "$f" >> "$out" 2>/dev/null
    echo "" >> "$out"
  done
  echo "wrote $(find audit-evidence/P2/contract-index/controllers-by-service -type f | wc -l | tr -d ' ') controller dumps"
} 2>&1
echo "done"