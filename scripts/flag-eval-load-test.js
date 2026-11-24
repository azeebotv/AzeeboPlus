// k6 load test: flag evaluation at production scale with hit-ratio reporting
//
// What it does
//   - bootstrap:    GET /feature-flags/bootstrap with a per-VU x-anonymous-id,
//                   exercising per-user rollout hashing + allowlists through the
//                   gateway's public-flag path (isPublic flags only). Served by
//                   the list-level snapshot cache (listCacheTtlMs, default 30s)
//                   — repeated calls within the TTL avoid the scan+get rebuild.
//   - cached_eval:  GET /api/v1/<route> through the gateway proxy, whose
//                   request handler evaluates gateway_maintenance_mode /
//                   gateway_api_v2 / gateway_response_cache via isEnabled() on
//                   EVERY request — the per-key in-process TTL cache path.
//
// Hit ratios (both reported + threshold-enforced)
//   The caches live inside each service's FeatureFlagService, so they can't be
//   observed from the client. The gateway's flag-metrics counters
//   (service="api-gateway") are sampled in setup() and teardown(); the
//   run-window deltas are reported as two gauges:
//     ttl_hit_ratio            = flag_cache_hits_total /
//                                (hits + flag_redis_reads_total)   [cached_eval]
//     bootstrap_list_hit_ratio = flag_list_cache_hits_total /
//                                (hits + flag_list_redis_reads_total) [bootstrap]
//   At production scale with the default 30s TTLs both should be ≈ 0.99+ — a
//   collapse means cache thrash (TTL too low, cache disabled, or key churn).
//
// Mid-run curve (sampler scenario)
//   A dedicated 1-VU sampler scenario polls /metrics every SAMPLE_INTERVAL
//   (default 30s) during the run and records each per-window delta into two
//   Trend metrics — ttl_hit_ratio_series and bootstrap_list_hit_ratio_series —
//   so cache thrash shows up as a curve (min/avg/max/p90 in the k6 summary)
//   instead of a single start/end number. Windows with zero lookups are
//   skipped. SAMPLER_ITERATIONS is derived from SUSTAIN_S / SAMPLE_INTERVAL so
//   the sampler ends with the load scenarios.
//
// Run (needs a running gateway with real Redis + flag metrics on /metrics):
//   k6 run scripts/flag-eval-load-test.js
//   BASE_URL=https://api.azeebo.plus METRICS_URL=https://api.azeebo.plus/metrics \
//     k6 run scripts/flag-eval-load-test.js
//   K6_VUS ... / CACHED_ROUTE / MIN_HIT_RATIO / MIN_LIST_HIT_RATIO /
//   SUSTAIN_S / SAMPLE_INTERVAL can be overridden via env.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Gauge, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3013';
const METRICS_URL = __ENV.METRICS_URL || `${BASE_URL}/metrics`;
const CACHED_ROUTE = __ENV.CACHED_ROUTE || '/api/v1/content/universes';
const SERVICE_LABEL = __ENV.SERVICE_LABEL || 'api-gateway';
const MIN_HIT_RATIO = parseFloat(__ENV.MIN_HIT_RATIO || '0.95');
const MIN_LIST_HIT_RATIO = parseFloat(__ENV.MIN_LIST_HIT_RATIO || '0.95');
const ANON_PREFIX = __ENV.ANON_PREFIX || 'load';
// Run length is (15s ramp-up + sustain + 15s ramp-down); the sampler derives
// its iteration count from it so it finishes with the load scenarios.
const SUSTAIN_S = parseInt(__ENV.SUSTAIN_S || '120', 10);
const SAMPLE_INTERVAL = parseFloat(__ENV.SAMPLE_INTERVAL || '30');
const RUN_S = 30 + SUSTAIN_S;
const SAMPLER_ITERATIONS = Math.max(1, Math.floor(RUN_S / SAMPLE_INTERVAL));

