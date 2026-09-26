// ============================================================================
// vite-port-drift-gate.mjs — CI gate: vite dev ports == launchd manifest
//
// The admin/creator SPAs are launched BY launchd from service-manifest.mjs
// (`kind: 'vite'` entries), but their listening ports are declared in each
// app's client/vite.config.ts. Those are two files a human edits in two
// places — and they DID drift once: vite served 4100 (admin-backend's port,
// a latent bind conflict) while the manifest said 5173 (commit 9ca2b491).
// This gate makes that drift a CI failure instead of a broken dev boot.
//
// Contract (mirrors prober-coverage-gate.mjs, same directory):
//   - Every manifest entry with kind: 'vite' must have a
//     <dir>/client/vite.config.ts whose server.port equals the entry's port.
//   - Every apps/*/client/vite.config.ts must be covered by a manifest
//     kind:'vite' entry (both directions, so neither side can silently
//     drop the other).
//   - Unparseable manifest/vite sources FAIL the gate — a refactor that
//     changes the shapes must update the parsers, never silently pass.
//
// Env: VITE_PORT_DRIFT_ROOT — repo root override (tests build fake trees).
// Usage: node scripts/launchd/vite-port-drift-gate.mjs [--check]
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Seams (overridable for tests)

const ROOT = process.env.VITE_PORT_DRIFT_ROOT
  ? path.resolve(process.env.VITE_PORT_DRIFT_ROOT)
  : path.resolve(path.dirname(new URL(import.meta.url).pathname.replace('/scripts/launchd', '')), '');

const MANIFEST_MJS = path.join(ROOT, 'scripts/launchd/service-manifest.mjs');
const APPS_DIR = path.join(ROOT, 'apps');

// ---------------------------------------------------------------------------
// Parsing

/**
 * Extract { label, dir, port } for every kind:'vite' entry in the manifest's
 * SERVICES array. Entries are single-line object literals; parsing is
 * line-based so a later entry's port can never bleed into an earlier one.
 * Rejects an empty/unparseable block — fail loud, never skip.
 */
export function parseManifestViteEntries(source) {
  const blockMatch = source.match(/export const SERVICES\s*=\s*\[([\s\S]*?)\n\];/);
  if (!blockMatch) return { error: 'SERVICES array not found in service-manifest.mjs' };
  const entries = [];
  for (const line of blockMatch[1].split('\n')) {
    if (!/^\s*\{/.test(line)) continue;
    const label = line.match(/label:\s*'([^']+)'/)?.[1];
    const dir = line.match(/dir:\s*'([^']+)'/)?.[1];
    const kind = line.match(/kind:\s*'([^']+)'/)?.[1];
    const port = line.match(/port:\s*(\d+)/)?.[1];
    if (label && dir && kind === 'vite' && port) {
      entries.push({ label, dir, port: Number(port) });
    }
  }
  if (entries.length === 0) {
    return { error: 'SERVICES found but no kind:\'vite\' entries parsed' };
  }
  return { entries };
}

/**
 * Extract server.port from a vite.config.ts source. The server block is
 * sliced from `server:` to the first closer at two-space indent (`\n  },`)
 * — the proxy object's inner closers sit deeper, so the lazy match can't
 * stop early. A config without a static numeric port (function form, env
 * interpolation) is a violation, not a skip: the manifest contract needs a
 * fixed number to compare against.
 */
export function parseViteServerPort(source) {
  const blockMatch = source.match(/server:\s*\{([\s\S]*?)\n  \},/);
  if (!blockMatch) return { error: 'server block not found in vite.config.ts' };
  const portMatch = blockMatch[1].match(/\bport:\s*(\d+)\b/);
  if (!portMatch) return { error: 'no static numeric server.port in vite.config.ts' };
  return { port: Number(portMatch[1]) };
}

/** Read + parse one vite config file; returns { port } or { error }. */
function readViteConfig(configPath) {
  let source;
  try {
    source = fs.readFileSync(configPath, 'utf8');
  } catch {
    return { error: `vite.config.ts not readable at ${configPath}` };
  }
  return parseViteServerPort(source);
}

// ---------------------------------------------------------------------------
// Core evaluation (pure)

/**
 * Compare manifest kind:'vite' entries against the discovered vite configs.
 * `configs` = [{ dir, path, source? }] — dir is the app dir (apps/<name>),
 * path is repo-relative. When `source` is present it is parsed directly
 * (tests); otherwise the file is read from disk. Returns violation strings.
 */
export function evaluateVitePortDrift(manifestEntries, configs) {
  const problems = [];
  const byDir = new Map(configs.map((c) => [c.dir, c]));

  for (const entry of manifestEntries) {
    const config = byDir.get(entry.dir);
    if (!config) {
      problems.push(
        `manifest kind:'vite' entry '${entry.label}' (${entry.dir}) has no ${entry.dir}/client/vite.config.ts`
      );
      continue;
    }
    const parsed = config.source !== undefined
      ? parseViteServerPort(config.source)
      : readViteConfig(config.path);
    if ('error' in parsed) {
      problems.push(`${entry.dir}/client/vite.config.ts: ${parsed.error}`);
      continue;
    }
    if (parsed.port !== entry.port) {
      problems.push(
        `${entry.dir}/client/vite.config.ts: vite server.port ${parsed.port} ≠ manifest '${entry.label}' port ${entry.port}`
      );
    }
  }

  // Coverage both ways: a vite config whose app dir has no manifest
  // kind:'vite' entry is unmanaged — launchd would never (re)start it.
  const manifestDirs = new Set(manifestEntries.map((e) => e.dir));
  for (const config of configs) {
    if (!manifestDirs.has(config.dir)) {
      problems.push(
        `${config.dir}/client/vite.config.ts: no kind:'vite' launchd manifest entry covers this SPA`
      );
    }
  }

  return problems;
}

// ---------------------------------------------------------------------------
// CLI

function discoverViteConfigs() {
  const configs = [];
  let appDirs;
  try {
    appDirs = fs
      .readdirSync(APPS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return configs; // no apps dir → manifest entries will report the gap
  }
  for (const app of appDirs) {
    const configPath = path.join(APPS_DIR, app, 'client', 'vite.config.ts');
    if (fs.existsSync(configPath)) {
      configs.push({
        dir: path.posix.join('apps', app),
        path: configPath,
      });
    }
  }
  return configs;
}

async function main() {
  let manifestSource;
  try {
    manifestSource = fs.readFileSync(MANIFEST_MJS, 'utf8');
  } catch {
    console.error(`vite-port-drift-gate: cannot read ${MANIFEST_MJS}`);
    process.exit(1);
  }
  const manifest = parseManifestViteEntries(manifestSource);
  if ('error' in manifest) {
    console.error(`vite-port-drift-gate: ${manifest.error}`);
    process.exit(1);
  }

  const problems = evaluateVitePortDrift(manifest.entries, discoverViteConfigs());

  if (problems.length === 0) {
    console.log(
      `vite-port-drift-gate: ${manifest.entries.length} manifest vite entr(y|ies) match their vite.config.ts server.port`
    );
    process.exit(0);
  }

  console.error(`vite-port-drift-gate: ${problems.length} violation(s)`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('Fix the vite.config.ts port (or the manifest) — launchd starts the SPA on the manifest port.');
  process.exit(1);
}

const invokedDirectly =
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname);
if (invokedDirectly) main();
