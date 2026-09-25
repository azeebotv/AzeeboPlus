#!/usr/bin/env node

/**
 * Data Retention Policy Enforcement Job
 *
 * Enforces the platform-wide retention policies from
 * @azeebo/shared-types (DEFAULT_RETENTION_POLICIES) against the real
 * per-service databases:
 *
 *   PII (3y)           — azeebo_analytics: product_events rows (and, by
 *                        schema-level ON DELETE CASCADE, their device_info
 *                        children) older than the cutoff are deleted.
 *   SENSITIVE_PII (2y) — azeebo_analytics: session_summaries older than the
 *                        cutoff are deleted.
 *   INTERNAL (1y)      — azeebo_messaging: messages older than the cutoff are
 *                        soft-deleted (isDeleted = true) — content history
 *                        stays recoverable until a product decision says
 *                        otherwise (see the SKIPPED note below).
 *
 * SKIPPED (documented dead code in the original version): the old job
 * referenced `prisma.auditLog` VIEW/DOWNLOAD deletes and a `message.archived`
 * flag. No AnalyticsEvent/PII_ACCESS model or category exists anywhere in the
 * repo, and Message has no `archived` column — both were fiction. Admin-panel
 * audit trails have their own retention job
 * (scripts/database/audit-retention.sh, feature_flag.deleted-exempt).
 *
 * Runs daily via LaunchAgent com.azeebo.data-retention (install below).
 * Defaults to a DRY RUN; pass --apply to actually delete. Both the deleted
 * counts and any errors are printed as one JSON line for the log.
 *
 * Usage:
 *   tsx scripts/data-retention-enforcement.ts            # dry run (default)
 *   tsx scripts/data-retention-enforcement.ts --apply     # enforce
 *   tsx scripts/data-retention-enforcement.ts install     # schedule daily 04:11
 *   tsx scripts/data-retention-enforcement.ts uninstall
 *
 * Dev-only defaults; override with ANALYTICS_DB_URL / MESSAGING_DB_URL.
 */

import { PrismaClient } from '@prisma/client';
import { DataClassification, DEFAULT_RETENTION_POLICIES } from '@azeebo/shared-types';
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, rmSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const APPLY = process.argv.includes('--apply');
const SCRIPT = resolve(process.argv[1] || 'scripts/data-retention-enforcement.ts');
const REPO_ROOT = resolve(dirname(SCRIPT), '..');
const nodeRequire = createRequire(import.meta.url);

const ANALYTICS_DB_URL =
  process.env.ANALYTICS_DB_URL || 'postgresql://azeebo:azeebo_dev_2024@localhost:5432/azeebo_analytics';
const MESSAGING_DB_URL =
  process.env.MESSAGING_DB_URL || 'postgresql://azeebo:azeebo_dev_2024@localhost:5432/azeebo_messaging';

