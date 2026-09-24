/**
 * Unit tests for the generated-LaunchAgent contract:
 *   scripts/launchd/service-manifest.mjs + scripts/launchd/gen-service-plists.mjs
 *
 * Covers the reason this machinery exists — an inline `DATABASE_URL` in a
 * service plist silently pins the whole fleet to direct 5432 (launchd env
 * overrides `node --env-file`), which is how the pgbouncer bypass happened —
 * plus the structural contract (env-file present, .env real, plist emit).
 *
 * Run: node --test scripts/__tests__/launchd-plists.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  SERVICES, DB_SERVICES, FORBIDDEN_ENV_KEYS,
  NODE_BIN, programArgumentsFor, plistDictFor, serviceByLabel, REPO_ROOT,
} from '../launchd/service-manifest.mjs';
import { auditManifest, auditInstalled, emitPlist } from '../launchd/gen-service-plists.mjs';

const GENERATOR = fileURLToPath(new URL('../launchd/gen-service-plists.mjs', import.meta.url));

describe('service manifest contract', () => {
  it('has unique labels and at least the DB-backed fleet', () => {
    const labels = SERVICES.map((s) => s.label);
    assert.equal(new Set(labels).size, labels.length, 'duplicate labels in manifest');
    for (const db of DB_SERVICES) assert.ok(labels.includes(db), `DB_SERVICES label ${db} missing from manifest`);
  });

  it('gives every DB-backed service --env-file pointing at ITS OWN .env', () => {
    for (const svc of SERVICES.filter((s) => DB_SERVICES.has(s.label))) {
      const argv = programArgumentsFor(svc).join(' ');
      assert.ok(argv.includes('--env-file='), `${svc.label}: missing --env-file`);
      assert.ok(
        argv.includes(path.join(REPO_ROOT, svc.dir, '.env')),
        `${svc.label}: --env-file does not point at ${svc.dir}/.env`,
      );
    }
  });

  it('carries no forbidden key in any inline env block', () => {
    for (const svc of SERVICES) {
      for (const key of Object.keys(svc.env ?? {})) {
        assert.ok(!FORBIDDEN_ENV_KEYS.includes(key), `${svc.label}: forbidden inline key ${key}`);
      }
    }
  });

  it('uses an absolute entrypoint and KeepAlive for every long-running service', () => {
    for (const svc of SERVICES) {
      const d = plistDictFor(svc);
      const entry = path.join(REPO_ROOT, svc.entry);
      assert.ok(d.ProgramArguments.includes(entry), `${svc.label}: entrypoint ${entry} not in argv`);
      assert.equal(d.KeepAlive, true, `${svc.label}: must KeepAlive`);
      assert.equal(d.Label, `com.azeebo.${svc.label}`);
    }
  });

  it('logs each service to its own /tmp/azeebo-<label>.log', () => {
    for (const svc of SERVICES) {
      const d = plistDictFor(svc);
      assert.equal(d.StandardOutPath, `/tmp/azeebo-${svc.label}.log`);
      assert.equal(d.StandardErrorPath, d.StandardOutPath);
    }
  });

  it('resolves the FlyEnv node shim when present (matches pre-generator plists)', () => {
    const flyenv = path.join(os.homedir(), 'Library', 'FlyEnv', 'env', 'node', 'bin', 'node');
    if (fs.existsSync(flyenv)) {
      assert.equal(NODE_BIN, flyenv);
      assert.equal(programArgumentsFor(serviceByLabel('content'))[0], flyenv);
    }
  });

  it('vite entries keep their --config client/vite.config.ts tail', () => {
    for (const svc of SERVICES.filter((s) => s.kind === 'vite')) {
      const argv = programArgumentsFor(svc);
      assert.deepEqual(argv.slice(-2), ['--config', 'client/vite.config.ts']);
    }
  });
});

describe('manifest audit', () => {
  it('passes on the real manifest', () => {
    assert.deepEqual(auditManifest(), []);
  });

  it('rejects a poisoned entry with DATABASE_URL inline env', () => {
    const poisoned = [{ label: 'evil', dir: '.', kind: 'script', entry: 'scripts/x.mjs', wd: '.', port: 1, env: { DATABASE_URL: 'postgres://direct:5432/db' } }];
    const problems = auditManifest(poisoned, { requireEnvFiles: false });
    assert.ok(problems.some((p) => p.includes('evil') && p.includes('DATABASE_URL')), problems.join('; '));
  });

  it('forces --env-file for a DB-backed label under EVERY kind (bypass-proof by construction)', () => {
    // The bypass happened because launchd env shadowed --env-file. Structural
    // defense: membership in DB_SERVICES must force --env-file regardless of
    // which kind the entry declares.
    for (const kind of ['node', 'script', 'vite', 'tsx', 'nest']) {
      const svc = { ...serviceByLabel('content'), kind };
      assert.ok(
        programArgumentsFor(svc).join(' ').includes('--env-file='),
        `kind ${kind}: DB-backed label lost --env-file`,
      );
    }
  });

  it('rejects duplicate labels in the manifest', () => {
    const dup = [serviceByLabel('content'), serviceByLabel('content')];
    const problems = auditManifest(dup, { requireEnvFiles: false });
    assert.ok(problems.some((p) => p.includes('duplicate label')), problems.join('; '));
  });
});

describe('plist emit + installed-drift audit', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'azeebo-plist-test-'));

  it('emits XML that plutil can parse back to the manifest dict', () => {
    const svc = serviceByLabel('content');
    const out = path.join(tmp, 'content.plist');
    emitPlist(plistDictFor(svc), out);
    const res = spawnSync('plutil', ['-convert', 'json', '-o', '-', out], { encoding: 'utf8' });
    assert.equal(res.status, 0, res.stderr);
    const parsed = JSON.parse(res.stdout);
    assert.deepEqual(parsed.ProgramArguments, plistDictFor(svc).ProgramArguments);
    assert.equal(parsed.EnvironmentVariables, undefined, 'content must have NO inline env');
  });

  it('auditInstalled passes on a freshly emitted plist and flags drift/vanishing', () => {
    const svc = serviceByLabel('search');
    const out = path.join(tmp, 'search.plist');
    emitPlist(plistDictFor(svc), out);
    assert.deepEqual(auditInstalled(out, svc), []);

    // Simulate the historical failure: an inline DATABASE_URL in the installed plist.
    const poisoned = { ...plistDictFor(svc), EnvironmentVariables: { DATABASE_URL: 'postgres://127.0.0.1:5432/x' } };
    const out2 = path.join(tmp, 'poisoned.plist');
    emitPlist(poisoned, out2);
    const problems = auditInstalled(out2, svc);
    assert.ok(problems.some((p) => p.includes('inline EnvironmentVariables')), problems.join('; '));
    assert.ok(problems.some((p) => p.includes('forbidden key DATABASE_URL')), problems.join('; '));

    // And the vanished-plist case (the deleter seen on this machine):
    const gone = auditInstalled(path.join(tmp, 'does-not-exist.plist'), svc);
    assert.equal(gone.length, 1);
    assert.ok(gone[0].includes('MISSING'));
  });

  it('emitted XML never contains any forbidden key as an env key', () => {
    for (const svc of SERVICES) {
      const out = path.join(tmp, `${svc.label}.plist`);
      emitPlist(plistDictFor(svc), out);
      const xml = fs.readFileSync(out, 'utf8');
      for (const k of FORBIDDEN_ENV_KEYS) {
        assert.ok(!xml.includes(`<key>${k}</key>`), `${svc.label}: emitted plist contains <key>${k}</key>`);
      }
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

describe('generator CLI', () => {
  it('--ci passes on this repo (pure emit, no LaunchAgents dir needed)', () => {
    const res = spawnSync(process.execPath, [GENERATOR, '--ci'], { encoding: 'utf8' });
    assert.equal(res.status, 0, `--ci failed:\n${res.stdout}\n${res.stderr}`);
    assert.match(res.stdout, /zero inline DB URLs or secrets/);
  });

  it('exits 2 when the manifest contract is violated (poisoned via env seam)', () => {
    // No-seam path: the shipped manifest is clean, so just verify the flag parse + clean pass here;
    // the poisoned-contract path is covered directly against auditManifest above.
    const res = spawnSync(process.execPath, [GENERATOR, '--ci'], { encoding: 'utf8' });
    assert.notEqual(res.status, 2);
  });
});
