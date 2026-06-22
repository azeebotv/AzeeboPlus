#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== root-level docs ==="
  ls -la CLAUDE.md CONTRIBUTING.md README.md TASKS.md issues.md 2>/dev/null
  echo
  echo "=== EXPO_ENVIRONMENT.md + INFRA_ISSUES_AND_FIXES.md ==="
  ls -la apps/mobile/EXPO_ENVIRONMENT.md infra/INFRA_ISSUES_AND_FIXES.md 2>/dev/null
  echo
  echo "=== file sizes ==="
  for f in CLAUDE.md CONTRIBUTING.md README.md TASKS.md issues.md apps/mobile/EXPO_ENVIRONMENT.md infra/INFRA_ISSUES_AND_FIXES.md; do
    if [ -f "$f" ]; then printf "%-50s %d lines\n" "$f" "$(wc -l < "$f")"; fi
  done
  echo
  echo "=== package-level READMEs ==="
  find . -name "README.md" -not -path "*/node_modules/*" -not -path "./audit-evidence/*" 2>/dev/null
  echo
  echo "=== CLAUDE.md head ==="
  head -n 30 CLAUDE.md
  echo
  echo "=== README.md head ==="
  head -n 30 README.md
  echo
  echo "=== INFRA_ISSUES_AND_FIXES.md head ==="
  head -n 30 infra/INFRA_ISSUES_AND_FIXES.md
} > audit-evidence/P1/docs-drift/_scan.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/docs-drift/_scan.txt) lines"