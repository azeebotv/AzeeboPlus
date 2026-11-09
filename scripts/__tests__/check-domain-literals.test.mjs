/**
 * Unit tests for scripts/check-domain-literals.mjs.
 *
 * The bug these pin: the gate only knew the registry's own domains, so
 * `api.staging.azeebo.ng` — a hardcoded host on a *different* domain — sailed
 * through a domain rename. The matcher is now domain-agnostic but
 * context-anchored, so filenames and GitHub expression paths are never
 * mistaken for hosts.
 *
 * The second half pins the widened surface: Dockerfiles and .env.example
 * templates are scanned too, with one concession — a .env.example may carry a
 * literal copy of a *current* registry host (dotenv cannot interpolate
 * deploy/domains.env), but an invented subdomain or a foreign domain still
 * fails there.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import {
  ALLOWLIST_RELATIVE_PATH,
  GENERATED_FILES,
  SCAN_GLOBS,
  classifyHost,
  extractHosts,
  findHardcodedHosts,
  isIgnoredHost,
  isScannedSurface,
  loadAllowlist,
  registryHosts,
} from '../check-domain-literals.mjs';
import { REGISTRY_RELATIVE_PATH } from '../generate-domain-env.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'check-domain-literals.mjs');

const REGISTRY = {
  baseDomain: 'azeeboplus.com',
  subdomains: {
    root: '',
    app: 'app',
    api: 'api',
    cdn: 'cdn',
    stagingRoot: 'staging',
    stagingApi: 'staging-api',
  },
  stagingSubdomains: { app: 'app', www: 'www', admin: 'admin' },
};

/** Writes files into a temp dir and runs a callback with its path. */
function withFiles(files, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'domain-literals-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const abs = join(dir, name);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
    }
    return fn(dir, Object.keys(files));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('flags a registry host and marks it as such', () => {
  withFiles(
    { 'deploy/docker-compose.x.yml': 'URL: https://api.azeeboplus.com/v1\n' },
    (dir, files) => {
      const found = findHardcodedHosts(dir, files, registryHosts(REGISTRY));
      assert.deepEqual(
        found.map((f) => [f.host, f.registry]),
        [['api.azeeboplus.com', true]]
      );
    }
  );
});

test('flags a hardcoded host on a foreign domain', () => {
  // The regression this gate exists for: not a registry host, still drift.
  withFiles(
    { '.github/workflows/cd.yml': "NEXT_PUBLIC_API_URL: 'https://api.staging.azeebo.ng'\n" },
    (dir, files) => {
      const found = findHardcodedHosts(dir, files, registryHosts(REGISTRY));
      assert.deepEqual(
        found.map((f) => [f.file, f.line, f.host, f.registry]),
        [['.github/workflows/cd.yml', 1, 'api.staging.azeebo.ng', false]]
      );
    }
  );
});

test('reads hosts from host-ish keys and Host headers', () => {
  withFiles(
    {
      'deploy/docker-compose.y.yml':
        '      domainName: cdn.example-infra.net\n' +
        '      APP_HOST: app.azeeboplus.com\n' +
        '      HOSTNAME=node.azeebo.ng\n' +
        "        -H 'Host: api.azeebo.ng'\n",
    },
    (dir, files) => {
      const found = findHardcodedHosts(dir, files, registryHosts(REGISTRY));
      assert.deepEqual(found.map((f) => f.host).sort(), [
        'api.azeebo.ng',
        'app.azeeboplus.com',
        'cdn.example-infra.net',
        'node.azeebo.ng',
      ]);
    }
  );
});

test('never mistakes filenames, expressions or service DNS for hosts', () => {
  const line =
    'run: bash scripts/build-service.sh && node scripts/env.example.js ' +
    '&& echo ${{ github.repository }} ${{ steps.creds.outputs.have }} ' +
    '&& curl http://api-gateway:3000/health && curl http://redis:6379';
  withFiles({ '.github/workflows/ci.yml': line }, (dir, files) => {
    assert.deepEqual(findHardcodedHosts(dir, files, registryHosts(REGISTRY)), []);
  });
});

test('ignores loopback, internal and documentation domains', () => {
  for (const host of [
    'localhost',
    'api-gateway',
    'db.staging.internal',
    'cache.local',
    'svc.test',
    'example.com',
    'docs.example.org',
  ]) {
    assert.equal(isIgnoredHost(host, new Set()), true, `${host} should be ignored`);
  }
});

test('an allowlisted third party covers its subdomains', () => {
  const allow = new Set(['amazonaws.com']);
  assert.equal(isIgnoredHost('bucket.s3.amazonaws.com', allow), true);
  assert.equal(isIgnoredHost('notamazonaws.com', allow), false);
});

test('extractHosts finds urls, key values and Host headers in one line', () => {
  const hosts = extractHosts(
    "APP_HOST: a.example.net && curl https://b.example.net/x -H 'Host: c.example.net'"
  );
  assert.deepEqual(hosts.sort(), ['a.example.net', 'b.example.net', 'c.example.net']);
});

