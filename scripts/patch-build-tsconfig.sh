#!/bin/bash
# Patch all tsconfig.build.json files to resolve @azeebo/* from dist
# Used in Docker builds after T0 packages are compiled
set -euo pipefail

for f in $(find services apps -maxdepth 3 -name "tsconfig.build.json" -not -path "*/node_modules/*"); do
  dir=$(dirname "$f")
  rel=$(node -e "console.log(require('path').relative('$dir','packages'))")
  node -e "
    const fs = require('fs');
    const d = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    if (!d.compilerOptions) d.compilerOptions = {};
    const paths = d.compilerOptions.paths || {};
    const needsPatch = !paths['@azeebo/*'] || JSON.stringify(paths) === '{}';
    if (needsPatch) {
      d.compilerOptions.paths = { '@azeebo/*': [process.argv[2] + '/*/dist'], '@/*': ['./src/*'] };
      fs.writeFileSync(process.argv[1], JSON.stringify(d, null, 2) + '\n');
      console.log('Patched: ' + process.argv[1] + ' -> ' + process.argv[2]);
    }
  " "$f" "$rel" 2>/dev/null || true
done
echo "Done patching tsconfig.build.json files"
