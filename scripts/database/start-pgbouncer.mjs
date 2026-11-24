#!/usr/bin/env node
// ============================================================================
// start-pgbouncer.mjs — lifecycle for the local pgbouncer (transaction mode)
//
// The pooler config lives in pgbouncer.ini next to this script; this wrapper
// generates userlist.txt from the live Postgres roles (md5 of password+user,
// so pgbouncer can authenticate clients without knowing plaintext), then
// starts/stops/checks the daemon:
//
//   node scripts/database/start-pgbouncer.mjs            # ensure running (default)
//   node scripts/database/start-pgbouncer.mjs stop       # stop the daemon
//   node scripts/database/start-pgbouncer.mjs restart    # stop + start
//   node scripts/database/start-pgbouncer.mjs status     # exit 0 if running
//
// Idempotent: if already running and healthy, it's a no-op (exit 0).
// ============================================================================

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const INI = resolve(HERE, 'pgbouncer.ini');
const USERLIST = resolve(HERE, 'userlist.txt');
const PIDFILE = '/tmp/azeebo-pgbouncer.pid';
const LOGFILE = '/tmp/azeebo-pgbouncer.log';
const PORT = 6432;

const PGPASSWORD = process.env.PGPASSWORD || 'change-me-in-production';

function psql(sql, { db = 'postgres', user = 'postgres' } = {}) {
  return execSync(
    `PGPASSWORD='${PGPASSWORD}' psql -h localhost -U ${user} -d ${db} -tAc ${JSON.stringify(sql)}`,
    { encoding: 'utf8' }
  ).trim();
}

function runningPid() {
  try {
    const pid = Number(readFileSync(PIDFILE, 'utf8').trim());
    if (Number.isInteger(pid) && pid > 0) {
      process.kill(pid, 0); // throws if not alive
      return pid;
    }
  } catch {
    /* not running */
  }
  return null;
}

/** MD5 scaramble: md5(password + username) — what Postgres/pgbouncer md5 auth expects. */
function md5Hex(s) {
  return spawnSync('md5', ['-q', '-s', s], { encoding: 'utf8' }).stdout.trim();
}

function generateUserlist() {
  // Roles that own the app data. Passwords match the dev .env convention.
  const ROLES = [
    { user: 'azeebo', password: 'change-me-in-production' },
    { user: 'postgres', password: 'change-me-in-production' },
    // pgbouncer pseudo-user: owns the admin console (SHOW POOLS etc.).
    { user: 'pgbouncer', password: 'change-me-in-production' },
  ];
  const lines = ROLES.map((r) => `"${r.user}" "md5${md5Hex(r.password + r.user)}"`);
  writeFileSync(USERLIST, lines.join('\n') + '\n');
  console.log(`userlist: ${USERLIST} (${ROLES.length} roles)`);
}

function smokeTest() {
  // pgbouncer special admin console + a real passthrough query.
  const admin = execSync(
    `PGPASSWORD='${PGPASSWORD}' psql -h 127.0.0.1 -p ${PORT} -U pgbouncer -d pgbouncer -tAc "SHOW VERSION;"`,
    { encoding: 'utf8' }
  ).trim();
  const data = execSync(
    `PGPASSWORD='${PGPASSWORD}' psql -h 127.0.0.1 -p ${PORT} -U azeebo -d azeebo_vertical -tAc "SELECT 1;"`,
    { encoding: 'utf8' }
  ).trim();
  if (data !== '1') throw new Error(`passthrough query returned ${JSON.stringify(data)}`);
  return admin;
}

const cmd = process.argv[2] || 'start';

if (cmd === 'status') {
  const pid = runningPid();
  if (pid) {
    console.log(`pgbouncer running (pid ${pid})`);
    process.exit(0);
  }
  console.log('pgbouncer not running');
  process.exit(1);
}

if (cmd === 'stop' || cmd === 'restart') {
  const pid = runningPid();
  if (pid) {
    process.kill(pid, 'SIGTERM');
    // wait for exit (max ~5s)
    for (let i = 0; i < 50; i++) {
      try {
        process.kill(pid, 0);
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
      } catch {
        break;
      }
    }
    console.log(`stopped pid ${pid}`);
  } else {
    console.log('not running');
  }
  if (cmd === 'stop') process.exit(0);
}

if (cmd === 'start' || cmd === 'restart') {
  const pid = runningPid();
  if (pid) {
    console.log(`already running (pid ${pid}) — no-op`);
  } else {
    if (!existsSync(INI)) {
      console.error(`missing ${INI}`);
      process.exit(1);
    }
    generateUserlist();
    spawnSync('pgbouncer', ['-d', INI], { stdio: 'inherit' });
    // wait for readiness
    let ready = false;
    for (let i = 0; i < 50; i++) {
      try {
        smokeTest();
        ready = true;
        break;
      } catch {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
      }
    }
    if (!ready) {
      console.error(`pgbouncer failed to become ready — see ${LOGFILE}`);
      process.exit(1);
    }
    console.log(`pgbouncer ready on 127.0.0.1:${PORT}`);
  }
  const version = smokeTest();
  console.log(`smoke: ${version}`);
  process.exit(0);
}

console.error(`unknown command: ${cmd} (use start|stop|restart|status)`);
process.exit(1);