const bootstrapDuration = new Trend('bootstrap_duration');
const cachedEvalDuration = new Trend('cached_eval_duration');
const errorRate = new Rate('flag_errors');
const bootstrapRequests = new Counter('bootstrap_requests');
const cachedEvalRequests = new Counter('cached_eval_requests');
const ttlHitRatio = new Gauge('ttl_hit_ratio');
const bootstrapListHitRatio = new Gauge('bootstrap_list_hit_ratio');
// Mid-run per-window samples: one value per 30s window → a thrash curve.
const ttlHitRatioSeries = new Trend('ttl_hit_ratio_series');
const listHitRatioSeries = new Trend('bootstrap_list_hit_ratio_series');

const ramp = (start, peak, sustain, down) => [
  { duration: '15s', target: start },
  { duration: `${sustain}s`, target: peak },
  { duration: '15s', target: 0 },
];

export const options = {
  scenarios: {
    // Public-flag bootstrap: per-user rollout bucketing through the list-level
    // snapshot cache.
    bootstrap: {
      executor: 'ramping-vus',
      exec: 'bootstrap',
      startVUs: 0,
      stages: ramp(10, 50, SUSTAIN_S, 0),
      gracefulStop: '10s',
    },
    // Proxied traffic: every request evaluates 3 gateway flags through the
    // in-process TTL cache — the path whose hit ratio we report.
    cached_eval: {
      executor: 'ramping-vus',
      exec: 'cachedEval',
      startVUs: 0,
      stages: ramp(20, 300, SUSTAIN_S, 0),
      gracefulStop: '10s',
    },
    // 1-VU sampler: polls /metrics every SAMPLE_INTERVAL and records each
    // per-window hit ratio so thrash appears as a curve, not one number.
    sampler: {
      executor: 'per-vu-iterations',
      exec: 'sampleRatios',
      vus: 1,
      iterations: SAMPLER_ITERATIONS,
      gracefulStop: '10s',
    },
  },
  thresholds: {
    bootstrap_duration: ['p(95)<500'],
    cached_eval_duration: ['p(95)<500'],
    flag_errors: ['rate<0.05'],
    ttl_hit_ratio: [`value>${MIN_HIT_RATIO}`],
    bootstrap_list_hit_ratio: [`value>${MIN_LIST_HIT_RATIO}`],
    // Whole-window gate stays; the series `min` catches a single thrash window
    // even when the aggregate ratio looks healthy. A healthy cache is ≈ 1.0 in
    // EVERY window (lookup volume is irrelevant to the ratio), so min is the
    // honest gate — with only ~5 samples per default run, p(90)/avg would
    // smooth a dipped window away. (Zero-lookup windows are skipped by the
    // sampler, so min never fires on an empty window.)
    ttl_hit_ratio_series: [`min>${MIN_HIT_RATIO}`],
    bootstrap_list_hit_ratio_series: [`min>${MIN_LIST_HIT_RATIO}`],
  },
};

function sumMetric(text, name) {
  const re = new RegExp(`${name}{service="${SERVICE_LABEL}"[^\n]*} (\\d+)`, 'g');
  // Goja (k6) has no matchAll: iterate exec on the global regex.
  let sum = 0;
  let m;
  while ((m = re.exec(text)) !== null) sum += parseInt(m[1], 10);
  return sum;
}

// Read all four cumulative counter families from /metrics (or null on failure).
function fetchCounters() {
  const res = http.get(METRICS_URL, { headers: { Accept: 'text/plain' } });
  if (res.status !== 200) {
    console.warn(`[flag-load] /metrics returned ${res.status} — ratio sample unavailable`);
    return null;
  }
  return {
    hits: sumMetric(res.body, 'flag_cache_hits_total'),
    reads: sumMetric(res.body, 'flag_redis_reads_total'),
    listHits: sumMetric(res.body, 'flag_list_cache_hits_total'),
    listReads: sumMetric(res.body, 'flag_list_redis_reads_total'),
  };
}

/** Per-window ratio between two counter snapshots (-1 when no lookups). */
function windowRatio(cur, prev, hitsKey, readsKey) {
  const hits = cur[hitsKey] - prev[hitsKey];
  const reads = cur[readsKey] - prev[readsKey];
  const total = hits + reads;
  return total > 0 ? hits / total : -1;
}

