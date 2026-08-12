#!/usr/bin/env node
// FlagCacheThrash assertion for the dockerized CI job (post-load step).
//
// The alert (docs/MONITORING.md) fires when Redis reads exceed 10% of flag
// lookups over 5m:
//   sum(rate(flag_redis_reads_total[5m])) /
//   (sum(rate(flag_cache_hits_total[5m])) + sum(rate(flag_redis_reads_total[5m]))) > 0.1
// This script applies the same read-share expression to the LOAD WINDOW's
// counter deltas (pre-load snapshot vs post-load snapshot), for BOTH the
// per-key TTL cache and the bootstrap list cache, and exits non-zero when the
// share exceeds the threshold (default 0.1) — the cache is thrashing.
//
// Usage (CI):
//   node scripts/flag-cache-thrash-check.mjs snapshot --out /tmp/before.json [--url <metrics>]
//   node scripts/flag-cache-thrash-check.mjs check --before /tmp/before.json [--url <metrics>] [--threshold 0.1]
//
// Env: METRICS_URL (default http://localhost:4017/metrics).

import { readFileSync, writeFileSync } from 'node:fs';

const METRICS_URL = process.env.METRICS_URL || 'http://localhost:4017/metrics';

const COUNTERS = [
  'flag_cache_hits_total',
  'flag_redis_reads_total',
  'flag_list_cache_hits_total',
  'flag_list_redis_reads_total',
];

function sumMetric(text, name) {
  const re = new RegExp(`${name}{service=\"[^\"]*\"[^\n]*} (\\d+)`, 'g');
  let sum = 0;
  let m;
  while ((m = re.exec(text)) !== null) sum += parseInt(m[1], 10);
  return sum;
}

async function fetchCounters() {
  const res = await fetch(METRICS_URL, { headers: { Accept: 'text/plain' } });
  if (!res.ok) throw new Error(`GET ${METRICS_URL} -> ${res.status}`);
  const text = await res.text();
  const out = {};
  for (const c of COUNTERS) out[c] = sumMetric(text, c);
  return out;
}

function readShare(hits, reads) {
  const total = hits + reads;
  return total > 0 ? { share: reads / total, hits, reads, total } : null;
}

const [mode] = process.argv.slice(2);

if (mode === 'snapshot') {
  const outIdx = process.argv.indexOf('--out');
  const urlIdx = process.argv.indexOf('--url');
  const out = outIdx !== -1 ? process.argv[outIdx + 1] : '/tmp/flag-cache-before.json';
  if (urlIdx !== -1) process.env.METRICS_URL = process.argv[urlIdx + 1];
  const counters = await fetchCounters();
  writeFileSync(out, JSON.stringify(counters, null, 2));
  console.log(`[flag-cache-thrash] snapshot written to ${out}: ${JSON.stringify(counters)}`);
  process.exit(0);
}

if (mode === 'check') {
  const beforeIdx = process.argv.indexOf('--before');
  const urlIdx = process.argv.indexOf('--url');
  const thrIdx = process.argv.indexOf('--threshold');
  const beforeFile = beforeIdx !== -1 ? process.argv[beforeIdx + 1] : '/tmp/flag-cache-before.json';
  if (urlIdx !== -1) process.env.METRICS_URL = process.argv[urlIdx + 1];
  const threshold = thrIdx !== -1 ? parseFloat(process.argv[thrIdx + 1]) : 0.1;

  const before = JSON.parse(readFileSync(beforeFile, 'utf8'));
  const after = await fetchCounters();

  const ttl = readShare(
    after.flag_cache_hits_total - before.flag_cache_hits_total,
    after.flag_redis_reads_total - before.flag_redis_reads_total
  );
  const list = readShare(
    after.flag_list_cache_hits_total - before.flag_list_cache_hits_total,
    after.flag_list_redis_reads_total - before.flag_list_redis_reads_total
  );

  const report = {
    threshold,
    ttlCache: ttl
      ? { ...ttl, hitRatio: (1 - ttl.share).toFixed(6), readShare: ttl.share.toFixed(6) }
      : { note: 'no lookups in the load window' },
    bootstrapListCache: list
      ? { ...list, hitRatio: (1 - list.share).toFixed(6), readShare: list.share.toFixed(6) }
      : { note: 'no lookups in the load window' },
  };
  console.log('[flag-cache-thrash] report: ' + JSON.stringify(report, null, 2));

  let failed = false;
  if (!ttl) {
    console.error('[flag-cache-thrash] FAIL — no TTL-path lookups in the window (load did not run?)');
    failed = true;
  } else if (ttl.share > threshold) {
    console.error(
      `[flag-cache-thrash] FAIL — TTL read share ${ttl.share.toFixed(4)} > ${threshold} (FlagCacheThrash condition)`
    );
    failed = true;
  }
  if (!list) {
    console.error('[flag-cache-thrash] FAIL — no bootstrap lookups in the window (load did not run?)');
    failed = true;
  } else if (list.share > threshold) {
    console.error(
      `[flag-cache-thrash] FAIL — bootstrap list read share ${list.share.toFixed(4)} > ${threshold} (FlagCacheThrash condition)`
    );
    failed = true;
  }
  if (failed) process.exit(1);
  console.log('[flag-cache-thrash] OK — both read shares within the FlagCacheThrash threshold.');
  process.exit(0);
}

console.error(
  'usage: node scripts/flag-cache-thrash-check.mjs snapshot|check [--out f] [--before f] [--url u] [--threshold 0.1]'
);
process.exit(2);
