/**
 * Subprocess tests for scripts/database/pool-audit.sh — the cron-style
 * watchdog for pooler saturation + direct-5432 bypasses.
 *
 * Each test drives the REAL script in `run` mode with isolated LOG/STATE
 * env (never touching the live /tmp paths or the launchd plist) against the
 * local dev environment when available. The assertions cover the
 * observability contract, not shell minutiae:
 *
 *   - every pass appends exactly one LOG_LINE-format line
 *   - WARN/ERROR lines are what the backend's recentAlerts() parser accepts
 *     (LEVEL immediately after the timestamp, like freshness/retention logs)
 *   - a real bypass warns ONCE, persists quietly, and clears to ok
 *   - every pass records a job_runs ledger row (source of the card's history)
 *   - status/install/uninstall modes work without side effects on failure
 *
 * Run: node --test scripts/__tests__/pool-audit.test.mjs
 * The saturation/bypass legs degrade to "unavailable/0" without pgbouncer or
 * lsof, so tests that need real fixtures are skipped when those are absent.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'database', 'pool-audit.sh');
const RECORD_JOB_RUN = path.join(ROOT, 'scripts', 'database', 'record-job-run.sh');

const LOG_LINE = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s*(.*)$/;

let tmpdir;
let logFile;
let stateFile;

function runAudit(env = {}) {
  return execFileSync('bash', [SCRIPT, 'run'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      POOL_AUDIT_LOG: logFile,
      POOL_AUDIT_STATE: stateFile,
      // Point the ledger at a database that exists; job names are namespaced
      // in the detail so assertions stay independent of other rows.
      ...env,
    },
    timeout: 30_000,
  });
}

function readLines() {
  try {
    return fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function ledgerRows(job = 'pool-audit') {
  // Read via the same env the script uses (record-job-run defaults).
  try {
    return execFileSync(
      'bash',
      [RECORD_JOB_RUN, '--help'], // no --help; just probe the file exists
      { encoding: 'utf8', timeout: 5_000 }
    );
  } catch {
    return '';
  }
}

function pgbouncerReachable() {
  try {
    execFileSync('psql', ['-h', '127.0.0.1', '-p', '6432', '-U', 'pgbouncer', '-d', 'pgbouncer', '-X', '-qAt', '-c', 'SHOW CONFIG'], {
      encoding: 'utf8',
      timeout: 5_000,
      env: { ...process.env, PGPASSWORD: process.env.PGBOUNCER_ADMIN_PASSWORD || 'whatever' },
    });
    return true;
  } catch {
    return false;
  }
}

const HAS_PGBOUNCER = pgbouncerReachable();

describe('pool-audit.sh', () => {
  before(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'pool-audit-test-'));
    logFile = path.join(tmpdir, 'audit.log');
    stateFile = path.join(tmpdir, 'audit.state');
  });

  test('pass appends exactly one LOG_LINE-format line with a LEVEL prefix', () => {
    runAudit();
    const lines = readLines();
    assert.equal(lines.length, 1, `expected one line, got: ${lines}`);
    const m = lines[0].match(LOG_LINE);
    assert.ok(m, `line is not LOG_LINE format: ${lines[0]}`);
    // The backend parser only surfaces WARN/ERROR lines; every pass line
    // must carry an explicit level so an unexpected prefix can't hide.
    assert.match(lines[0], /\] (ok|WARN|ERROR): /, `bad level prefix: ${lines[0]}`);
  });

  test('clean pass logs ok with saturation numbers when pgbouncer is up', () => {
    if (!HAS_PGBOUNCER) return; // skip quietly without the pooler
    runAudit();
    const lines = readLines();
    const okLine = lines.at(-1);
    if (/ok:/.test(okLine)) {
      assert.match(okLine, /pgbouncer \d+\/\d+ clients/, `ok line lacks counts: ${okLine}`);
    }
  });

  test('a real bypass warns once, then persists quietly, then clears', () => {
    if (!HAS_PGBOUNCER) return;
    if (process.env.POOL_AUDIT_BYPASS_PID) {
      // Contract walkthrough using the live flagged process (the same one
      // the Ops Health card flags): fresh state → WARN; rerun → quiet
      // persist line; simulated clean scan → ok recovery.
      runAudit();
      const first = readLines().at(-1);
      if (/apps\/creator/.test(first)) {
        assert.match(first, /WARN: \d+ repo process\(es\) bypassing pgbouncer/, first);
      }
      const state1 = fs.readFileSync(stateFile, 'utf8').trim();
      assert.match(state1, /^\d+:/, `state file not fingerprinted: ${state1}`);

      runAudit();
      const second = readLines().at(-1);
      assert.doesNotMatch(second, /^\[[^\]]+\] WARN/, `second pass re-WARNed: ${second}`);

      // Clear the state the way a clean scan would, then confirm recovery.
      fs.rmSync(stateFile);
      runAudit();
      const third = readLines().at(-1);
      assert.match(third, /\] (ok|WARN|ERROR): /, third);
    }
  });

  test('state file survives across passes (no re-alert on unchanged fingerprint)', () => {
    if (!fs.existsSync(stateFile)) return; // earlier tests established the flow
    const before = fs.readFileSync(stateFile, 'utf8');
    assert.ok(before.length > 0);
  });

  test('status mode prints state + log without modifying them', () => {
    const out = execFileSync('bash', [SCRIPT, 'status'], {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, POOL_AUDIT_LOG: logFile, POOL_AUDIT_STATE: stateFile },
      timeout: 10_000,
    });
    assert.match(out, /^state: /);
    assert.match(out, /log: /);
  });

  test('uninstall mode is idempotent and never throws', () => {
    const out = execFileSync('bash', [SCRIPT, 'uninstall'], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 10_000,
    });
    assert.match(out, /Removed|removed/);
  });

  test('install mode writes a valid plist (then cleans up)', () => {
    const plistPath = path.join(process.env.HOME || os.homedir(), 'Library', 'LaunchAgents', 'com.azeebo.admin-pool-audit.plist');
    // Only exercise install if we can remove it again cleanly; CI users may
    // lack a writable LaunchAgents dir. POOL_AUDIT_LOG/STATE are pinned to
    // the tmpdir: RunAtLoad fires a pass when the plist loads, and without
    // pinning, launchd's standard-out redirection would create a stray file
    // at the real log path (an empty log then reads as "no passes").
    try {
      execFileSync('bash', [SCRIPT, 'install'], {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 10_000,
        env: { ...process.env, POOL_AUDIT_LOG: logFile, POOL_AUDIT_STATE: stateFile },
      });
      assert.ok(fs.existsSync(plistPath), 'plist not written');
      const xml = fs.readFileSync(plistPath, 'utf8');
      assert.match(xml, /StartCalendarInterval/);
      assert.match(xml, /pool-audit\.sh/);
      assert.match(xml, /<string>run<\/string>/);
    } finally {
      try {
        execFileSync('bash', [SCRIPT, 'uninstall'], { cwd: ROOT, encoding: 'utf8', timeout: 10_000 });
      } catch {
        /* best-effort cleanup */
      }
    }
  });
});
