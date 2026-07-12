#!/bin/bash
# Patch Prisma-generated client package.json to add "types" to exports
# Required for Node16 module resolution compatibility
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
