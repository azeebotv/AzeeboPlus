#!/usr/bin/env node
// ============================================================================
// lint-scorecard.mjs — per-service progress table for promotion-enforced rules
//
// One command that answers "where is the migration?" for any rule listed in
// scripts/promotion-rules.json without stitching together three tools:
//
//   • warnings   — live count per service (same ESLint pass the ratchet uses)
//   • gated      — the rule's effective severity per service (same ESLint
//                  config resolution the promotion gate uses)
//   • trend      — warning total vs the OLDEST available baseline snapshot
//                  from git history (commits that changed the rule's ratchet
//                  baseline from scripts/promotion-rules.json). The baseline
//                  only moves down, so a negative delta is real progress, not
//                  a regression.
//
// The trend is commit-scoped, not time-scoped: the baseline changes exactly
// when conversions land, so it is the honest history. While the baseline has
// few commits (or none yet), the column shows "–" and fills in as migration
// commits land. A rule without a `ratchet` path in the config has no baseline
// history at all: its trend column degrades to "off" rather than inventing
// one.
//
// Pure helpers (rule resolution, history extraction, trend, table rendering)
// are exported for unit tests.
//
// Usage:
//   node scripts/lint-scorecard.mjs                  # every ratcheted rule
//   node scripts/lint-scorecard.mjs --rule <id>      # one rule
//   node scripts/lint-scorecard.mjs --history 24     # deeper trend window
//
// Not a gate — exit 0 always (except operator errors, exit 2). The ratchet
// and promotion gate enforce; this reports.
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { discoverWorkspaces, runEslintJson, countFindings } from './check-lint-warning-ratchet.mjs';
import { inScope, resolveSeverities, severityOf, loadPromotionConfig, classifyServices } from './check-rule-promotion.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Rule + baseline resolution
// ---------------------------------------------------------------------------

/**
 * Resolve which rule(s) to score. Without --rule: every rule that has a
 * ratchet baseline (rules without one have no regression floor to report a
 * trend against). With --rule <id>: that rule from the config, ratcheted or
 * not (its trend then reports "off" instead of pretending) — an unlisted id
 * is an operator error.
 */
export function resolveScorecardRules(rules, ruleArg) {
  if (ruleArg === undefined) {
    const ratcheted = rules.filter((r) => typeof r.ratchet === 'string' && r.ratchet.trim() !== '');
    if (ratcheted.length === 0) {
      throw new Error('no rule in scripts/promotion-rules.json declares a ratchet baseline — nothing to score');
    }
    return ratcheted;
  }
  const match = rules.find((r) => r.id === ruleArg);
  if (!match) {
    throw new Error(
      `--rule "${ruleArg}" is not promotion-enforced — listed rules: ${rules.map((r) => r.id).join(', ')}`,
    );
  }
  return [match];
}

// ---------------------------------------------------------------------------
// Git history of a rule's baseline file
// ---------------------------------------------------------------------------

/**
 * Extract baseline snapshots from git history, oldest first.
 *
 * `commits` is the output of `git log --format=%H%x1f%ad --date=iso-strict`
 * over the baseline path (newest first), split into lines; `baselineAt` is
 * an async (sha) → { workspaces: Record<string, number> } | null reader.
 * Snapshots are skipped — rather than poisoning the trend — when they are
 * absent (null) or violate the ratchet's own baseline contract (workspaces
 * must be an object of non-negative integers, mirroring the ratchet's
 * validateBaseline). One malformed historical snapshot must not manufacture
 * phantom deltas.
 * Returns [{ sha, date, total, workspaces }] oldest first.
 */
export async function extractHistory(commits, baselineAt) {
  const out = [];
  for (const commit of commits) {
    const [sha, date] = commit.split('\x1f');
    if (!sha) continue;
    const snap = await baselineAt(sha);
    const workspaces = snap?.workspaces;
    if (
      !workspaces ||
      typeof workspaces !== 'object' ||
      !Object.values(workspaces).every((c) => Number.isInteger(c) && c >= 0)
    ) {
      continue;
    }
    let total = 0;
    for (const count of Object.values(workspaces)) total += count;
    out.push({ sha, date, total, workspaces });
  }
  return out.reverse();
}

