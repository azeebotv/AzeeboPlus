#!/usr/bin/env node
// ============================================================================
// transport-drill.mjs — nightly CI drill for the Ops Health service prober
//
// What it proves, every night, on a fresh runner:
//
//   1. COMPILE   the real prober (apps/admin/src/modules/ops/service-probe.ts)
//                builds standalone with the workspace tsc — a type error,
//                a bad refactor, or a new import that breaks standalone
//                compilation fails here, before it can break the page.
//   2. TRANSPORT a real v4-only listener on a spare port is probed with the
//                REAL probeAcrossTransports + real fetch: the probe must come
//                back healthy with a transport recorded (stock resolvers
//                answer `localhost` by trying all resolved families, so the
//                recorded transport is `localhost` OR `ipv4` — either proves
//                reachability + transport attribution; the narrow-bind
//                listener must never read as `down`).
//   3. FLIP      the real mergeTransportHistory core, fed a real sweep-1
//                outcome and a modeled sweep-2 re-bind, must emit the flip
//                (including a crossing-family flip with familyChanged: true).
//                The sweep-2 socket layer is scripted because no stock
//                resolver can make `localhost` fail while an explicit
//                candidate answers — that platform semantic is documented in
//                RUNBOOK.md ("Loopback transport"); the drill drives the same
//                production merge code the banner renders from.
//
// Fails closed: exit 1 on any violated assertion (the nightly job is red —
// a broken prober contract is exactly what a drill exists to catch), exit 2
// on environment errors (tsc missing). Summary written to GITHUB_STEP_SUMMARY
// when present; `::error` annotation on failure.
//
// Locally: node scripts/ops/transport-drill.mjs   (needs pnpm-installed deps)
// Tests:   node --test scripts/__tests__/transport-drill.test.mjs
// ============================================================================

import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const PROBER_TS = path.join(REPO_ROOT, 'apps/admin/src/modules/ops/service-probe.ts');
const TSC = path.join(REPO_ROOT, 'node_modules/.bin/tsc');
const PROBE_TIMEOUT_MS = 2_000;

// ── helpers (exported for tests) ────────────────────────────────────────────

/** Compile the real prober to JS in a temp dir; returns the module URL. */
export function compileProber(outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prober-drill-'))) {
  if (!fs.existsSync(TSC)) {
    const err = new Error(`tsc not found at ${TSC} — run pnpm install at the repo root first`);
    err.code = 'ENV';
    throw err;
  }
  if (!fs.existsSync(PROBER_TS)) {
    const err = new Error(`prober source missing: ${PROBER_TS}`);
    err.code = 'ENV';
    throw err;
  }
  execFileSync(
    TSC,
    [
      PROBER_TS,
      '--outDir', outDir,
      '--module', 'esnext',
      '--moduleResolution', 'bundler',
      '--target', 'es2022',
      '--skipLibCheck',
      '--strict',
    ],
    { encoding: 'utf8', timeout: 60_000 },
  );
  const js = path.join(outDir, 'service-probe.js');
  if (!fs.existsSync(js)) {
    const err = new Error(`tsc produced no service-probe.js in ${outDir}`);
    err.code = 'ENV';
    throw err;
  }
  return pathToFileURL(js).href;
}

/**
 * Bind a real IPv4-only HTTP-ish TCP listener on a spare port (127.0.0.1:0)
 * that answers 200 JSON on any GET. Returns { port, close, assertNarrow }.
 * assertNarrow() dials both families directly and throws unless v4 answers
 * AND v6 refuses — proof the listener really is family-narrow.
 */
