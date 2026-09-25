#!/usr/bin/env node
// ============================================================================
// prober-coverage-gate.mjs — every Ops Health probed service must have a
// launchd manifest entry
//
// Why: PROBED_SERVICES in apps/admin/src/modules/ops/ops.service.ts is the
// Ops Health page's fleet list, but nothing forced it to match the launchd
// manifest (scripts/launchd/service-manifest.mjs) — the source of truth for
// what actually runs on this machine. When the 15 newer services were added
// to the prober they weren't in the manifest at all: Ops Health reported
// them down with no way to fix it, because nothing was ever going to start
// them. This gate makes that drift unmergeable.
//
// Join key is PORT, not name: prober names are always `<dir>-service` style
// while manifest labels are deliberately mixed ('payment' vs
// 'user-service'), and the prober doesn't carry dirs. Ports are unique in
// both lists (the manifest generator enforces manifest-side uniqueness; the
// prober would double-probe a duplicated port), so a port match is a
// service match. A port match also carries the health-path contract: the
// prober dials `<port>`/v1/health, so whatever owns the port must answer it.
//
// Static by design: pure regex parsing of committed sources, no DB, no
// launchd, no node_modules. Fail modes are env-overridable so tests can
// drive them against temp files (PROBER_COVERAGE_ROOT seam, mirroring the
// pool gate's POOL_LIMITS_ROOT).
//
// Exit codes: 0 = invariant holds, 1 = violation (unmatched prober entry,
// duplicate port in one list, or unparseable PROBED_SERVICES block).
//
// Usage: node scripts/launchd/prober-coverage-gate.mjs [--check]
//   (no flags needed in CI; --check is an alias for the same run)
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Seams (overridable for tests)

const ROOT = process.env.PROBER_COVERAGE_ROOT
  ? path.resolve(process.env.PROBER_COVERAGE_ROOT)
  : path.resolve(path.dirname(new URL(import.meta.url).pathname.replace('/scripts/launchd', '')), '');

const OPS_SERVICE_TS = path.join(ROOT, 'apps/admin/src/modules/ops/ops.service.ts');
const MANIFEST_MJS = path.join(ROOT, 'scripts/launchd/service-manifest.mjs');

// ---------------------------------------------------------------------------
// Parsing

/**
 * Extract { name, port } pairs from the PROBED_SERVICES array literal.
 * Rejects an empty/unparseable block — a refactor that renames the array or
 * changes entry shape must fail loudly here, never silently pass.
 */
export function parseProberEntries(source) {
  const blockMatch = source.match(/PROBED_SERVICES[^=]*=\s*\[([\s\S]*?)\n\]/);
  if (!blockMatch) return { error: 'PROBED_SERVICES array not found in ops.service.ts' };
  const entries = [];
  const entryRe = /name:\s*'([^']+)',\s*port:\s*(\d+)/g;
  let m;
  while ((m = entryRe.exec(blockMatch[1])) !== null) {
    entries.push({ name: m[1], port: Number(m[2]) });
  }
  if (entries.length === 0) {
    return { error: 'PROBED_SERVICES found but no { name, port } entries parsed' };
  }
  return { entries };
}

/**
 * Extract { label, port } pairs from the manifest's SERVICES array.
 * Same fail-loud rule: the manifest is the contract; an unparseable one is
 * a gate failure, not a skip.
 */
export function parseManifestEntries(source) {
  const blockMatch = source.match(/export const SERVICES\s*=\s*\[([\s\S]*?)\n\];/);
  if (!blockMatch) return { error: 'SERVICES array not found in service-manifest.mjs' };
  const entries = [];
  const entryRe = /label:\s*'([^']+)',[\s\S]*?port:\s*(\d+)\s*[},]/g;
  let m;
  while ((m = entryRe.exec(blockMatch[1])) !== null) {
    entries.push({ label: m[1], port: Number(m[2]) });
  }
  if (entries.length === 0) {
    return { error: 'SERVICES found but no { label, port } entries parsed' };
  }
  return { entries };
}

/** Ports claimed twice within one list — a prober dup double-probes; a
 *  manifest dup would mean two agents fight over one port. */
export function findDuplicatePorts(entries) {
  const seen = new Map();
  for (const e of entries) {
    const key = e.port;
    const list = seen.get(key) ?? [];
    list.push(e.name ?? e.label);
    seen.set(key, list);
  }
  return [...seen.entries()].filter(([, names]) => names.length > 1);
}

// ---------------------------------------------------------------------------
// Core evaluation (pure)

export function evaluate(prober, manifest) {
  const problems = [];
  const manifestPorts = new Set(manifest.map((e) => e.port));

  for (const dup of findDuplicatePorts(prober)) {
    problems.push(`prober port ${dup[0]} claimed by: ${dup[1].join(', ')}`);
  }
  for (const dup of findDuplicatePorts(manifest)) {
    problems.push(`manifest port ${dup[0]} claimed by: ${dup[1].join(', ')}`);
  }

  const unmatched = prober.filter((p) => !manifestPorts.has(p.port));
  for (const p of unmatched) {
    problems.push(
      `prober entry '${p.name}' (port ${p.port}) has NO launchd manifest entry — ` +
        `nothing would ever start it; add it to scripts/launchd/service-manifest.mjs ` +
        `or remove it from PROBED_SERVICES`
    );
  }

  return { ok: problems.length === 0, problems };
}

// ---------------------------------------------------------------------------
// CLI

function main() {
  let proberSource;
  let manifestSource;
  try {
    proberSource = fs.readFileSync(OPS_SERVICE_TS, 'utf8');
  } catch {
    console.error(`prober-coverage-gate: cannot read ${OPS_SERVICE_TS}`);
    process.exit(1);
  }
  try {
    manifestSource = fs.readFileSync(MANIFEST_MJS, 'utf8');
  } catch {
    console.error(`prober-coverage-gate: cannot read ${MANIFEST_MJS}`);
    process.exit(1);
  }

  const prober = parseProberEntries(proberSource);
  if (prober.error) {
    console.error(`prober-coverage-gate: ${prober.error}`);
    process.exit(1);
  }
  const manifest = parseManifestEntries(manifestSource);
  if (manifest.error) {
    console.error(`prober-coverage-gate: ${manifest.error}`);
    process.exit(1);
  }

  const { ok, problems } = evaluate(prober.entries, manifest.entries);

  if (ok) {
    console.log(
      `prober-coverage-gate: all ${prober.entries.length} probed services ` +
        `have manifest coverage (${manifest.entries.length} manifest entries)`
    );
    process.exit(0);
  }

  console.error(`prober-coverage-gate: ${problems.length} violation(s)`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const invokedDirectly =
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname);
if (invokedDirectly) main();
