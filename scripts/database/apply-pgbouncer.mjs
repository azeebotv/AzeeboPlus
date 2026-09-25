#!/usr/bin/env node
// ============================================================================
// apply-pgbouncer.mjs — point every dev service's DATABASE_URL at the local
// pgbouncer (transaction mode, 127.0.0.1:6432), preserving a direct escape
// hatch.
//
// Why: with the pooler in front of Postgres, services stop competing for
// server connections entirely — each Prisma pool multiplexes over a small
// client-side footprint while pgbouncer shares ~20 real connections across
// ALL services. Per-service connection_limit caps (apply-pool-limits.mjs)
// become a client-side concern only.
//
// What it writes per .env:
//   DIRECT_DATABASE_URL=<original URL>       (escape hatch; only if absent)
//   DATABASE_URL=<same creds/db @127.0.0.1:6432>?pgbouncer=true&connection_limit=N
//
// pgbouncer=true is REQUIRED for Prisma behind transaction-mode pooling:
// it switches the engine away from named prepared statements, which don't
// survive transaction pooling (each statement can land on a different
// server connection).
//
// Usage:
//   node scripts/database/apply-pgbouncer.mjs            # apply (idempotent)
//   node scripts/database/apply-pgbouncer.mjs --dry-run  # show, don't write
//   node scripts/database/apply-pgbouncer.mjs --revert   # restore from DIRECT_DATABASE_URL
//   node scripts/database/apply-pgbouncer.mjs --status   # report only
//
// Idempotency: URLs already on :6432 are left untouched; a pre-existing
// DIRECT_DATABASE_URL is never overwritten; connection_limit is preserved.
// Prisma CLI work (migrate/db push) should use DIRECT_DATABASE_URL — session
// state like advisory locks is unsafe in transaction mode.
// ============================================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PGBOUNCER_HOST = '127.0.0.1';
const PGBOUNCER_PORT = 6432;
const DEFAULT_CLIENT_LIMIT = 5; // client-side conns are cheap through the pooler

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const REVERT = args.includes('--revert');
const STATUS = args.includes('--status');

function discoverEnvFiles() {
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

function redact(url) {
  return url.replace(/(\/\/[^:/@]+:)[^@]+@/, '$1***@');
}

/**
 * Rewrite a postgres://(ql):// URL to point at pgbouncer:
 * same user/password/database, host swapped to the pooler, pgbouncer=true +
 * pool params appended (existing connection_limit preserved).
 */
function toPgbouncerUrl(url) {
  const m = url.match(/^(postgres(?:ql)?:\/\/)([^@]+)@([^:/?]+)(?::(\d+))?(\/[^?]*)\??(.*)$/);
  if (!m) throw new Error('unrecognized DATABASE_URL shape');
  const [, scheme, userinfo, , , database, query] = m;

  const params = new URLSearchParams(query);
  if (!params.has('connection_limit')) params.set('connection_limit', String(DEFAULT_CLIENT_LIMIT));
  if (!params.has('pool_timeout')) params.set('pool_timeout', '10000');
  if (!params.has('connect_timeout')) params.set('connect_timeout', '5000');
  params.set('pgbouncer', 'true');

  return `${scheme}${userinfo}@${PGBOUNCER_HOST}:${PGBOUNCER_PORT}${database}?${params.toString()}`;
}

const envFiles = discoverEnvFiles();
if (envFiles.length === 0) {
  console.error('No .env files with DATABASE_URL found — nothing to do.');
  process.exit(1);
}

let enabled = 0;
let alreadyOn = 0;
let reverted = 0;

for (const file of envFiles) {
  const relPath = file.slice(ROOT.length + 1).replace(/\/\.env$/, '');
  let content = readFileSync(file, 'utf8');
  const urlMatch = content.match(/^DATABASE_URL=(.+)$/m);
  if (!urlMatch) continue;
  const url = urlMatch[1].trim();
  const directMatch = content.match(/^DIRECT_DATABASE_URL=(.+)$/m);

  if (REVERT) {
    if (!directMatch) {
      console.log(`skip (no DIRECT_DATABASE_URL): ${relPath}`);
      continue;
    }
    if (!DRY_RUN) {
      let next = content.replace(/^DATABASE_URL=.+$/m, `DATABASE_URL=${directMatch[1].trim()}`);
      next = next.replace(/^DIRECT_DATABASE_URL=.+\n?/m, '');
      writeFileSync(file, next);
    }
    reverted += 1;
    console.log(`reverted   ${relPath} -> ${redact(directMatch[1].trim())}`);
    continue;
  }

  if (STATUS) {
    const on = url.includes(`:${PGBOUNCER_PORT}`);
    console.log(`${on ? 'PGBOUNCER' : 'direct   '}  ${relPath}  ${redact(url)}`);
    if (on) enabled += 1;
    continue;
  }

  if (url.includes(`:${PGBOUNCER_PORT}`)) {
    alreadyOn += 1;
    console.log(`unchanged  ${relPath}  (already on pgbouncer)`);
    continue;
  }

  let nextUrl;
  try {
    nextUrl = toPgbouncerUrl(url);
  } catch (e) {
    console.log(`skip (cannot parse): ${relPath} — ${e.message}`);
    continue;
  }

  if (!DRY_RUN) {
    let next = content;
    if (!directMatch) {
      next = next.replace(
        /^DATABASE_URL=.+$/m,
        `DIRECT_DATABASE_URL=${url}\nDATABASE_URL=${nextUrl}`
      );
    } else {
      next = next.replace(/^DATABASE_URL=.+$/m, `DATABASE_URL=${nextUrl}`);
    }
    writeFileSync(file, next);
  }
  enabled += 1;
  console.log(`enabled    ${relPath} -> ${redact(nextUrl)}`);
}

if (STATUS) {
  console.log(`\n${enabled} on pgbouncer, ${envFiles.length - enabled} direct (${envFiles.length} env files)`);
} else if (REVERT) {
  console.log(`\n${reverted} reverted${DRY_RUN ? ' [dry-run: nothing written]' : ''}`);
} else {
  console.log(
    `\n${enabled} enabled, ${alreadyOn} already on pgbouncer (${envFiles.length} env files)` +
      (DRY_RUN ? ' [dry-run: nothing written]' : '')
  );
  if (!DRY_RUN && enabled > 0) {
    console.log(
      '\nRestart services to pick up the new URLs. Prisma CLI commands that need\n' +
        'session state (migrate, db push) should use DIRECT_DATABASE_URL.'
    );
  }
}
