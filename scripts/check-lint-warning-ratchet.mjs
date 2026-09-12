#!/usr/bin/env node
// ============================================================================
// check-lint-warning-ratchet.mjs — ratchet gate for lint warnings
//
// `azeebo-custom/require-map-and-throw` runs at `warn` severity repo-wide
// while legacy catch blocks are migrated to `mapAndThrow`. A plain `--max-
// warnings` flag cannot enforce a ratchet here: it counts ALL warnings
// (no-console, no-unused-vars, …), so an unrelated `console.log` could mask
// ratchet growth — and vice versa. This gate counts warnings PER RULE and
// PER WORKSPACE instead, and fails when any count exceeds the committed
// baseline (scripts/lint-warning-baseline.json).
//
// Ratchet mechanics:
//   • Baseline may only move DOWN. Any workspace exceeding its baseline
//     count fails CI. Dropping below the baseline does not fail — run
//     `--update` to lock in the improvement and make the new level the
//     floor (otherwise a regressing PR could grow back to the old count).
//   • New workspaces start at 0: a workspace absent from the baseline is
//     compared against 0, so new services cannot ship with warnings.
//   • Fully-converted services move to the `error` block in
//     eslint.config.js (they stop warning entirely) and can be deleted
//     from the baseline with `--update`.
//
// Usage:
//   node scripts/check-lint-warning-ratchet.mjs            # gate (exit 1 on growth)
//   node scripts/check-lint-warning-ratchet.mjs --update   # rewrite baseline from current state
//   node scripts/check-lint-warning-ratchet.mjs --list     # show discovered workspaces, no gate
//
// CI wiring: pr-checks.yml (lint-pr) and lint.yml (lint-backend), right
// after `pnpm -r lint`. Requires no network, no DB, and ~one ESLint pass.
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

export const RULE = 'azeebo-custom/require-map-and-throw';
const require = createRequire(import.meta.url);
const BASELINE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'lint-warning-baseline.json',
);

// ---------------------------------------------------------------------------
// Workspace discovery — mirrors pnpm-workspace.yaml (services/*/*, apps/*,
// packages/*) without a YAML dependency. A workspace participates in the
// ratchet iff its `lint` script runs eslint; the linted dirs are parsed from
// the script so `eslint src` and `eslint src test` both work.
// ---------------------------------------------------------------------------

/** Extract linted directories from an eslint invocation like `eslint src`. */
export function parseLintDirs(lintScript) {
  const tokens = String(lintScript ?? '')
    .trim()
    .split(/\s+/)
    .slice(1) // drop "eslint"
    .filter((t) => t && !t.startsWith('-'));
  return tokens.length > 0 ? tokens : ['src'];
}

/** Find every workspace with an eslint-based `lint` script. */
export function discoverWorkspaces(root) {
  const groups = ['services/*/*', 'apps/*', 'packages/*'];
  const workspaces = [];
  for (const group of groups) {
    const [base, ...rest] = group.split('/');
    const baseDir = path.join(root, base);
    if (!fs.existsSync(baseDir)) continue;
    let level = [baseDir];
    for (const seg of rest) {
      const next = [];
      for (const dir of level) {
        let entries = [];
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          continue;
        }
        for (const e of entries) {
          if (e.isDirectory() && (seg === '*' || e.name === seg)) {
            next.push(path.join(dir, e.name));
          }
        }
      }
      level = next;
    }
    for (const dir of level) {
      const pkgPath = path.join(dir, 'package.json');
      if (!fs.existsSync(pkgPath)) continue;
      let pkg;
      try {
        pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      } catch {
        continue;
      }
      const lintScript = pkg?.scripts?.lint;
      if (typeof lintScript !== 'string' || !lintScript.trim().startsWith('eslint')) continue;
      workspaces.push({
        name: pkg.name ?? path.relative(root, dir),
        dir,
        lintDirs: parseLintDirs(lintScript).map((d) => path.resolve(dir, d)),
      });
    }
  }
  return workspaces.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Warning counting
// ---------------------------------------------------------------------------

