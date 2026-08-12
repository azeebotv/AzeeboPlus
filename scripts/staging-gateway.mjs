#!/usr/bin/env node
// Minimal "staging gateway" for CI — same flag machinery the real api-gateway
// uses (FeatureFlagService + FlagMetricsService, service label "api-gateway"),
// served over plain HTTP so a load run and the FlagCacheThrash assertion can
// execute against it with a REAL Redis (no NestJS boot, no service URLs).
//
// Routes mirror the gateway surfaces the load test drives:
//   GET /metrics                   — prometheus counters (flag_cache_hits_total /
//                                     flag_redis_reads_total / list variants)
//   GET /eval                      — evaluates 3 internal flags per request
//                                     (the per-key TTL cache path)
//   GET /feature-flags/bootstrap   — public flags evaluated for the caller's
//                                     x-anonymous-id (the list-snapshot path)
//
// Env: REDIS_URL (default redis://localhost:6379), PORT (default 4017),
//      FLAG_PREFIX (default ci_flags: — never touches real flags).
//
// Build the packages first (dist is gitignored):
//   pnpm --filter @azeebo/feature-flags build
//   pnpm --filter @azeebo/flag-metrics build
// Then: node scripts/staging-gateway.mjs

import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { FeatureFlagService } from '../packages/feature-flags/dist/index.js';
import { FlagMetricsService } from '../packages/flag-metrics/dist/index.js';

const require = createRequire(new URL('../packages/feature-flags/package.json', import.meta.url));
const Redis = require('ioredis');

const PORT = parseInt(process.env.PORT || '4017', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const PREFIX = process.env.FLAG_PREFIX || 'ci_flags:';

const metricsService = new FlagMetricsService('api-gateway', undefined);
const service = new FeatureFlagService({
  redisUrl: REDIS_URL,
  prefix: PREFIX,
  cacheTtlMs: 30_000,
  listCacheTtlMs: 30_000,
  ...metricsService.getFlagHooks(),
});

// Mirror the gateway proxy's per-request flag checks (maintenance/apiV2/cache)
// and the public bootstrap set the web/mobile clients consume.
const INTERNAL_KEYS = ['gateway_maintenance_mode', 'gateway_api_v2', 'gateway_response_cache'];
const PUBLIC_KEYS = [
  'web_maintenance_mode',
  'web_dark_mode',
  'mobile_autoplay',
  'web_low_data_mode',
  'web_autoplay_next',
];

async function seed() {
  const flags = [
    ...INTERNAL_KEYS.map((key, i) => ({
      key,
      enabled: true,
      rolloutPercentage: Math.max(50, 100 - i * 10),
      isPublic: false,
    })),
    ...PUBLIC_KEYS.map((key, i) => ({
      key,
      enabled: true,
      rolloutPercentage: Math.max(50, 90 - i * 5),
      isPublic: true,
    })),
  ];
  for (const flag of flags) await service.setFlag(flag);
  console.log(`[staging-gateway] seeded ${flags.length} flags under ${PREFIX}*`);
}

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'content-type': type });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const anonId = req.headers['x-anonymous-id'] || `anon-${Math.floor(Math.random() * 1000)}`;

  try {
    if (req.method === 'GET' && url.pathname === '/metrics') {
      return send(res, 200, await metricsService.getMetrics(), 'text/plain');
    }
    if (req.method === 'GET' && url.pathname === '/eval') {
      const results = {};
      for (const key of INTERNAL_KEYS) {
        results[key] = await service.isEnabled(key, undefined, anonId);
      }
      return send(res, 200, { success: true, data: results });
    }
    if (req.method === 'GET' && url.pathname === '/feature-flags/bootstrap') {
      const flags = await service.getPublicFlags(undefined, anonId);
      return send(res, 200, {
        success: true,
        data: { flags, generatedAt: new Date().toISOString(), evaluatedFor: 'anonymous' },
      });
    }
    return send(res, 404, { success: false, error: 'not found' });
  } catch (error) {
    return send(res, 500, { success: false, error: String(error) });
  }
});

async function shutdown() {
  server.close();
  await service.onModuleDestroy();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

await seed();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[staging-gateway] listening on :${PORT} (redis ${REDIS_URL}, prefix ${PREFIX})`);
});
