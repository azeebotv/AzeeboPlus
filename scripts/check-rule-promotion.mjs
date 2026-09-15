#!/usr/bin/env node
// ============================================================================
// check-rule-promotion.mjs — steady-state tripwire for lint migrations
//
// The require-map-and-throw migration is COMPLETE (every service converted),
// so its scaffolding is retired: the rule is `error` in the eslint.config.js
// base config, the per-service error-gate block is gone, and the ratchet
// baseline sits at total 0. THIS gate is what keeps that end state from
// quietly eroding. It fails CI when any service under services/*/* stops
// resolving a promotion-enforced rule to 'error' severity — i.e. when
// someone:
//
//   • downgrades the rule to 'warn'/'off' (in the base config, an override
//     block, or by deleting the config line),
//   • scope-exceptions a service out of the rule's coverage, or
//   • reintroduces warnings behind a lowered severity (reported as misgated).
//
// Which rules are enforced is config-driven — see
// scripts/promotion-rules.json (loading/validation lives in
// scripts/lib/promotion-config.mjs, shared with the ratchet). That file is
// also the onboarding point for the NEXT warn-while-migrating rule:
// implement it, set it `warn` repo-wide, add an entry with a ratchet path,
// and both gates (this one plus the check-lint-warning-ratchet regression
// gate) enforce the migration automatically. When that migration finishes,
// flip the rule to `error` in the base config and empty the baseline with
// one `--update` — this gate then guards the new steady state, exactly as
// it does for require-map-and-throw today.
//
// How the gate list is read: instead of parsing eslint.config.js text, this
// script resolves each service's EFFECTIVE rule severity through ESLint
// itself — `calculateConfigForFile` on a virtual probe file whose path is
// `<service>/src/__promotion_probe__.ts`. Every config mechanism (globs,
// override blocks, future reshapes) applies to the probe exactly as it would
// to real service files, so the gate cannot be fooled by formatting or
// restructuring.
//
// Scope: services/*/* only. Frontend apps that never throw NestJS
// HttpExceptions are not tripwired.
//
// Rule selection:
//   • default            — every rule in promotion-rules.json
//   • AZEEBO_LINT_RULE=k — only rule id `k` (must be listed in the config)
//   • AZEEBO_LINT_RULE=k of an unlisted rule is an operator error (exit 2):
//     silently gating an unenforced rule would defeat the whole mechanism.
//
// Usage:
//   node scripts/check-rule-promotion.mjs          # gate (exit 1 on stale gate lists)
//   node scripts/check-rule-promotion.mjs --list   # show classification, no gate
//
// CI wiring: pr-checks.yml (lint-pr) and lint.yml (lint-backend), right
// after check:lint-ratchet. Shares one cached ESLint pass with the ratchet.
// ============================================================================

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { discoverWorkspaces, runEslintJson, countWarnings } from './check-lint-warning-ratchet.mjs';
import { loadPromotionConfig, selectRules, PROMOTION_CONFIG_PATH } from './lib/promotion-config.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Re-exported so tests and sibling scripts keep a single import surface for
// the config API (the implementation moved to scripts/lib/promotion-config.mjs).
export { loadPromotionConfig, selectRules, PROMOTION_CONFIG_PATH };

/** Only workspaces under these layout prefixes are promotable. */
export const SCOPE_PREFIXES = ['services/'];

/** Whether a workspace directory (relative, posix) is in promotion scope. */
export function inScope(relDir) {
  const posix = relDir.replaceAll('\\', '/');
  return SCOPE_PREFIXES.some((p) => posix.startsWith(p));
}

/** Virtual probe filename resolved inside each service dir (never on disk). */
const PROBE_FILENAME = '__promotion_probe__.ts';

// ---------------------------------------------------------------------------
// Effective severity resolution (through ESLint itself)
// ---------------------------------------------------------------------------

/**
 * Resolve the effective severity of every requested rule for each workspace
 * through ESLint itself — `calculateConfigForFile` on a virtual probe file
 * inside the service's directory (the same config resolution the CLI
 * performs for real service files). ONE config resolution per workspace
 * covers all rules.
 *
 * Returns Map<workspaceName, Map<ruleId, 0|1|2|null>> where null means the
 * rule is not configured for that file tree at all.
 */
export async function resolveSeverities(workspaces, ruleIds) {
  const { ESLint } = require('eslint');
  const eslint = new ESLint({ cwd: ROOT });
  const severities = new Map();
  for (const w of workspaces) {
    const relProbe = path.relative(ROOT, path.join(w.dir, PROBE_FILENAME));
    const config = await eslint.calculateConfigForFile(relProbe);
    const perRule = new Map();
    for (const ruleId of ruleIds) {
      const raw = config.rules?.[ruleId];
      let severity = null;
      if (typeof raw === 'number') severity = raw;
      else if (Array.isArray(raw)) severity = typeof raw[0] === 'number' ? raw[0] : null;
      else if (raw === 'off') severity = 0;
      perRule.set(ruleId, severity);
    }
    severities.set(w.name, perRule);
  }
  return severities;
}

/** Extract the severity of `ruleId` from a resolveSeverities map. */
export function severityOf(severities, workspaceName, ruleId) {
  return severities.get(workspaceName)?.get(ruleId) ?? null;
}

/**
 * The pure decision: classify every service workspace against every rule.
 *
 *   promote   — lints clean but the rule is below 'error' (this gate's
 *               failure: a weakened severity on a clean service)
 *   healthy   — clean AND 'error'-gated (the goal state)
 *   migrating — still has warnings at a lower severity (the ratchet's job
 *               during an in-flight migration; misgated at 'error')
 *   misgated  — gated but still has warnings (should not happen: the error
 *               severity already fails lint; listed for operator awareness)
 *   exempt    — clean AND the config pins this rule below 'error' for the
 *               workspace's whole file tree. An explicit, committed
 *               "never here" — the opposite of regression fuel. With the
 *               base config at 'error', any lower pin wins wherever it
 *               lives; a warn-vs-warn or warn-vs-off pin means the pin
 *               changes nothing and is reported as a config warning.
 */
