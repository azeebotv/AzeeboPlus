#!/bin/bash
# Patch Prisma-generated client:
# 1. Add "types" to exports for Node16 module resolution
# 2. Copy custom-output prisma client to expected relative path
set -euo pipefail

for pkg_json in $(find services apps -name "package.json" -path "*/prisma/client/package.json" -not -path "*/node_modules/*" 2>/dev/null); do
  if [ -f "$pkg_json" ]; then
    node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$pkg_json', 'utf8'));
let modified = false;
if (data.exports && data.exports['.']) {
  const dot = data.exports['.'];
  const addTypes = (obj) => {
    if (obj && typeof obj === 'object' && !obj.types) {
      obj.types = './index.d.ts';
      modified = true;
    }
  };
  if (typeof dot === 'object') {
    addTypes(dot);
    ['require', 'import', 'default'].forEach(k => addTypes(dot[k]));
  }
}
if (modified) {
  fs.writeFileSync('$pkg_json', JSON.stringify(data, null, 2) + '\n');
  console.log('Patched: $pkg_json');
}
" 2>/dev/null || true
  fi
done

# For services with custom prisma output, copy the generated client to
# the expected relative path (../../prisma/client/ from dist/modules/)
for schema in $(find services apps -maxdepth 5 -name "schema.prisma" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/prisma/client/*" -not -path "*/src/prisma/*" -not -path "*/generated/*" 2>/dev/null); do
  proj_root=$(dirname "$schema")
  svc_root=$(dirname "$proj_root")
  custom_output=$(grep -m1 'output\s*=' "$schema" 2>/dev/null | sed 's/.*"\(.*\)".*/\1/')
  if [ -n "$custom_output" ]; then
    full_output="$proj_root/$custom_output"
    expected_dir="$svc_root/prisma/client"
    if [ -d "$full_output" ] && [ ! -d "$expected_dir" ]; then
      mkdir -p "$expected_dir"
      cp -r "$full_output/." "$expected_dir/"
      echo "Copied prisma client to $expected_dir (for relative imports)"
    fi
  fi
done
