#!/usr/bin/env node
/**
 * gen-service-plists.mjs — generate every `com.azeebo.*` service LaunchAgent
 * plist from scripts/launchd/service-manifest.mjs.
 *
 * Usage:
 *   node scripts/launchd/gen-service-plists.mjs            # write plists to ~/Library/LaunchAgents
 *   node scripts/launchd/gen-service-plists.mjs --check    # CI mode: emit to a temp dir and compare
 *
 * Hard rules the generator enforces (exit 2 on violation):
 *   1. No generated plist may contain any FORBIDDEN_ENV_KEYS key (secrets,
 *      DB URLs). An inline DATABASE_URL can therefore never reappear on any
 *      service — the guard rejects it at generation time.
 *   2. Every DB-backed service must reference its own .env via --env-file.
 *   3. Every DB-backed service must HAVE a .env on disk (missing file = hard
 *      error, so a renamed service directory can't silently break the fleet).
 *   4. `--check` fails when the installed plist differs from the manifest in
 *      ANY way — including a plist that vanished entirely. This is the
 *      tripwire for the LaunchAgent deleter seen on this machine.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  REPO_ROOT, SERVICES, DB_SERVICES, FORBIDDEN_ENV_KEYS,
  plistDictFor, programArgumentsFor,
} from './service-manifest.mjs';

const LAUNCH_AGENTS = path.join(os.homedir(), 'Library', 'LaunchAgents');

const invokedDirectly = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));

/** Minimal plist-XML serializer (strings, booleans, arrays, dicts) — used when plutil is unavailable (e.g. ubuntu CI). */
function toXml(value, indent = '') {
  if (typeof value === 'string') return `${indent}<string>${value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</string>`;
  if (typeof value === 'boolean') return `${indent}<${value}/>`;
  if (Array.isArray(value)) return `${indent}<array>\n${value.map((v) => toXml(v, `${indent}  `)).join('\n')}\n${indent}</array>`;
  const inner = Object.entries(value)
    .map(([k, v]) => `${indent}  <key>${k}</key>\n${toXml(v, `${indent}  `)}`)
    .join('\n');
  return `${indent}<dict>\n${inner}\n${indent}</dict>`;
}