/**
 * Count `ruleId` warnings (severity 1) per workspace from ESLint JSON output.
 * Results without a matching workspace land in the `other` bucket.
 */
export function countWarnings(results, workspaces, ruleId = RULE) {
  const counts = new Map(workspaces.map((w) => [w.name, 0]));
  const other = [];
  for (const fileResult of results) {
    const filePath = fileResult?.filePath;
    if (!filePath) continue;
    const messages = fileResult.messages ?? [];
    if (messages.length === 0) continue;
    // Longest prefix wins so nested workspace layouts can't shadow each other.
    let best = null;
    let bestLen = -1;
    for (const w of workspaces) {
      for (const lintDir of w.lintDirs) {
        if (
          (filePath === lintDir || filePath.startsWith(lintDir + path.sep)) &&
          lintDir.length > bestLen
        ) {
          best = w;
          bestLen = lintDir.length;
        }
      }
    }
    for (const msg of messages) {
      if (msg.ruleId === ruleId && msg.severity === 1) {
        if (best) counts.set(best.name, (counts.get(best.name) ?? 0) + 1);
        else other.push(`${filePath}:${msg.line ?? '?'} — ${msg.message}`);
      }
    }
  }
  return { counts, other };
}

// ---------------------------------------------------------------------------
// Baseline I/O + comparison
// ---------------------------------------------------------------------------

/** Validate baseline structure; returns an error string or null. */
export function validateBaseline(baseline) {
  if (!baseline || typeof baseline !== 'object') return 'baseline is not an object';
  if (baseline.rule !== RULE) return `baseline rule ${JSON.stringify(baseline.rule)} !== ${JSON.stringify(RULE)}`;
  if (!baseline.workspaces || typeof baseline.workspaces !== 'object') return 'baseline.workspaces missing';
  let sum = 0;
  for (const [name, count] of Object.entries(baseline.workspaces)) {
    if (!Number.isInteger(count) || count < 0) return `workspaces[${JSON.stringify(name)}] must be a non-negative integer, got ${count}`;
    sum += count;
  }
  if (baseline.total !== sum) return `baseline.total (${baseline.total}) !== sum of workspaces (${sum}) — regenerate with --update instead of hand-editing`;
  return null;
}

/**
 * Compare current counts against the baseline.
 * Violations: any workspace above its baseline (absent baseline ⇒ 0 — this
 * also catches renames, since the new name has no entry). No separate
 * totals check is needed: if every current ≤ allowed then the total cannot
 * exceed the baseline by construction. Improvements are reported so the
 * operator knows to run --update and lower the floor.
 */
export function compare(baseline, currentCounts) {
  const violations = [];
  const improvements = [];
  let currentTotal = 0;
  let baselineTotal = baseline?.total ?? 0;
  const names = new Set([...currentCounts.keys(), ...Object.keys(baseline?.workspaces ?? {})]);
  for (const name of [...names].sort()) {
    const current = currentCounts.get(name) ?? 0;
    const allowed = baseline?.workspaces?.[name] ?? 0;
    currentTotal += current;
    if (current > allowed) violations.push({ name, current, allowed, delta: current - allowed });
    else if (current < allowed) improvements.push({ name, current, allowed, delta: allowed - current });
  }
  return { violations, improvements, currentTotal, baselineTotal };
}

// ---------------------------------------------------------------------------
// ESLint invocation
// ---------------------------------------------------------------------------

function resolveEslintBin() {
  // './bin/eslint.js' is not in eslint 9's package exports map, so resolve
  // the package root and join the stable bin location.
  const pkgRoot = path.dirname(require.resolve('eslint/package.json'));
  return path.join(pkgRoot, 'bin', 'eslint.js');
}

/**
 * Run ESLint with JSON output over the given dirs. Exported so the
 * promotion gate (check-map-and-throw-promotion.mjs) reuses the exact same
 * invocation instead of forking it.
 */
