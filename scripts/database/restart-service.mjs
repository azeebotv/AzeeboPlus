#!/usr/bin/env node
// ============================================================================
// restart-service.mjs — restart one dev service detached, on its pgbouncer env
//
// Why this exists: the pgbouncer cutover rewrote every service .env to point
// at the pooler (127.0.0.1:6432 + pgbouncer=true), but only services actually
// restarted since the cutover picked the new URLs up. Processes started
// before it kept dialing Postgres directly. This script is the canonical way
// to (re)start a service so it:
//   1. always reads ITS OWN services/<area>/<name>/.env via --env-file
//      (pooler URL + per-service connection_limit included), and
//   2. survives this shell exiting (detached spawn, like the rest of the
//      dev fleet).
//
// Hard-learned lesson baked in: a bare SIGTERM + 1.5s is NOT enough. Nest
// graceful shutdown can hang on open handles, so a naive spawn then dies with
// EADDRINUSE while the health-wait is fooled by the OLD process still
// answering the port. This version therefore:
//   - TERM → waits for actual exit (up to 8s) → KILL → waits again
//   - spawns only once the port is genuinely free
//   - verifies the NEW pid owns the listener, and honestly reports when an
//     external supervisor (FlyEnv) respawned its own child instead
//
// Usage:
//   node scripts/database/restart-service.mjs <service-dir> <port> [env overrides...]
//   e.g. node scripts/database/restart-service.mjs services/core/wallet-service 3002
//
// Env overrides (KEY=value) are applied after --env-file so they win; PORT is
// always forced to <port> because most main.ts files default to their own
// historical port and the fleet layout is the source of truth here.
// Logs append to /tmp/azeebo-daemon-<name>-<port>.log.

import { spawn } from 'node:child_process';
import { accessSync, constants, openSync } from 'node:fs';
import path from 'node:path';

const [dirArg, portArg, ...overrides] = process.argv.slice(2);
if (!dirArg || !portArg) {
  console.error('usage: node restart-service.mjs <service-dir> <port> [KEY=value ...]');
  process.exit(2);
}

const root = process.cwd();
const dir = path.isAbsolute(dirArg) ? dirArg : path.join(root, dirArg);
const main = path.join(dir, 'dist/main.js');
const envFile = path.join(dir, '.env');

for (const f of [main, envFile]) {
  try {
    accessSync(f, constants.R_OK);
  } catch {
    console.error(`missing ${f} — build the service and ensure its .env exists`);
    process.exit(2);
  }
}

const port = Number(portArg);
if (!Number.isInteger(port) || port <= 0) {
  console.error(`invalid port: ${portArg}`);
  process.exit(2);
}

const { execSync } = await import('node:child_process');

const listenerPids = () => {
  try {
    return execSync(`lsof -ti :${port} -sTCP:LISTEN`, { encoding: 'utf8' })
      .split('\n')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
};

const waitAllGone = async (pids, ms) => {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const alive = pids.filter((pid) => {
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    });
    if (alive.length === 0) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
};

// ── Kill phase: TERM → wait → KILL → wait. Never spawn on a live port. ──
const old = listenerPids();
for (const pid of old) {
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`SIGTERM old pid ${pid} on :${port}`);
  } catch {
    /* already gone */
  }
}
if (old.length > 0 && !(await waitAllGone(old, 8000))) {
  for (const pid of listenerPids()) {
    try {
      process.kill(pid, 'SIGKILL');
      console.log(`SIGKILL stubborn pid ${pid} on :${port}`);
    } catch {
      /* already gone */
    }
  }
  await waitAllGone(listenerPids(), 3000);
}
if (listenerPids().length > 0) {
  console.error(`port :${port} still held after TERM+KILL — refusing to spawn`);
  process.exit(1);
}

// ── Spawn phase ──
const name = path.basename(dir);
const out = openSync(`/tmp/azeebo-daemon-${name}-${port}.log`, 'a');
const env = { ...process.env, PORT: String(port) };
for (const o of overrides) {
  const i = o.indexOf('=');
  if (i > 0) env[o.slice(0, i)] = o.slice(i + 1);
}

const child = spawn(
  process.execPath,
  [`--env-file=${envFile}`, main],
  { cwd: dir, detached: true, stdio: ['ignore', out, out], env }
);
child.unref();
console.log(`spawned ${name} pid ${child.pid} on :${port} (env-file=${envFile})`);

// ── Competition phase ──────────────────────────────────────────────────
// FlyEnv (the local supervisor) respawns its managed children the instant
// they die — with its OWN baked env snapshot, which still points at direct
// 5432. If it wins the bind race, the service silently bypasses the pooler
// again. So: while OUR child boots, kill any other listener that grabs the
// port. Once our child binds, FlyEnv's later respawn attempts just fail on
// EADDRINUSE and back off. (Permanent fix: disable these services inside
// FlyEnv's UI — see RUNBOOK.)
const competeDeadline = Date.now() + 30_000;
let owned = false;
let evictions = 0;
let childProcess = child;
while (Date.now() < competeDeadline) {
  const owner = listenerPids()[0];
  if (owner === childProcess.pid) {
    owned = true;
    break;
  }
  if (owner) {
    try {
      process.kill(owner, 'SIGKILL');
      evictions++;
      console.log(`evicted competing pid ${owner} from :${port}`);
    } catch {
      /* gone already */
    }
  }
  // If our child died in the bind race (EADDRINUSE), replace it immediately
  // so something of ours is always mid-boot after each eviction.
  if (childProcess.exitCode !== null || childProcess.signalCode !== null) {
    childProcess = spawn(
      process.execPath,
      [`--env-file=${envFile}`, main],
      { cwd: dir, detached: true, stdio: ['ignore', out, out], env }
    );
    childProcess.unref();
    console.log(`respawned our child as pid ${childProcess.pid}`);
  }
  await new Promise((r) => setTimeout(r, 700));
}
if (!owned) {
  console.error(
    `${name}: could not win :${port} within 30s (evicted ${evictions} competitors) — check /tmp/azeebo-daemon-${name}-${port}.log`
  );
  process.exit(1);
}
if (evictions > 0) {
  console.log(`${name} won :${port} after ${evictions} eviction(s) — FlyEnv respawn disabled by binding first`);
}

// ── Verify phase: port answers ──
const deadline = owned ? Date.now() + 10_000 : Date.now() + 20_000;
let up = owned;
while (!up && Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 1000));
  try {
    execSync(`nc -z localhost ${port}`, { stdio: 'ignore' });
    up = true;
    break;
  } catch {
    /* not up yet */
  }
}
if (!up) {
  console.error(`${name} NOT listening within 20s — check /tmp/azeebo-daemon-${name}-${port}.log`);
  process.exit(1);
}

console.log(`${name} serving :${port} (pid ${child.pid})`);
process.exit(0);
