/**
 * Unit + end-to-end tests for scripts/sync-env-example-hosts.mjs.
 *
 * The bug these pin: .env.example templates carried literal platform hosts, and
 * dotenv cannot interpolate, so a domain rename silently left every template
 * pointing at the old domain. The values are now generated from the registry,
 * and --check fails when a template disagrees with it.
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
  MANAGED_VALUES,
  applyManagedValues,
  manifestByFile,
  managedKeysFor,
  registryTokens,
  renderValue,
} from '../sync-env-example-hosts.mjs';
import { REGISTRY_RELATIVE_PATH } from '../generate-domain-env.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'sync-env-example-hosts.mjs');

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

const tokensFor = (baseDomain) => registryTokens({ ...REGISTRY, baseDomain });

test('registry tokens expand production and staging hosts', () => {
  const tokens = tokensFor('azeeboplus.com');
  assert.equal(tokens.app, 'app.azeeboplus.com');
  assert.equal(tokens.root, 'azeeboplus.com');
  assert.equal(tokens.cdn, 'cdn.azeeboplus.com');
  assert.equal(tokens.stagingRoot, 'staging.azeeboplus.com');
  assert.equal(tokens.stagingApi, 'staging-api.azeeboplus.com');
  assert.equal(tokens.wwwStaging, 'www.staging.azeeboplus.com');
  assert.equal(tokens.adminStaging, 'admin.staging.azeeboplus.com');
});

test('renderValue fills tokens, joins lists and rejects unknown tokens', () => {
  const tokens = tokensFor('azeeboplus.com');
  assert.equal(renderValue('https://{app}/link', tokens), 'https://app.azeeboplus.com/link');
  assert.equal(
    renderValue(['https://{stagingRoot}', 'https://{wwwStaging}'], tokens),
    'https://staging.azeeboplus.com,https://www.staging.azeeboplus.com'
  );
  // No silently-empty host: an unexpanded token is an error, not a blank value.
  assert.throws(() => renderValue('https://{nope}', tokens), /unknown registry token/);
});

test('a rename changes every managed value without touching anything else', () => {
  const before = tokensFor('azeeboplus.com');
  const after = tokensFor('renamed.example');
  assert.equal(MANAGED_VALUES.length > 0, true);
  for (const entry of MANAGED_VALUES) {
    const old = renderValue(entry.template, before);
    const next = renderValue(entry.template, after);
    assert.notEqual(old, next, `${entry.file}:${entry.key} did not follow the rename`);
    assert.equal(next.includes('azeeboplus.com'), false, `${next} still references the old domain`);
  }
});

test('applyManagedValues rewrites values in place and preserves everything else', () => {
  const text = [
    '# header',
    'CDN_BASE_URL=https://old.example',
    'SSL_DOMAIN=old.example',
    'UNRELATED=keep-me',
    '# trailing comment',
    '',
  ].join('\n');
  const tokens = tokensFor('azeeboplus.com');
  const next = applyManagedValues(
    text,
    [
      { file: 'x.env.example', key: 'CDN_BASE_URL', template: 'https://{cdn}' },
      { file: 'x.env.example', key: 'SSL_DOMAIN', template: '{stagingRoot}' },
    ],
    tokens
  );
  assert.equal(
    next,
    [
      '# header',
      'CDN_BASE_URL=https://cdn.azeeboplus.com',
      'SSL_DOMAIN=staging.azeeboplus.com',
      'UNRELATED=keep-me',
      '# trailing comment',
      '',
    ].join('\n')
  );
});

test('a commented managed key stays commented', () => {
  const next = applyManagedValues(
    '# CDN_BASE_URL=https://old.example\n',
    [{ file: 'x.env.example', key: 'CDN_BASE_URL', commented: true, template: 'https://{cdn}' }],
    tokensFor('azeeboplus.com')
  );
  assert.equal(next, '# CDN_BASE_URL=https://cdn.azeeboplus.com\n');
});

test('a manifest entry with no matching line fails loudly', () => {
  assert.throws(
    () =>
      applyManagedValues(
        'SOMETHING_ELSE=1\n',
        [{ file: 'x.env.example', key: 'CDN_BASE_URL', template: 'https://{cdn}' }],
        tokensFor('azeeboplus.com')
      ),
    /no "CDN_BASE_URL=" line to manage/
  );
});

test('managedKeysFor only reports keys managed in that file', () => {
  assert.equal(managedKeysFor('.env.example').has('CDN_BASE_URL'), true);
  assert.equal(managedKeysFor('.env.example').has('CORS_ORIGIN'), false);
  assert.equal(managedKeysFor('deploy/staging.env.example').has('CORS_ORIGIN'), true);
  assert.equal(managedKeysFor('apps/tv/.env.example').has('EXPO_PUBLIC_ACTIVATION_URL'), true);
});

test('--check passes on the repository and fails when a template drifts', () => {
  const clean = spawnSync(process.execPath, [SCRIPT, '--root', ROOT, '--check'], {
    encoding: 'utf8',
  });
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);

  const dir = mkdtempSync(join(tmpdir(), 'env-hosts-'));
  try {
    mkdirSync(join(dir, 'packages', 'shared-types', 'src'), { recursive: true });
    mkdirSync(join(dir, 'deploy'), { recursive: true });
    mkdirSync(join(dir, 'apps', 'tv'), { recursive: true });
    writeFileSync(join(dir, REGISTRY_RELATIVE_PATH), JSON.stringify(REGISTRY));
    // Every managed template has to exist: a deleted template must fail the
    // sync rather than silently stop being maintained.
    writeFileSync(join(dir, '.env.example'), '# CDN_BASE_URL=https://old.example\n');
    writeFileSync(
      join(dir, 'apps', 'tv', '.env.example'),
      'EXPO_PUBLIC_ACTIVATION_URL=https://old.example/link\n'
    );
    // One line per key the manifest manages in this file, so the only staleness
    // is the value itself.
    const stagingKeys = MANAGED_VALUES.filter(
      (entry) => entry.file === 'deploy/staging.env.example'
    ).map((entry) => entry.key);
    const template = join(dir, 'deploy', 'staging.env.example');
    writeFileSync(template, stagingKeys.map((key) => `${key}=old.example`).join('\n') + '\n');

    const stale = spawnSync(process.execPath, [SCRIPT, '--root', dir, '--check'], {
      encoding: 'utf8',
    });
    assert.equal(stale.status, 1, stale.stdout + stale.stderr);
    assert.match(stale.stderr, /SSL_DOMAIN=staging\.azeeboplus\.com/);
    assert.match(stale.stderr, /sync-env-example-hosts\.mjs/);

    const write = spawnSync(process.execPath, [SCRIPT, '--root', dir], { encoding: 'utf8' });
    assert.equal(write.status, 0, write.stdout + write.stderr);
    assert.match(readFileSync(template, 'utf8'), /^SSL_DOMAIN=staging\.azeeboplus\.com$/m);

    const afterWrite = spawnSync(process.execPath, [SCRIPT, '--root', dir, '--check'], {
      encoding: 'utf8',
    });
    assert.equal(afterWrite.status, 0, afterWrite.stdout + afterWrite.stderr);

    // Rename the domain: the regenerated template must go stale again.
    const renamed = { ...REGISTRY, baseDomain: 'renamed.example' };
    writeFileSync(join(dir, REGISTRY_RELATIVE_PATH), JSON.stringify(renamed));
    const afterRename = spawnSync(process.execPath, [SCRIPT, '--root', dir, '--check'], {
      encoding: 'utf8',
    });
    assert.equal(afterRename.status, 1, afterRename.stdout + afterRename.stderr);
    assert.match(afterRename.stderr, /SSL_DOMAIN=staging\.renamed\.example/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('every declared template key exists in a tracked template', () => {
  for (const [file, entries] of manifestByFile()) {
    const text = readFileSync(join(ROOT, file), 'utf8');
    for (const entry of entries) {
      assert.match(
        text,
        new RegExp(`^#?\\s*${entry.key}=`, 'm'),
        `${file} has no ${entry.key}= line, so the manifest would silently stop managing it`
      );
    }
  }
});
