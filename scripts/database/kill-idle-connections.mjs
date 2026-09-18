#!/usr/bin/env node
// ============================================================================
// kill-idle-connections.mjs — emergency relief for Postgres connection
// exhaustion ("remaining connection slots are reserved for roles with the
// SUPERUSER attribute").
//
// Root cause this addresses: every service holds its own Prisma pool; before
// apply-pool-limits.mjs, default sizing meant the sum exceeded
// max_connections, idle slots piled up, and the next service to connect
// failed. This tool terminates idle sessions to restore service immediately.
//
// The durable fix is apply-pool-limits.mjs (per-service pool caps); use this
// only when a box is already wedged, or to reclaim slots from processes that
// predate the caps.
//
// Usage:
//   node scripts/database/kill-idle-connections.mjs            # dry-run: show what would be killed
//   node scripts/database/kill-idle-connections.mjs --kill     # actually terminate
//
// Safety: never touches superuser sessions, your own connection, or any
// session younger than the idle threshold (default 10 minutes).
// ============================================================================

import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const KILL = args.includes('--kill');
const IDLE_MINUTES = 10;
const PGPASSWORD = process.env.PGPASSWORD || 'change-me-in-production';

function psql(sql) {
  return execSync(
    `PGPASSWORD='${PGPASSWORD}' psql -h localhost -U postgres -d postgres -tAc ${JSON.stringify(sql)}`,
    { encoding: 'utf8' }
  ).trim();
}

const where =
  `state = 'idle'` +
  ` AND usename = 'azeebo'` +
  ` AND state_change < now() - interval '${IDLE_MINUTES} minutes'` +
  ` AND pid <> pg_backend_pid()`;

const count = Number(psql(`SELECT count(*) FROM pg_stat_activity WHERE ${where};`));
const total = Number(psql('SELECT count(*) FROM pg_stat_activity;'));
const maxConn = psql('SHOW max_connections;');

console.log(`Connections: ${total}/${maxConn} used`);
console.log(`Idle azeebo sessions older than ${IDLE_MINUTES} min: ${count}`);

if (count === 0) {
  console.log('Nothing to reclaim.');
  process.exit(0);
}

if (total / Number(maxConn) < 0.8) {
  console.log(
    `Utilization is below 80% of max_connections — killing idle sessions is optional here.`
  );
}

if (!KILL) {
  console.log('Dry run (pass --kill to terminate these sessions).');
  process.exit(0);
}

const killed = psql(
  `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE ${where};`
).split('\n').filter(Boolean).length;

const remaining = Number(psql('SELECT count(*) FROM pg_stat_activity;'));
console.log(`Terminated ${killed} idle sessions. Connections now: ${remaining}/${maxConn}`);
