/**
 * Unit tests for the live-environment half of the drift PR comment bot:
 *
 *   • scripts/lib/zip-read.mjs            — minimal ZIP reader (artifact zips)
 *   • scripts/lib/nightly-live-reports.mjs — artifact-name parsing, API walk,
 *     report extraction from artifact zips
 *   • the live-environment additions to scripts/lib/drift-pr-comment.mjs
 *
 * ZIP fixtures are built byte-by-byte (stored + deflated entries) so the
 * reader is exercised against real archive bytes, and the API walk runs
 * against a scripted fake fetch — no network, no fixtures on disk.
 *
 * Run: `node --test scripts/__tests__/nightly-live-reports.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readZipEntries } from '../lib/zip-read.mjs';
import {
  reportFromArtifactZip,
  nightlyArtifactName,
  fetchNightlyLiveReports,
} from '../lib/nightly-live-reports.mjs';
import { renderDriftComment, commentIsAlarming, COMMENT_MARKER } from '../lib/drift-pr-comment.mjs';
import { buildZip } from './helpers/zip-fixture.mjs';


// ── zip-read ────────────────────────────────────────────────────────────────

test('zip-read: parses stored and deflated entries in order', () => {
  const zip = buildZip([
    { name: 'dir/', data: Buffer.alloc(0) },
    { name: 'staging/report-staging.json', data: Buffer.from('{"env":"staging"}'), method: 8 },
    { name: 'staging/diff.sql', data: Buffer.from('ALTER TABLE x;'), method: 0 },
  ]);
  const entries = readZipEntries(zip);
  assert.deepEqual(
    entries.map((e) => e.name),
    ['staging/report-staging.json', 'staging/diff.sql'],
    'directory entries skipped, CD order kept'
  );
  assert.equal(entries[0].data.toString(), '{"env":"staging"}');
  assert.equal(entries[1].data.toString(), 'ALTER TABLE x;');
});

test('zip-read: rejects non-zip input with a clear error', () => {
  assert.throws(() => readZipEntries(Buffer.from('definitely not a zip')), /not a ZIP archive/);
});

test('zip-read: rejects corrupt archives instead of misreading them', () => {
  const zip = buildZip([{ name: 'a.json', data: Buffer.from('{}') }]);
  const truncated = zip.subarray(0, zip.length - 30); // central directory gutted
  assert.throws(() => readZipEntries(truncated), /corrupt|not a ZIP/);
});

test('zip-read: rejects ZIP64 archives it cannot represent', () => {
  const zip = buildZip([{ name: 'a.json', data: Buffer.from('{}') }], { zip64: true });
  assert.throws(() => readZipEntries(zip), /ZIP64/);
});

// ── nightly-live-reports ────────────────────────────────────────────────────

const STAGING_REPORT = {
  env: 'staging',
  generatedAt: '2026-09-11T04:30:00.000Z',
  host: 'db.staging.internal',
  summary: { total: 28, clean: 27, noDb: 0, additiveOnly: 0, review: 0, destructive: 0, ledgerMismatch: 0, blockedLedger: 0, error: 0, unreachable: 1 },
  services: [
    { service: 'services/core/user-service', status: 'CLEAN', detail: '' },
    { service: 'services/core/ledger-service', status: 'UNREACHABLE', detail: 'DB host unreachable — environment not verified' },
  ],
};

const PROD_REPORT = {
  env: 'production',
  generatedAt: '2026-09-11T04:31:00.000Z',
  host: 'db.prod.internal',
  summary: { total: 28, clean: 26, noDb: 0, additiveOnly: 1, review: 1, destructive: 0, ledgerMismatch: 0, blockedLedger: 0, error: 0, unreachable: 0 },
  services: [
    { service: 'services/core/wallet-service', status: 'CLEAN', detail: '' },
    { service: 'services/core/reality-service', status: 'DRIFT-REVIEW', detail: '1 column(s) need review' },
  ],
};

test('nightlyArtifactName matches the upload-artifact naming in the nightly workflow', () => {
  assert.equal(nightlyArtifactName('staging', 12345), 'schema-lock-report-staging-12345');
});

test('reportFromArtifactZip picks the report-*.json entry out of an artifact zip', () => {
  const zip = buildZip([
    { name: '.check-live-schema-lock-out/staging/services__core__user-service.sql', data: Buffer.from('-- diff'), method: 8 },
    { name: '.check-live-schema-lock-out/staging/report-staging.json', data: Buffer.from(JSON.stringify(STAGING_REPORT)), method: 8 },
  ]);
  const report = reportFromArtifactZip(zip);
  assert.equal(report.env, 'staging');
  assert.equal(report.services.length, 2);
});

test('reportFromArtifactZip errors informatively on a report-less zip', () => {
  const zip = buildZip([{ name: 'only-sql/diff.sql', data: Buffer.from('-- no json here') }]);
  assert.throws(() => reportFromArtifactZip(zip), /no \.json report/);
});

/** Fake fetch returning {status, json|body buffer} per URL pattern. */
function fakeFetch(handlers) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    const handler = handlers.find((h) => h.match.test(url));
    if (!handler) throw new Error(`fakeFetch: no handler for ${url}`);
    return handler.respond(url);
  };
  impl.calls = calls;
  return impl;
}

