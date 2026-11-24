/**
 * Unit tests for scripts/generate-cdn-config.mjs.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import {
  REGISTRY_RELATIVE_PATH,
  applyHosts,
  cdnHostFromBaseUrl,
  resolveHosts,
  stagingHosts,
} from '../generate-cdn-config.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'generate-cdn-config.mjs');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const REGISTRY = {
  baseDomain: 'azeeboplus.com',
  subdomains: {
    root: '',
    api: 'api',
    cdn: 'cdn',
    media: 'media',
    stagingRoot: 'staging',
    stagingApi: 'staging-api',
  },
  stagingSubdomains: {
    app: 'app',
    www: 'www',
    admin: 'admin',
    creator: 'creator',
    cdn: 'cdn',
    media: 'media',
    stream: 'stream',
  },
};

/** A miniature config carrying the same four hostname sites as the real file. */
const CONFIG = `{
  "cloudfront": {
    "origins": [
      { "id": "s3-media-origin", "domainName": "bucket.s3.amazonaws.com" },
      { "id": "api-origin", "domainName": "api.old-domain.test" }
    ],
    "aliases": {
      "quantity": 2,
      "items": ["cdn.old-domain.test", "media.old-domain.test"]
    }
  },
  "cors": {
    "allowOrigins": [
      "https://old-domain.test",
      "https://www.old-domain.test",
      "https://admin.old-domain.test",
      "https://api.old-domain.test"
    ],
    "allowMethods": ["GET"]
  },
  "security": {
    "policy": "connect-src 'self' https://api.old-domain.test wss://api.old-domain.test"
  }
}
`;

test('derives staging hosts from the registry', () => {
  const hosts = stagingHosts(REGISTRY);
  assert.equal(hosts.root, 'staging.azeeboplus.com');
  // The canonical staging API host is a flat label, not api.staging.*.
  assert.equal(hosts.api, 'staging-api.azeeboplus.com');
  assert.equal(hosts.cdn, 'cdn.staging.azeeboplus.com');
  assert.equal(hosts.media, 'media.staging.azeeboplus.com');
  assert.equal(hosts.www, 'www.staging.azeeboplus.com');
});

test('rejects a registry that is missing staging keys', () => {
  assert.throws(() => stagingHosts({ baseDomain: 'x.test', subdomains: {} }), /stagingRoot/);
  assert.throws(
    () =>
      stagingHosts({
        baseDomain: 'x.test',
        subdomains: { stagingRoot: 'staging', stagingApi: 'staging-api' },
        stagingSubdomains: {},
      }),
    /stagingSubdomains\.app/
  );
});

test('rewrites all four hostname sites and leaves everything else alone', () => {
  const next = applyHosts(CONFIG, stagingHosts(REGISTRY));
  const parsed = JSON.parse(next);

  assert.equal(parsed.cloudfront.origins[1].domainName, 'staging-api.azeeboplus.com');
  assert.equal(parsed.cloudfront.origins[0].domainName, 'bucket.s3.amazonaws.com');
  assert.deepEqual(parsed.cloudfront.aliases.items, [
    'cdn.staging.azeeboplus.com',
    'media.staging.azeeboplus.com',
  ]);
  assert.deepEqual(parsed.cors.allowOrigins, [
    'https://staging.azeeboplus.com',
    'https://www.staging.azeeboplus.com',
    'https://admin.staging.azeeboplus.com',
    'https://staging-api.azeeboplus.com',
  ]);
  assert.match(parsed.security.policy, /connect-src 'self' https:\/\/staging-api\.azeeboplus\.com/);
  assert.match(parsed.security.policy, /wss:\/\/staging-api\.azeeboplus\.com/);
  assert.doesNotMatch(next, /old-domain\.test/);
  assert.deepEqual(parsed.cors.allowMethods, ['GET']);
});

test('is idempotent', () => {
  const hosts = stagingHosts(REGISTRY);
  const once = applyHosts(CONFIG, hosts);
  assert.equal(applyHosts(once, hosts), once);
});

test('refuses a config missing a hostname site', () => {
  assert.throws(
    () => applyHosts('{"cors":{"allowOrigins":[]}}', stagingHosts(REGISTRY)),
    /api origin/
  );
});

test('CDN_BASE_URL overrides the cdn alias without touching the api host', () => {
  const hosts = resolveHosts(ROOT, REGISTRY, {
    CDN_BASE_URL: 'https://cdn.preview.example.com',
  });
  assert.equal(hosts.cdn, 'cdn.preview.example.com');
  assert.equal(hosts.media, 'media.preview.example.com');
  assert.equal(hosts.api, 'staging-api.azeeboplus.com');
});

test('cdnHostFromBaseUrl rejects non-origin URLs', () => {
  assert.equal(cdnHostFromBaseUrl(undefined), null);
  assert.throws(() => cdnHostFromBaseUrl('http://cdn.azeeboplus.com'), /https/);
  assert.throws(() => cdnHostFromBaseUrl('https://cdn.azeeboplus.com/path'), /no path/);
});

test('the committed cdns config is up to date with the registry', () => {
  // The real gate: deploy/cdn-config.json must already match the registry.
  const res = spawnSync(process.execPath, [SCRIPT, '--check', '--root', ROOT], {
    encoding: 'utf8',
  });
  assert.equal(res.status, 0, res.stderr || res.stdout);
});

test('--check fails when the file has drifted', () => {
  const root = mkdtempSync(join(tmpdir(), 'cdn-config-'));
  try {
    mkdirSync(join(root, 'deploy'), { recursive: true });
    mkdirSync(join(root, dirname(REGISTRY_RELATIVE_PATH)), { recursive: true });
    writeFileSync(join(root, REGISTRY_RELATIVE_PATH), JSON.stringify(REGISTRY));
    writeFileSync(join(root, 'deploy/cdn-config.json'), CONFIG);
    const res = spawnSync(process.execPath, [SCRIPT, '--check', '--root', root], {
      encoding: 'utf8',
    });
    assert.equal(res.status, 1);
    assert.match(res.stderr, /hostnames are stale/);
    assert.match(res.stderr, /generate-cdn-config\.mjs/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the real registry declares every staging label the config needs', () => {
  const registry = JSON.parse(readFileSync(join(ROOT, REGISTRY_RELATIVE_PATH), 'utf8'));
  const hosts = stagingHosts(registry);
  for (const key of ['root', 'api', 'www', 'admin', 'cdn', 'media']) {
    assert.ok(hosts[key].endsWith('.azeeboplus.com'), `${key} should be on the platform domain`);
  }
});
