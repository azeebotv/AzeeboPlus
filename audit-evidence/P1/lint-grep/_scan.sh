#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== ci scripts presence ==="
  ls -la ci/scripts 2>/dev/null
  echo
  echo "=== running scan-hardcoded-values.sh ==="
  if [ -x ci/scripts/scan-hardcoded-values.sh ]; then
    bash ci/scripts/scan-hardcoded-values.sh 2>&1 | head -n 100
  else
    echo "(script not executable or missing)"
    head -n 30 ci/scripts/scan-hardcoded-values.sh 2>/dev/null
  fi
  echo
  echo "=== running secret-verification.sh ==="
  if [ -x ci/scripts/secret-verification.sh ]; then
    bash ci/scripts/secret-verification.sh 2>&1 | head -n 100
  else
    echo "(script not executable or missing)"
    head -n 30 ci/scripts/secret-verification.sh 2>/dev/null
  fi
  echo
  echo "=== rg: 'as any' ==="
  rg -n "as any" --type ts --type tsx -g '!node_modules' -g '!audit-evidence' . 2>/dev/null | head -n 40
  echo
  echo "=== rg: '@ts-ignore' ==="
  rg -n "@ts-ignore" --type ts --type tsx -g '!node_modules' -g '!audit-evidence' . 2>/dev/null | head -n 40
  echo
  echo "=== rg: 'eslint-disable' ==="
  rg -n "eslint-disable" --type ts --type tsx -g '!node_modules' -g '!audit-evidence' . 2>/dev/null | head -n 40
  echo
  echo "=== rg: 'TODO|FIXME|XXX|HACK' (counts per file) ==="
  rg -c -o "(TODO|FIXME|XXX|HACK)" --type ts --type tsx -g '!node_modules' -g '!audit-evidence' . 2>/dev/null | sort -t: -k2 -nr | head -n 30
  echo
  echo "=== rg: 'console.log' (counts per file) ==="
  rg -c -o "console\.log" --type ts --type tsx -g '!node_modules' -g '!audit-evidence' . 2>/dev/null | sort -t: -k2 -nr | head -n 30
  echo
  echo "=== rg: hardcoded password= / secret= / API_KEY ==="
  rg -n "(password=|secret=|API_KEY|JWT_SECRET|PRIVATE KEY)" --type ts --type tsx -g '!node_modules' -g '!audit-evidence' . 2>/dev/null | head -n 40
  echo
  echo "=== rg: 'process.env.*SAMPLE' / 'process.env.SAMPLE' ==="
  rg -n "process\.env\.[A-Z_]+SAMPLE|process\.env\.SAMPLE" --type ts --type tsx -g '!node_modules' -g '!audit-evidence' . 2>/dev/null | head -n 20
} > audit-evidence/P1/lint-grep/_scan.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/lint-grep/_scan.txt) lines"