const GH_HEADERS = { Authorization: 'Bearer t0k', Accept: 'application/vnd.github+json' };

function jsonResponse(obj, status = 200) {
  return { ok: status < 400, status, text: async () => JSON.stringify(obj), json: async () => obj, arrayBuffer: async () => Buffer.from(JSON.stringify(obj)) };
}

function zipResponse(zip) {
  const bytes = Buffer.from(zip);
  return { ok: true, status: 200, text: async () => '', json: async () => { throw new Error('not json'); }, arrayBuffer: async () => bytes };
}

function runsHandler(runs) {
  return {
    match: /\/actions\/workflows\/schema-lock-nightly\.yml\/runs/,
    respond: () => jsonResponse({ total_count: runs.length, workflow_runs: runs.map((r) => ({ id: r.id, html_url: `https://github.com/acme/repo/actions/runs/${r.id}`, head_sha: 'a'.repeat(40), created_at: '2026-09-11T04:30:00Z' })) }),
  };
}

function artifactsHandler(runId, artifacts) {
  return {
    match: new RegExp(`/actions/runs/${runId}/artifacts`),
    respond: () => jsonResponse({ total_count: artifacts.length, artifacts: artifacts.map((a) => ({ id: a.id, name: a.name })) }),
  };
}

function zipHandler(artifactId, zip) {
  return { match: new RegExp(`/actions/artifacts/${artifactId}/zip`), respond: () => zipResponse(zip) };
}

function artifactZip(id, env, report) {
  return { id, name: `schema-lock-report-${env}-9001`, zip: buildZip([{ name: `.check-live-schema-lock-out/${env}/report-${env}.json`, data: Buffer.from(JSON.stringify(report)), method: 8 }]) };
}

test('fetchNightlyLiveReports: newest run wins per environment, across runs', async () => {
  const oldStaging = artifactZip(1, 'staging', { ...STAGING_REPORT, generatedAt: '2026-09-10T04:30:00.000Z' });
  const newStaging = artifactZip(2, 'staging', STAGING_REPORT);
  const prod = artifactZip(3, 'production', PROD_REPORT);
  const fetchImpl = fakeFetch([
    runsHandler([{ id: 101 }, { id: 100 }]),
    artifactsHandler(101, [newStaging, prod]), // newest run has both
    artifactsHandler(100, [oldStaging]),
    zipHandler(2, newStaging.zip),
    zipHandler(3, prod.zip),
    zipHandler(1, oldStaging.zip),
  ]);

  const { reports, meta } = await fetchNightlyLiveReports({ repo: 'acme/repo', token: 't0k', fetchImpl });

  assert.deepEqual(meta.foundEnvs, ['staging', 'production']);
  assert.deepEqual(meta.missingEnvs, []);
  assert.equal(meta.runUrl, 'https://github.com/acme/repo/actions/runs/101');
  assert.equal(reports.length, 2);
  // Both from the newest run — staging is NOT the older duplicate.
  assert.equal(reports.find((r) => r.env === 'staging').generatedAt, STAGING_REPORT.generatedAt);
  // Exactly one artifact download per environment (no wasted fetches).
  const downloads = fetchImpl.calls.filter((c) => /\/zip$/.test(c.url));
  assert.equal(downloads.length, 2);
});

test('fetchNightlyLiveReports: a skipped env leg falls back to the previous run', async () => {
  const prod = artifactZip(1, 'production', PROD_REPORT);
  const fetchImpl = fakeFetch([
    runsHandler([{ id: 201 }, { id: 200 }]),
    artifactsHandler(201, [artifactZip(2, 'staging', STAGING_REPORT)]), // staging only
    artifactsHandler(200, [prod]), // previous run had production
    zipHandler(2, STAGING_REPORT && buildZip([{ name: `report-staging.json`, data: Buffer.from(JSON.stringify(STAGING_REPORT)), method: 8 }])),
    zipHandler(1, prod.zip),
  ]);

  const { reports, meta } = await fetchNightlyLiveReports({ repo: 'acme/repo', token: 't0k', fetchImpl });
  assert.deepEqual(meta.foundEnvs.sort(), ['production', 'staging']);
  assert.equal(reports.find((r) => r.env === 'production').host, 'db.prod.internal');
});

