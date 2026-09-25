/**
 * Tests for scripts/ops/transport-drill.mjs — the nightly CI drill for the
 * Ops Health service prober.
 *
 * Layers:
 *  - pure assertion-helper cases (the drill's failure vocabulary)
 *  - REAL listener test: startV4OnlyListener binds, assertNarrow proves the
 *    v4-only property against actual sockets, close releases the port
 *  - REAL subprocess drill: the whole script runs against the repo (compiles
 *    the prober with the workspace tsc, probes the listener, checks flips)
 *    and must PASS at HEAD — the same command CI runs
 *
 * Run: node --test scripts/__tests__/transport-drill.test.mjs
 */
import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DRILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../ops/transport-drill.mjs');

const OK = (transport) => ({ status: 'healthy', httpStatus: 200, latencyMs: 3, transport });
const DOWN = (detail) => ({ status: 'down', latencyMs: 30, errorDetail: detail });

describe('assertReachableWithTransport', () => {
  it('accepts a healthy outcome with a v4-ish transport', async () => {
    const { assertReachableWithTransport } = await import(DRILL);
    assert.doesNotThrow(() => assertReachableWithTransport(OK('ipv4'), { port: 40000 }));
    assert.doesNotThrow(() => assertReachableWithTransport(OK('localhost'), { port: 40000 }));
  });

  it('rejects down / transport-less outcomes with the recorded detail', async () => {
    const { assertReachableWithTransport } = await import(DRILL);
    assert.throws(() => assertReachableWithTransport(DOWN('ECONNREFUSED'), { port: 40000 }), /expected healthy.*ECONNREFUSED/);
    assert.throws(() => assertReachableWithTransport({ status: 'healthy', latencyMs: 1 }, { port: 40000 }), /no transport recorded/);
  });

  it('treats a v6 answer against a v4-only listener as impossible', async () => {
    const { assertReachableWithTransport } = await import(DRILL);
    assert.throws(() => assertReachableWithTransport(OK('ipv6'), { port: 40000 }), /impossible transport 'ipv6'/);
  });
});

describe('assertFlips', () => {
  const flip = (from, to, familyChanged) => ({ from, to, familyChanged });

  it('accepts exactly the expected flip sequence', async () => {
    const { assertFlips } = await import(DRILL);
    assert.doesNotThrow(() =>
      assertFlips(
        [flip('localhost', 'ipv4', false), flip('ipv6', 'ipv4', true)],
        [{ from: 'localhost', to: 'ipv4', familyChanged: false }, { from: 'ipv6', to: 'ipv4', familyChanged: true }],
      ),
    );
  });

  it('rejects missing, wrong-transition, wrong-family, and extra flips', async () => {
    const { assertFlips } = await import(DRILL);
    assert.throws(() => assertFlips([], [{ from: 'localhost', to: 'ipv4', familyChanged: false }]), /flip 1 missing/);
    assert.throws(
      () => assertFlips([flip('localhost', 'ipv6', false)], [{ from: 'localhost', to: 'ipv4', familyChanged: false }]),
      /expected localhost→ipv4, got localhost→ipv6/,
    );
    assert.throws(
      () => assertFlips([flip('ipv6', 'ipv4', false)], [{ from: 'ipv6', to: 'ipv4', familyChanged: true }]),
      /familyChanged expected true, got false/,
    );
    assert.throws(
      () => assertFlips([flip('localhost', 'ipv4', false), flip('ipv4', 'ipv6', true)], [{ from: 'localhost', to: 'ipv4', familyChanged: false }]),
      /expected 1 flip\(s\), got 2/,
    );
  });
});

describe('startV4OnlyListener (real sockets)', () => {
  it('binds a genuinely v4-only listener and proves its own narrowness', async () => {
    const { startV4OnlyListener } = await import(DRILL);
    const listener = await startV4OnlyListener();
    try {
      assert.equal(typeof listener.port, 'number');
      assert.ok(listener.port > 0);
      // The listener answers HTTP on v4...
      const res = await fetch(`http://127.0.0.1:${listener.port}/v1/health`, { signal: AbortSignal.timeout(2000) });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.drill, true);
      // ...and assertNarrow proves v6 refuses (the property the drill depends on).
      await listener.assertNarrow();
    } finally {
      await listener.close();
    }
  });
});

describe('subprocess: the real drill', () => {
  it('passes at HEAD: compiles the prober, probes the listener, verifies flips', () => {
    const out = execFileSync('node', [DRILL], { encoding: 'utf8', timeout: 120_000, stdio: ['ignore', 'pipe', 'pipe'] });
    assert.match(out, /transport-drill: PASS/);
    assert.match(out, /v4-only listener on :\d+/);
    assert.match(out, /flips verified through the compiled prober/);
  });
});
