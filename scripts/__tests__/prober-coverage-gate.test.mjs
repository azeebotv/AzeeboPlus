/**
 * Tests for scripts/launchd/prober-coverage-gate.mjs — the CI gate that
 * requires every PROBED_SERVICES entry in ops.service.ts to have a launchd
 * manifest entry (join key: port), so a service can never be added to the
 * Ops Health prober without launchd coverage.
 *
 * Two layers:
 *  - pure unit tests of parse/evaluate helpers (no filesystem needed)
 *  - subprocess runs: the REAL gate against the REAL repo sources (must
 *    pass at HEAD) and against a fake workspace tree (PROBER_COVERAGE_ROOT
 *    seam) for each failure mode
 *
 * Run: node --test scripts/__tests__/prober-coverage-gate.test.mjs
 */
import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../launchd/prober-coverage-gate.mjs',
);

const PROBER_BLOCK = `export const PROBED_SERVICES: Array<{ name: string; port: number }> = [
  { name: 'auth-service', port: 3000 },
  { name: 'wallet-service', port: 3002 },
  { name: 'live-event-service', port: 3027 },
];`;

const MANIFEST_BLOCK = `export const SERVICES = [
  { label: 'auth-service', dir: 'services/core/auth-service', kind: 'node', entry: 'x', wd: '.', port: 3000 },
  { label: 'wallet', dir: 'services/core/wallet-service', kind: 'tsx', entry: 'x', wd: 'x', port: 3002 },
  { label: 'live-event', dir: 'services/universes/live-event-service', kind: 'node', entry: 'x', wd: '.', port: 3027 },
  { label: 'admin-backend', dir: 'apps/admin', kind: 'node', entry: 'x', wd: '.', port: 4016 },
  { label: 'admin-vite', dir: 'apps/admin', kind: 'vite', entry: 'x', wd: 'x', port: 5173 },
];`;

/** Materialize a fake workspace and return its root. */
function fakeWorkspace({ prober = PROBER_BLOCK, manifest = MANIFEST_BLOCK } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prober-gate-'));
  fs.mkdirSync(path.join(root, 'apps/admin/src/modules/ops'), { recursive: true });
  fs.mkdirSync(path.join(root, 'scripts/launchd'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'apps/admin/src/modules/ops/ops.service.ts'),
    `export const X = 1;\n${prober}\n`,
  );
  fs.writeFileSync(path.join(root, 'scripts/launchd/service-manifest.mjs'), `${manifest}\n`);
  return root;
}

function run(root) {
  return execFileSync('node', [SCRIPT], {
    env: { ...process.env, PROBER_COVERAGE_ROOT: root },
    encoding: 'utf8',
  });
}

