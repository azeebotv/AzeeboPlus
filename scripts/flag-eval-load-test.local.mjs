#!/usr/bin/env node
// Local re-run of the flag-eval load test against a REAL Redis, using the
// actual production code paths (FeatureFlagService + FlagMetricsService from
// the built packages). Use this on a dev machine without k6/docker:
//
//   node scripts/flag-eval-load-test.local.mjs            # Redis on :6379
//   REDIS_URL=redis://localhost:6380 node scripts/flag-eval-load-test.local.mjs
//
// It reports the same two gauges as the k6 script (scripts/flag-eval-load-test.js):
//   ttl_hit_ratio            — per-key TTL cache (cached_eval scenario)
//   bootstrap_list_hit_ratio — list-level snapshot cache (bootstrap scenario)
//
// All data goes under the `loadtest:` prefix, which is flushed at start AND
// end — real flags on a shared instance are never touched.

import { createRequire } from 'node:module';
import { FeatureFlagService } from '../packages/feature-flags/dist/index.js';
import { FlagMetricsService } from '../packages/flag-metrics/dist/index.js';

// Resolve ioredis through the feature-flags package (pnpm strict layout).
const require = createRequire(new URL('../packages/feature-flags/package.json', import.meta.url));
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const PREFIX = 'loadtest:';
const SERVICE = process.env.SERVICE_LABEL || 'api-gateway';
const MIN_HIT_RATIO = parseFloat(process.env.MIN_HIT_RATIO || '0.95');
const MIN_LIST_HIT_RATIO = parseFloat(process.env.MIN_LIST_HIT_RATIO || '0.95');
const BOOTSTRAP_CALLS = parseInt(process.env.BOOTSTRAP_CALLS || '5000', 10);
const EVAL_CALLS = parseInt(process.env.EVAL_CALLS || '20000', 10);

const counters = [
  'flag_cache_hits_total',
  'flag_redis_reads_total',
  'flag_list_cache_hits_total',
  'flag_list_redis_reads_total',
];

// Prometheus exposition: `name{service="X",key="Y"} N` / `name{service="X"} N`.
function sumMetric(text, name) {
  const re = new RegExp(
    `${name}{service="${SERVICE}"[^\\n]*} (\\d+)`,
    'g'
  );
  let sum = 0;
  let m;
  while ((m = re.exec(text)) !== null) sum += parseInt(m[1], 10);
  return sum;
}

async function sample(metricsService) {
  const text = await metricsService.getMetrics();
  const out = {};
  for (const c of counters) out[c] = sumMetric(text, c);
  return out;
}

function ratio(hits, reads) {
  const total = hits + reads;
  return total > 0 ? { ratio: hits / total, hits, reads, total } : { ratio: -1, hits, reads, total };
}

async function main() {
  const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 });
  await redis.ping();

  const flush = async () => {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `${PREFIX}*`, 'COUNT', 500);
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  };
  await flush();

  const flags = [];
  const publicFlags = [];
  for (let i = 0; i < 24; i++) {
    const isPublic = i < 12;
    const key = isPublic
      ? ['web_maintenance_mode', 'web_dark_mode', 'mobile_autoplay', 'web_low_data_mode',
         'universe.reality.voting_enabled', 'universe.comedy.skits_premium', 'mobile_crunchyroll',
         'web_autoplay_next', 'universe.movie.simulcast', 'mobile_downloads_4g',
         'web_creator_profile_v2', 'universe.games.cloud_saves'][i]
      : `gateway_api_v${i % 3 + 2}_test_${i}`;
    const flag = {
      key,
      enabled: true,
      isPublic,
      rolloutPercentage: 100 - (i * 7) % 51, // 50–100% rollouts to exercise hashing
      description: isPublic ? 'public bootstrap flag' : 'internal gateway flag',
    };
    flags.push(flag);
    if (isPublic) publicFlags.push(key);
  }

  const metricsService = new FlagMetricsService(SERVICE, undefined);
  const service = new FeatureFlagService({
    redisUrl: REDIS_URL,
    prefix: PREFIX,
    cacheTtlMs: 30_000,
    listCacheTtlMs: 30_000,
    defaultFlags: {},
    ...metricsService.getFlagHooks(),
  });

  for (const flag of flags) await service.setFlag(flag);
  console.log(`[flag-load] seeded ${flags.length} flags (${publicFlags.length} public) under ${PREFIX}*`);

  // ---- Scenario A: bootstrap (list-level snapshot cache) ----
  const beforeA = await sample(metricsService);
  for (let i = 0; i < BOOTSTRAP_CALLS; i++) {
    await service.getPublicFlags(undefined, `load-u-${i % 200}`);
  }
  const afterA = await sample(metricsService);
  const list = ratio(afterA.flag_list_cache_hits_total - beforeA.flag_list_cache_hits_total,
                     afterA.flag_list_redis_reads_total - beforeA.flag_list_redis_reads_total);

  // ---- Scenario B: cached_eval (per-key TTL cache) ----
  const beforeB = await sample(metricsService);
  for (let i = 0; i < EVAL_CALLS; i++) {
    await service.isEnabled(flags[i % flags.length].key, `user-${i % 500}`);
  }
  const afterB = await sample(metricsService);
  const ttl = ratio(afterB.flag_cache_hits_total - beforeB.flag_cache_hits_total,
                    afterB.flag_redis_reads_total - beforeB.flag_redis_reads_total);

  await flush();
  await service.onModuleDestroy(); // quit the service's own ioredis connection
  await redis.quit();

  const summary = {
    bootstrapScenario: {
      calls: BOOTSTRAP_CALLS,
      listCacheHits: list.hits,
      listRedisReads: list.reads,
      bootstrap_list_hit_ratio: list.ratio === -1 ? 'n/a' : list.ratio.toFixed(6),
    },
    cachedEvalScenario: {
      calls: EVAL_CALLS,
      ttlHits: ttl.hits,
      redisReads: ttl.reads,
      ttl_hit_ratio: ttl.ratio === -1 ? 'n/a' : ttl.ratio.toFixed(6),
    },
  };
  console.log('[flag-load] cache report: ' + JSON.stringify(summary, null, 2));

  let failed = false;
  if (ttl.ratio >= 0 && ttl.ratio < MIN_HIT_RATIO) {
    console.error(`[flag-load] FAIL ttl_hit_ratio ${ttl.ratio.toFixed(4)} < ${MIN_HIT_RATIO}`);
    failed = true;
  }
  if (list.ratio >= 0 && list.ratio < MIN_LIST_HIT_RATIO) {
    console.error(`[flag-load] FAIL bootstrap_list_hit_ratio ${list.ratio.toFixed(4)} < ${MIN_LIST_HIT_RATIO}`);
    failed = true;
  }
  if (failed) process.exit(1);
  console.log('[flag-load] OK — both hit ratios above thresholds; loadtest: prefix flushed.');
}

main().catch((error) => {
  console.error('[flag-load] error:', error);
  process.exit(1);
});
