#!/bin/bash
cd "$(dirname "$0")"
if [ -f prisma/schema.prisma ] && [ ! -d src/prisma/client ]; then
  echo "Generating Prisma client..."
  pnpm exec prisma generate > /dev/null 2>&1
fi
if [ -d src/prisma/client ]; then
  mkdir -p dist/prisma/client 2>/dev/null
  cp -r src/prisma/client/* dist/prisma/client/ 2>/dev/null
fi
exec pnpm exec nest start --watch
