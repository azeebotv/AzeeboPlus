// ============================================================================
// dev-port-drift-gate.mjs — CI gate: app dev-server ports == launchd manifest
//
// Every locally-run dev frontend is launched BY launchd from
// service-manifest.mjs, but its listening port is declared in the app's own
// config — three different config shapes, three ways to drift:
//   kind: 'vite' → <dir>/client/vite.config.ts  server.port
//   kind: 'next' → <dir>/package.json           scripts.dev  (-p/--port)
//   kind: 'expo' → <dir>/package.json           scripts.start (--port)
// These are two files a human edits in two places, and they HAVE drifted:
// the admin vite config once served 4100 (admin-backend's port — fixed in
// 9ca2b491), and `next dev` unpinned defaults to 3000 (auth-service's port)
// while two unpinned `expo start` dev servers would collide on Metro 8081.
// This gate makes every such drift a CI failure instead of a broken boot.
//
// Contract (mirrors prober-coverage-gate.mjs, same directory):
//   - Every manifest entry with kind vite/next/expo must match its app
//     config's pinned port.
//   - Every apps/*/ config of those shapes must be covered by a manifest
//     entry (both directions, so neither side can silently drop the other).
//   - Unparseable manifest/config sources FAIL the gate — a refactor that
//     changes the shapes must update the parsers, never silently pass. A
//     dev script WITHOUT a pinned port is also a failure: the manifest
//     contract needs a fixed number to compare against.
//
// Env: DEV_PORT_DRIFT_ROOT — repo root override (tests build fake trees).
// Usage: node scripts/launchd/dev-port-drift-gate.mjs [--check]
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Seams (overridable for tests)

const ROOT = process.env.DEV_PORT_DRIFT_ROOT
  ? path.resolve(process.env.DEV_PORT_DRIFT_ROOT)
  : path.resolve(path.dirname(new URL(import.meta.url).pathname.replace('/scripts/launchd', '')), '');

const MANIFEST_MJS = path.join(ROOT, 'scripts/launchd/service-manifest.mjs');
const APPS_DIR = path.join(ROOT, 'apps');

// ---------------------------------------------------------------------------
// Parsing

/**
 * Extract { label, dir, kind, port } for every manifest dev entry (kinds
 * vite/next/expo). Entries are single-line object literals; parsing is
 * line-based so a later entry's port can never bleed into an earlier one.
 * Rejects an empty/unparseable block — fail loud, never skip.
 */
export function parseManifestDevEntries(source) {
  const blockMatch = source.match(/export const SERVICES\s*=\s*\[([\s\S]*?)\n\];/);
  if (!blockMatch) return { error: 'SERVICES array not found in service-manifest.mjs' };
  const entries = [];
  for (const line of blockMatch[1].split('\n')) {
    if (!/^\s*\{/.test(line)) continue;
    const label = line.match(/label:\s*'([^']+)'/)?.[1];
    const dir = line.match(/dir:\s*'([^']+)'/)?.[1];
    const kind = line.match(/kind:\s*'([^']+)'/)?.[1];
    const port = line.match(/port:\s*(\d+)/)?.[1];
    if (label && dir && kind && port) {
      entries.push({ label, dir, kind, port: Number(port) });
    }
  }
  const devEntries = entries.filter((e) => ['vite', 'next', 'expo'].includes(e.kind));
  if (devEntries.length === 0) {
    return { error: "SERVICES found but no kind:'vite'|'next'|'expo' dev entries parsed" };
  }
  return { entries: devEntries };
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

/** Read a package.json scripts entry as JSON; shared error shape. */
function readScript(source, scriptName) {
  let pkg;
  try {
    pkg = JSON.parse(source);
  } catch {
    return { error: 'package.json is not valid JSON' };
  }
  const script = pkg?.scripts?.[scriptName];
  if (typeof script !== 'string' || script.trim() === '') {
    return { error: `no '${scriptName}' script in package.json` };
  }
  return { script };
}

/**
 * Extract the dev port from a Next.js package.json (`scripts.dev`).
 * Accepts `-p 4000`, `--port 4000`, and `--port=4000` anywhere in the
 * script (pnpm/next pass them through). Unpinned is a violation: next dev
 * defaults to 3000 — auth-service's port.
 */
export function parseNextDevPort(packageJsonSource) {
  const read = readScript(packageJsonSource, 'dev');
  if ('error' in read) return read;
  const m = /(?:^|\s)(?:-{1,2}p(?:ort)?\s+(\d+)|--port=(\d+))\b/.exec(read.script);
  if (!m) {
    return {
      error: `dev script does not pin a port ("${read.script}") — next dev would default to 3000 (auth-service's port)`,
    };
  }
  return { port: Number(m[1] ?? m[2]) };
}

/**
 * Extract the dev port from an Expo package.json (`scripts.start`).
 * Accepts `--port 8081` form. Unpinned is a violation: expo start defaults
 * to Metro 8081, and two unpinned Expo dev servers (mobile + tv) collide.
 */
export function parseExpoDevPort(packageJsonSource) {
  const read = readScript(packageJsonSource, 'start');
  if ('error' in read) return read;
  const m = /--port\s+(\d+)\b/.exec(read.script);
  if (!m) {
    return {
      error: `start script does not pin a port ("${read.script}") — expo start would default to Metro 8081 and collide with other Expo dev servers`,
    };
  }
  return { port: Number(m[1]) };
}

