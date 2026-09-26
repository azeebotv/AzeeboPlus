/**
 * Tests for scripts/launchd/vite-port-drift-gate.mjs — the CI gate that
 * requires every launchd manifest kind:'vite' entry to equal the matching
 * vite.config.ts server.port (and vice versa), so SPA dev-port drift can
 * never reappear (the admin SPA once served admin-backend's 4100 while the
 * manifest said 5173 — fixed in 9ca2b491).
 *
 * Two layers (mirrors the prober-coverage-gate test conventions):
 *  - pure unit tests of parse/evaluate helpers (no filesystem needed)
 *  - subprocess runs: the REAL gate against the REAL repo (must pass at
 *    HEAD) and against a fake workspace tree (VITE_PORT_DRIFT_ROOT seam)
 *    for each failure mode
 *
 * Run: node --test scripts/__tests__/vite-port-drift-gate.test.mjs
 */
import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseManifestViteEntries,
  parseViteServerPort,
  evaluateVitePortDrift,
} from '../launchd/vite-port-drift-gate.mjs';

const SCRIPT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../launchd/vite-port-drift-gate.mjs',
);

const MANIFEST_BLOCK = `export const SERVICES = [
  { label: 'admin-backend', dir: 'apps/admin', kind: 'node', entry: 'apps/admin/dist/main.js', wd: '.', port: 4016 },
  { label: 'admin-vite', dir: 'apps/admin', kind: 'vite', entry: 'node_modules/vite/bin/vite.js', wd: 'apps/admin', port: 5173 },
  { label: 'creator-vite', dir: 'apps/creator', kind: 'vite', entry: 'apps/creator/node_modules/vite/bin/vite.js', wd: 'apps/creator', port: 5174 },
];`;

const viteConfig = (port) => `export default defineConfig({
  server: {
    // Dedicated dev port — must match the manifest entry.
    port: ${port},
    proxy: {
      '/api': {
        target: 'http://localhost:3013',
        changeOrigin: true,
      },
    },
  },
});`;

describe('parseManifestViteEntries', () => {
  it('extracts only kind:vite entries with label, dir, port', () => {
    const r = parseManifestViteEntries(MANIFEST_BLOCK);
    assert.deepEqual(r.entries, [
      { label: 'admin-vite', dir: 'apps/admin', port: 5173 },
      { label: 'creator-vite', dir: 'apps/creator', port: 5174 },
    ]);
  });

  it('is line-based: a later entry port cannot bleed into an earlier one', () => {
    const src = `export const SERVICES = [
  { label: 'a-vite', dir: 'apps/a', kind: 'vite', port: 1000 },
  { label: 'b-vite', dir: 'apps/b', kind: 'vite', port: 2000 },
];`;
    assert.deepEqual(parseManifestViteEntries(src).entries, [
      { label: 'a-vite', dir: 'apps/a', port: 1000 },
      { label: 'b-vite', dir: 'apps/b', port: 2000 },
    ]);
  });

  it('fails loud when the SERVICES array is missing or has no vite entries', () => {
    assert.ok('error' in parseManifestViteEntries('export const OTHER = 1;'));
    assert.ok(
      'error' in
        parseManifestViteEntries(
          "export const SERVICES = [\n  { label: 'x', dir: 'y', kind: 'node', port: 1 },\n];"
        )
    );
  });
});

describe('parseViteServerPort', () => {
  it('reads the numeric port inside the server block (proxy cannot swallow it)', () => {
    assert.equal(parseViteServerPort(viteConfig(5173)).port, 5173);
    assert.equal(parseViteServerPort(viteConfig(5174)).port, 5174);
  });

  it('fails loud on a missing server block or a non-numeric port', () => {
    assert.ok('error' in parseViteServerPort('export default {};'));
    assert.ok(
      'error' in
        parseViteServerPort(
          "export default { server: { port: Number(process.env.PORT) } };"
        )
    );
  });
});

