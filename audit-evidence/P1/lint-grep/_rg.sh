#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== rg: 'as any' (no type filter, .ts/.tsx/.js/.jsx, excl. specs) ==="
  rg -n "as any" -g '*.ts' -g '*.tsx' -g '*.js' -g '*.jsx' -g '!node_modules' -g '!audit-evidence' -g '!**/*.spec.ts' -g '!**/*.spec.tsx' . 2>/dev/null | head -n 30
  echo
  echo "=== rg: '@ts-ignore' ==="
  rg -n "@ts-ignore" -g '*.ts' -g '*.tsx' -g '!node_modules' -g '!audit-evidence' . 2>/dev/null | head -n 30
  echo
  echo "=== rg: 'eslint-disable' ==="
  rg -n "eslint-disable" -g '*.ts' -g '*.tsx' -g '!node_modules' -g '!audit-evidence' . 2>/dev/null | head -n 30
  echo
  echo "=== rg: 'TODO|FIXME|XXX|HACK' (count per file) ==="
  rg -c -o "(TODO|FIXME|XXX|HACK)" -g '*.ts' -g '*.tsx' -g '!node_modules' -g '!audit-evidence' . 2>/dev/null | sort -t: -k2 -nr | head -n 30
  echo
  echo "=== rg: 'console.log' (count per file, excl. specs/scripts) ==="
  rg -c -o "console\.log" -g '*.ts' -g '*.tsx' -g '!node_modules' -g '!audit-evidence' -g '!scripts/**' . 2>/dev/null | sort -t: -k2 -nr | head -n 30
  echo
  echo "=== .env file ==="
  if [ -f .env ]; then
    echo "EXISTS: .env"
    head -n 50 .env
  else
    echo "no .env at root"
  fi
  echo
  echo "=== .env in .gitignore? ==="
  grep -E "^\.env|^\*\.env" .gitignore 2>/dev/null || echo "(not in .gitignore)"
  echo
  echo "=== rg: hardcoded 'process.env.NEXT_PUBLIC.* || http://localhost' ==="
  rg -n "process\.env\.[A-Z_]+ \|\| ['\"]http://localhost" -g '*.ts' -g '*.tsx' -g '!node_modules' -g '!audit-evidence' . 2>/dev/null | head -n 30
} > audit-evidence/P1/lint-grep/_scan-rg.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/lint-grep/_scan-rg.txt) lines"