#!/bin/bash
# Fix all Prisma schemas to use local output paths
# Each service gets its own src/prisma/client to avoid pnpm store conflicts

cd /Users/deprof/www/azeebo+

find services -name "schema.prisma" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | while read f; do
  name=$(echo "$f" | sed 's|services/||; s|/prisma/schema.prisma||')
  
  # Skip if already has custom output
  if grep -q 'output.*=.*src/prisma/client' "$f" 2>/dev/null; then
    echo "SKIP: $name"
    continue
  fi
  
  # Add output line to generator client block
  sed -i '' '/^generator client {/,/^}/ {
    /provider = "prisma-client-js"/a\
\  output   = "../src/prisma/client"
  }' "$f"
  
  # Clean old client
  svc_dir=$(dirname "$f")
  rm -rf "$svc_dir/src/prisma/client" 2>/dev/null
  
  # Regenerate
  cd "$svc_dir"
  npx prisma generate 2>&1 | grep -oE "Generated Prisma Client.*to [^ ]+" | head -1
  cd /Users/deprof/www/azeebo+
  
  echo "FIXED: $name"
done

echo ""
echo "All done."