test('loadAllowlist rejects entries without a real reason', () => {
  withFiles(
    {
      [ALLOWLIST_RELATIVE_PATH]: JSON.stringify({
        allowedHosts: [{ host: 'ghcr.io', reason: 'x' }],
      }),
    },
    (dir) => {
      assert.throws(() => loadAllowlist(dir), /needs a real "reason"/);
    }
  );
  withFiles(
    { [ALLOWLIST_RELATIVE_PATH]: JSON.stringify({ allowedHosts: [{ reason: 'no host here' }] }) },
    (dir) => {
      assert.throws(() => loadAllowlist(dir), /needs a "host"/);
    }
  );
});

test('an allowlisted host silences the gate end to end', () => {
  const compose =
    "      - 'org.opencontainers.image.source=https://github.com/azeebotv/AzeeboPlus'\n";
  const registry = JSON.stringify(REGISTRY);

  // Without the allowlist entry the same file fails.
  withFiles(
    {
      [REGISTRY_RELATIVE_PATH]: registry,
      'docker-compose.demo.yml': compose,
      [ALLOWLIST_RELATIVE_PATH]: JSON.stringify({ allowedHosts: [] }),
    },
    (dir) => {
      execFileSync('git', ['init', '-q'], { cwd: dir });
      execFileSync('git', ['add', '-A'], { cwd: dir });
      const res = spawnSync(process.execPath, [SCRIPT, '--root', dir], { encoding: 'utf8' });
      assert.equal(res.status, 1, res.stdout + res.stderr);
      assert.match(res.stderr, /github\.com\s+\[foreign-domain\]/);
      assert.match(res.stderr, /domain-literal-allowlist\.json/);
    }
  );

  withFiles(
    {
      [REGISTRY_RELATIVE_PATH]: registry,
      'docker-compose.demo.yml': compose,
      [ALLOWLIST_RELATIVE_PATH]: JSON.stringify({
        allowedHosts: [{ host: 'github.com', reason: 'OCI image source label for the container.' }],
      }),
    },
    (dir) => {
      execFileSync('git', ['init', '-q'], { cwd: dir });
      execFileSync('git', ['add', '-A'], { cwd: dir });
      const res = spawnSync(process.execPath, [SCRIPT, '--root', dir], { encoding: 'utf8' });
      assert.equal(res.status, 0, res.stdout + res.stderr);
      assert.match(res.stdout, /No hardcoded hosts/);
    }
  );
});

test('scans Dockerfiles and tracked .env.example templates', () => {
  // The regression this covers: only compose files and workflows used to be
  // protected, so Dockerfile.all-in-one and the env templates could keep a
  // stale host through a rename without any gate noticing.
  assert.ok(SCAN_GLOBS.includes('*.env.example'), 'env templates must be scanned');
  assert.ok(
    SCAN_GLOBS.some((glob) => glob.includes('Dockerfile')),
    'Dockerfiles must be scanned'
  );

  withFiles(
    {
      'Dockerfile.all-in-one': 'ARG PUBLIC_URL=https://api.azeeboplus.com\n',
      'services/core/auth-service/.env.example':
        'EXPO_PUBLIC_ACTIVATION_URL=https://legacy.example-brand.net/link\n',
    },
    (dir, files) => {
      const found = findHardcodedHosts(dir, files, registryHosts(REGISTRY), new Set(), {
        baseDomain: REGISTRY.baseDomain,
      });
      assert.deepEqual(
        found.map((f) => [f.file, f.host, f.kind]).sort(),
        [
          ['Dockerfile.all-in-one', 'api.azeeboplus.com', 'registry'],
          ['services/core/auth-service/.env.example', 'legacy.example-brand.net', 'foreign-domain'],
        ].sort()
      );
    }
  );
});

test('an .env.example may repeat a current registry host but may not invent one', () => {
  const options = { baseDomain: REGISTRY.baseDomain };
  const hosts = registryHosts(REGISTRY);
  withFiles(
    {
      '.env.example':
        'CDN_BASE_URL=https://cdn.azeeboplus.com\n' +
        'CORS_ORIGIN=https://www.staging.azeeboplus.com,https://admin.staging.azeeboplus.com\n',
    },
    (dir, files) => {
      assert.deepEqual(findHardcodedHosts(dir, files, hosts, new Set(), options), []);
    }
  );

  withFiles(
    {
      'deploy/staging.env.example':
        'AUTH_URL=https://auth.staging.azeeboplus.com\n' +
        'API_URL=https://auth.staging.azeebo.ng\n',
    },
    (dir, files) => {
      assert.deepEqual(
        findHardcodedHosts(dir, files, hosts, new Set(), options).map((f) => [f.host, f.kind]),
        [
          ['auth.staging.azeeboplus.com', 'unregistered-subdomain'],
          ['auth.staging.azeebo.ng', 'foreign-domain'],
        ]
      );
    }
  );

  // The same registry literal is still a violation in a Dockerfile.
  withFiles(
    { 'deploy/Dockerfile.service': 'ENV APP_URL=https://app.azeeboplus.com\n' },
    (dir, files) => {
      assert.deepEqual(
        findHardcodedHosts(dir, files, hosts, new Set(), options).map((f) => f.kind),
        ['registry']
      );
    }
  );
});