// Baseline the cumulative counters before any load.
export function setup() {
  const counters = fetchCounters();
  return counters ? { ...counters, ok: true } : { hits: -1, reads: -1, ok: false };
}

// Mid-run sampler: every SAMPLE_INTERVAL seconds, diff the counters since the
// previous poll and record the per-window ratios into the series trends. One
// value per window, so the k6 summary shows min/avg/max/p90 as a curve.
let prevCounters = null;

export function sampleRatios() {
  const cur = fetchCounters();
  if (cur && prevCounters) {
    const ttl = windowRatio(cur, prevCounters, 'hits', 'reads');
    const list = windowRatio(cur, prevCounters, 'listHits', 'listReads');
    if (ttl >= 0) ttlHitRatioSeries.add(ttl);
    if (list >= 0) listHitRatioSeries.add(list);
  }
  if (cur) prevCounters = cur;
  sleep(SAMPLE_INTERVAL);
}

export function bootstrap() {
  const anonId = `${ANON_PREFIX}-u-${__VU}`;
  const res = http.get(`${BASE_URL}/feature-flags/bootstrap`, {
    headers: { 'x-anonymous-id': anonId },
  });
  bootstrapDuration.add(res.timings.duration);
  bootstrapRequests.add(1);
  if (!check(res, { 'bootstrap 200': (r) => r.status === 200 })) errorRate.add(1);
}

export function cachedEval() {
  const res = http.get(`${BASE_URL}${CACHED_ROUTE}`, {
    headers: { 'x-anonymous-id': `${ANON_PREFIX}-u-${__VU}` },
  });
  cachedEvalDuration.add(res.timings.duration);
  cachedEvalRequests.add(1);
  // The flag checks run before proxying, so a non-200 from the target service
  // (or an unrouted path) still counted a cached evaluation — only total
  // failures (no response) are errors.
  if (res.status === 0) errorRate.add(1);
}

// Diff the counters across the run window and report the TTL hit ratio.
export function teardown(data) {
  if (!data || !data.ok) {
    ttlHitRatio.add(-1);
    return;
  }
  const end = fetchCounters();
  if (!end) {
    ttlHitRatio.add(-1);
    console.error('[flag-load] /metrics unavailable at teardown — ratio unknown');
    return;
  }

  const hits = end.hits - data.hits;
  const reads = end.reads - data.reads;
  const total = hits + reads;
  const ratio = total > 0 ? hits / total : -1;

  const listHits = end.listHits - data.listHits;
  const listReads = end.listReads - data.listReads;
  const listTotal = listHits + listReads;
  const listRatio = listTotal > 0 ? listHits / listTotal : -1;

  ttlHitRatio.add(ratio);
  bootstrapListHitRatio.add(listRatio);

  const summary = {
    windowHits: hits,
    windowRedisReads: reads,
    windowLookups: total,
    ttlHitRatio: ratio === -1 ? 'n/a (no lookups in window)' : ratio.toFixed(6),
    bootstrapListHits: listHits,
    bootstrapListReads: listReads,
    bootstrapListLookups: listTotal,
    bootstrapListHitRatio:
      listRatio === -1 ? 'n/a (no lookups in window)' : listRatio.toFixed(6),
  };
  console.log('[flag-load] cache report: ' + JSON.stringify(summary, null, 2));

  if (ratio >= 0 && ratio < MIN_HIT_RATIO) {
    throw new Error(
      `TTL hit ratio ${ratio.toFixed(4)} is below the ${MIN_HIT_RATIO} threshold — ` +
        `the flag cache is thrashing (check cacheTtlMs / key churn).`
    );
  }
  if (listRatio >= 0 && listRatio < MIN_LIST_HIT_RATIO) {
    throw new Error(
      `Bootstrap list hit ratio ${listRatio.toFixed(4)} is below the ${MIN_LIST_HIT_RATIO} ` +
        `threshold — the list snapshot cache is thrashing (check listCacheTtlMs).`
    );
  }
}