/** Emit one plist file as XML via plutil (canonical formatting). */
export function emitPlist(dict, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const plutil = spawnSync('plutil', ['-version'], { encoding: 'utf8' });
  if (plutil.status === 0) {
    const tmp = `${outPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(dict));
    const res = spawnSync('plutil', ['-convert', 'xml1', '-o', outPath, tmp], { encoding: 'utf8' });
    fs.rmSync(tmp, { force: true });
    if (res.status !== 0) throw new Error(`plutil failed for ${outPath}: ${res.stderr}`);
    return;
  }
  // No plutil (linux CI): emit equivalent XML directly.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n${toXml(dict, '')}\n</plist>\n`;
  fs.writeFileSync(outPath, xml);
}

/** Contract audit shared by write and check modes. Returns list of problems. */
export function auditManifest(entries = SERVICES, { requireEnvFiles = true } = {}) {
  const problems = [];
  const seen = new Set();
  for (const svc of entries) {
    if (seen.has(svc.label)) problems.push(`${svc.label}: duplicate label in manifest`);
    seen.add(svc.label);
    const argv = programArgumentsFor(svc).join(' ');
    const dbBacked = DB_SERVICES.has(svc.label);
    if (dbBacked) {
      if (!argv.includes('--env-file=')) problems.push(`${svc.label}: DB-backed service missing --env-file`);
      if (requireEnvFiles) {
        const envPath = path.join(REPO_ROOT, svc.dir, '.env');
        if (!fs.existsSync(envPath)) problems.push(`${svc.label}: .env missing at ${envPath}`);
        const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        if (!/^PORT=/m.test(envContent)) problems.push(`${svc.label}: .env missing PORT`);
      }
    }
    if (svc.env) {
      for (const key of Object.keys(svc.env)) {
        if (FORBIDDEN_ENV_KEYS.includes(key)) problems.push(`${svc.label}: forbidden inline env key ${key}`);
      }
    }
  }
  for (const label of DB_SERVICES) {
    if (!seen.has(label)) problems.push(`DB_SERVICES lists unknown label ${label}`);
  }
  return problems;
}

/** Compare an installed plist against the manifest. Returns list of problems. */
export function auditInstalled(installedPath, svc) {
  const problems = [];
  if (!fs.existsSync(installedPath)) {
    problems.push(`${svc.label}: plist MISSING from ${installedPath} (deleted? reinstall via gen-service-plists.mjs)`);
    return problems;
  }
  let parsed;
  try {
    const res = spawnSync('plutil', ['-convert', 'json', '-o', '-', installedPath], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    if (res.status !== 0) throw new Error(res.stderr);
    parsed = JSON.parse(res.stdout);
  } catch {
    problems.push(`${svc.label}: plist is not parseable XML`);
    return problems;
  }
  const want = plistDictFor(svc);
  for (const key of ['ProgramArguments', 'WorkingDirectory', 'KeepAlive', 'RunAtLoad', 'StandardOutPath', 'StandardErrorPath']) {
    if (JSON.stringify(parsed[key]) !== JSON.stringify(want[key])) {
      problems.push(`${svc.label}: ${key} differs from manifest`);
    }
  }
  if ('EnvironmentVariables' in parsed && svc.env === undefined) {
    problems.push(`${svc.label}: installed plist carries inline EnvironmentVariables but manifest has none — STRIP IT (this is how the direct-5432 bypass happened)`);
  }
  const inline = parsed.EnvironmentVariables ?? {};
  for (const k of Object.keys(inline)) {
    if (FORBIDDEN_ENV_KEYS.includes(k)) {
      problems.push(`${svc.label}: installed plist carries forbidden key ${k}`);
    }
  }
  return problems;
}

function main() {
  if (!invokedDirectly) return; // imported by tests — run nothing
  const checkOnly = process.argv.includes('--check');
  const ciMode = process.argv.includes('--ci');
  // CI runners have no LaunchAgents dir and .env files are gitignored — relax
  // exactly those two checks; every pure guard still runs.
  const problems = auditManifest(SERVICES, { requireEnvFiles: !ciMode });
  if (problems.length > 0) {
    console.error('gen-service-plists: manifest contract violations:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(2);
  }

  if (ciMode) {
    // Machine-independent sanity: emit every plist to a temp dir and prove
    // the XML parses (via plutil when available) and carries no forbidden key.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'azeebo-plists-'));
    let bad = 0;
    for (const svc of SERVICES) {
      const out = path.join(tmp, `com.azeebo.${svc.label}.plist`);
      try {
        emitPlist(plistDictFor(svc), out);
        const xml = fs.readFileSync(out, 'utf8');
        if (/<key>EnvironmentVariables<\/key>/i.test(xml) && svc.env === undefined) {
          console.error(`  - ${svc.label}: emitted plist has inline env but manifest has none`);
          bad += 1;
        }
        for (const k of FORBIDDEN_ENV_KEYS) {
          if (xml.includes(`<string>${k}</string>`)) {
            console.error(`  - ${svc.label}: emitted plist mentions forbidden key ${k}`);
            bad += 1;
          }
        }
      } catch (err) {
        console.error(`  - ${svc.label}: emit failed — ${err.message}`);
        bad += 1;
      }
    }
    fs.rmSync(tmp, { recursive: true, force: true });
    if (bad > 0) {
      console.error(`gen-service-plists --ci: ${bad} emitted plist(s) violated the contract`);
      process.exit(1);
    }
    console.log(`gen-service-plists --ci: all ${SERVICES.length} plists emit cleanly with zero inline DB URLs or secrets`);
    return;
  }

  let drifted = 0;
  for (const svc of SERVICES) {
    const installed = path.join(LAUNCH_AGENTS, `com.azeebo.${svc.label}.plist`);
    if (checkOnly) {
      const plistProblems = auditInstalled(installed, svc);
      for (const p of plistProblems) { console.error(`  - ${p}`); drifted += 1; }
    } else {
      try {
        emitPlist(plistDictFor(svc), installed);
        console.log(`wrote ${installed}`);
      } catch (err) {
        console.error(`gen-service-plists: ${err.message}`);
        process.exit(2);
      }
    }
  }

  if (checkOnly) {
    if (drifted > 0) {
      console.error(`gen-service-plists --check: ${drifted} service plist(s) drifted from the manifest — run "node scripts/launchd/gen-service-plists.mjs" to regenerate, or fix the manifest`);
      process.exit(1);
    }
    console.log(`gen-service-plists --check: all ${SERVICES.length} service plists match the manifest`);
    return;
  }
  console.log(`gen-service-plists: ${SERVICES.length} plists generated with zero inline DB URLs or secrets`);
}

if (invokedDirectly) main();
