#!/usr/bin/env node
// ============================================================================
// verify-pgbouncer-prisma.mjs — prove the dev Prisma clients work through the
// local pgbouncer (transaction mode, port 6432).
//
// Transaction-mode pooling changes the failure surface for ORMs: session
// state (temp tables, SETs, advisory locks, prepared statements) does not
// survive across transactions because every transaction can land on a
// different server connection. Prisma is transaction-mode safe when the URL
// carries pgbouncer=true (text protocol instead of named prepared
// statements); this script verifies the guarantees we actually rely on:
//
//   1. basic reads through the pooler
//   2. writes (create + delete) round-trip
//   3. interactive $transaction — multiple statements must see each other's
//      writes, i.e. pgbouncer pins one server connection for the transaction
//   4. concurrency — many parallel queries through a deliberately tiny Prisma
//      pool (connection_limit=3), proving client-side multiplexing over the
//      shared server pool without "prepared statement ... does not exist"
//      errors or pool timeouts
//
// Usage: node scripts/database/verify-pgbouncer-prisma.mjs
// Exits nonzero on the first failed case. No persistent data is left behind.
// ============================================================================

import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);

// Use the vertical-service generated client (has StoryworldPath/AgbalaQuiz
// models and an existing azeebo_vertical database to query). The build
// mirrors the generated client into dist/ (see the service's build script).
const { PrismaClient } = require(
  resolve(ROOT, 'services/universes/vertical-service/dist/prisma/client/index.js')
);

const PGBOUNCER_URL =
  'postgresql://azeebo:change-me-in-production@127.0.0.1:6432/azeebo_vertical' +
  '?pgbouncer=true&connection_limit=3&pool_timeout=8000&connect_timeout=5000';

const prisma = new PrismaClient({ datasources: { db: { url: PGBOUNCER_URL } } });

const results = [];
function report(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function serverPoolStats() {
  try {
    const out = execSync(
      `PGPASSWORD='change-me-in-production' psql -h 127.0.0.1 -p 6432 -U pgbouncer -d pgbouncer -tAc "SHOW POOLS;"`,
      { encoding: 'utf8' }
    ).trim();
    const row = out.split('\n').find((l) => l.startsWith('azeebo_vertical|'));
    if (!row) return null;
    const f = row.split('|');
    // database|user|cl_active|cl_waiting|sv_active|sv_idle|...
    return {
      clActive: Number(f[2]),
      clWaiting: Number(f[3]),
      svActive: Number(f[4]),
      svIdle: Number(f[5]),
    };
  } catch {
    return null;
  }
}

let storyworldId = null;
try {
  storyworldId = await prisma.$queryRaw`SELECT id FROM "universe_maps" LIMIT 1`.then(
    (r) => r[0]?.id ?? null
  );
} catch {
  /* handled below */
}

// ── 1. basic read ────────────────────────────────────────────────────────────
try {
  const count = await prisma.universeMap.count();
  report('basic read (universeMap.count)', true, `${count} rows`);
} catch (e) {
  report('basic read (universeMap.count)', false, e.message.split('\n')[0]);
}

// ── 2. write round-trip ─────────────────────────────────────────────────────
if (storyworldId) {
  try {
    const created = await prisma.storyworldPath.create({
      data: { storyworldId, name: 'pgbouncer-verify-tmp', totalSteps: 1 },
    });
    const readBack = await prisma.storyworldPath.findUnique({ where: { id: created.id } });
    await prisma.storyworldPath.delete({ where: { id: created.id } });
    report('write round-trip (create/read/delete)', readBack?.name === 'pgbouncer-verify-tmp');
  } catch (e) {
    report('write round-trip (create/read/delete)', false, e.message.split('\n')[0]);
  }
} else {
  report('write round-trip (create/read/delete)', false, 'no universe_maps row to attach to');
}

// ── 3. interactive transaction ──────────────────────────────────────────────
if (storyworldId) {
  try {
    const inner = await prisma.$transaction(async (tx) => {
      const a = await tx.storyworldPath.create({
        data: { storyworldId, name: 'pgbouncer-verify-tx', totalSteps: 1 },
      });
      // The second statement must observe the first's write on the same
      // server connection — the core transaction-mode requirement.
      const seen = await tx.storyworldPath.findUnique({ where: { id: a.id } });
      const deleted = await tx.storyworldPath.delete({ where: { id: a.id } });
      return { seenOk: seen?.id === a.id, deletedOk: deleted.id === a.id };
    });
    report('interactive $transaction', inner.seenOk && inner.deletedOk);
  } catch (e) {
    report('interactive $transaction', false, e.message.split('\n')[0]);
  }
} else {
  report('interactive $transaction', false, 'no universe_maps row to attach to');
}

// ── 4. concurrency over a tiny client pool ──────────────────────────────────
try {
  const before = serverPoolStats();
  const N = 30;
  const results30 = await Promise.all(
    Array.from({ length: N }, (_, i) =>
      i % 3 === 0
        ? prisma.universeMap.count()
        : i % 3 === 1
          ? prisma.$queryRaw`SELECT 1::int AS n`
          : prisma.agbalaQuiz.count()
    )
  );
  const after = serverPoolStats();
  const allOk = results30.every((r) => r !== undefined && r !== null);
  const serverConns = after ? after.svActive + after.svIdle : null;
  report(
    `concurrency (${N} parallel queries, connection_limit=3)`,
    allOk,
    after
      ? `server pool: ${serverConns} real conns (active=${after.svActive} idle=${after.svIdle}), ` +
          `clients: active=${after.clActive} waiting=${after.clWaiting}`
      : `before=${JSON.stringify(before)}`
  );
} catch (e) {
  report('concurrency', false, e.message.split('\n')[0]);
}

await prisma.$disconnect();

const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} cases passed` +
    (failed.length ? ` — failing: ${failed.map((f) => f.name).join(', ')}` : ' — Prisma is pgbouncer-safe')
);
process.exit(failed.length ? 1 : 0);
