#!/usr/bin/env node
// ============================================================================
// check-dead-exports.mjs — ratchet gate for unused files/exports/types
// (knip-backed, per-workspace)
//
// knip (knip.json) classifies dead code per workspace; this gate turns the
// report into a ratchet: each workspace's counts of unused files, exports,
// type exports and duplicate exports may only DECREASE. A new workspace
// starts at 0. Cleanup PRs lower the floor with --update.
//
// Usage:
//   node scripts/check-dead-exports.mjs            # gate (exit 1 on growth)
//   node scripts/check-dead-exports.mjs --update   # rewrite baseline
//   node scripts/check-dead-exports.mjs --list     # show report, no gate
//
// CI wiring: lint.yml + pr-checks.yml, after the lint ratchet.
// Requires no network and no DB; one knip pass over the repo (~2-4 min).
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = path.join(ROOT, 'scripts', 'dead-exports-baseline.json');
const CATEGORIES = ['files', 'exports', 'types', 'duplicates'];

// Mirrors knip.json workspaces + pnpm-workspace.yaml (services/*/*, apps/*,
// packages/*) without a YAML dependency. The repo root counts as its own
// workspace so stray root-level files are ratcheted too.
function discoverWorkspaces() {
  const groups = ['services/*/*', 'apps/*', 'packages/*'];
  const workspaces = [{ name: '.', dir: ROOT }];
  for (const group of groups) {
    const [base, ...rest] = group.split('/');
    const baseDir = path.join(ROOT, base);
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
          if (e.isDirectory() && (seg === '*' || e.name === seg)) next.push(path.join(dir, e.name));
        }
      }
      level = next;
    }
    for (const dir of level) {
      if (!fs.existsSync(path.join(dir, 'package.json'))) continue;
      workspaces.push({ name: path.relative(ROOT, dir), dir });
    }
  }
  return workspaces;
}

/** Longest workspace-prefix wins so nested layouts can't shadow each other. */
function workspaceFor(workspaces, relFile) {
  let best = null;
  let bestLen = -1;
  for (const w of workspaces) {
    const prefix = w.name === '.' ? '' : w.name;
    if ((prefix === '' || relFile.startsWith(prefix + '/')) && prefix.length > bestLen) {
      best = w;
      bestLen = prefix.length;
    }
  }
  return best;
}

function resolveKnipBin() {
  // knip's exports map does not expose ./package.json, so resolve the bin
  // through the root node_modules layout (pnpm symlinks it for -w deps).
  const pkgDir = path.join(ROOT, 'node_modules', 'knip');
  const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.knip;
  return path.join(pkgDir, bin);
}

function runKnipJson() {
  const knipBin = resolveKnipBin();
  let stdout = '';
  try {
    stdout = execFileSync(process.execPath, [knipBin, '--reporter', 'json', '--no-progress'], {
      cwd: ROOT,
      maxBuffer: 512 * 1024 * 1024,
      encoding: 'utf8',
    });
  } catch (err) {
    // knip exits non-zero when issues exist — that IS our payload.
    stdout = err.stdout ?? '';
    if (!stdout.trim().startsWith('{')) {
      throw new Error(`knip failed without JSON output: ${err.stderr ?? err.message}`);
    }
  }
  return JSON.parse(stdout);
}

function countIssues(issues, workspaces) {
  const counts = new Map(
    workspaces.map((w) => [w.name, Object.fromEntries(CATEGORIES.map((c) => [c, 0]))]),
  );
  const other = [];
  for (const issue of issues ?? []) {
    const relFile = path.relative(ROOT, path.resolve(ROOT, issue.file));
    const ws = workspaceFor(workspaces, relFile);
    const bucket = ws ? counts.get(ws.name) : null;
    let total = 0;
    for (const cat of CATEGORIES) {
      const n = Array.isArray(issue[cat]) ? issue[cat].length : 0;
      if (bucket) bucket[cat] += n;
      total += n;
    }
    if (!bucket && total > 0) other.push(relFile);
  }
  return { counts, other };
}

