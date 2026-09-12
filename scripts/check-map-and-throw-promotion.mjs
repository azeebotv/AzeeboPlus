#!/usr/bin/env node
// ============================================================================
// check-map-and-throw-promotion.mjs — forces the eslint error-gate block forward
//
// The require-map-and-throw migration has two forces working against drift:
//
//   • check-lint-warning-ratchet.mjs  — stops the count from GROWING
//     (per-workspace baseline may only decrease). This is the regression gate.
//   • THIS gate                       — forces PROGRESSION. Any service under
//     services/*/* that lints CLEAN of require-map-and-throw must appear in
//     the eslint.config.js error-gate block. A clean service sitting at the
//     repo-wide `warn` severity is free regression fuel: nothing re-breaks
//     CI when someone hand-writes a fabricated-4xx catch block there again.
//
// A promotion is then one mechanical PR: add the service's glob to the
// error-gate block (the failure prints the exact snippet) and drop its
// baseline entry with `pnpm run check:lint-ratchet -- --update`.
//
// How the gate list is read: instead of parsing eslint.config.js text, this
// script resolves each service's EFFECTIVE rule severity through ESLint
// itself — `lintText` on a virtual probe file whose path is
// `<service>/src/__promotion_probe__.ts`. Every config mechanism (globs,
// override blocks, future reshapes) applies to the probe exactly as it would
// to real service files, so the gate cannot be fooled by formatting or
// restructuring.
//
// Scope: services/*/* only. The error-gate block is a services migration
// story — frontend apps that never throw NestJS HttpExceptions are not
// forced into it.
//
// Usage:
//   node scripts/check-map-and-throw-promotion.mjs          # gate (exit 1 on stale gate list)
//   node scripts/check-map-and-throw-promotion.mjs --list   # show classification, no gate
//
// CI wiring: pr-checks.yml (lint-pr) and lint.yml (lint-backend), right
// after check:lint-ratchet. Shares one cached ESLint pass with the ratchet.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { discoverWorkspaces, runEslintJson, countWarnings, RULE } from './check-lint-warning-ratchet.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Only workspaces under these layout prefixes are promotable. */
export const SCOPE_PREFIXES = ['services/'];

/** Whether a workspace directory (relative, posix) is in promotion scope. */
export function inScope(relDir) {
  const posix = relDir.replaceAll(path.sep, '/');
  return SCOPE_PREFIXES.some((p) => posix.startsWith(p));
}

/** Virtual probe filename resolved inside each service dir (never on disk). */
const PROBE_FILENAME = '__promotion_probe__.ts';

// ---------------------------------------------------------------------------
// Effective severity resolution (through ESLint itself)
// ---------------------------------------------------------------------------

/**
 * Resolve the effective severity of `ruleId` for each workspace through
 * ESLint itself — `calculateConfigForFile` on a virtual probe file inside the
 * service's directory (the same config resolution the CLI performs for real
 * service files). Returns Map<workspaceName, 0|1|2|null> where null means
 * the rule is not configured for that file tree at all.
 */
export async function resolveSeverities(workspaces, ruleId = RULE) {
  const { ESLint } = require('eslint');
  const eslint = new ESLint({ cwd: ROOT });
  const severities = new Map();
  for (const w of workspaces) {
    const relProbe = path.relative(ROOT, path.join(w.dir, PROBE_FILENAME));
    const config = await eslint.calculateConfigForFile(relProbe);
    const raw = config.rules?.[ruleId];
    let severity = null;
    if (typeof raw === 'number') severity = raw;
    else if (Array.isArray(raw)) severity = typeof raw[0] === 'number' ? raw[0] : null;
    else if (raw === 'off') severity = 0;
    severities.set(w.name, severity);
  }
  return severities;
}

/**
 * The pure decision: classify every service workspace.
 *
 *   promote   — lints clean but is NOT gated (this gate's failure)
 *   healthy   — clean AND gated (the goal state)
 *   migrating — still has warnings (ratchet's job, not this gate's)
 *   misgated  — gated but still has warnings (should not happen: the error
 *               severity already fails lint; listed for operator awareness)
 */
