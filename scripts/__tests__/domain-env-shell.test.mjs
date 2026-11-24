/**
 * Tests for scripts/lib/domain-env.sh and the shell scripts that use it.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderDomainEnv, REGISTRY_RELATIVE_PATH } from '../generate-domain-env.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HELPER = path.join(ROOT, 'scripts', 'lib', 'domain-env.sh');
const LITERAL_HOST = /app\.azeeboplus\.com/;

function expectedAppHost() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, REGISTRY_RELATIVE_PATH), 'utf8'));
  const line = renderDomainEnv(registry)
    .split('\n')
    .find((l) => l.startsWith('APP_HOST='));
  return line.slice('APP_HOST='.length);
}

test('helper exports APP_HOST from deploy/domains.env', () => {
  const out = execFileSync('bash', ['-c', `source "${HELPER}" && printf %s "$APP_HOST"`], {
    encoding: 'utf8',
  });
  assert.equal(out, expectedAppHost());
  assert.ok(out.length > 0);
});

test('helper fails clearly when deploy/domains.env is missing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'domain-env-'));
  try {
    const libDir = path.join(dir, 'scripts', 'lib');
    fs.mkdirSync(libDir, { recursive: true });
    fs.copyFileSync(HELPER, path.join(libDir, 'domain-env.sh'));
    // Mirror the callers, which run under `set -e`: a failed source must abort them.
    const res = spawnSync(
      'bash',
      ['-c', `set -euo pipefail; source "${path.join(libDir, 'domain-env.sh')}"; echo ok`],
      {
        encoding: 'utf8',
      }
    );
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /deploy\/domains\.env is missing/);
    assert.doesNotMatch(res.stdout, /ok/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('verify-ssl.sh and deploy-staging.sh read the host from the registry, not a literal', () => {
  for (const rel of ['scripts/verify-ssl.sh', 'scripts/deploy-staging.sh']) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.match(src, /lib\/domain-env\.sh/, `${rel} must source the helper`);
    const code = src
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('#'))
      .join('\n');
    assert.doesNotMatch(code, LITERAL_HOST, `${rel} must not hardcode the app host`);
  }
});
