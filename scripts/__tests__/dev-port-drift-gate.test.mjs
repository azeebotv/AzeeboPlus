/**
 * Tests for scripts/launchd/dev-port-drift-gate.mjs — the CI gate that
 * requires every launchd manifest dev entry (kinds vite/next/expo) to equal
 * the matching app dev-server port, and vice versa, so dev-port drift can
 * never reappear. The drift is real history: the admin vite config once
 * served 4100 (admin-backend's port — fixed in 9ca2b491), `next dev`
 * unpinned defaults to 3000 (auth-service's port), and two unpinned
 * `expo start` dev servers (mobile + tv) would collide on Metro 8081.
 *
 * Two layers (mirrors the prober-coverage-gate test conventions):
 *  - pure unit tests of parse/evaluate helpers (no filesystem needed)
 *  - subprocess runs: the REAL gate against the REAL repo (must pass at
 *    HEAD) and against a fake workspace tree (DEV_PORT_DRIFT_ROOT seam)
 *    for each failure mode
 *
 * Run: node --test scripts/__tests__/dev-port-drift-gate.test.mjs
 */
import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseManifestDevEntries,
  parseViteServerPort,
  parseNextDevPort,
  parseExpoDevPort,
  evaluateDevPortDrift,
} from '../launchd/dev-port-drift-gate.mjs';

const SCRIPT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../launchd/dev-port-drift-gate.mjs',
);