function cutoffFor(isoDuration) {
  const m = isoDuration.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?$/);
  const days = m
    ? (+(m[1] || 0) * 365 + +(m[2] || 0) * 30 + +(m[3] || 0))
    : 0;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function enforceAnalytics(results) {
  const prisma = new PrismaClient({ datasources: { db: { url: ANALYTICS_DB_URL } } });
  try {
    const pii = DEFAULT_RETENTION_POLICIES.find((p) => p.classification === DataClassification.PII);
    const spii = DEFAULT_RETENTION_POLICIES.find((p) => p.classification === DataClassification.SENSITIVE_PII);
    const piiCutoff = cutoffFor(pii.retentionPeriod);
    const spiiCutoff = cutoffFor(spii.retentionPeriod);

    if (APPLY) {
      // device_info rows cascade from their product_events parent (schema-level
      // onDelete: Cascade), so deleting the parent is enough.
      const piiDeleted = await prisma.$executeRawUnsafe(
        `DELETE FROM product_events WHERE timestamp < $1`,
        piiCutoff
      );
      const spiiDeleted = await prisma.$executeRawUnsafe(
        `DELETE FROM session_summaries WHERE "endedAt" < $1`,
        spiiCutoff
      );
      results.deletedCount += piiDeleted + spiiDeleted;
      results.detail.push(`azeebo_analytics: PII ${piiDeleted}, SENSITIVE_PII ${spiiDeleted}`);
    } else {
      const piiOld = (await prisma.$queryRawUnsafe(
        `SELECT count(*)::int AS n FROM product_events WHERE timestamp < $1`,
        piiCutoff
      ))[0].n;
      const spiiOld = (await prisma.$queryRawUnsafe(
        `SELECT count(*)::int AS n FROM session_summaries WHERE "endedAt" < $1`,
        spiiCutoff
      ))[0].n;
      results.detail.push(
        `azeebo_analytics: WOULD delete PII ${piiOld}, SENSITIVE_PII ${spiiOld} (dry run)`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function enforceMessaging(results) {
  // Raw SQL on purpose: the root @prisma/client is generated without the
  // messaging schema, and a per-service client import would drag the whole
  // messaging package into a root-level cron script.
  const prisma = new PrismaClient({ datasources: { db: { url: MESSAGING_DB_URL } } });
  try {
    const internal = DEFAULT_RETENTION_POLICIES.find((p) => p.classification === DataClassification.INTERNAL);
    const cutoff = cutoffFor(internal.retentionPeriod);
    if (APPLY) {
      const archived = await prisma.$executeRawUnsafe(
        `UPDATE messages SET "isDeleted" = true WHERE "createdAt" < $1 AND "isDeleted" = false`,
        cutoff
      );
      results.archivedCount += archived;
      results.detail.push(`azeebo_messaging: soft-deleted ${archived} old messages (INTERNAL 1y)`);
    } else {
      const n = (await prisma.$queryRawUnsafe(
        `SELECT count(*)::int AS n FROM messages WHERE "createdAt" < $1 AND "isDeleted" = false`,
        cutoff
      ))[0].n;
      results.detail.push(`azeebo_messaging: WOULD soft-delete ${n} old messages (dry run)`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function enforceDataRetention() {
  const results = {
    deletedCount: 0,
    archivedCount: 0,
    errors: [],
    detail: [] as string[],
  };
  const started = Date.now();
  for (const step of [enforceAnalytics, enforceMessaging]) {
    try {
      await step(results);
    } catch (error) {
      results.errors.push(`${step.name}: ${(error as Error).message}`);
    }
  }
  // Ledger row for the Ops Health pass-history chart (apply passes only —
  // dry runs don't touch data and would dilute the history). Best-effort:
  // the table may not exist on a fresh checkout.
  if (APPLY) {
    try {
      const ledger = new PrismaClient({ datasources: { db: { url: process.env.ADMIN_DB_URL || 'postgresql://azeebo:azeebo_dev_2024@localhost:5432/azeebo_admin' } } });
      const status = results.errors.length > 0 ? 'error' : 'ok';
      await ledger.$executeRawUnsafe(
        `INSERT INTO "job_runs" (id, job, status, detail, "rowsPurged", "durationMs") VALUES ($1, $2, $3, $4, $5, $6)`,
        randomUUID(),
        'data-retention',
        status,
        `analytics: ${results.deletedCount}, messaging: ${results.archivedCount}${results.errors.length ? '; ' + results.errors.join('; ').slice(0, 200) : ''}`,
        results.deletedCount + results.archivedCount,
        Date.now() - started
      );
      await ledger.$disconnect();
    } catch {
      /* job_runs table not there yet (fresh checkout) — skip recording */
    }
  }
  return results;
}

// ── LaunchAgent plumbing (same pattern as admin-data-freshness.sh) ──────────
const PLIST_ID = 'com.azeebo.data-retention';
const PLIST_PATH = `${process.env.HOME}/Library/LaunchAgents/${PLIST_ID}.plist`;
const LOG_FILE = process.env.RETENTION_LOG || '/tmp/azeebo-data-retention.log';

function install() {
  const tsxPkg = nodeRequire.resolve('tsx/package.json');
  const tsxCli = tsxPkg.replace(/package\.json$/, 'dist/cli.mjs');
  if (!existsSync(tsxCli)) {
    console.error('tsx cli not found; run from the repo root with node_modules installed');
    process.exit(1);
  }
  const nodeBin = process.execPath;
  mkdirSync(`${process.env.HOME}/Library/LaunchAgents`, { recursive: true });
  rmSync(PLIST_PATH, { force: true });
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${PLIST_ID}</string>
  <key>ProgramArguments</key><array>
    <string>${nodeBin}</string><string>${tsxCli}</string><string>${SCRIPT}</string><string>--apply</string>
  </array>
  <key>WorkingDirectory</key><string>${REPO_ROOT}</string>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>4</integer><key>Minute</key><integer>11</integer></dict>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>/usr/local/bin:/usr/bin:/bin</string>
    <key>HOME</key><string>${process.env.HOME}</string>
  </dict>
  <key>StandardOutPath</key><string>${LOG_FILE}</string>
  <key>StandardErrorPath</key><string>${LOG_FILE}</string>
</dict></plist>`;
  writeFileSync(PLIST_PATH, plist);
  execSync(`launchctl unload "${PLIST_PATH}" 2>/dev/null || true`, { shell: '/bin/bash' });
  execSync(`launchctl load "${PLIST_PATH}"`);
  console.log(`Installed ${PLIST_ID}: runs daily at 04:11 (--apply). Log: ${LOG_FILE}`);
}

function uninstall() {
  execSync(`launchctl unload "${PLIST_PATH}" 2>/dev/null || true`, { shell: '/bin/bash' });
  rmSync(PLIST_PATH, { force: true });
  console.log(`Removed ${PLIST_ID}.`);
}

if (process.argv.includes('install')) {
  install();
  process.exit(0);
}
if (process.argv.includes('uninstall')) {
  uninstall();
  process.exit(0);
}

enforceDataRetention()
  .then((results) => {
    const mode = APPLY ? 'APPLY' : 'DRY-RUN';
    console.log(
      JSON.stringify({ job: 'data-retention', mode, ...results }, null, 2)
    );
    if (results.errors.length > 0) {
      console.error('Errors:', results.errors.join('; '));
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Data retention enforcement failed:', error);
    process.exit(1);
  });