/** Per-kind config specs: file layout inside the app dir + parser. */
const CONFIG_SPECS = [
  { kind: 'vite', segments: ['client', 'vite.config.ts'], parse: parseViteServerPort },
  { kind: 'next', segments: ['package.json'], parse: parseNextDevPort },
  { kind: 'expo', segments: ['package.json'], parse: parseExpoDevPort },
];

function parseConfig(kind, config) {
  const spec = CONFIG_SPECS.find((s) => s.kind === kind);
  if (!spec) return { error: `unknown dev kind '${kind}'` };
  if (config.source !== undefined) return spec.parse(config.source);
  let source;
  try {
    source = fs.readFileSync(config.path, 'utf8');
  } catch {
    return { error: `config not readable at ${config.path}` };
  }
  return spec.parse(source);
}

// ---------------------------------------------------------------------------
// Core evaluation (pure)

/**
 * Compare manifest dev entries against the discovered app dev configs.
 * `configs` = [{ dir, kind, path?, source? }] — dir is the app dir
 * (apps/<name>), path is absolute; when `source` is present it is parsed
 * directly (tests) instead of reading from disk. Returns violation strings.
 * Join key is (dir, kind): the same dir may host several dev servers.
 */
export function evaluateDevPortDrift(manifestEntries, configs) {
  const problems = [];
  const byKey = new Map(configs.map((c) => [`${c.dir}:${c.kind}`, c]));

  for (const entry of manifestEntries) {
    const key = `${entry.dir}:${entry.kind}`;
    const config = byKey.get(key);
    if (!config) {
      const spec = CONFIG_SPECS.find((s) => s.kind === entry.kind);
      const rel = spec ? spec.segments.join('/') : '<config>';
      problems.push(
        `manifest ${entry.kind} entry '${entry.label}' (${entry.dir}) has no ${entry.dir}/${rel}`
      );
      continue;
    }
    const parsed = parseConfig(entry.kind, config);
    if ('error' in parsed) {
      problems.push(`${entry.dir} (${entry.kind}): ${parsed.error}`);
      continue;
    }
    if (parsed.port !== entry.port) {
      problems.push(
        `${entry.dir} (${entry.kind}): dev port ${parsed.port} ≠ manifest '${entry.label}' port ${entry.port}`
      );
    }
  }

  // Coverage both ways: an app dev config with no manifest entry of its
  // kind is unmanaged — launchd would never (re)start it.
  const manifestKeys = new Set(manifestEntries.map((e) => `${e.dir}:${e.kind}`));
  for (const config of configs) {
    if (!manifestKeys.has(`${config.dir}:${config.kind}`)) {
      problems.push(
        `${config.dir} (${config.kind}): no '${config.kind}' launchd manifest entry covers this dev server`
      );
    }
  }

  return problems;
}

// ---------------------------------------------------------------------------
// CLI

function discoverDevConfigs() {
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
    // vite SPA: the config file's existence IS the shape.
    const vitePath = path.join(APPS_DIR, app, 'client', 'vite.config.ts');
    if (fs.existsSync(vitePath)) {
      configs.push({ dir: path.posix.join('apps', app), kind: 'vite', path: vitePath });
      continue; // an app is exactly one dev-server shape
    }
    // package.json shapes: classify by the scripts themselves, not the
    // file's existence — every app HAS a package.json, and the gate must
    // not check a next app against the expo contract (or vice versa).
    const pkgPath = path.join(APPS_DIR, app, 'package.json');
    let scripts;
    try {
      scripts = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))?.scripts ?? {};
    } catch {
      continue; // unreadable package.json → no dev config of either shape
    }
    const rel = path.posix.join('apps', app);
    if (typeof scripts.dev === 'string' && /\bnext\b/.test(scripts.dev)) {
      configs.push({ dir: rel, kind: 'next', path: pkgPath });
    }
    if (typeof scripts.start === 'string' && /\bexpo\b/.test(scripts.start)) {
      configs.push({ dir: rel, kind: 'expo', path: pkgPath });
    }
  }
  return configs;
}

async function main() {
  let manifestSource;
  try {
    manifestSource = fs.readFileSync(MANIFEST_MJS, 'utf8');
  } catch {
    console.error(`dev-port-drift-gate: cannot read ${MANIFEST_MJS}`);
    process.exit(1);
  }
  const manifest = parseManifestDevEntries(manifestSource);
  if ('error' in manifest) {
    console.error(`dev-port-drift-gate: ${manifest.error}`);
    process.exit(1);
  }

  const problems = evaluateDevPortDrift(manifest.entries, discoverDevConfigs());

  if (problems.length === 0) {
    console.log(
      `dev-port-drift-gate: ${manifest.entries.length} manifest dev entries match their app dev-server ports`
    );
    process.exit(0);
  }

  console.error(`dev-port-drift-gate: ${problems.length} violation(s)`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    'Pin the dev port in the app config (or fix the manifest) — launchd starts the dev server on the manifest port.'
  );
  process.exit(1);
}

const invokedDirectly =
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname);
if (invokedDirectly) main();
