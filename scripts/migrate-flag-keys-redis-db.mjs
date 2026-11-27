#!/usr/bin/env node
/**
 * migrate-flag-keys-redis-db.mjs — one-time copy of feature-flag keys from
 * the old reserved/generic DB 0 to the dedicated flag-cache DB index.
 *
 * Context: the feature-flag cache now resolves its own Redis DB index
 * (FEATURE_FLAG_REDIS_DB, default 2 — see resolveFeatureFlagRedisUrl in
 * @azeebo/feature-flags). DB 0 is reserved for generic/shared keyspace.
 * Redis is the store of record for global + universe flags, so a prod deploy
 * must copy the existing `feature_flags:*` keys (incl. universe flags, which
 * share the same `feature_flags:universe.*` prefix) from DB 0 to DB 2 once,
 * before/at rollout of the dedicated-DB build.
 *
 * Usage:
 *   node scripts/migrate-flag-keys-redis-db.mjs            # dry run (default)
 *   node scripts/migrate-flag-keys-redis-db.mjs --apply    # perform the copy
 *
 * Env:
 *   SOURCE_REDIS_URL / REDIS_URL   source Redis (default redis://localhost:6379)
 *   SOURCE_REDIS_DB                source index (default 0; URL path wins)
 *   FEATURE_FLAG_REDIS_URL / REDIS_URL  target Redis (same host by default)
 *   FEATURE_FLAG_REDIS_DB          target index (default 2)
 *
 * Semantics: GET/SET byte copy per key (flags are plain JSON strings),
 * PTTL preserved when > 0. Keys already present on the target with the same
 * value are skipped; differing values are overwritten (last writer is this
 * migration). Never deletes source keys — retire DB 0 flag keys manually
 * after verification.
 */

import Redis from 'ioredis';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/migrate-flag-keys-redis-db.mjs [--apply]');
  process.exit(0);
}

const DEFAULT_FLAG_DB = 2;

function splitUrl(raw, fallbackUrl, dbEnv, defaultDb) {
  const url = new URL(raw || fallbackUrl || 'redis://localhost:6379');
  let db = defaultDb;
  if (url.pathname && url.pathname !== '/') {
    db = Number(url.pathname.slice(1));
  } else if (process.env[dbEnv] !== undefined && process.env[dbEnv] !== '') {
    db = Number(process.env[dbEnv]);
  }
  if (!Number.isFinite(db) || db < 0) db = defaultDb;
  return { url, db };
}

const src = splitUrl(
  process.env.SOURCE_REDIS_URL ?? process.env.REDIS_URL,
  'redis://localhost:6379',
  'SOURCE_REDIS_DB',
  0,
);
const dst = splitUrl(
  process.env.FEATURE_FLAG_REDIS_URL ?? process.env.REDIS_URL,
  'redis://localhost:6379',
  'FEATURE_FLAG_REDIS_DB',
  DEFAULT_FLAG_DB,
);

const PATTERN = 'feature_flags:*';
const hostPort = (u) => `${u.hostname}:${u.port || 6379}`;

console.log(`source: redis://${hostPort(src.url)} db=${src.db} (pattern: ${PATTERN})`);
console.log(`target: redis://${hostPort(dst.url)} db=${dst.db}`);
console.log(`mode:   ${APPLY ? 'APPLY — keys will be copied' : 'DRY RUN (pass --apply to copy)'}`);

if (hostPort(src.url) === hostPort(dst.url) && src.db === dst.db) {
  console.error(`\nRefusing to run: source and target are the same Redis DB (${src.db}). Nothing to migrate.`);
  process.exit(1);
}
if (src.db !== 0) {
  console.log(`\nNOTE: source DB is ${src.db}, not 0 — this is a non-standard migration run.`);
}

const source = new Redis(src.url.toString(), { db: src.db, lazyConnect: false, maxRetriesPerRequest: 1 });
const target = new Redis(dst.url.toString(), { db: dst.db, lazyConnect: false, maxRetriesPerRequest: 1 });

let scanned = 0;
let toCopy = 0;
let copied = 0;
let skippedSame = 0;
const values = []; // [{ key, value, pttl }]
const BATCH = 200;

async function main() {
  const keys = [];
  let cursor = '0';
  let batch = [];
  do {
    [cursor, batch] = await source.scan(cursor, 'MATCH', PATTERN, 'COUNT', 500);
    keys.push(...batch);
  } while (cursor !== '0');
  scanned = keys.length;
  console.log(`\nscanned ${scanned} key(s) matching ${PATTERN} on source DB ${src.db}`);

  for (const key of keys) {
    const value = await source.get(key);
    if (value === null) continue; // expired or non-string — flags are strings
    const pttl = await source.pttl(key);
    values.push({ key, value, pttl });
  }

  // Diff against target
  for (const entry of values) {
    const existing = await target.get(entry.key);
    if (existing === entry.value) {
      skippedSame += 1;
    } else {
      toCopy += 1;
    }
  }

  console.log(`found  ${values.length} string key(s): ${toCopy} to write, ${skippedSame} already identical on target\n`);
  for (const { key, pttl } of values.slice(0, 30)) {
    console.log(`  ${key}${pttl > 0 ? ` (ttl ${pttl}ms)` : ''}`);
  }
  if (values.length > 30) console.log(`  … and ${values.length - 30} more`);

  if (!APPLY) {
    console.log('\ndry run complete — rerun with --apply to copy these keys.');
    return;
  }

  for (let i = 0; i < values.length; i += BATCH) {
    const chunk = values.slice(i, i + BATCH);
    const pipe = target.pipeline();
    for (const { key, value, pttl } of chunk) {
      if (pttl > 0) pipe.set(key, value, 'PX', pttl);
      else pipe.set(key, value);
    }
    const results = await pipe.exec();
    results.forEach(([err], idx) => {
      if (err) console.error(`  FAILED ${chunk[idx].key}: ${err.message}`);
      else copied += 1;
    });
  }

  console.log(`\napply complete: wrote ${copied}/${values.length} key(s) to DB ${dst.db}.`);
  const verifyCount = await target.dbsize();
  console.log(`target DB ${dst.db} dbsize now: ${verifyCount}`);
  console.log('source keys were NOT deleted — verify, then retire DB 0 flag keys manually.');
}

main()
  .catch((err) => {
    console.error(`migration failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { source.disconnect(); } catch {}
    try { target.disconnect(); } catch {}
  });