export function classifyServices(workspaces, severities, warnCounts) {
  return workspaces.map((w) => {
    const severity = severities.get(w.name) ?? null;
    const gated = severity === 2;
    const warnCount = warnCounts.get(w.name) ?? 0;
    let status;
    if (warnCount > 0) status = gated ? 'misgated' : 'migrating';
    else status = gated ? 'healthy' : 'promote';
    return { name: w.name, dir: w.dir, severity, gated, warnCount, status };
  });
}

/** The exact config snippet an operator needs to promote a service. */
export function promotionSnippet(relDir) {
  const posix = relDir.replaceAll(path.sep, '/');
  return `      'services/${posix.split('/').slice(1).join('/')}/**/*.ts',`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const argv = process.argv.slice(2);
  const list = argv.includes('--list');
  const ruleId = process.env.AZEEBO_LINT_RULE ?? RULE;

  const allWorkspaces = discoverWorkspaces(ROOT);
  const workspaces = allWorkspaces.filter((w) => inScope(path.relative(ROOT, w.dir)));
  if (workspaces.length === 0) {
    console.error('No service workspaces discovered — check pnpm-workspace.yaml layout.');
    process.exit(2);
  }

  const severities = await resolveSeverities(workspaces, ruleId);

  // One shared ESLint JSON pass over the service dirs (same runner the
  // ratchet uses), counted per workspace for the migrating/misgated status.
  const results = runEslintJson(workspaces.flatMap((w) => w.lintDirs), ROOT);
  const { counts } = countWarnings(results, workspaces, ruleId);

  const classified = classifyServices(workspaces, severities, counts);
  const promote = classified.filter((c) => c.status === 'promote');
  const misgated = classified.filter((c) => c.status === 'misgated');
  const migrating = classified.filter((c) => c.status === 'migrating');
  const healthy = classified.filter((c) => c.status === 'healthy');

  if (list) {
    for (const c of classified.sort((a, b) => a.name.localeCompare(b.name))) {
      const sev = c.severity === 2 ? 'error' : c.severity === 1 ? 'warn' : 'not-configured';
      console.log(`${c.status.padEnd(10)} ${String(c.warnCount).padStart(3)} warn  ${sev.padEnd(14)} ${c.name}`);
    }
    console.log(`\n${classified.length} service workspaces · ${healthy.length} gated · ${migrating.length} migrating · ${promote.length} promotable`);
    return;
  }

  if (promote.length > 0) {
    console.error(`\n🚫 ${promote.length} service(s) lint CLEAN of ${ruleId} but are NOT in the eslint error-gate block:`);
    const globs = [];
    for (const c of promote) {
      const rel = path.relative(ROOT, c.dir);
      console.error(`::error file=eslint.config.js::${c.name} lints clean — promote it to the error-gate block`);
      console.error(`   ${rel}`);
      globs.push(promotionSnippet(rel));
    }
    console.error('\nAdd to the error-gate block in eslint.config.js (then run `pnpm run check:lint-ratchet -- --update` to drop their baseline entries):');
    console.error('  {');
    console.error("    files: [");
    for (const g of globs) console.error(g);
    console.error('    ],');
    console.error('    rules: {');
    console.error(`      '${ruleId}': 'error',`);
    console.error('    },');
    console.error('  },');
    process.exit(1);
  }

  if (misgated.length > 0) {
    // Gated services must be clean; if lint itself passed but the gate list
    // drifted (e.g. glob typo), say so loudly rather than silently pass.
    console.error(`\n🚫 ${misgated.length} service(s) are in the error-gate block but still report ${ruleId} warnings:`);
    for (const c of misgated) console.error(`  ${c.name} — ${c.warnCount} warning(s); fix the glob or the conversion`);
    process.exit(1);
  }

  console.log(
    `✅ Promotion gate holds: ${healthy.length}/${classified.length} services in the error-gate block, ${migrating.length} still migrating, ${promote.length} pending promotion.`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error('check-map-and-throw-promotion failed:', err);
    process.exit(2);
  });
}