export function classifyServices(workspaces, severities, warnCounts, ruleId, { pinExemptions = [] } = {}) {
  const pinned = new Set(pinExemptions);
  return workspaces.map((w) => {
    const severity = severityOf(severities, w.name, ruleId);
    const gated = severity === 2;
    const warnCount = warnCounts.get(w.name) ?? 0;
    let status;
    if (warnCount > 0) status = gated ? 'misgated' : 'migrating';
    else if (gated) status = 'healthy';
    else if (pinned.has(w.name)) status = 'exempt';
    else status = 'promote';
    return { name: w.name, dir: w.dir, severity, gated, warnCount, status };
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const argv = process.argv.slice(2);
  const list = argv.includes('--list');

  const allWorkspaces = discoverWorkspaces(ROOT);
  const workspaces = allWorkspaces.filter((w) => inScope(path.relative(ROOT, w.dir)));
  if (workspaces.length === 0) {
    console.error('No service workspaces discovered — check pnpm-workspace.yaml layout.');
    process.exit(2);
  }

  const { rules, warnings } = loadPromotionConfig(ROOT);
  const selected = selectRules(rules);

  const ruleIds = selected.map((r) => r.id);
  const severities = await resolveSeverities(workspaces, ruleIds);

  // One shared ESLint JSON pass over the service dirs (same runner the
  // ratchet uses), counted per workspace per rule.
  const results = runEslintJson(workspaces.flatMap((w) => w.lintDirs), ROOT);

  const perRule = selected.map((rule) => {
    const { counts } = countWarnings(results, workspaces, rule.id);
    const classified = classifyServices(workspaces, severities, counts, rule.id, {
      pinExemptions: rule.exemptWorkspaces ?? [],
    });
    // Config-rot warnings: an exemption that no longer matches reality.
    for (const c of classified) {
      if (c.status === 'exempt' && c.severity === 2) {
        warnings.push(`exemptWorkspaces for "${rule.id}" lists "${c.name}" but it already resolves to 'error' — drop the exemption`);
      } else if (c.status === 'exempt' && c.warnCount > 0) {
        warnings.push(`exemptWorkspaces for "${rule.id}" lists "${c.name}" but it reports ${c.warnCount} warning(s) — exemption or conversion, not both`);
      }
    }
    return { rule, counts, classified };
  });

  for (const warning of warnings) console.warn(`⚠️  ${warning}`);

  if (list) {
    for (const { rule, classified } of perRule) {
      const healthy = classified.filter((c) => c.status === 'healthy').length;
      const migrating = classified.filter((c) => c.status === 'migrating').length;
      const promote = classified.filter((c) => c.status === 'promote').length;
      const exempt = classified.filter((c) => c.status === 'exempt').length;
      console.log(`\n── ${rule.id} ──`);
      for (const c of classified.sort((a, b) => a.name.localeCompare(b.name))) {
        const sev = c.severity === 2 ? 'error' : c.severity === 1 ? 'warn' : 'not-configured';
        console.log(`${c.status.padEnd(10)} ${String(c.warnCount).padStart(3)} warn  ${sev.padEnd(14)} ${c.name}`);
      }
      console.log(`${classified.length} service workspaces · ${healthy} gated · ${migrating} migrating · ${promote} promotable · ${exempt} exempt`);
    }
    return;
  }

  let failed = false;
  for (const { rule, classified } of perRule) {
    const promote = classified.filter((c) => c.status === 'promote');
    const misgated = classified.filter((c) => c.status === 'misgated');

    if (promote.length > 0) {
      failed = true;
      const sevLabel = (s) => (s === 2 ? 'error' : s === 1 ? 'warn' : s === 0 ? 'off' : 'not configured');
      console.error(`\n🚫 ${rule.id} no longer resolves to 'error' for ${promote.length} service(s) — the rule must be 'error' for every service:`);
      for (const c of promote) {
        console.error(`::error file=eslint.config.js::${c.name}: ${rule.id} resolves to '${sevLabel(c.severity)}' while the service lints clean — restore 'error' severity`);
        console.error(`   ${path.relative(ROOT, c.dir)}`);
      }
      console.error('\nRestore the rule to error severity in eslint.config.js — a clean service below error is free regression fuel.');
      console.error('A deliberate scope exception instead: add the service to exemptWorkspaces for this rule in scripts/promotion-rules.json.');
    }

    if (misgated.length > 0) {
      failed = true;
      // A service at 'error' severity cannot emit warnings through the
      // normal lint job — if counts appear anyway, the severity regressed
      // somewhere the lint job doesn't see (or the probe path diverged from
      // real service files). Say so loudly rather than pass.
      console.error(`\n🚫 ${misgated.length} service(s) report ${rule.id} warnings despite resolving to 'error' severity:`);
      for (const c of misgated) console.error(`  ${c.name} — ${c.warnCount} warning(s); fix the conversion or restore the severity`);
    }
  }

  if (failed) process.exit(1);

  const healthy = perRule
    .map(({ rule, classified }) => ({ rule, healthy: classified.filter((c) => c.status === 'healthy').length }))
    .map(({ rule, healthy }) => `${rule.id}: ${healthy}/${workspaces.length} gated`)
    .join(' · ');
  console.log(`✅ Promotion gate holds — ${healthy}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error('check-rule-promotion failed:', err);
    process.exit(2);
  });
}
