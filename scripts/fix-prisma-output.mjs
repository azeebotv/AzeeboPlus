#!/usr/bin/env node
// Fix all Prisma schemas to use local output paths
// This prevents services from overwriting each other's @prisma/client in the pnpm store

import { readFileSync, writeFileSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { globSync } from 'fs';

// Find all schema.prisma files
import { readdirSync, statSync } from 'fs';

function findSchemas(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    if (statSync(full).isDirectory()) {
      results.push(...findSchemas(full));
    } else if (entry === 'schema.prisma') {
      results.push(full);
    }
  }
  return results;
}

const servicesDir = '/Users/deprof/www/azeebo+/services';
const schemas = findSchemas(servicesDir);

let fixed = 0;
let skipped = 0;

for (const schemaPath of schemas) {
  const dir = dirname(schemaPath);
  const name = dir.replace(servicesDir + '/', '');
  
  let content = readFileSync(schemaPath, 'utf8');
  
  // Check if already has custom output
  if (/output\s*=\s*["']/.test(content)) {
    console.log(`SKIP (already has output): ${name}`);
    skipped++;
    continue;
  }
  
  // Replace the generator client block
  content = content.replace(
    /generator client \{[\s\S]*?\}/,
    `generator client {\n  provider = "prisma-client-js"\n  output   = "../src/prisma/client"\n}`
  );
  
  writeFileSync(schemaPath, content);
  
  // Clean old client if it exists
  const clientDir = join(dir, 'src', 'prisma', 'client');
  try { rmSync(clientDir, { recursive: true, force: true }); } catch {}
  
  // Regenerate
  try {
    const out = execSync('npx prisma generate 2>&1', { cwd: dir, encoding: 'utf8' });
    const genLine = out.split('\n').find(l => l.includes('Generated'));
    console.log(`FIXED: ${name} - ${genLine ? genLine.trim() : 'done'}`);
    fixed++;
  } catch (e) {
    console.log(`ERROR: ${name} - ${e.message}`);
  }
}

console.log(`\nDone: ${fixed} fixed, ${skipped} skipped`);