test('the deploy/ tree is a scanned surface, minus generated files and prose', () => {
  assert.ok(
    SCAN_GLOBS.some((glob) => glob.startsWith('deploy/') && glob !== 'deploy/docker-compose*.yml'),
    'deploy/ must be scanned: entrypoint.sh, nginx.conf, bake file and canary config carry hosts'
  );

  for (const file of [
    'deploy/entrypoint.sh',
    'deploy/nginx.conf',
    'deploy/supervisord.conf',
    'deploy/docker-bake.hcl',
    'deploy/canary-config.yaml',
    'deploy/staging.env.example',
  ]) {
    assert.equal(isScannedSurface(file), true, `${file} should be scanned`);
  }
  // Generated from the registry, verified by the generators' --check modes.
  // deploy/domains.env lives inside the deploy/ glob, so without this it would
  // be reported against itself (every line is a registry host by design).
  for (const generated of ['deploy/cdn-config.json', 'deploy/domains.env']) {
    assert.equal(isScannedSurface(generated), false, `${generated} is generated`);
    assert.ok(GENERATED_FILES.has(generated), `${generated} must be declared generated`);
  }
  // Docs quote hosts on purpose; check-docs-consistency owns them.
  assert.equal(isScannedSurface('deploy/README.md'), false);
});

test('a host baked into a deploy script fails end to end, a generated file does not', () => {
  const registry = JSON.stringify(REGISTRY);
  const run = (files) => {
    let result;
    withFiles(
      {
        [REGISTRY_RELATIVE_PATH]: registry,
        [ALLOWLIST_RELATIVE_PATH]: JSON.stringify({ allowedHosts: [] }),
        ...files,
      },
      (dir) => {
        execFileSync('git', ['init', '-q'], { cwd: dir });
        execFileSync('git', ['add', '-A'], { cwd: dir });
        result = spawnSync(process.execPath, [SCRIPT, '--root', dir], { encoding: 'utf8' });
      }
    );
    return result;
  };

  const deployScript = run({
    'deploy/entrypoint.sh': 'curl -sf "https://staging.azeeboplus.com/health" > /dev/null\n',
  });
  assert.equal(deployScript.status, 1, deployScript.stdout + deployScript.stderr);
  assert.match(
    deployScript.stderr,
    /deploy\/entrypoint\.sh:1\s+staging\.azeeboplus\.com\s+\[registry\]/
  );

  // Same host in the generated CDN config is not the gate's business.
  const generated = run({
    'deploy/cdn-config.json': JSON.stringify({ origin: 'https://api.staging.azeebo.ng' }),
  });
  assert.equal(generated.status, 0, generated.stdout + generated.stderr);
});

test('registryHosts includes staging subdomains', () => {
  const hosts = registryHosts(REGISTRY);
  for (const host of [
    'azeeboplus.com',
    'app.azeeboplus.com',
    'staging.azeeboplus.com',
    'staging-api.azeeboplus.com',
    'www.staging.azeeboplus.com',
    'admin.staging.azeeboplus.com',
  ]) {
    assert.ok(hosts.has(host), `${host} should be a registry host`);
  }
  assert.equal(hosts.has('auth.staging.azeeboplus.com'), false);
});

test('classifyHost separates registry, invented and foreign hosts', () => {
  const hosts = registryHosts(REGISTRY);
  assert.equal(classifyHost('api.azeeboplus.com', hosts, 'azeeboplus.com'), 'registry');
  assert.equal(
    classifyHost('nope.azeeboplus.com', hosts, 'azeeboplus.com'),
    'unregistered-subdomain'
  );
  assert.equal(classifyHost('api.staging.azeebo.ng', hosts, 'azeeboplus.com'), 'foreign-domain');
  // Without a base domain (unit callers) nothing is assumed to be ours.
  assert.equal(classifyHost('zzz.azeeboplus.com', hosts), 'foreign-domain');
});

test('a foreign host in an .env.example fails the gate end to end', () => {
  const registry = JSON.stringify(REGISTRY);

  withFiles(
    {
      [REGISTRY_RELATIVE_PATH]: registry,
      'apps/tv/.env.example': 'EXPO_PUBLIC_ACTIVATION_URL=https://azeebo.tv/link\n',
      [ALLOWLIST_RELATIVE_PATH]: JSON.stringify({ allowedHosts: [] }),
    },
    (dir) => {
      execFileSync('git', ['init', '-q'], { cwd: dir });
      execFileSync('git', ['add', '-A'], { cwd: dir });
      const res = spawnSync(process.execPath, [SCRIPT, '--root', dir], { encoding: 'utf8' });
      assert.equal(res.status, 1, res.stdout + res.stderr);
      assert.match(res.stderr, /azeebo\.tv\s+\[foreign-domain\]/);
    }
  );
});

test('the repository itself is clean', () => {
  const res = spawnSync(process.execPath, [SCRIPT, '--root', ROOT], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr || res.stdout);
});