function validateBaseline(baseline) {
  if (!baseline || typeof baseline !== 'object') return 'baseline is not an object';
  if (!baseline.workspaces || typeof baseline.workspaces !== 'object') return 'baseline.workspaces missing';
  for (const [name, cats] of Object.entries(baseline.workspaces)) {
    for (const cat of CATEGORIES) {
      const v = cats?.[cat];
      if (!Number.isInteger(v) || v < 0) {
        return `workspaces[${JSON.stringify(name)}].${cat} must be a non-negative integer, got ${v}`;
      }
    }
  }
  return null;
}

function compare(baseline, counts) {
  const violations = [];
  const improvements = [];
  const names = new Set([...counts.keys(), ...Object.keys(baseline?.workspaces ?? {})]);
  for (const name of [...names].sort()) {
    const current = counts.get(name) ?? Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    const allowed = baseline?.workspaces?.[name] ?? Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    for (const cat of CATEGORIES) {
      if (current[cat] > allowed[cat]) {
        violations.push({ name, cat, current: current[cat], allowed: allowed[cat], delta: current[cat] - allowed[cat] });
      } else if (current[cat] < allowed[cat]) {
        improvements.push({ name, cat, current: current[cat], allowed: allowed[cat] });
      }
    }
  }
  return { violations, improvements };
}

function printCounts(counts) {
  for (const [name, cats] of [...counts].sort()) {
    const total = CATEGORIES.reduce((s, c) => s + cats[c], 0);
    if (total === 0) continue;
    console.log(
      `  ${String(total).padStart(4)}  ${name}  (${CATEGORIES.map((c) => `${c} ${cats[c]}`).join(', ')})`,
    );
  }
}

function main() {
  const argv = process.argv.slice(2);
  const update = argv.includes('--update');
  const list = argv.includes('--list');

  const workspaces = discoverWorkspaces();
  const { issues } = runKnipJson();
  const { counts, other } = countIssues(issues, workspaces);

  if (list) {
    console.log('knip dead-code report by workspace:');
    printCounts(counts);
    return;
  }

  if (update) {
    const record = {
      generatedAt: new Date().toISOString(),
      categories: CATEGORIES,
      workspaces: Object.fromEntries(counts),
    };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(record, null, 2) + '\n');
    console.log(`Baseline written: ${path.relative(ROOT, BASELINE_PATH)}`);
    printCounts(counts);
    return;
  }

  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`No baseline at ${path.relative(ROOT, BASELINE_PATH)}.`);
    console.error('Generate it once with: node scripts/check-dead-exports.mjs --update');
    process.exit(2);
  }
  let baseline;
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  } catch (err) {
    console.error(`Unparsable baseline: ${err.message}`);
    process.exit(2);
  }
  const invalid = validateBaseline(baseline);
  if (invalid) {
    console.error(`Invalid baseline: ${invalid}`);
    process.exit(2);
  }

  const { violations, improvements } = compare(baseline, counts);
  console.log('knip dead-code report by workspace:');
  printCounts(counts);
  if (other.length > 0) {
    console.warn(`\n${other.length} file(s) outside any workspace dir (not ratcheted):`);
    for (const line of other.slice(0, 10)) console.warn(`  ${line}`);
  }
  for (const imp of improvements) {
    console.log(`✅ ${imp.name} ${imp.cat}: ${imp.allowed} → ${imp.current} (run --update to lock in)`);
  }

  if (violations.length > 0) {
    console.error(`\n🚫 ${violations.length} dead-code ratchet violation(s) — unused files/exports may only decrease:`);
    for (const v of violations) {
      console.error(`::error file=scripts/dead-exports-baseline.json::[${v.name}] ${v.cat}: ${v.current} > baseline ${v.allowed} (+${v.delta})`);
    }
    console.error(`\nIf the cleanup is intentional, lower the floor: node scripts/check-dead-exports.mjs --update`);
    process.exit(1);
  }
  console.log('\n✅ Dead-code ratchet holds.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