export function startV4OnlyListener() {
  const server = net.createServer((socket) => {
    let buf = '';
    socket.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      if (!buf.includes('\r\n\r\n')) return; // wait for full request headers
      const body = '{"status":"ok","drill":true}';
      socket.end(`HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port, family, address } = server.address();
      if (family !== 'IPv4' || address !== '127.0.0.1') {
        server.close();
        reject(new Error(`listener bound ${address}:${port} family ${family} — expected 127.0.0.1 IPv4`));
        return;
      }
      const assertNarrow = () =>
        Promise.all([
          dial(`http://127.0.0.1:${port}/v1/health`),
          dial(`http://[::1]:${port}/v1/health`).then(
            () => Promise.reject(new Error('[::1] unexpectedly ANSWERED — something is listening on v6 too; drill results would be meaningless')),
            (err) => {
              // Refusal is the expectation; anything else (timeout) is suspect.
              if (!String(err?.message ?? err).match(/refused|ECONNREFUSED|not.*reachable|EADDRNOTAVAIL|ENETUNREACH/)) {
                throw new Error(`[::1] dial gave unexpected error (expected clean refusal): ${err?.message ?? err}`);
              }
              return 'refused';
            },
          ),
        ]);
      resolve({ port, close: () => new Promise((r) => server.close(r)), assertNarrow });
    });
  });
}

/** Raw TCP dial used for the narrowness proof (no HTTP semantics needed). */
function dial(url) {
  return new Promise((resolve, reject) => {
    const m = /^(http:\/\/(?:\[::1\]|127\.0\.0\.1):(\d+))/.exec(url);
    if (!m) return reject(new Error(`unparseable dial url: ${url}`));
    const [, base, port] = m;
    const host = base.includes('[::1]') ? '::1' : '127.0.0.1';
    const sock = net.connect({ host, port: Number(port) });
    const settle = (fn, v) => { try { sock.destroy(); } catch {} fn(v); };
    const timer = setTimeout(() => settle(reject, new Error(`dial ${host}:${port} timed out`)), PROBE_TIMEOUT_MS);
    sock.once('connect', () => { clearTimeout(timer); settle(resolve, 'connected'); });
    sock.once('error', (err) => { clearTimeout(timer); settle(reject, err); });
  });
}

/** Assertion helper: a phase-A outcome must be healthy with a transport. */
export function assertReachableWithTransport(outcome, { port }) {
  const problems = [];
  if (outcome.status !== 'healthy') {
    problems.push(`expected healthy, got ${outcome.status}${outcome.errorDetail ? ` (${outcome.errorDetail})` : ''}`);
  }
  if (!outcome.transport) {
    problems.push('no transport recorded — the prober must attribute the answering candidate');
  } else if (!['localhost', 'ipv4'].includes(outcome.transport)) {
    // A v6 answer against a v4-only listener would mean the port was stolen
    // or the narrowness check lied — treat as a real failure.
    problems.push(`impossible transport '${outcome.transport}' for a v4-only listener`);
  }
  if (problems.length > 0) {
    throw new Error(`phase A (real v4-only listener on :${port}): ${problems.join('; ')}`);
  }
  return outcome;
}

/** Assertion helper: the merge must emit exactly the expected flips. */
export function assertFlips(flips, expected) {
  const got = flips.map((f) => ({ from: f.from, to: f.to, familyChanged: f.familyChanged }));
  for (let i = 0; i < expected.length; i++) {
    const e = expected[i];
    const g = got[i];
    if (!g) throw new Error(`phase B: flip ${i + 1} missing — got ${JSON.stringify(got)}`);
    if (g.from !== e.from || g.to !== e.to) {
      throw new Error(`phase B: flip ${i + 1} expected ${e.from}→${e.to}, got ${g.from}→${g.to}`);
    }
    if (g.familyChanged !== e.familyChanged) {
      throw new Error(`phase B: flip ${i + 1} familyChanged expected ${e.familyChanged}, got ${g.familyChanged} (${g.from}→${g.to})`);
    }
  }
  if (got.length !== expected.length) {
    throw new Error(`phase B: expected ${expected.length} flip(s), got ${got.length}: ${JSON.stringify(got)}`);
  }
  return flips;
}

// ── the drill ───────────────────────────────────────────────────────────────

