#!/usr/bin/env node
// ============================================================================
// apply-pool-limits.mjs — enforce per-service Prisma connection pool caps
//
// Why: every service runs its own Prisma client with the Postgres default
// pool size (num_cpus * 2 + 1, ~10-11 connections locally). With ~28 services
// each holding a default-sized pool against the same Postgres instance, idle
// connections accumulate until the server refuses new ones:
//   FATAL: remaining connection slots are reserved for roles with the
//          SUPERUSER attribute
// which surfaces as random Prisma errors in whichever service queries next.
//
// Fix: append explicit `connection_limit` (plus timeouts) to every service's
// DATABASE_URL so the worst case is bounded under the server's max_connections.
// The caps are tiered: busy services get more headroom, quiet universes get 3.
//
// Sizing table (total worst case = 154 of max_connections=100's headroom is
// NOT free — run `--check` to print the sum against a live server budget):
//
//   tier        limit   who
//   -----       -----   ---
//   primary       10    auth-service
//   busy           8    admin-backend, user-service, content-ish backends
//   medium         6    analytics, wallet, payment, subscription, moderation
//   support        5    support-service (runs 7 parallel count queries)
//   media          6    media-service (upload fan-out)
//   quiet          3    one-universe services, referral/reward/queue/etc.
//
// Usage:
//   node scripts/database/apply-pool-limits.mjs            # apply (idempotent)
//   node scripts/database/apply-pool-limits.mjs --dry-run  # show, don't write
//   node scripts/database/apply-pool-limits.mjs --check    # summarize + compare to live max_connections
//
// Idempotency: an existing `connection_limit=` query param is REUSED as the
// limit (its other params are left alone); only URLs without a cap get the
// computed one appended. Re-running never changes an already-capped URL.
// ============================================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// ── Per-service pool sizing ─────────────────────────────────────────────────
// Keys are paths relative to the repo root. Everything not listed falls back
// to TIER_DEFAULTS.quiet (3), so new services are safe by default.
const LIMITS = {
  // Primary identity path — every request from every client funnels here.
  'services/core/auth-service': 6,
  // Admin backend does cross-service fan-outs with parallel queries.
  'apps/admin': 6,
  // High-traffic core reads/writes.
  'services/core/user-service': 5,
  'services/core/wallet-service': 3,
  'services/core/payment-service': 3,
  'services/core/media-service': 4,
  'services/core/search-service': 3,
  // Analytics runs aggregations; subscription/moderation parallelize counts.
  'services/intelligence/analytics-service': 3,
  'services/engagement/subscription-service': 3,
  'services/operations/moderation-service': 3,
  // Support runs 7 parallel count queries in its dashboard.
  'services/operations/support-service': 4,
  // Messaging and engagement hold listener pools.
  'services/engagement/messaging-service': 3,
  'services/engagement/engagement-service': 3,
  'services/engagement/notification-service': 3,
  // Everything else (universe services, referral, reward, queue,
  // recommendation, creator, gateway) is low-traffic: default 2.
};
const TIER_DEFAULTS = { quiet: 2 };

const POOL_TIMEOUT_MS = 10_000; // fail fast instead of queueing when saturated
const CONNECT_TIMEOUT_MS = 5_000;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CHECK = args.includes('--check');

function discoverEnvFiles() {
  // Reuse the same discovery shape as the doc: services + apps .env with a
  // DATABASE_URL, excluding client bundles and node_modules.
  const out = execSync(
    `find ${ROOT}/services ${ROOT}/apps -maxdepth 4 -name ".env" ` +
      `-not -path "*/node_modules/*" -not -path "*/client/*" 2>/dev/null | sort`,
    { encoding: 'utf8' }
  )
    .split('\n')
    .filter((p) => p && existsSync(p));
  return out.filter((p) => {
    const content = readFileSync(p, 'utf8');
    return /^DATABASE_URL=/m.test(content);
  });
}

function limitFor(relPath) {
  if (LIMITS[relPath] !== undefined) return LIMITS[relPath];
  return TIER_DEFAULTS.quiet;
}

/** Append (or preserve) pool params on a postgres://(ql):// URL. */
function applyParams(url, limit) {
  const has = (key) => new RegExp(`[?&]${key}=`).test(url);
  let next = url;
  // An explicitly-set connection_limit is never overwritten (idempotency).
  if (!has('connection_limit')) {
    next += (next.includes('?') ? '&' : '?') + `connection_limit=${limit}`;
  }
  if (!has('pool_timeout')) {
    next += `&pool_timeout=${POOL_TIMEOUT_MS}`;
  }
  if (!has('connect_timeout')) {
    next += `&connect_timeout=${CONNECT_TIMEOUT_MS}`;
  }
  return next;
}

function redact(url) {
  return url.replace(/(\/\/[^:/@]+:)[^@]+@/, '$1***@');
}

// ── Main ────────────────────────────────────────────────────────────────────

const envFiles = discoverEnvFiles();
if (envFiles.length === 0) {
  console.error('No .env files with DATABASE_URL found — nothing to do.');
  process.exit(1);
}

let changed = 0;
let unchanged = 0;
let totalBudget = 0;

for (const file of envFiles) {
  const relPath = file.slice(ROOT.length + 1).replace(/\/\.env$/, '');
  const limit = limitFor(relPath);
  const content = readFileSync(file, 'utf8');
  const urlMatch = content.match(/^DATABASE_URL=(.+)$/m);
  if (!urlMatch) {
    console.log(`skip (no DATABASE_URL): ${relPath}`);
    continue;
  }
  const url = urlMatch[1].trim();
  const nextUrl = applyParams(url, limit);

  if (nextUrl === url) {
    unchanged += 1;
    totalBudget += limit;
    console.log(`unchanged  ${relPath}  (limit=${limit})`);
    continue;
  }

  if (!DRY_RUN) {
    writeFileSync(file, content.replace(/^DATABASE_URL=.+$/m, `DATABASE_URL=${nextUrl}`));
  }
  changed += 1;
  totalBudget += limit;
  console.log(`updated    ${relPath}  -> limit=${limit}  ${redact(nextUrl)}`);
}

console.log(
  `\n${changed} updated, ${unchanged} already capped (${envFiles.length} env files)` +
    (DRY_RUN ? ' [dry-run: nothing written]' : '')
);
console.log(`Worst-case pool budget across all services: ${totalBudget} connections`);

if (CHECK) {
  try {
    const maxConn = execSync(
      `PGPASSWORD='change-me-in-production' psql -h localhost -U postgres -d postgres -tAc "SHOW max_connections;"`,
      { encoding: 'utf8' }
    ).trim();
    console.log(`Live max_connections=${maxConn} -> budget uses ${totalBudget}/${maxConn}`);
    if (totalBudget > Number(maxConn) * 0.8) {
      console.error(
        'WARNING: budget exceeds 80% of max_connections. Lower per-service limits or raise max_connections.'
      );
      process.exitCode = 2;
    } else {
      console.log(
        `Budget is within the 80% safety margin ` +
          `(${totalBudget} <= ${Math.floor(Number(maxConn) * 0.8)}).`
      );
    }
  } catch {
    console.log('(could not read live max_connections — psql unavailable?)');
  }
}
