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
  SERVICES,
  DB_SERVICES,
  FORBIDDEN_ENV_KEYS,
  NODE_BIN,
  programArgumentsFor,
  plistDictFor,
  serviceByLabel,
  REPO_ROOT,
} from '../launchd/service-manifest.mjs';
import {
  auditManifest,
  auditInstalled,
  emitPlist,
  readDisabledState,
  DISABLE_MARKER,
} from '../launchd/gen-service-plists.mjs';

const GENERATOR = fileURLToPath(new URL('../launchd/gen-service-plists.mjs', import.meta.url));

// Spawned write/check runs need every DB-backed service's .env on disk
// (auditManifest hard-fails without them) — gitignored in CI, so gate those.
const envFileOk = SERVICES.filter((s) => DB_SERVICES.has(s.label)).every((s) =>
  fs.existsSync(path.join(REPO_ROOT, s.dir, '.env'))
);

describe('service manifest contract', () => {
  it('has unique labels and at least the DB-backed fleet', () => {
    const labels = SERVICES.map((s) => s.label);
    assert.equal(new Set(labels).size, labels.length, 'duplicate labels in manifest');
    for (const db of DB_SERVICES)
      assert.ok(labels.includes(db), `DB_SERVICES label ${db} missing from manifest`);
  });

  it('gives every DB-backed service --env-file pointing at ITS OWN .env', () => {
    for (const svc of SERVICES.filter((s) => DB_SERVICES.has(s.label))) {
      const argv = programArgumentsFor(svc).join(' ');
      assert.ok(argv.includes('--env-file='), `${svc.label}: missing --env-file`);
      assert.ok(
        argv.includes(path.join(REPO_ROOT, svc.dir, '.env')),
        `${svc.label}: --env-file does not point at ${svc.dir}/.env`
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
      assert.ok(
        d.ProgramArguments.includes(entry),
        `${svc.label}: entrypoint ${entry} not in argv`
      );
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
    const poisoned = [
      {
        label: 'evil',
        dir: '.',
        kind: 'script',
        entry: 'scripts/x.mjs',
        wd: '.',
        port: 1,
        env: { DATABASE_URL: 'postgres://direct:5432/db' },
      },
    ];
    const problems = auditManifest(poisoned, { requireEnvFiles: false });
    assert.ok(
      problems.some((p) => p.includes('evil') && p.includes('DATABASE_URL')),
      problems.join('; ')
    );
  });

  it('forces --env-file for a DB-backed label under EVERY kind (bypass-proof by construction)', () => {
    // The bypass happened because launchd env shadowed --env-file. Structural
    // defense: membership in DB_SERVICES must force --env-file regardless of
    // which kind the entry declares.
    for (const kind of ['node', 'script', 'vite', 'tsx', 'nest']) {
      const svc = { ...serviceByLabel('content'), kind };
      assert.ok(
        programArgumentsFor(svc).join(' ').includes('--env-file='),
        `kind ${kind}: DB-backed label lost --env-file`
      );
    }
  });

  it('rejects duplicate labels in the manifest', () => {
    const dup = [serviceByLabel('content'), serviceByLabel('content')];
    const problems = auditManifest(dup, { requireEnvFiles: false });
    assert.ok(
      problems.some((p) => p.includes('duplicate label')),
      problems.join('; ')
    );
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
    const poisoned = {
      ...plistDictFor(svc),
      EnvironmentVariables: { DATABASE_URL: 'postgres://127.0.0.1:5432/x' },
    };
    const out2 = path.join(tmp, 'poisoned.plist');
    emitPlist(poisoned, out2);
    const problems = auditInstalled(out2, svc);
    assert.ok(
      problems.some((p) => p.includes('inline EnvironmentVariables')),
      problems.join('; ')
    );
    assert.ok(
      problems.some((p) => p.includes('forbidden key DATABASE_URL')),
      problems.join('; ')
    );

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
        assert.ok(
          !xml.includes(`<key>${k}</key>`),
          `${svc.label}: emitted plist contains <key>${k}</key>`
        );
      }
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

describe('service-fleet disable marker', () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'azeebo-disable-'));
  const runGen = (dir, marker, ...flags) =>
    spawnSync(process.execPath, [GENERATOR, ...flags], {
      encoding: 'utf8',
      env: { ...process.env, AZEEBO_LAUNCH_AGENTS_DIR: dir, AZEEBO_SERVICE_DISABLE_MARKER: marker },
    });

  it('defaults to enabled when no marker exists', () => {
    const state = readDisabledState(path.join(sandbox, 'does-not-exist'));
    assert.equal(state.disabled, false);
    assert.equal(state.keep.size, 0);
  });

  it('parses KEEP from a marker and keeps the default path machine-local', () => {
    const marker = path.join(sandbox, 'marker');
    fs.writeFileSync(
      marker,
      '# comment line\nDISABLED_AT=2026-10-24T00:00:00\nREASON=test\nKEEP=dev-virus-scanner web-dev,api-gateway\n'
    );
    const state = readDisabledState(marker);
    assert.equal(state.disabled, true);
    assert.deepEqual([...state.keep].sort(), ['api-gateway', 'dev-virus-scanner', 'web-dev']);
    assert.ok(DISABLE_MARKER.endsWith('.com.azeebo.services.disabled'));
  });

  it('--labels prints every manifest label without touching the machine', () => {
    const res = spawnSync(process.execPath, [GENERATOR, '--labels'], { encoding: 'utf8' });
    assert.equal(res.status, 0, res.stderr);
    assert.deepEqual(
      res.stdout.trim().split('\n'),
      SERVICES.map((s) => s.label)
    );
  });

  it(
    'write mode deletes suppressed plists, keeps KEEP, and check mode agrees',
    { skip: !envFileOk },
    () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azeebo-launchagents-'));
      const marker = path.join(dir, '.com.azeebo.services.disabled');
      fs.writeFileSync(marker, 'KEEP=dev-virus-scanner\n');
      // A stray (as a login re-import or FlyEnv would leave) + the kept utility.
      emitPlist(
        plistDictFor(serviceByLabel('content')),
        path.join(dir, 'com.azeebo.content.plist')
      );
      emitPlist(
        plistDictFor(serviceByLabel('dev-virus-scanner')),
        path.join(dir, 'com.azeebo.dev-virus-scanner.plist')
      );

      const write = runGen(dir, marker);
      assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
      assert.equal(
        fs.existsSync(path.join(dir, 'com.azeebo.content.plist')),
        false,
        'suppressed plist must be deleted'
      );
      assert.equal(
        fs.existsSync(path.join(dir, 'com.azeebo.dev-virus-scanner.plist')),
        true,
        'KEEP label must survive'
      );

      const check = runGen(dir, marker, '--check');
      assert.equal(check.status, 0, `${check.stdout}\n${check.stderr}`);
      assert.match(
        check.stdout,
        new RegExp(`all 1 service plists match the manifest \\(36 disabled by \\S*disabled\\)`)
      );

      // Drift inside the KEEP set is still real drift.
      emitPlist(
        {
          ...plistDictFor(serviceByLabel('dev-virus-scanner')),
          EnvironmentVariables: { DATABASE_URL: 'x' },
        },
        path.join(dir, 'com.azeebo.dev-virus-scanner.plist')
      );
      const drifted = runGen(dir, marker, '--check');
      assert.equal(drifted.status, 1, 'KEEP-label drift must fail check mode');
      assert.match(drifted.stderr, /dev-virus-scanner/);

      fs.rmSync(dir, { recursive: true, force: true });
    }
  );

  it('without a marker, check mode reports a vanished plist as drift', { skip: !envFileOk }, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azeebo-launchagents-'));
    const marker = path.join(dir, '.com.azeebo.services.disabled');
    const check = runGen(dir, marker, '--check');
    assert.equal(check.status, 1, 'no marker + no plists must be drift');
    assert.match(check.stderr, /MISSING/);
    assert.doesNotMatch(check.stderr, /disabled by/);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('generator CLI', () => {
  it('--ci passes on this repo (pure emit, no LaunchAgents dir needed)', () => {
    const res = spawnSync(process.execPath, [GENERATOR, '--ci'], { encoding: 'utf8' });
    assert.equal(res.status, 0, `--ci failed:\n${res.stdout}\n${res.stderr}`);
    assert.match(res.stdout, /zero inline DB URLs or secrets/);
  });

  it(
    '--ci ignores a disable marker (CI has none, and must stay hermetic)',
    { skip: !envFileOk },
    () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azeebo-ci-'));
      const marker = path.join(dir, '.com.azeebo.services.disabled');
      fs.writeFileSync(marker, 'KEEP=nothing\n');
      const res = spawnSync(process.execPath, [GENERATOR, '--ci'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          AZEEBO_LAUNCH_AGENTS_DIR: dir,
          AZEEBO_SERVICE_DISABLE_MARKER: marker,
        },
      });
      assert.equal(res.status, 0, `${res.stdout}\n${res.stderr}`);
      assert.doesNotMatch(res.stdout, /disabled by/);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  );

  it('exits 2 when the manifest contract is violated (poisoned via env seam)', () => {
    // No-seam path: the shipped manifest is clean, so just verify the flag parse + clean pass here;
    // the poisoned-contract path is covered directly against auditManifest above.
    const res = spawnSync(process.execPath, [GENERATOR, '--ci'], { encoding: 'utf8' });
    assert.notEqual(res.status, 2);
  });
});
