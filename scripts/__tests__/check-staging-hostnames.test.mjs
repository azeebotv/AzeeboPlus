/**
 * Unit tests for scripts/check-staging-hostnames.mjs.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findForeignStagingHosts, isCanonicalHost } from '../check-staging-hostnames.mjs';

function withFiles(files, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'staging-hosts-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const abs = path.join(dir, name);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content);
    }
    return fn(dir, Object.keys(files));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('accepts staging hosts under the canonical domain', () => {
  assert.equal(isCanonicalHost('staging.azeeboplus.com'), true);
  assert.equal(isCanonicalHost('api.staging.azeeboplus.com'), true);
  assert.equal(isCanonicalHost('www.staging.azeeboplus.com'), true);
});

test('rejects staging hosts on any other domain', () => {
  assert.equal(isCanonicalHost('staging.azeebo.ng'), false);
  assert.equal(isCanonicalHost('api.staging.azeebo.ng'), false);
  assert.equal(isCanonicalHost('notazeeboplus.com'), false);
});

test('ignores third-party hosts that contain a staging label', () => {
  withFiles(
    {
      'deploy/cdn-config.json':
        '{"bucket": "azeebo-media-staging.s3.amazonaws.com", "fb": "staging.firebaseapp.com"}\n',
    },
    (dir, files) => {
      assert.deepEqual(findForeignStagingHosts(dir, files), []);
    }
  );
});

test('flags a foreign staging host with file and line', () => {
  withFiles(
    {
      'deploy/cdn.json': '{\n  "origin": "https://api.staging.azeebo.ng"\n}\n',
    },
    (dir, files) => {
      const found = findForeignStagingHosts(dir, files);
      assert.deepEqual(found, [
        { file: 'deploy/cdn.json', line: 2, host: 'api.staging.azeebo.ng' },
      ]);
    }
  );
});

test('passes when every staging host is canonical', () => {
  withFiles(
    {
      '.github/workflows/cd.yml':
        "NEXT_PUBLIC_API_URL=${{ vars.X || 'https://staging.azeeboplus.com' }}\n",
    },
    (dir, files) => {
      assert.deepEqual(findForeignStagingHosts(dir, files), []);
    }
  );
});

test('ignores two-label filenames that contain staging', () => {
  withFiles({ 'deploy/README.md': 'Copy deploy/staging.env and fill it in.\n' }, (dir, files) => {
    assert.deepEqual(findForeignStagingHosts(dir, files), []);
  });
});

test('ignores internal staging DNS names', () => {
  withFiles(
    {
      'deploy/env.example':
        'ANALYTICS_SERVICE_URL=http://analytics-service.staging.internal:3008\n',
    },
    (dir, files) => {
      assert.deepEqual(findForeignStagingHosts(dir, files), []);
    }
  );
});
