#!/usr/bin/env node
// ============================================================================
// audit-gate.mjs — blocking dependency-advisory gate for CI
//
// Wraps `pnpm audit --json` and fails (exit 1) when any advisory at or above
// the severity threshold is present — EXCEPT advisories on the allowlist
// below, which must carry an upstream justification and an expiry date.
// Expired allowlist entries are treated as blocking again, so forgotten
// exceptions fail the build on their own.
//
// This replaces a bare `pnpm audit --audit-level=high` (which cannot express
// "no upstream fix exists" and was therefore permanently red), while keeping
// the same blocking semantics for everything else.
//
// Usage:
//   node scripts/audit-gate.mjs                      # fail on high+ (default)
//   node scripts/audit-gate.mjs --severity=critical  # fail on critical only
//   node scripts/audit-gate.mjs --prod               # production deps only
//   node scripts/audit-gate.mjs --severity=moderate  # stricter local run
//
// Exit codes: 0 = pass · 1 = blocking findings · 2 = tooling/usage error
// ============================================================================

import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SEVERITY_RANK = { low: 0, moderate: 1, high: 2, critical: 3 };

// ---------------------------------------------------------------------------
// Allowlist — exceptions with an expiry. Re-validate every entry when it
// expires; the gate fails automatically after that date.
// ---------------------------------------------------------------------------
export const ALLOWLIST = [
  {
    ghsa: 'GHSA-86w9-cpqp-85rv',
    package: 'node-forge',
    reason:
      'No upstream fix exists (registry reports patched: <0.0.0). Pulled in by ' +
      'expo > @expo/cli — build-time tooling only; never shipped in app bundles ' +
      'or executed on any server. Re-check when expo ships a fixed @expo/cli.',
    expires: '2027-01-01',
  },
  {
    ghsa: 'GHSA-g84c-rxfj-3j2c',
    package: 'webpack-dev-middleware',
    reason:
      'Fix requires >=7.4.6 (major bump), but @storybook/builder-webpack5@8 pins ^6 — ' +
      'forcing the major risks breaking the storybook build used by visual tests. ' +
      'Dev-server path traversal only; the dev server is never exposed outside ' +
      'developer machines/CI. Re-evaluate on the next storybook major.',
    expires: '2027-01-01',
  },
];

// ---------------------------------------------------------------------------
// Helpers (exported for tests)
// ---------------------------------------------------------------------------

/** Extract every GHSA id from an advisory's url + references fields. */
export function ghsaIds(advisory) {
  const text = [advisory.url, advisory.references].filter(Boolean).join('\n');
  // GHSA ids are 4-4-4 lowercase alphanumerics (e.g. GHSA-g84c-rxfj-3j2c).
  return [...new Set(text.match(/GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}/g) || [])];
}

/**
 * Split advisories into blocking vs allowlisted.
 * @param {object} report   parsed `pnpm audit --json` output
 * @param {string} minSeverity  lowest severity that blocks
 * @param {Array}  allowlist    entries { ghsa, package, expires? }
 * @param {string} todayISO  injectable clock for tests (YYYY-MM-DD)
 * @returns {{ blocking: [], allowed: [], expired: [] }}
 */
export function evaluate(report, minSeverity, allowlist = ALLOWLIST, todayISO) {
  const min = SEVERITY_RANK[minSeverity];
  if (min === undefined) throw new Error(`unknown severity: ${minSeverity}`);
  const today = todayISO ?? new Date().toISOString().slice(0, 10);

  const blocking = [];
  const allowed = [];
  const expired = [];

  for (const advisory of Object.values(report.advisories || {})) {
    if ((SEVERITY_RANK[advisory.severity] ?? -1) < min) continue;

    const ghsas = ghsaIds(advisory);
    const entry = allowlist.find(
      (a) => ghsas.includes(a.ghsa) && a.package === advisory.module_name
    );

    if (!entry) {
      blocking.push(advisory);
    } else if (entry.expires && entry.expires < today) {
      expired.push({ advisory, entry });
    } else {
      allowed.push({ advisory, entry });
    }
  }
  return { blocking, allowed, expired };
}

/** One-line rendering of an advisory for the failure table. */
export function formatAdvisory(a) {
  const version = a.findings?.[0]?.version ?? '?';
  const ghsa = ghsaIds(a)[0] ?? 'no-GHSA';
  const path = a.findings?.[0]?.paths?.[0] ?? '';
  return `  ${String(a.severity).padEnd(8)} ${String(a.module_name).padEnd(24)} @${version}  ${a.title ?? ''} (${ghsa})${path ? `\n            via ${path}` : ''}`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export function main(argv = process.argv.slice(2)) {
  const severityArg = argv.find((a) => a.startsWith('--severity='));
  const severity = severityArg ? severityArg.slice('--severity='.length) : 'high';
  if (!(severity in SEVERITY_RANK)) {
    console.error(`audit-gate: unknown --severity "${severity}" (low|moderate|high|critical)`);
    return 2;
  }
  const prod = argv.includes('--prod');

  const args = ['audit', '--json', ...(prod ? ['--prod'] : [])];
  const res = spawnSync('pnpm', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

  let report;
  try {
    report = JSON.parse(res.stdout);
  } catch {
    console.error('audit-gate: could not parse `pnpm audit --json` output.');
    console.error(res.stderr || res.stdout || `(exit ${res.status})`);
    return 2;
  }

  const counts = report.metadata?.vulnerabilities ?? {};
  console.log(
    `audit-gate: severity>=${severity}${prod ? ' (prod only)' : ''} — registry reports ` +
      `critical=${counts.critical ?? '?'} high=${counts.high ?? '?'} ` +
      `moderate=${counts.moderate ?? '?'} low=${counts.low ?? '?'}`
  );

  const { blocking, allowed, expired } = evaluate(report, severity);

  for (const { advisory, entry } of allowed) {
    console.warn(
      `⚠ ALLOWED ${advisory.severity} ${advisory.module_name} (${ghsaIds(advisory)[0]}) ` +
        `until ${entry.expires}: ${entry.reason}`
    );
  }
  for (const { advisory, entry } of expired) {
    console.error(
      `✖ EXPIRED allowlist entry for ${advisory.module_name} (${entry.ghsa}) — expired ${entry.expires}. ` +
        `Re-validate or remove the exception.`
    );
  }

  if (blocking.length || expired.length) {
    console.error(`\naudit-gate: FAIL — ${blocking.length} blocking, ${expired.length} expired exception(s)\n`);
    for (const a of [...blocking, ...expired.map((e) => e.advisory)]) {
      console.error(formatAdvisory(a));
    }
    console.error(
      '\nFix by bumping pnpm overrides to a patched floor (root package.json#pnpm.overrides),\n' +
        'running `pnpm install`, or — only when no compatible upstream fix exists — adding a\n' +
        'documented, expiry-dated entry to ALLOWLIST in scripts/audit-gate.mjs.\n'
    );
    return 1;
  }

  console.log(
    `audit-gate: PASS — no unallowlisted vulnerabilities at severity >= ${severity} ` +
      `(${allowed.length} allowlisted exception(s) active)`
  );
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
