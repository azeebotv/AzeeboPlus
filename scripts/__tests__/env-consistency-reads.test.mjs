/**
 * Unit tests for the env-read scanner in scripts/check-env-consistency.mjs.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * The bug these pin: `GET_RE` required a trailing comma, so `get('KEY')` — the
 * form used for a key that has no code-level default — was never counted as a
 * read. `.env.example` line for such a key was then reported STALE-EXAMPLE
 * ("documented but nothing reads it"), which is exactly backwards for the keys
 * that are most required.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findEnvReads } from '../check-env-consistency.mjs';

function withFixture(source, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-reads-'));
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'sample.ts'), source);
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('counts .get() reads with and without a default', () => {
  withFixture(
    `const a = config.get('REQUIRED_KEY');\n` +
      `const b = config.get('WITH_DEFAULT', 'fallback');\n` +
      `const c = config.get<string>('TYPED_NO_DEFAULT');\n` +
      `const d = config.get<string>('TYPED_WITH_DEFAULT', 'x');\n`,
    (dir) => {
      const { soft, anyRead } = findEnvReads(dir);
      for (const key of [
        'REQUIRED_KEY',
        'WITH_DEFAULT',
        'TYPED_NO_DEFAULT',
        'TYPED_WITH_DEFAULT',
      ]) {
        assert.ok(soft.has(key), `${key} should be a soft read`);
        assert.ok(anyRead.has(key), `${key} should count as read`);
      }
    }
  );
});

test('counts config reads split across lines (chained calls)', () => {
  withFixture(
    `const url = configService\n      .get<string>('ALLOWED_ORIGINS')\n      ?.split(',');\n`,
    (dir) => {
      const { soft } = findEnvReads(dir);
      assert.ok(soft.has('ALLOWED_ORIGINS'), 'multi-line configService chain should count');
    }
  );
});

test('ignores .get() on non-config receivers', () => {
  withFixture(
    `const a = cache.get('SOME_FLAG');\n` +
      `const b = headers.get('X_TRACE_ID');\n` +
      `const c = store.get('MY_SETTING', 1);\n`,
    (dir) => {
      const { anyRead } = findEnvReads(dir);
      assert.equal(anyRead.size, 0, `unexpected reads: ${[...anyRead].join(', ')}`);
    }
  );
});

test('does not classify getOrThrow as a soft read', () => {
  // getOrThrow is the strict form; it must not also land in `soft`, or the
  // MISSING-REQUIRED finding would be suppressed by its own mirror image.
  withFixture(`const a = config.getOrThrow('BOOT_REQUIRED');\n`, (dir) => {
    const { strict, soft } = findEnvReads(dir);
    assert.ok(strict.has('BOOT_REQUIRED'), 'expected a strict read');
    assert.equal(soft.has('BOOT_REQUIRED'), false, 'getOrThrow must not be soft');
  });
});

test('ignores reads whose key is not an env-shaped literal', () => {
  withFixture(
    `const a = map.get('mixedCase');\n` +
      `const b = redis.get(someVariable);\n` +
      `const c = headers.get('Content-Type');\n`,
    (dir) => {
      const { anyRead } = findEnvReads(dir);
      assert.equal(anyRead.size, 0, `unexpected reads: ${[...anyRead].join(', ')}`);
    }
  );
});

test('still ignores runtime plumbing keys', () => {
  withFixture(`const a = config.get('NODE_ENV');\nconst b = config.get('PORT', 3000);\n`, (dir) => {
    const { anyRead } = findEnvReads(dir);
    assert.equal(anyRead.size, 0, 'NODE_ENV/PORT are never reported');
  });
});