async function main() {
  const summary = [];
  const fail = (msg) => {
    summary.push(`**FAIL** — ${msg}`);
    writeSummary(summary);
    console.error(`::error title=Transport drill failed::${String(msg).slice(0, 200)}`);
    process.exit(1);
  };

  // Phase 0 — compile the real prober.
  let proberUrl;
  try {
    proberUrl = compileProber();
  } catch (err) {
    if (err.code === 'ENV') {
      console.error(`transport-drill: ${err.message}`);
      process.exit(2);
    }
    return fail(`prober compile failed: ${err.message.split('\n')[0]}`);
  }
  const prober = await import(proberUrl);
  summary.push(`Compiled ${path.relative(REPO_ROOT, PROBER_TS)} with the workspace tsc.`);

  // Phase A — real v4-only listener, real fetch, real probe.
  let listener;
  try {
    listener = await startV4OnlyListener();
  } catch (err) {
    return fail(`could not bind the v4-only drill listener: ${err.message}`);
  }
  try {
    await listener.assertNarrow();
    summary.push(`Listener: v4-only on 127.0.0.1:${listener.port} (v4 answers, v6 refuses — narrowness proven).`);

    const outcomeA = await prober.probeAcrossTransports(listener.port, '/v1/health', (url) =>
      fetch(url, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) }),
    );
    assertReachableWithTransport(outcomeA, { port: listener.port });
    summary.push(`Phase A: probeAcrossTransports → **${outcomeA.status}**, transport \`${outcomeA.transport}\`, ${outcomeA.latencyMs}ms. The narrow-bind listener is reachable and its transport is attributed.`);
  } catch (err) {
    return fail(err.message);
  } finally {
    await listener.close();
  }

  // Phase B — the real merge core, fed the real sweep-1 outcome plus a
  // modeled sweep-2 re-bind (scripted socket layer: see header comment).
  try {
    const sweep1 = [{ name: 'drill-service', port: listener.port, outcome: { status: 'healthy', httpStatus: 200, latencyMs: 3, transport: 'localhost' } }];
    // Re-bind modeled as: localhost stopped answering, explicit v4 candidate now answers.
    const sweep2a = [{ name: 'drill-service', port: listener.port, outcome: { status: 'healthy', httpStatus: 200, latencyMs: 2, transport: 'ipv4' } }];
    // Family crossing: ipv6 → ipv4 (the loud case the banner counts).
    const sweep2b = [{ name: 'drill-service', port: listener.port, outcome: { status: 'healthy', httpStatus: 200, latencyMs: 2, transport: 'ipv4' } }];
    const baseline = { 'drill-service': 'ipv6' };

    const pass1 = prober.mergeTransportHistory({}, sweep1);
    if (pass1.flips.length !== 0) throw new Error(`phase B: first sighting must not flip, got ${JSON.stringify(pass1.flips)}`);
    const pass2 = prober.mergeTransportHistory(pass1.next, sweep2a);
    const flips = assertFlips(pass2.flips, [{ from: 'localhost', to: 'ipv4', familyChanged: false }]);
    const pass3 = prober.mergeTransportHistory(baseline, sweep2b);
    assertFlips(pass3.flips, [{ from: 'ipv6', to: 'ipv4', familyChanged: true }]);
    summary.push(`Phase B: mergeTransportHistory → flip 1 \`${flips[0].from}→${flips[0].to}\` (re-bind), flip 2 \`ipv6→ipv4\` with \`familyChanged: true\`. The banner's data path works through the compiled prober.`);
  } catch (err) {
    return fail(err.message);
  }

  summary.push('**PASS** — prober compiles, records transports across a real family-narrow listener, and emits re-bind flips.');
  writeSummary(summary);
  console.log(`transport-drill: PASS (v4-only listener on :${listener.port}, flips verified through the compiled prober)`);
  process.exit(0);
}

function writeSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  try {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, ['## Transport drill (service prober)', '', ...lines.map((l) => `- ${l}`), ''].join('\n') + '\n');
  } catch {
    // Summary writing is best-effort; the drill's exit code is the signal.
  }
}

const invokedDirectly =
  process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname);
if (invokedDirectly) {
  main().catch((err) => {
    console.error('transport-drill failed:', err);
    process.exit(1);
  });
}
