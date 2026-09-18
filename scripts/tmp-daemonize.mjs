#!/usr/bin/env node
// tmp-daemonize.mjs — spawn a process fully detached from this process group
// so the tool shell cannot reap it. Usage:
//   node scripts/tmp-daemonize.mjs <name> <logFile> -- <command> [args...]
import { spawn } from 'node:child_process';
import { openSync } from 'node:fs';

const sep = process.argv.indexOf('--');
const [name, logFile] = process.argv.slice(2, sep);
const cmd = process.argv.slice(sep + 1);
if (!name || !logFile || cmd.length === 0) {
  console.error('usage: node tmp-daemonize.mjs <name> <logFile> -- <command> [args...]');
  process.exit(1);
}

const out = openSync(logFile, 'a');
const child = spawn(cmd[0], cmd.slice(1), {
  detached: true,
  stdio: ['ignore', out, out],
  cwd: process.cwd(),
  env: process.env,
});
child.unref();
console.log(`${name} spawned pid=${child.pid}`);
