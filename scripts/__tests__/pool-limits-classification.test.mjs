/**
 * Subprocess tests for the pool-budget gate's classification extension:
 * every prisma workspace must be sized on purpose (explicit LIMITS entry or
 * documented QUIET_TIER_WORKSPACES opt-in) — a new service can no longer
 * silently inherit the quiet default.
 *
 * Runs scripts/database/apply-pool-limits.mjs --ci as a real subprocess
 * against a tiny fake workspace tree (POOL_LIMITS_ROOT seam). No real DB is
 * needed for the unknown-workspace path: classification fails BEFORE any
 * database access, which the test pins by pointing POOL_CHECK_DATABASE_URL
 * at an unreachable port — an exit 4 (not 3) proves the ordering.
 *
 * Run: node --test scripts/__tests__/pool-limits-classification.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'database',
  'apply-pool-limits.mjs'
);

/** Fake repo tree with one prisma workspace at services/<area>/<name>. */
function workspace(root, area, name) {
  const dir = path.join(root, 'services', area, name, 'prisma');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'schema.prisma'), 'model X { id String @id }');
}

const UNREACHABLE_DB = 'postgresql://nobody:nope@127.0.0.1:1/postgres';

function runGate(root) {
  return spawnSync(process.execPath, [SCRIPT, '--ci'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      POOL_LIMITS_ROOT: root,
      POOL_CHECK_DATABASE_URL: UNREACHABLE_DB,
    },
  });
}

describe('pool-budget classification gate (--ci, subprocess)', () => {
  it('fails exit 4 on an unclassified workspace — before any DB access', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pool-limits-'));
    workspace(root, 'core', 'auth-service'); // in LIMITS → classified
    workspace(root, 'core', 'new-service'); // in NEITHER list → must fail

    const res = runGate(root);
    assert.equal(res.status, 4, `stderr: ${res.stderr}`);
    assert.ok(res.stderr.includes('new-service'), 'names the offending workspace');
    assert.ok(res.stderr.includes('QUIET_TIER_WORKSPACES'), 'explains the fix');
    assert.ok(res.stderr.includes('apply-pool-limits.mjs'), 'points at the tier map');
    assert.ok(!res.stderr.includes('cannot reach Postgres'), 'classification precedes the DB read');
  });

  it('passes classification for a fully classified tree and proceeds to the DB check', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pool-limits-'));
    workspace(root, 'core', 'auth-service'); // explicit (services/core/auth-service)
    workspace(root, 'universes', 'comedy-service'); // quiet opt-in (services/universes/comedy-service)

    const res = runGate(root);
    // With an unreachable DB, "classified OK" means the gate got PAST
    // classification (no exit 4) and failed closed at the DB read (exit 3).
    assert.equal(res.status, 3, `stderr: ${res.stderr}`);
    assert.ok(!res.stderr.includes('no pool sizing decision'), 'no classification failure');
    assert.ok(res.stderr.includes('cannot reach Postgres'), 'fails closed on the unreachable DB');
  });

  it('still exits 3 when there are no prisma workspaces at all', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pool-limits-'));
    const res = runGate(root);
    assert.equal(res.status, 3);
    assert.ok(res.stderr.includes('no prisma/schema.prisma workspaces'));
  });
});
