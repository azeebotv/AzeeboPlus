#!/usr/bin/env node
// check-dist-stale.mjs — fail when a packages/* workspace's dist/ outputs are
// older than the sources they were compiled from.
//
// Why: packages/* dist dirs are gitignored, so CI always rebuilds, but a local
// edit without `pnpm run build` leaves a stale dist that root `tsc --noEmit`
// silently consumes (phantom type errors, or worse, stale types passing).
// Root `pnpm run typecheck` runs this as a preflight and fails fast with the
// one command that fixes it.
//
// mtime heuristic: newest compiled source vs OLDEST dist artifact. Sources
// whose names match the package tsconfig's exclude list (tests) are ignored,
// mirroring what `tsc` actually compiles. A false positive only costs a
// rebuild (safe direction); a false negative is bounded by the same rebuild.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const args = process.argv.slice(2);
const rootIdx = args.indexOf('--root');
const ROOT = rootIdx >= 0 ? args[rootIdx + 1] : process.cwd();
const PKGS_DIR = join(ROOT, 'packages');

/** Compile-relevant extensions only. */
const SRC_EXTS = new Set(['.ts', '.tsx']);

/** Default excludes when a package has no tsconfig of its own. */
const DEFAULT_EXCLUDES = [/\.spec\.[^.]+$/, /\.test\.[^.]+$/, /\/__tests__\//];

function excludesFor(pkgDir) {
  const cfgPath = join(pkgDir, 'tsconfig.json');
  if (!existsSync(cfgPath)) return DEFAULT_EXCLUDES;
  try {
    const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
    const list = Array.isArray(cfg.exclude) ? cfg.exclude : [];
    const patterns = [];
    for (const raw of list) {
      if (typeof raw !== 'string') continue;
      if (raw.includes('*.spec') || raw.includes('*.test')) {
        patterns.push(/\.(spec|test)\.[^.]+$/);
      } else if (raw === '**/__tests__' || raw.includes('__tests__')) {
        patterns.push(/\/__tests__\//);
      }
      // node_modules/dist entries are irrelevant: we only scan src/.
    }
    return patterns;
  } catch {
    return DEFAULT_EXCLUDES;
  }
}

function walk(dir, exts, skip, out, limit = 5000) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (out.length >= limit) return out;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, exts, skip, out, limit);
    } else if (exts) {
      const ext = e.name.slice(e.name.lastIndexOf('.'));
      if (!exts.has(ext)) continue;
      if (skip.some((re) => re.test(full.replace(/\\/g, '/')))) continue;
      out.push(full);
    } else {
      out.push(full);
    }
  }
  return out;
}

function mtimeOf(files, pick) {
  let best = null;
  for (const f of files) {
    let m;
    try {
      m = statSync(f).mtimeMs;
    } catch {
      continue;
    }
    if (best === null) best = m;
    else if (pick === 'max') best = Math.max(best, m);
    else best = Math.min(best, m);
  }
  return best;
}

// ---------------------------------------------------------------------------
// Main: one line per stale package; exit 1 if any (or if none checkable but
// every dist is missing — that case surfaces as a tsc module error anyway).
// ---------------------------------------------------------------------------
let pkgDirs = [];
try {
  pkgDirs = readdirSync(PKGS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(PKGS_DIR, e.name));
} catch {
  console.error(`check-dist-stale: no packages/ directory at ${PKGS_DIR}`);
  process.exit(2);
}

const stale = [];
let checked = 0;
for (const pkgDir of pkgDirs) {
  const distDir = join(pkgDir, 'dist');
  const srcDir = join(pkgDir, 'src');
  if (!existsSync(distDir) || !existsSync(srcDir)) continue;
  checked++;
  const skip = excludesFor(pkgDir);
  const newestSrc = mtimeOf(walk(srcDir, SRC_EXTS, skip, []), 'max');
  const oldestDist = mtimeOf(walk(distDir, null, [], []), 'min');
  if (newestSrc === null || oldestDist === null) continue;
  if (newestSrc > oldestDist) {
    stale.push(basename(pkgDir));
  }
}

if (stale.length > 0) {
  console.error('❌ Stale workspace dist detected (source newer than build output):');
  for (const name of stale) console.error(`   ✗ packages/${name}`);
  console.error(`\nFix: pnpm --filter ${stale.map((n) => `./packages/${n}`).join(' ')} run build`);
  console.error('Then re-run `pnpm run typecheck` — its results are untrustworthy until then.');
  process.exit(1);
}

console.log(`✅ check-dist-stale: ${checked} package dists fresh`);
