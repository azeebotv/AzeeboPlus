#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== file-type counts (excluding node_modules / .git) ==="
  printf "%-30s %s\n" "extension" "count"
  for ext in ts tsx js jsx mjs cjs json yaml yml toml md sh bash prisma tf tfvars hcl dockerfile env; do
    n=$(find . \( -path ./node_modules -o -path ./.git -o -path ./audit-evidence \) -prune -o -type f -name "*.$ext" -print 2>/dev/null | wc -l | tr -d ' ')
    printf "%-30s %s\n" ".$ext" "$n"
  done
  echo
  echo "=== Dockerfile (exact name) ==="
  find . \( -path ./node_modules -o -path ./.git -o -path ./audit-evidence \) -prune -o -type f -name "Dockerfile" -print 2>/dev/null | wc -l | tr -d ' '
  echo
  echo "=== docker-compose variants ==="
  find . \( -path ./node_modules -o -path ./.git -o -path ./audit-evidence \) -prune -o -type f -name "docker-compose*.yml" -print 2>/dev/null | wc -l | tr -d ' '
  echo
  echo "=== Kubernetes manifests ==="
  find . \( -path ./node_modules -o -path ./.git -o -path ./audit-evidence \) -prune -o -type f \( -name "*.yaml" -o -name "*.yml" \) -path "*/k8s/*" -print 2>/dev/null | wc -l | tr -d ' '
  echo
  echo "=== Prisma schemas ==="
  find . \( -path ./node_modules -o -path ./.git -o -path ./audit-evidence \) -prune -o -type f -name "schema.prisma" -print 2>/dev/null | wc -l | tr -d ' '
  echo
  echo "=== Terraform files ==="
  find . \( -path ./node_modules -o -path ./.git -o -path ./audit-evidence \) -prune -o -type f \( -name "*.tf" -o -name "*.tfvars*" \) -print 2>/dev/null | wc -l | tr -d ' '
  echo
  echo "=== GitHub workflow files ==="
  find .github/workflows -type f -name "*.yml" 2>/dev/null | wc -l | tr -d ' '
  echo
  echo "=== Apps (top-level dirs under apps/) ==="
  ls -1 apps 2>/dev/null
  echo
  echo "=== Services (top-level dirs under services/) ==="
  ls -1 services 2>/dev/null
  echo
  echo "=== Packages (top-level dirs under packages/) ==="
  ls -1 packages 2>/dev/null
} > audit-evidence/P0/inventory.txt 2>&1