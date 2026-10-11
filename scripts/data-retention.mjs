#!/usr/bin/env node
// ============================================================================
// data-retention.mjs — platform-wide data-retention policy enforcement
//
// Enforces the retention policies from @azeebo/shared-types
// (DEFAULT_RETENTION_POLICIES, packages/shared-types/src/data-classification.ts)
// against the real per-service databases:
//
//   PII (1095 days)           — azeebo_analytics: product_events rows (and, by
//                               schema-level ON DELETE CASCADE, their
//                               device_info children) older than the cutoff.
//   SENSITIVE_PII (730 days)  — azeebo_analytics: session_summaries older
//                               than the cutoff.
//   INTERNAL (365 days)       — azeebo_messaging: messages older than the
//                               cutoff get their content nulled
//                               (content='[deleted]', mediaUrl=NULL,
//                               isDeleted=true) — rows stay so conversations
//                               remain coherent, but no words/media survive.
//
// The day windows default to the shared-types policy; they are passed as env
// so this script can run dependency-free (the job container has no
// node_modules). If you change DEFAULT_RETENTION_POLICIES, change the
// defaults here too.
//
// Credentials: no hardcoded fallbacks. ANALYTICS_DB_URL / MESSAGING_DB_URL /
// ADMIN_DB_URL win; otherwise DB_HOST/DB_PORT/DB_USER/DB_PASSWORD are
// REQUIRED — the script exits non-zero instead of guessing.
//
// Scheduling: nightly via the data-retention job container
// (docker-compose.staging-jobs.yml, docker/data-retention.Dockerfile).
// Defaults to a DRY RUN; pass --apply to actually delete.
//
// Usage:
//   node scripts/data-retention.mjs              # dry run (default)
//   node scripts/data-retention.mjs --apply      # enforce
// ============================================================================

import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const APPLY = process.argv.includes('--apply');

// Policy windows (days) — mirror DEFAULT_RETENTION_POLICIES (PII P1095D,
// SENSITIVE_PII P730D, INTERNAL P365D).
const PII_DAYS = Number(process.env.PII_RETENTION_DAYS ?? 1095);
const SENSITIVE_PII_DAYS = Number(process.env.SENSITIVE_PII_RETENTION_DAYS ?? 730);
const INTERNAL_DAYS = Number(process.env.INTERNAL_RETENTION_DAYS ?? 365);

// Credentials — required, never guessed.
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT ?? '5432';
const DB_USER = process.env.DB_USER ?? 'azeebo';
const DB_PASSWORD = process.env.DB_PASSWORD;
if ((!DB_HOST || !DB_PASSWORD) && !process.env.ANALYTICS_DB_URL && !process.env.MESSAGING_DB_URL) {
  console.error(
    'data-retention: missing database credentials. Set ANALYTICS_DB_URL and ' +
      'MESSAGING_DB_URL, or DB_HOST + DB_PASSWORD (ADMIN_DB_URL optional, for the job ledger).'
  );
  process.exit(1);
}
const dbUrl = (db) => `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${db}`;
const ANALYTICS_URL = process.env.ANALYTICS_DB_URL ?? dbUrl('azeebo_analytics');
const MESSAGING_URL = process.env.MESSAGING_DB_URL ?? dbUrl('azeebo_messaging');
const ADMIN_URL = process.env.ADMIN_DB_URL ?? dbUrl('azeebo_admin');

function cutoff(daysAgo) {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

function psql(url, sql) {
  return execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-tAc', sql], {
    encoding: 'utf8',
    env: { ...process.env, PGAPPNAME: 'azeebo-data-retention' },
  }).trim();
}

function psqlCount(url, sql) {
  return Number(psql(url, sql) || 0);
}

const results = {
  deletedCount: 0,
  nullsedCount: 0,
  errors: [],
  detail: [],
};

