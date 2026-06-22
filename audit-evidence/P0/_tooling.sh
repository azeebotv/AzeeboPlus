#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  for tool in node pnpm npm yarn docker kubectl helm terraform aws gcloud tofu jq rg python3 go rustc dotnet; do
    printf "%-12s -> " "$tool"
    if command -v "$tool" >/dev/null 2>&1; then
      "$tool" --version 2>&1 | head -n 3 | tr '\n' '|' | sed 's/|$//'
      echo
    else
      echo "NOT INSTALLED"
    fi
  done
  echo
  echo "=== .nvmrc ==="
  if [ -f .nvmrc ]; then cat .nvmrc; else echo "(no .nvmrc)"; fi
  echo
  echo "=== engines.node (root package.json) ==="
  node -e "try{const p=require('./package.json'); console.log(JSON.stringify(p.engines||{},null,2))}catch(e){console.log('read failed:',e.message)}"
  echo
  echo "=== pnpm-workspace.yaml (head) ==="
  if [ -f pnpm-workspace.yaml ]; then head -n 20 pnpm-workspace.yaml; else echo "(no pnpm-workspace.yaml)"; fi
} > audit-evidence/P0/tooling.txt 2>&1