#!/usr/bin/env node
/**
 * Route-contract check: extracts API calls from client code and verifies they
 * match routes defined in the gateway's SERVICE_CONFIGS.
 *
 * Run: node scripts/check-route-contracts.mjs
 *
 * Exit 0 = all client calls match a gateway route.
 * Exit 1 = mismatches found (details printed).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

// ── 1. Collect all client API calls ──────────────────────────────────────

const CLIENT_DIRS = [
  'apps/web/src',
  'apps/mobile/src',
  'apps/mobile/app',
  'apps/admin/client/src',
  'apps/creator/client/src',
];

const CLIENT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

/**
 * Regex to match API call patterns:
 * - `/api/v1/{service}/{path}`
 * - `api.get/post/put/patch/delete('/api/v1/{service}/{path}`
 * - `apiClient.get/post/put/patch/delete('/api/v1/{service}/{path}`
 * - `request('/api/v1/{service}/{path}`
 * - `fetch('/api/v1/{service}/{path}`
 */
const API_CALL_RE = /['"`]\/api\/v1\/([a-z][a-z0-9_-]*)(\/[a-zA-Z0-9/_:{}]*)?['"`]/g;

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const calls = new Set();
  let match;
  while ((match = API_CALL_RE.exec(content)) !== null) {
    const service = match[1];
    const path = (match[2] || '/').replace(/:[a-zA-Z]+/g, ':param'); // normalize :id → :param
    calls.add(`${service}:${path}`);
  }
  return calls;
}

function scanDirectory(dir) {
  const calls = new Set();
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          // Skip node_modules, dist, .next, __tests__
          if (['node_modules', 'dist', '.next', '__tests__'].includes(entry)) continue;
          for (const call of scanDirectory(fullPath)) calls.add(call);
        } else if (CLIENT_EXTENSIONS.has(extname(entry))) {
          for (const call of scanFile(fullPath)) calls.add(call);
        }
      } catch {
        // Skip inaccessible files
      }
    }
  } catch {
    // Skip inaccessible directories
  }
  return calls;
}

// ── 2. Parse gateway SERVICE_CONFIGS ─────────────────────────────────────

function parseServiceConfigs() {
  const configPath = join(
    process.cwd(),
    'services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts'
  );
  const content = readFileSync(configPath, 'utf8');

  // Extract path and endpoints from each service config block
  const routes = new Map();
  const configBlocks = content.split(/path:\s*'/);

  for (const block of configBlocks) {
    const pathMatch = block.match(/^([^']+)'/);
    if (!pathMatch) continue;
    const servicePath = pathMatch[1]; // e.g. 'auth', 'content', etc.

    // Extract endpoint paths from this block
    const endpointRe = /path:\s*'([^']+)'/g;
    let endpointMatch;
    while ((endpointMatch = endpointRe.exec(block)) !== null) {
      const ep = endpointMatch[1];
      const normalizedEp = ep.replace(/:[a-zA-Z]+/g, ':param');
      const key = `${servicePath}:${normalizedEp}`;
      if (!routes.has(key)) routes.set(key, []);
      routes.get(key).push(`${servicePath}${ep}`);
    }
  }

  return routes;
}

// ── 3. Compare and report ────────────────────────────────────────────────

function normalizePath(path) {
  return path
    .replace(/\/+/g, '/') // collapse double slashes
    .replace(/\/$/, '') || '/';
}

function matchRoute(service, clientPath, gatewayRoutes) {
  // Check exact match first
  const normalizedPath = normalizePath(clientPath);
  const exactKey = `${service}:${normalizedPath}`;
  if (gatewayRoutes.has(exactKey)) return true;

  // Check with param normalization
  const paramPath = normalizedPath.replace(/:[a-zA-Z]+/g, ':param');
  const paramKey = `${service}:${paramPath}`;
  if (gatewayRoutes.has(paramKey)) return true;

  // Check parent paths (e.g., /content/universe matches /content/:id)
  const segments = normalizedPath.split('/').filter(Boolean);
  for (let i = segments.length; i > 0; i--) {
    const parentPath = '/' + segments.slice(0, i).join('/');
    const parentParamPath = parentPath.replace(/:[a-zA-Z]+/g, ':param');
    if (gatewayRoutes.has(`${service}:${parentParamPath}`)) return true;
  }

  return false;
}

console.log('Checking route contracts...\n');

// Scan client code
const clientCalls = new Set();
for (const dir of CLIENT_DIRS) {
  try {
    for (const call of scanDirectory(join(process.cwd(), dir))) {
      clientCalls.add(call);
    }
  } catch {
    // Skip missing directories
  }
}

// Parse gateway routes
const gatewayRoutes = parseServiceConfigs();

// Compare
const mismatches = [];
for (const call of clientCalls) {
  const [service, path] = call.split(':');
  if (!matchRoute(service, path, gatewayRoutes)) {
    mismatches.push({ service, path });
  }
}

if (mismatches.length === 0) {
  console.log(`✅ All ${clientCalls.size} client API calls match gateway routes.`);
  process.exit(0);
} else {
  console.log(`❌ Found ${mismatches.length} client API calls with no matching gateway route:\n`);
  for (const { service, path } of mismatches.sort((a, b) => a.service.localeCompare(b.service))) {
    console.log(`  /api/v1/${service}${path}`);
  }
  console.log(`\nTotal client calls: ${clientCalls.size}`);
  console.log(`Unmatched: ${mismatches.length}`);
  console.log(`\nThese calls will 404 at runtime. Add the missing routes to the gateway\nSERVICE_CONFIGS or re-point the client to an existing route.`);
  process.exit(1);
}