export function runEslintJson(lintDirs, cwd) {
  const eslintBin = resolveEslintBin();
  const args = [eslintBin, '--format', 'json', '--no-error-on-unmatched-pattern', ...lintDirs];
  let stdout = '';
  try {
    stdout = execFileSync(process.execPath, args, {
      cwd,
      maxBuffer: 256 * 1024 * 1024,
      encoding: 'utf8',
    });
  } catch (err) {
    // ESLint exits non-zero on lint errors too, but still prints JSON to
    // stdout — the ratchet only counts warnings, and the lint job itself
    // already fails on errors, so reuse whatever JSON we got.
    stdout = err.stdout ?? '';
    if (!stdout.trim().startsWith('[')) {
      throw new Error(`eslint failed without JSON output: ${err.stderr ?? err.message}`);
    }
  }
  return JSON.parse(stdout);
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function printCounts(workspaces, counts) {
  const rows = workspaces
    .map((w) => ({ name: w.name, count: counts.get(w.name) ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  if (rows.length === 0) {
    console.log(`No ${RULE} warnings found.`);
    return;
  }
  console.log(`${RULE} warnings by workspace:`);
  for (const r of rows) console.log(`  ${String(r.count).padStart(3)}  ${r.name}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const argv = process.argv.slice(2);
  const update = argv.includes('--update');
  const list = argv.includes('--list');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  const workspaces = discoverWorkspaces(root);
  if (workspaces.length === 0) {
    console.error('No eslint-based workspaces discovered — check pnpm-workspace.yaml layout.');
    process.exit(2);
  }
  if (list) {
    for (const w of workspaces) console.log(`${w.name}  (${path.relative(root, w.dir)})`);
    console.log(`\n${workspaces.length} workspaces with eslint-based lint scripts.`);
    return;
  }

  const allDirs = workspaces.flatMap((w) => w.lintDirs);
  const results = runEslintJson(allDirs, root);
  const { counts, other } = countWarnings(results, workspaces);

  if (update) {
    let total = 0;
    const record = {};
    for (const [name, count] of counts) {
      record[name] = count;
      total += count;
    }
    const baseline = { rule: RULE, generatedAt: new Date().toISOString(), total, workspaces: record };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
    console.log(`Baseline written: ${path.relative(root, BASELINE_PATH)}`);
    printCounts(workspaces, counts);
    if (other.length > 0) {
      console.warn(`\n${other.length} ${RULE} warning(s) outside any workspace dir (not ratcheted):`);
      for (const line of other.slice(0, 10)) console.warn(`  ${line}`);
    }
    return;
  }

  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`No baseline at ${path.relative(root, BASELINE_PATH)}.`);
    console.error('Generate it once with: node scripts/check-lint-warning-ratchet.mjs --update');
    process.exit(2);
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  const invalid = validateBaseline(baseline);
  if (invalid) {
    console.error(`Invalid baseline: ${invalid}`);
    process.exit(2);
  }

  const { violations, improvements, currentTotal, baselineTotal } = compare(baseline, counts);
  printCounts(workspaces, counts);

  for (const imp of improvements) {
    console.log(`✅ ${imp.name}: ${imp.allowed} → ${imp.current} (run --update to lock in the improvement)`);
  }
  if (other.length > 0) {
    console.warn(`${other.length} warning(s) outside any workspace dir (not ratcheted):`);
    for (const line of other.slice(0, 10)) console.warn(`  ${line}`);
  }

  if (violations.length > 0) {
    console.error(`\n🚫 ${RULE} ratchet violated — warnings may only decrease:`);
    for (const v of violations) {
      // GitHub renders ::error lines as annotations in Actions logs; harmless text elsewhere.
      console.error(`::error file=scripts/lint-warning-baseline.json::${v.name}: ${v.current} warning(s) > baseline ${v.allowed} (+${v.delta})${v.note ? ` — ${v.note}` : ''}`);
      console.error(`   Convert these catch blocks to mapAndThrow(error, '<context>') from @azeebo/security.`);
    }
    console.error(`\nIf conversion is genuinely intentional (never for new violations), lower the floor explicitly:`);
    console.error(`  node scripts/check-lint-warning-ratchet.mjs --update`);
    process.exit(1);
  }

  console.log(`\n✅ Ratchet holds: ${currentTotal} warning(s) ≤ baseline ${baselineTotal} across ${workspaces.length} workspaces.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