function runExpectingFailure(root) {
  try {
    execFileSync('node', [SCRIPT], {
      env: { ...process.env, PROBER_COVERAGE_ROOT: root },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    return { status: err.status, stderr: String(err.stderr) };
  }
  assert.fail('gate should have failed');
}

// ---------------------------------------------------------------------------
// Pure parsing

describe('parseProberEntries', () => {
  it('parses every { name, port } entry', async () => {
    const { parseProberEntries } = await import(SCRIPT);
    const r = parseProberEntries(PROBER_BLOCK);
    assert.deepEqual(r.entries, [
      { name: 'auth-service', port: 3000 },
      { name: 'wallet-service', port: 3002 },
      { name: 'live-event-service', port: 3027 },
    ]);
  });

  it('fails loud when the array is missing or shapeless', async () => {
    const { parseProberEntries } = await import(SCRIPT);
    assert.ok(parseProberEntries('const X = 1;').error);
    assert.ok(parseProberEntries('const PROBED_SERVICES = "nope";').error);
  });
});

describe('parseManifestEntries', () => {
  it('parses label/port pairs including multi-line entries', async () => {
    const { parseManifestEntries } = await import(SCRIPT);
    const r = parseManifestEntries(MANIFEST_BLOCK);
    assert.equal(r.entries.length, 5);
    assert.ok(r.entries.find((e) => e.label === 'live-event' && e.port === 3027));
  });

  it('fails loud when SERVICES is missing', async () => {
    const { parseManifestEntries } = await import(SCRIPT);
    assert.ok(parseManifestEntries('export const OTHER = [];').error);
  });
});

describe('evaluate', () => {
  it('passes when every prober port has a manifest entry', async () => {
    const { evaluate, parseProberEntries, parseManifestEntries } = await import(SCRIPT);
    const r = evaluate(parseProberEntries(PROBER_BLOCK).entries, parseManifestEntries(MANIFEST_BLOCK).entries);
    assert.deepEqual(r.problems, []);
    assert.equal(r.ok, true);
  });

  it('fails when a probed service has no manifest entry (the incident)', async () => {
    const { evaluate, parseProberEntries, parseManifestEntries } = await import(SCRIPT);
    const manifest = parseManifestEntries(MANIFEST_BLOCK).entries.filter((e) => e.port !== 3027);
    const r = evaluate(parseProberEntries(PROBER_BLOCK).entries, manifest);
    assert.equal(r.ok, false);
    assert.equal(r.problems.length, 1);
    assert.match(r.problems[0], /live-event-service.*port 3027.*NO launchd manifest entry/);
  });

  it('fails on duplicate ports within either list', async () => {
    const { evaluate, parseProberEntries, parseManifestEntries } = await import(SCRIPT);
    const prober = parseProberEntries(PROBER_BLOCK).entries.concat([
      { name: 'auth-service-again', port: 3000 },
    ]);
    const manifest = parseManifestEntries(MANIFEST_BLOCK).entries.concat([
      { label: 'wallet-alias', port: 3002 },
    ]);
    const r = evaluate(prober, manifest);
    assert.equal(r.ok, false);
    assert.equal(r.problems.length, 2);
    assert.ok(r.problems.some((p) => /prober port 3000/.test(p)));
    assert.ok(r.problems.some((p) => /manifest port 3002/.test(p)));
  });

  it('matches by port even when labels and names disagree (deliberate)', async () => {
    const { evaluate, parseProberEntries, parseManifestEntries } = await import(SCRIPT);
    const manifest = [{ label: 'totally-different-label', port: 3000 }];
    const r = evaluate([{ name: 'auth-service', port: 3000 }], manifest);
    assert.equal(r.ok, true);
  });
});

// ---------------------------------------------------------------------------
// Subprocess: real repo at HEAD

describe('subprocess against the real repo', () => {
  const repoRoot = path.resolve(path.dirname(SCRIPT), '..', '..');

  it('passes on the committed fleet (every probed service has a plist)', () => {
    const out = run(repoRoot);
    assert.match(out, /all 28 probed services have manifest coverage/);
  });
});

// ---------------------------------------------------------------------------
// Subprocess: failure modes against a fake tree

describe('subprocess failure modes', () => {
  it('exit 1 with a named violation when a probed service lacks a manifest entry', () => {
    const root = fakeWorkspace({
      manifest: MANIFEST_BLOCK.replace(
        /\n\s*\{ label: 'live-event'.*?port: 3027 \},/s,
        '',
      ),
    });
    const { status, stderr } = runExpectingFailure(root);
    assert.equal(status, 1);
    assert.match(stderr, /live-event-service.*NO launchd manifest entry/);
  });

  it('exit 1 when PROBED_SERVICES cannot be parsed (rename/shape drift)', () => {
    const root = fakeWorkspace({ prober: 'export const FLEET_LIST = 1;' });
    const { status, stderr } = runExpectingFailure(root);
    assert.equal(status, 1);
    assert.match(stderr, /PROBED_SERVICES array not found/);
  });

  it('exit 1 when the manifest cannot be parsed', () => {
    const root = fakeWorkspace({ manifest: 'export const SERVICES = 42;' });
    const { status, stderr } = runExpectingFailure(root);
    assert.equal(status, 1);
    assert.match(stderr, /SERVICES array not found/);
  });

  it('exit 1 when PROBED_SERVICES parses but has no entries', () => {
    const root = fakeWorkspace({ prober: 'export const PROBED_SERVICES = [\n];' });
    const { status, stderr } = runExpectingFailure(root);
    assert.equal(status, 1);
    assert.match(stderr, /no \{ name, port \} entries parsed/);
  });

  it('exit 1 on duplicate prober ports (double-probe)', () => {
    const root = fakeWorkspace({
      prober: PROBER_BLOCK.replace(
        "];",
        "  { name: 'auth-service-dup', port: 3000 },\n];",
      ),
    });
    const { status, stderr } = runExpectingFailure(root);
    assert.equal(status, 1);
    assert.match(stderr, /prober port 3000 claimed by/);
  });
});
