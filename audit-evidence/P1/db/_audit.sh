#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== schema.prisma files (56 total) ==="
  find . -type f -name "schema.prisma" -not -path "*/node_modules/*" -not -path "./audit-evidence/*" 2>/dev/null
  echo
  echo "=== prisma/migrations directories ==="
  find . -type d -name "migrations" -not -path "*/node_modules/*" -not -path "./audit-evidence/*" 2>/dev/null
  echo
  echo "=== BigInt / Decimal / Json fields across all schemas (sample first schema) ==="
  if [ -f services/core/wallet-service/prisma/schema.prisma ]; then
    echo "--- wallet-service schema.prisma (head) ---"
    head -n 80 services/core/wallet-service/prisma/schema.prisma
  fi
  echo
  echo "=== search-service schema.prisma ==="
  if [ -f services/core/search-service/prisma/schema.prisma ]; then
    head -n 80 services/core/search-service/prisma/schema.prisma
  fi
  echo
  echo "=== seed files ==="
  ls -la prisma/seed 2>/dev/null
  echo
  echo "=== migrations SQL (count) ==="
  find . -type f -path "*/migrations/*" -name "*.sql" -not -path "*/node_modules/*" -not -path "./audit-evidence/*" 2>/dev/null | wc -l
} > audit-evidence/P1/db/_prisma-inventory.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/db/_prisma-inventory.txt) lines"