/** Read a baseline snapshot from git. `rel` is the repo-relative baseline path. */
function baselineAtCommit(sha, rel) {
  try {
    const stdout = execFileSync('git', ['show', `${sha}:${rel}`], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

/** Newest-first commit lines touching the baseline (format `sha\x1fdate`). */
function baselineCommits(rel, limit) {
  try {
    const stdout = execFileSync(
      'git',
      ['log', `--max-count=${limit}`, '--format=%H%x1f%ad', '--date=iso-strict', '--', rel],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
    );
    return stdout.split('\n').filter((l) => l.trim() !== '');
  } catch {
    return [];
  }
}

/**
 * The trend: live total vs the oldest snapshot inside the window, compared
 * like-for-like — `workspaceNames` restricts the snapshot sum to the same
 * workspaces the table shows (the baseline is repo-wide and also covers
 * packages/apps; comparing its total against a services-only live count
 * would report phantom progress). Missing snapshot entries count as 0.
 * Returns { delta, scopeTotal, since } — delta < 0 is progress. Null when
 * there is no history yet (baseline never committed).
 */
export function trendFrom(history, currentTotal, workspaceNames = null) {
  if (history.length === 0) return null;
  const oldest = history[0];
  const names = workspaceNames ? [...workspaceNames] : null;
  const scopeTotal =
    names && names.length > 0
      ? names.reduce((s, n) => s + (Number.isInteger(oldest.workspaces[n]) ? oldest.workspaces[n] : 0), 0)
      : oldest.total;
  return { delta: currentTotal - scopeTotal, scopeTotal, since: oldest };
}

// ---------------------------------------------------------------------------
// Table rendering (pure)
// ---------------------------------------------------------------------------

/**
 * Build the scorecard rows. Sort: migrating first (most warnings on top),
 * then ungated-but-clean (the promotion gate's next targets), then gated
 * (done); name ascending within each group.
 */
export function buildRows(entries) {
  const rank = { migrating: 0, promote: 0, exempt: 1, healthy: 2 };
  return [...entries].sort((a, b) => {
    const r = (rank[a.status] ?? 1) - (rank[b.status] ?? 1);
    if (r !== 0) return r;
    if (b.warnCount !== a.warnCount) return b.warnCount - a.warnCount;
    return a.name.localeCompare(b.name);
  });
}

/** Pad-right / pad-left helpers that count visible width (names are ASCII). */
const padEnd = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));
const padStart = (s, n) => ' '.repeat(Math.max(0, n - s.length)) + s;

/**
 * Render the table. `trend` is trendFrom's result ({ delta, scopeTotal,
 * since }) against the LIVE services total, or null. The per-row trend is
 * that row's own delta vs its snapshot entry — each service's progress is
 * visible independently.
 */
export function renderTable(rows, { trend, historyCommits, historyWindow }) {
  const sevLabel = (sev) => (sev === 2 ? 'gated' : sev === 1 ? 'warn' : sev === 0 ? 'off' : 'n/a');
  const days = trend ? Math.max(1, Math.round((Date.now() - new Date(trend.since.date).getTime()) / 86_400_000)) : 0;
  const trendLabel = (r) => {
    if (!trend) return '–';
    const d = r.warnCount - (Number.isInteger(trend.since.workspaces[r.name]) ? trend.since.workspaces[r.name] : 0);
    if (d === 0) return '· flat';
    return `${d < 0 ? '↓' : '↑'}${Math.abs(d)} / ${days}d`;
  };

  const nameW = Math.max('service'.length, ...rows.map((r) => r.name.length));
  const lines = [];
  lines.push(`${padEnd('service', nameW)}  ${padStart('warn', 4)}  ${padEnd('gate', 5)}  trend`);
  lines.push(`${'─'.repeat(nameW)}  ${'─'.repeat(4)}  ${'─'.repeat(5)}  ${'─'.repeat(12)}`);
  for (const r of rows) {
    lines.push(
      `${padEnd(r.name, nameW)}  ${padStart(String(r.warnCount), 4)}  ${padEnd(sevLabel(r.severity), 5)}  ${trendLabel(r)}`,
    );
  }

  const total = rows.reduce((s, r) => s + r.warnCount, 0);
  const gated = rows.filter((r) => r.severity === 2).length;
  const migrating = rows.filter((r) => r.status === 'migrating').length;
  const promote = rows.filter((r) => r.status === 'promote').length;
  const exempt = rows.filter((r) => r.status === 'exempt').length;
  lines.push('');
  lines.push(
    `${rows.length} services · ${gated} gated · ${migrating} migrating · ${promote} promotable${exempt > 0 ? ` · ${exempt} exempt` : ''} · ${total} warnings live`,
  );
  if (trend) {
    const dir = trend.delta < 0 ? 'down' : trend.delta > 0 ? 'up' : 'flat';
    lines.push(
      `trend: ${dir === 'flat' ? 'no net change' : `${Math.abs(trend.delta)} ${dir}`} since ${trend.since.sha.slice(0, 8)} (${new Date(trend.since.date).toISOString().slice(0, 10)}) — ${historyCommits} baseline commit(s) in the ${historyWindow}-commit window`,
    );
  } else {
    lines.push('trend: unavailable — the baseline has no committed history yet; it fills in as migration commits land.');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const argv = process.argv.slice(2);
  const historyIdx = argv.indexOf('--history');
  const historyWindow = historyIdx >= 0 ? Number(argv[historyIdx + 1]) : 12;
  if (!Number.isInteger(historyWindow) || historyWindow < 1) {
    console.error('--history must be a positive integer');
    process.exit(2);
  }
  const ruleIdx = argv.indexOf('--rule');
  const ruleArg = ruleIdx >= 0 ? argv[ruleIdx + 1] : undefined;
  if (ruleIdx >= 0 && (ruleArg === undefined || ruleArg.startsWith('--'))) {
    console.error('--rule requires a rule id (see scripts/promotion-rules.json)');
    process.exit(2);
  }

  // Same discovery + scoping as the promotion gate.
  const allWorkspaces = discoverWorkspaces(ROOT);
  const workspaces = allWorkspaces.filter((w) => inScope(path.relative(ROOT, w.dir)));
  if (workspaces.length === 0) {
    console.error('No service workspaces discovered — check pnpm-workspace.yaml layout.');
    process.exit(2);
  }

  // Rules from the promotion config (single source of truth).
  let selected;
  try {
    selected = resolveScorecardRules(loadPromotionConfig(ROOT).rules, ruleArg);
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }

  // ONE ESLint pass + ONE severity resolution feed every printed rule —
  // scoring N rules costs one lint run, same as the ratchet.
  const ruleIds = selected.map((r) => r.id);
  const severities = await resolveSeverities(workspaces, ruleIds);
  const results = runEslintJson(workspaces.flatMap((w) => w.lintDirs), ROOT);
  const serviceNames = new Set(workspaces.map((w) => w.name));

  for (const [index, { id: ruleId, ratchet }] of selected.entries()) {
    const { counts, warnCounts } = countFindings(results, workspaces, ruleId);
    const liveTotal = [...counts.values()].reduce((s, c) => s + c, 0);

    // The rule's ratchet baseline is the trend source. A rule without one
    // has no regression floor to compare against — the trend stays off
    // rather than being faked from some other rule's history.
    let history = [];
    let baselinePath = null;
    if (ratchet) {
      baselinePath = path.resolve(ROOT, ratchet);
      const rel = path.relative(ROOT, baselinePath).replaceAll('\\', '/');
      history = await extractHistory(
        baselineCommits(rel, historyWindow),
        (sha) => baselineAtCommit(sha, rel),
      );
    }
    const trend = trendFrom(history, liveTotal, serviceNames);

    // Same classification as the promotion gate — one source of truth for
    // migrating/healthy/promote/exempt/misgated — which means the warning-only
    // counts, not the severity-agnostic total the trend compares.
    const entries = classifyServices(workspaces, severities, warnCounts, ruleId).map((c) => ({
      name: c.name,
      warnCount: c.warnCount,
      severity: c.severity,
      status: c.status,
    }));

    console.log(`${ruleId} scorecard`);
    console.log('');
    console.log(renderTable(buildRows(entries), { trend, historyCommits: history.length, historyWindow }));

    // The committed baseline is the trend source — if its entries for the
    // SERVICES IN VIEW drifted from live counts, say so (the operator forgot
    // --update after a conversion). The baseline also covers packages/apps,
    // so compare the same scope as the table, not the file's grand total.
    if (baselinePath && fs.existsSync(baselinePath)) {
      try {
        const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
        const baselineServiceTotal = [...serviceNames].reduce(
          (s, n) => s + (Number.isInteger(baseline.workspaces?.[n]) ? baseline.workspaces[n] : 0),
          0,
        );
        if (baselineServiceTotal !== liveTotal) {
          console.log('');
          console.log(
            `note: baseline for these services (${baselineServiceTotal}) ≠ live findings (${liveTotal}) — run \`pnpm run check:lint-ratchet -- --update\` after landing conversions to keep the trend honest.`,
          );
        }
      } catch {
        // unreadable baseline — the ratchet gate already owns that signal
      }
    }
    if (index < selected.length - 1) console.log('');
  }

  if (selected.length > 1) {
    console.log('');
    console.log(`${selected.length} ratcheted rule(s) scored — pass --rule <id> for one rule's full table.`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error('lint-scorecard failed:', err);
    process.exit(2);
  });
}