function enforceAnalytics() {
  const piiCutoff = cutoff(PII_DAYS);
  const spiiCutoff = cutoff(SENSITIVE_PII_DAYS);
  if (APPLY) {
    // device_info rows cascade from their product_events parent (schema-level
    // onDelete: Cascade), so deleting the parent is enough.
    const piiDeleted = psqlCount(
      ANALYTICS_URL,
      `DELETE FROM product_events WHERE timestamp < '${piiCutoff}'`
    );
    const spiiDeleted = psqlCount(
      ANALYTICS_URL,
      `DELETE FROM session_summaries WHERE "endedAt" < '${spiiCutoff}'`
    );
    results.deletedCount += piiDeleted + spiiDeleted;
    results.detail.push(`azeebo_analytics: PII ${piiDeleted}, SENSITIVE_PII ${spiiDeleted}`);
  } else {
    const piiOld = psqlCount(
      ANALYTICS_URL,
      `SELECT count(*) FROM product_events WHERE timestamp < '${piiCutoff}'`
    );
    const spiiOld = psqlCount(
      ANALYTICS_URL,
      `SELECT count(*) FROM session_summaries WHERE "endedAt" < '${spiiCutoff}'`
    );
    results.detail.push(
      `azeebo_analytics: WOULD delete PII ${piiOld}, SENSITIVE_PII ${spiiOld} (dry run)`
    );
  }
}

function enforceMessaging() {
  const msgCutoff = cutoff(INTERNAL_DAYS);
  // Content nulling, not just a soft-delete flag: the words and media must
  // not survive retention expiry. Rows stay so other participants'
  // conversations remain coherent.
  const action = APPLY
    ? `UPDATE messages SET "isDeleted" = true, "content" = '[deleted]', "mediaUrl" = NULL WHERE "createdAt" < '${msgCutoff}' AND "isDeleted" = false`
    : `SELECT count(*) FROM messages WHERE "createdAt" < '${msgCutoff}' AND "isDeleted" = false`;
  const n = psqlCount(MESSAGING_URL, action);
  if (APPLY) {
    results.nullsedCount += n;
    results.detail.push(`azeebo_messaging: nulled content of ${n} old messages (INTERNAL ${INTERNAL_DAYS}d)`);
  } else {
    results.detail.push(
      `azeebo_messaging: WOULD null content of ${n} old messages (dry run)`
    );
  }
}

// Ledger row for the Ops Health pass-history chart / job-health-gate
// (scripts/database/job-health-gate.mjs expects passes named 'data-retention').
// Best-effort: the table may not exist on a fresh checkout. Apply passes only
// — dry runs don't touch data and would dilute the history.
function recordLedgerRun(started, status) {
  try {
    const detail = `analytics: ${results.deletedCount}, messaging: ${results.nullsedCount}${
      results.errors.length ? '; ' + results.errors.join('; ').slice(0, 200) : ''
    }`;
    psql(
      ADMIN_URL,
      `INSERT INTO "job_runs" (id, job, status, detail, "rowsPurged", "durationMs") VALUES ('${randomUUID()}', 'data-retention', '${status}', '${detail.replace(/'/g, "''")}', ${
        results.deletedCount + results.nullsedCount
      }, ${Date.now() - started})`
    );
  } catch {
    /* job_runs table not there yet — skip recording */
  }
}

const started = Date.now();
for (const step of [enforceAnalytics, enforceMessaging]) {
  try {
    step();
  } catch (error) {
    results.errors.push(`${step.name}: ${error.message}`);
  }
}

if (APPLY) {
  recordLedgerRun(started, results.errors.length > 0 ? 'error' : 'ok');
}

const mode = APPLY ? 'APPLY' : 'DRY-RUN';
console.log(JSON.stringify({ job: 'data-retention', mode, ...results }));
if (results.errors.length > 0) {
  console.error('Errors:', results.errors.join('; '));
  process.exit(1);
}
process.exit(0);