const MANIFEST_BLOCK = `export const SERVICES = [
  { label: 'admin-backend', dir: 'apps/admin', kind: 'node', entry: 'apps/admin/dist/main.js', wd: '.', port: 4016 },
  { label: 'admin-vite', dir: 'apps/admin', kind: 'vite', entry: 'node_modules/vite/bin/vite.js', wd: 'apps/admin', port: 5173 },
  { label: 'web-dev', dir: 'apps/web', kind: 'next', entry: 'node_modules/next/dist/bin/next', wd: 'apps/web', port: 4000 },
  { label: 'mobile-dev', dir: 'apps/mobile', kind: 'expo', entry: 'apps/mobile/node_modules/expo/bin/cli', wd: 'apps/mobile', port: 8081 },
  { label: 'tv-dev', dir: 'apps/tv', kind: 'expo', entry: 'apps/tv/node_modules/expo/bin/cli', wd: 'apps/tv', port: 8082 },
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

const pkgJson = (scripts) => JSON.stringify({ scripts }, null, 2);

describe('parseManifestDevEntries', () => {
  it('extracts vite/next/expo entries and ignores non-dev kinds', () => {
    const r = parseManifestDevEntries(MANIFEST_BLOCK);
    assert.deepEqual(r.entries, [
      { label: 'admin-vite', dir: 'apps/admin', kind: 'vite', port: 5173 },
      { label: 'web-dev', dir: 'apps/web', kind: 'next', port: 4000 },
      { label: 'mobile-dev', dir: 'apps/mobile', kind: 'expo', port: 8081 },
      { label: 'tv-dev', dir: 'apps/tv', kind: 'expo', port: 8082 },
    ]);
  });

  it('is line-based: a later entry port cannot bleed into an earlier one', () => {
    const src = `export const SERVICES = [
  { label: 'a-vite', dir: 'apps/a', kind: 'vite', port: 1000 },
  { label: 'b-vite', dir: 'apps/b', kind: 'vite', port: 2000 },
];`;
    assert.deepEqual(parseManifestDevEntries(src).entries, [
      { label: 'a-vite', dir: 'apps/a', kind: 'vite', port: 1000 },
      { label: 'b-vite', dir: 'apps/b', kind: 'vite', port: 2000 },
    ]);
  });

  it('fails loud when the SERVICES array is missing or has no dev entries', () => {
    assert.ok('error' in parseManifestDevEntries('export const OTHER = 1;'));
    assert.ok(
      'error' in
        parseManifestDevEntries(
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
          'export default { server: { port: Number(process.env.PORT) } };'
        )
    );
  });
});

describe('parseNextDevPort', () => {
  it('reads -p and --port and --port= forms', () => {
    assert.equal(parseNextDevPort(pkgJson({ dev: 'next dev -p 4000' })).port, 4000);
    assert.equal(parseNextDevPort(pkgJson({ dev: 'next dev --port 4000' })).port, 4000);
    assert.equal(parseNextDevPort(pkgJson({ dev: 'next dev --port=4000' })).port, 4000);
    assert.equal(
      parseNextDevPort(pkgJson({ dev: 'NODE_ENV=development next dev -p 4000' })).port,
      4000,
    );
  });

  it('fails loud when unpinned — next dev defaults to 3000 (auth-service port)', () => {
    const r = parseNextDevPort(pkgJson({ dev: 'next dev' }));
    assert.ok('error' in r);
    assert.match(r.error, /3000/);
    assert.match(r.error, /auth-service/);
  });

  it('fails loud on missing script or invalid JSON', () => {
    assert.ok('error' in parseNextDevPort(pkgJson({ build: 'next build' })));
    assert.ok('error' in parseNextDevPort('{ not json'));
  });
});

describe('parseExpoDevPort', () => {
  it('reads --port form', () => {
    assert.equal(parseExpoDevPort(pkgJson({ start: 'expo start --port 8081' })).port, 8081);
    assert.equal(parseExpoDevPort(pkgJson({ start: 'expo start --web --port 8082' })).port, 8082);
  });

  it('fails loud when unpinned — Metro defaults to 8081 and Expo apps collide', () => {
    const r = parseExpoDevPort(pkgJson({ start: 'expo start' }));
    assert.ok('error' in r);
    assert.match(r.error, /8081/);
    assert.match(r.error, /collide/);
  });
});

describe('evaluateDevPortDrift', () => {
  const manifest = [
    { label: 'admin-vite', dir: 'apps/admin', kind: 'vite', port: 5173 },
    { label: 'web-dev', dir: 'apps/web', kind: 'next', port: 4000 },
    { label: 'mobile-dev', dir: 'apps/mobile', kind: 'expo', port: 8081 },
  ];

  it('passes when every port matches across all three kinds', () => {
    const problems = evaluateDevPortDrift(manifest, [
      { dir: 'apps/admin', kind: 'vite', source: viteConfig(5173) },
      { dir: 'apps/web', kind: 'next', source: pkgJson({ dev: 'next dev -p 4000' }) },
      { dir: 'apps/mobile', kind: 'expo', source: pkgJson({ start: 'expo start --port 8081' }) },
    ]);
    assert.deepEqual(problems, []);
  });

  it('flags a drifted port with both sides named', () => {
    const problems = evaluateDevPortDrift(manifest, [
      { dir: 'apps/admin', kind: 'vite', source: viteConfig(4100) },
      { dir: 'apps/web', kind: 'next', source: pkgJson({ dev: 'next dev -p 4000' }) },
      { dir: 'apps/mobile', kind: 'expo', source: pkgJson({ start: 'expo start --port 8081' }) },
    ]);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /apps\/admin/);
    assert.match(problems[0], /4100/);
    assert.match(problems[0], /5173/);
    assert.match(problems[0], /admin-vite/);
  });

  it('flags an unpinned next dev script (the 3000/auth-service trap)', () => {
    const problems = evaluateDevPortDrift(manifest, [
      { dir: 'apps/admin', kind: 'vite', source: viteConfig(5173) },
      { dir: 'apps/web', kind: 'next', source: pkgJson({ dev: 'next dev' }) },
      { dir: 'apps/mobile', kind: 'expo', source: pkgJson({ start: 'expo start --port 8081' }) },
    ]);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /apps\/web/);
    assert.match(problems[0], /3000/);
  });

  it('flags a manifest dev entry with no app config at all', () => {
    const problems = evaluateDevPortDrift(manifest, [
      { dir: 'apps/admin', kind: 'vite', source: viteConfig(5173) },
      { dir: 'apps/mobile', kind: 'expo', source: pkgJson({ start: 'expo start --port 8081' }) },
    ]);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /apps\/web.*package\.json/);
  });

  it('flags an uncovered app dev config (coverage both directions)', () => {
    const problems = evaluateDevPortDrift(manifest, [
      { dir: 'apps/admin', kind: 'vite', source: viteConfig(5173) },
      { dir: 'apps/web', kind: 'next', source: pkgJson({ dev: 'next dev -p 4000' }) },
      { dir: 'apps/mobile', kind: 'expo', source: pkgJson({ start: 'expo start --port 8081' }) },
      { dir: 'apps/tv', kind: 'expo', source: pkgJson({ start: 'expo start --port 8082' }) },
    ]);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /apps\/tv/);
    assert.match(problems[0], /no 'expo' launchd manifest entry/);
  });

  it('distinguishes configs by (dir, kind) — same dir cannot mask another kind', () => {
    // apps/admin manifest expects a vite entry; an unrelated next config in
    // the same dir must NOT satisfy it.
    const problems = evaluateDevPortDrift(
      [{ label: 'admin-vite', dir: 'apps/admin', kind: 'vite', port: 5173 }],
      [{ dir: 'apps/admin', kind: 'next', source: pkgJson({ dev: 'next dev -p 5173' }) }],
    );
    assert.equal(problems.length, 2);
    assert.match(problems[0], /has no .*vite\.config\.ts/);
    // The stray next config is reported as UNCOVERED by a next entry —
    // the coverage check speaks the config's kind, not the manifest's.
    assert.match(problems[1], /apps\/admin \(next\): no 'next' launchd manifest entry/);
  });

  it('flags an unparseable config (fail loud, never silently pass)', () => {
    const problems = evaluateDevPortDrift(manifest, [
      { dir: 'apps/admin', kind: 'vite', source: 'export default {};' },
      { dir: 'apps/web', kind: 'next', source: pkgJson({ dev: 'next dev -p 4000' }) },
      { dir: 'apps/mobile', kind: 'expo', source: pkgJson({ start: 'expo start --port 8081' }) },
    ]);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /server block not found/);
  });
});

// ── subprocess runs ────────────────────────────────────────────────────────

describe('dev-port-drift-gate CLI', () => {
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

  const writeFakeTree = (root, manifestSource) => {
    fs.mkdirSync(path.join(root, 'scripts/launchd'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'scripts/launchd/service-manifest.mjs'),
      manifestSource,
    );
  };

  it('passes against the real repo at HEAD (all dev ports in sync)', () => {
    const out = run();
    assert.match(out, /manifest dev entries match/);
  });

  it('fails against a fake tree with a drifted vite port', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-drift-'));
    try {
      writeFakeTree(root, MANIFEST_BLOCK);
      fs.mkdirSync(path.join(root, 'apps/admin/client'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'apps/admin/client/vite.config.ts'),
        viteConfig(4100),
      );
      const r = runExpectFailure({ DEV_PORT_DRIFT_ROOT: root });
      assert.ok(r, 'gate should have failed');
      assert.equal(r.status, 1);
      assert.match(r.stderr, /4100 .*5173|5173 .*4100/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails against a fake tree where next dev is unpinned (the 3000 trap)', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-drift-'));
    try {
      writeFakeTree(root, MANIFEST_BLOCK);
      fs.mkdirSync(path.join(root, 'apps/web'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'apps/web/package.json'),
        pkgJson({ dev: 'next dev' }),
      );
      const r = runExpectFailure({ DEV_PORT_DRIFT_ROOT: root });
      assert.ok(r, 'gate should have failed');
      assert.match(r.stderr, /3000/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails against a fake tree with two colliding unpinned expo apps', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-drift-'));
    try {
      writeFakeTree(root, MANIFEST_BLOCK);
      for (const app of ['apps/mobile', 'apps/tv']) {
        fs.mkdirSync(path.join(root, app), { recursive: true });
        fs.writeFileSync(
          path.join(root, app, 'package.json'),
          pkgJson({ start: 'expo start' }),
        );
      }
      const r = runExpectFailure({ DEV_PORT_DRIFT_ROOT: root });
      assert.ok(r, 'gate should have failed');
      assert.match(r.stderr, /8081/);
      // Both apps must be called out.
      assert.match(r.stderr, /apps\/mobile/);
      assert.match(r.stderr, /apps\/tv/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails loud when the manifest is unparseable', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-drift-'));
    try {
      writeFakeTree(root, 'export const SERVICES = broken;');
      const r = runExpectFailure({ DEV_PORT_DRIFT_ROOT: root });
      assert.ok(r, 'gate should have failed');
      assert.match(r.stderr, /SERVICES array not found/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