test('fetchNightlyLiveReports: envs never reported come back in missingEnvs', async () => {
  const fetchImpl = fakeFetch([
    runsHandler([{ id: 301 }]),
    artifactsHandler(301, [artifactZip(1, 'staging', STAGING_REPORT)]),
    zipHandler(1, buildZip([{ name: 'report-staging.json', data: Buffer.from(JSON.stringify(STAGING_REPORT)), method: 8 }])),
  ]);
  const { meta } = await fetchNightlyLiveReports({ repo: 'acme/repo', token: 't0k', environments: ['staging', 'production'], fetchImpl });
  assert.deepEqual(meta.foundEnvs, ['staging']);
  assert.deepEqual(meta.missingEnvs, ['production']);
});

test('fetchNightlyLiveReports: a repo with no nightly runs yields nothing, not an error', async () => {
  const fetchImpl = fakeFetch([
    { match: /\/actions\/workflows\//, respond: () => ({ ok: false, status: 404, text: async () => 'not found', json: async () => ({}) }) },
  ]);
  const { reports, meta } = await fetchNightlyLiveReports({ repo: 'acme/repo', token: 't0k', fetchImpl });
  assert.deepEqual(reports, []);
  assert.deepEqual(meta.missingEnvs, ['staging', 'production']);
});

test('fetchNightlyLiveReports: an unreadable artifact does not abort the walk', async () => {
  const fetchImpl = fakeFetch([
    runsHandler([{ id: 401 }]),
    artifactsHandler(401, [artifactZip(1, 'staging', STAGING_REPORT), { id: 2, name: 'schema-lock-report-production-9001' }]),
    zipHandler(1, buildZip([{ name: 'report-staging.json', data: Buffer.from(JSON.stringify(STAGING_REPORT)), method: 8 }])),
    zipHandler(2, Buffer.from('this is not a zip')),
  ]);
  const { reports, meta } = await fetchNightlyLiveReports({ repo: 'acme/repo', token: 't0k', fetchImpl });
  assert.deepEqual(meta.foundEnvs, ['staging']);
  assert.deepEqual(meta.missingEnvs, ['production']);
  assert.equal(reports.length, 1);
});

// ── renderer: live section + header integration ─────────────────────────────

const GATE_CLEAN = { gate: 'prisma-migrations', generatedAt: 'x', total: 1, clean: 1, drifted: 0, broken: 0, services: [{ service: 'svc', status: 'CLEAN', detail: '' }] };

test('live section renders per-environment tables with live status icons', () => {
  const body = renderDriftComment({ migrationReport: GATE_CLEAN, liveReports: [STAGING_REPORT, PROD_REPORT] });
  assert.match(body, /#### Live environments \(nightly schema-lock report\)/);
  assert.match(body, /##### ✅ Environment: \*\*staging\*\* — schema lock holds/);
  assert.match(body, /##### 🔴 Environment: \*\*production\*\* — 1 service\(s\) violating the lock/);
  assert.match(body, /🟠 DRIFT-REVIEW/);
  assert.match(body, /⚪ UNREACHABLE/);
  // Gate table and live table both present (count real h4 lines — naive
  // splitting would also match the h5 environment headings).
  const h4 = body.split('\n').filter((l) => l.startsWith('#### ')).length;
  assert.equal(h4, 2);
});

test('header goes red when only the live environments violate the lock', () => {
  const body = renderDriftComment({ migrationReport: GATE_CLEAN, liveReports: [PROD_REPORT] });
  assert.match(body, /### 🚨 Schema drift detected — 1 in live environments/);
});

test('header stays green when live environments are clean or merely unreachable', () => {
  const body = renderDriftComment({ migrationReport: GATE_CLEAN, liveReports: [STAGING_REPORT] });
  assert.match(body, /### ✅ Schema lock holds/);
});

test('commentIsAlarming matches what the header renders (posting policy)', () => {
  assert.equal(commentIsAlarming({ migrationReport: GATE_CLEAN }), false);
  assert.equal(commentIsAlarming({ migrationReport: GATE_CLEAN, liveReports: [STAGING_REPORT] }), false);
  assert.equal(commentIsAlarming({ migrationReport: GATE_CLEAN, liveReports: [PROD_REPORT] }), true);
  assert.equal(commentIsAlarming({ migrationReport: { ...GATE_CLEAN, drifted: 1, clean: 0 } }), true);
  // Non-array / junk live reports are ignored, not crashes.
  assert.equal(commentIsAlarming({ migrationReport: GATE_CLEAN, liveReports: [null, { env: 'x' }] }), false);
});

test('live reports that are not usable are dropped without breaking the comment', () => {
  const body = renderDriftComment({ migrationReport: GATE_CLEAN, liveReports: [null, { env: 'junk' }] });
  assert.ok(body.startsWith(COMMENT_MARKER));
  assert.doesNotMatch(body, /Live environments/);
});
