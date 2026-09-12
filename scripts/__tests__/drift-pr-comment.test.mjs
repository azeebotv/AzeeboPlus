/**
 * Unit tests for the drift PR comment renderer
 * (scripts/lib/drift-pr-comment.mjs) — the rendering half of the PR comment
 * bot. The report payloads here mirror exactly what the gate CLIs write
 * (.check-prisma-drift-out/report.json and
 * .check-prisma-deploy-diff-out/report.json).
 *
 * Run: `node --test scripts/__tests__/drift-pr-comment.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDriftComment, COMMENT_MARKER } from '../lib/drift-pr-comment.mjs';

const MIG_CLEAN = {
  gate: 'prisma-migrations',
  generatedAt: '2026-09-11T00:00:00.000Z',
  total: 2, clean: 2, drifted: 0, broken: 0,
  services: [
    { service: 'services/core/user-service', status: 'CLEAN', detail: '' },
    { service: 'services/core/wallet-service', status: 'CLEAN', detail: '' },
  ],
};

const MIG_DRIFTED = {
  gate: 'prisma-migrations',
  generatedAt: '2026-09-11T00:00:00.000Z',
  total: 3, clean: 2, drifted: 1, broken: 0,
  services: [
    { service: 'services/core/user-service', status: 'CLEAN', detail: '' },
    {
      service: 'services/core/reality-service', status: 'DRIFTED',
      detail: '2 diff statement(s) between replayed migrations and schema.prisma',
    },
    { service: 'services/core/wallet-service', status: 'CLEAN', detail: '' },
  ],
};

const DEPLOY_BROKEN = {
  gate: 'deployed-schema-lock',
  generatedAt: '2026-09-11T00:00:00.000Z',
  total: 2, clean: 1, drifted: 0, broken: 1, errored: 0,
  services: [
    { service: 'services/core/user-service', status: 'CLEAN', detail: '' },
    {
      service: 'services/core/search-service', status: 'BROKEN',
      detail: 'migrate deploy failed — P3006 · relation "Nope" does not exist',
    },
  ],
};

test('green run renders the all-clean header and both tables', () => {
  const body = renderDriftComment({ migrationReport: MIG_CLEAN, deployReport: { ...DEPLOY_BROKEN, clean: 2, broken: 0, services: DEPLOY_BROKEN.services.map((s) => ({ ...s, status: 'CLEAN', detail: '' })) } });
  assert.ok(body.startsWith(COMMENT_MARKER), 'marker must lead the comment');
  assert.match(body, /### ✅ Schema lock holds/);
  assert.match(body, /2\/2 clean/);
  assert.equal(body.split('#### ').length - 1, 2, 'both gate sections present');
});

test('drifted service produces the alarm header + red status row', () => {
  const body = renderDriftComment({ migrationReport: MIG_DRIFTED });
  assert.match(body, /### 🚨 Schema drift detected — 1 service\(s\) at the gates/);
  assert.match(body, /\| services\/core\/reality-service \| 🔴 DRIFTED \|/);
  assert.match(body, /2 diff statement\(s\)/);
});

test('broken deploy produces the alarm header with the deploy detail', () => {
  const body = renderDriftComment({ deployReport: DEPLOY_BROKEN });
  assert.match(body, /### 🚨 Schema drift detected — 1 service\(s\) at the gates/);
  assert.match(body, /💥 BROKEN/);
  assert.match(body, /P3006/);
});

test('comment includes run link and short commit sha', () => {
  const body = renderDriftComment({
    migrationReport: MIG_CLEAN,
    runUrl: 'https://github.com/acme/repo/actions/runs/123',
    runLabel: '#123',
    sha: '0123456789abcdef0123456789abcdef01234567',
  });
  assert.match(body, /\[Run #123\]\(https:\/\/github\.com\/acme\/repo\/actions\/runs\/123\)/);
  assert.match(body, /commit `0123456`/);
});

test('table cells escape pipes and newlines from details', () => {
  const report = {
    gate: 'prisma-migrations', generatedAt: 'x', total: 1, clean: 0, drifted: 1, broken: 0,
    services: [{ service: 'svc|with|pipes', status: 'DRIFTED', detail: 'line1\nline2 | broken' }],
  };
  const body = renderDriftComment({ migrationReport: report });
  assert.match(body, /svc\\\|with\\\|pipes/);
  assert.match(body, /line1 line2 \\\| broken/);
  assert.doesNotMatch(body, /line1\nline2/);
});

test('missing reports are tolerated; empty input renders nothing', () => {
  const onlyMigrations = renderDriftComment({ migrationReport: MIG_DRIFTED });
  assert.ok(onlyMigrations);
  assert.doesNotMatch(onlyMigrations, /Deploy-then-diff/);

  const onlyDeploy = renderDriftComment({ deployReport: DEPLOY_BROKEN });
  assert.ok(onlyDeploy);
  assert.doesNotMatch(onlyDeploy, /Migrations ↔ schema replay/);

  assert.equal(renderDriftComment({}), null);
  assert.equal(renderDriftComment({ migrationReport: null, deployReport: null }), null);
});

test('guidance footer is present on every render', () => {
  for (const body of [
    renderDriftComment({ migrationReport: MIG_CLEAN }),
    renderDriftComment({ deployReport: DEPLOY_BROKEN }),
  ]) {
    assert.match(body, /never `migrate resolve` an unapplied one/);
    assert.match(body, /updated in place on re-runs/);
  }
});
