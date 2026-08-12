#!/usr/bin/env node
// HTTP load against the staging gateway (scripts/staging-gateway.mjs) for the
// dockerized CI job. Hammers /eval (per-key TTL cache path) and
// /feature-flags/bootstrap (list-snapshot path) with rotating anonymous ids,
// then prints a small summary. Production-scale runs use the k6 script
// (scripts/flag-eval-load-test.js); this is the dependency-free CI load.
//
// Env: BASE_URL (default http://localhost:4017), REQUESTS (default 4000),
//      CONCURRENCY (default 50), BOOTSTRAP_SHARE (0-1, default 0.5).

const BASE_URL = process.env.BASE_URL || 'http://localhost:4017';
const REQUESTS = parseInt(process.env.REQUESTS || '4000', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '50', 10);
const BOOTSTRAP_SHARE = parseFloat(process.env.BOOTSTRAP_SHARE || '0.5');

const EVAL_URL = `${BASE_URL}/eval`;
const BOOTSTRAP_URL = `${BASE_URL}/feature-flags/bootstrap`;

let next = 0;
let errors = 0;
let bootstraps = 0;
let evals = 0;
const durations = [];

async function one(i) {
  const start = Date.now();
  const useBootstrap = Math.random() < BOOTSTRAP_SHARE;
  const url = useBootstrap ? BOOTSTRAP_URL : EVAL_URL;
  try {
    const res = await fetch(url, {
      headers: { 'x-anonymous-id': `ci-u-${i % 200}` },
    });
    if (res.status !== 200) errors += 1;
    if (useBootstrap) bootstraps += 1;
    else evals += 1;
  } catch {
    errors += 1;
  }
  durations.push(Date.now() - start);
}

async function worker() {
  while (true) {
    const i = next;
    next += 1;
    if (i >= REQUESTS) return;
    await one(i);
  }
}

const startMs = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
const elapsedMs = Date.now() - startMs;

durations.sort((a, b) => a - b);
const p95 = durations[Math.floor(durations.length * 0.95)];
const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

const summary = {
  requests: REQUESTS,
  bootstraps,
  evals,
  errors,
  elapsedMs,
  rps: Math.round(REQUESTS / (elapsedMs / 1000)),
  latencyMs: { avg: +avg.toFixed(1), p95 },
};
console.log('[flag-load-http] summary: ' + JSON.stringify(summary, null, 2));

if (errors > 0 || evals === 0 || bootstraps === 0) {
  console.error(
    `[flag-load-http] FAIL — ${errors} errors, ${evals} evals, ${bootstraps} bootstraps`
  );
  process.exit(1);
}
console.log('[flag-load-http] OK');