describe('evaluateVitePortDrift', () => {
  const manifest = [
    { label: 'admin-vite', dir: 'apps/admin', port: 5173 },
    { label: 'creator-vite', dir: 'apps/creator', port: 5174 },
  ];

  it('passes when every port matches (in-memory sources)', () => {
    const problems = evaluateVitePortDrift(manifest, [
      { dir: 'apps/admin', source: viteConfig(5173) },
      { dir: 'apps/creator', source: viteConfig(5174) },
    ]);
    assert.deepEqual(problems, []);
  });

  it('flags a drifted port with both sides named', () => {
    const problems = evaluateVitePortDrift(manifest, [
      { dir: 'apps/admin', source: viteConfig(4100) },
      { dir: 'apps/creator', source: viteConfig(5174) },
    ]);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /apps\/admin\/client\/vite\.config\.ts/);
    assert.match(problems[0], /4100/);
    assert.match(problems[0], /5173/);
    assert.match(problems[0], /admin-vite/);
  });

  it('flags a manifest vite entry with no vite config at all', () => {
    const problems = evaluateVitePortDrift(manifest, [
      { dir: 'apps/creator', source: viteConfig(5174) },
    ]);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /has no .*vite\.config\.ts/);
  });

  it('flags an uncovered vite config (coverage both directions)', () => {
    const problems = evaluateVitePortDrift(manifest, [
      { dir: 'apps/admin', source: viteConfig(5173) },
      { dir: 'apps/creator', source: viteConfig(5174) },
      { dir: 'apps/mystery', source: viteConfig(6000) },
    ]);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /apps\/mystery/);
    assert.match(problems[0], /no kind:'vite' launchd manifest entry/);
  });

  it('flags an unparseable vite config (fail loud, never silently pass)', () => {
    const problems = evaluateVitePortDrift(manifest, [
      { dir: 'apps/admin', source: 'export default {};' },
      { dir: 'apps/creator', source: viteConfig(5174) },
    ]);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /server block not found/);
  });
});

// ── subprocess runs ────────────────────────────────────────────────────────

describe('vite-port-drift-gate CLI', () => {
  const run = (env = {}) =>
    execFileSync('node', [SCRIPT], {
      encoding: 'utf8',
      env: { ...process.env, ...env },
    });

  const runExpectFailure = (env = {}) => {
    try {
      execFileSync('node', [SCRIPT], {
        encoding: 'utf8',
        env: { ...process.env, ...env },
      });
    } catch (e) {
      return { status: e.status, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
    }
    return null; // did not fail — caller asserts null
  };

  it('passes against the real repo at HEAD (ports currently in sync)', () => {
    const out = run();
    assert.match(out, /manifest vite entr/);
  });

  it('fails against a fake tree with a drifted vite port', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-drift-'));
    try {
      fs.mkdirSync(path.join(root, 'scripts/launchd'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'scripts/launchd/service-manifest.mjs'),
        MANIFEST_BLOCK,
      );
      fs.mkdirSync(path.join(root, 'apps/admin/client'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'apps/admin/client/vite.config.ts'),
        viteConfig(4100),
      );
      const r = runExpectFailure({ VITE_PORT_DRIFT_ROOT: root });
      assert.ok(r, 'gate should have failed');
      assert.equal(r.status, 1);
      assert.match(r.stderr, /4100 .*5173|5173 .*4100/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails when a fake tree has no vite config for a manifest vite entry', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-drift-'));
    try {
      fs.mkdirSync(path.join(root, 'scripts/launchd'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'scripts/launchd/service-manifest.mjs'),
        MANIFEST_BLOCK,
      );
      const r = runExpectFailure({ VITE_PORT_DRIFT_ROOT: root });
      assert.ok(r, 'gate should have failed');
      assert.match(r.stderr, /has no .*vite\.config\.ts/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails loud when the manifest is unparseable', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-drift-'));
    try {
      fs.mkdirSync(path.join(root, 'scripts/launchd'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'scripts/launchd/service-manifest.mjs'),
        'export const SERVICES = broken;',
      );
      const r = runExpectFailure({ VITE_PORT_DRIFT_ROOT: root });
      assert.ok(r, 'gate should have failed');
      assert.match(r.stderr, /SERVICES array not found/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
