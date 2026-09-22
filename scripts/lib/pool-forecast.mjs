/**
 * pool-forecast.mjs — pure core for the pool-budget forecast pipeline.
 *
 * Two consumers:
 *   • scripts/database/connection-forecast.mjs --record  → buildSample/mergeHistory
 *     turn one night's pg_stat_activity counts into an append-only history
 *     (one JSON line per UTC day, newest wins on re-runs).
 *   • scripts/database/connection-forecast.mjs --forecast → fitTrend/
 *     daysUntilMargin/renderForecastComment turn that history into the PR
 *     comment posted under the pool-budget gate.
 *
 * Kept dependency-free and network-free so node:test covers the math
 * (least-squares trend, days-to-margin) without Postgres or GitHub.
 */

/** Stable marker used to find/update the forecast comment on a PR. */
export const COMMENT_MARKER = '<!-- azeebo:pool-budget-forecast -->';

export const DEFAULT_TAIL_DAYS = 90;

function utcDate(iso) {
  return String(iso).slice(0, 10);
}

function epochDays(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/**
 * Build one history sample from raw pg_stat_activity rows.
 * @param {object} p
 * @param {string} p.recordedAt ISO timestamp of the recording run
 * @param {number|null} p.maxConnections live Postgres max_connections (null when unreadable)
 * @param {number|null} p.budget committed worst-case pool budget (null when unavailable)
 * @param {Array<{db: string, connections: number, services?: string[]}>} p.byDb
 *        azeebo_* database rows EXCLUDING the probe's own connection.
 */
export function buildSample({ recordedAt, maxConnections = null, budget = null, byDb }) {
  const rows = [...byDb]
    .map((r) => ({ ...r, connections: Number(r.connections) }))
    .filter((r) => Number.isFinite(r.connections) && r.connections >= 0)
    .sort((a, b) => b.connections - a.connections);
  return {
    date: utcDate(recordedAt),
    recordedAt,
    totalActual: rows.reduce((sum, r) => sum + r.connections, 0),
    budget,
    maxConnections,
    byDb: rows,
  };
}

/**
 * Merge one sample into a history array. Keyed by UTC date — a re-run on the
 * same day REPLACES that day's line (nightly retries must not double-count),
 * result sorted oldest→newest and clipped to the newest `tail` days.
 */
export function mergeHistory(prev, sample, { tail = DEFAULT_TAIL_DAYS } = {}) {
  const byDate = new Map();
  for (const s of Array.isArray(prev) ? prev : []) {
    if (s && typeof s.date === 'string') byDate.set(s.date, s);
  }
  byDate.set(sample.date, { ...byDate.get(sample.date), ...sample });
  const merged = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return merged.slice(-tail);
}

/**
 * Least-squares fit of totalActual over time (unit: days).
 * @returns {{slopePerDay: number, interceptAtLast: number, n: number}}
 *          interceptAtLast is the fitted value at the last sample's day.
 */
export function fitTrend(samples) {
  const n = samples.length;
  if (n < 3) return { slopePerDay: 0, interceptAtLast: samples[n - 1]?.totalActual ?? 0, n };
  const xs = samples.map((s) => epochDays(s.date));
  const ys = samples.map((s) => s.totalActual);
  const x̄ = xs.reduce((a, b) => a + b, 0) / n;
  const ȳ = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - x̄) * (ys[i] - ȳ);
    sxx += (xs[i] - x̄) ** 2;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  return { slopePerDay: slope, interceptAtLast: ȳ + slope * (xs[n - 1] - x̄), n };
}

/**
 * Days from the last sample until totalActual reaches `margin` at the current
 * trend. Returns null when there is no meaningful upward trend (slope ≤ 0)
 * or the crossing lies beyond `horizonDays` — both render as "no forecast".
 */
export function daysUntilMargin(samples, margin, { horizonDays = 365 } = {}) {
  const latest = samples[samples.length - 1]?.totalActual ?? 0;
  if (latest >= margin) return { days: 0, reason: 'at-margin' };
  const { slopePerDay } = fitTrend(samples);
  if (slopePerDay <= 0) return { days: null, reason: 'flat-or-declining' };
  const days = Math.ceil((margin - latest) / slopePerDay);
  if (days > horizonDays) return { days: null, reason: 'beyond-horizon' };
  return { days, reason: 'forecast' };
}

function trendArrow(samples) {
  if (samples.length < 6) return '→';
  const last = samples.slice(-3);
  const prior = samples.slice(-6, -3);
  const avg = (arr) => arr.reduce((s, x) => s + x.totalActual, 0) / arr.length;
  const delta = avg(last) - avg(prior);
  if (delta > 0.5) return '▲';
  if (delta < -0.5) return '▼';
  return '→';
}

function esc(s) {
  return String(s ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function fmtDatePlus(days, fromIso) {
  const d = new Date(fromIso ?? new Date().toISOString());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Render the PR comment body.
 * @param {object} p
 * @param {Record<string, Array<object>>} p.histories environment → samples (oldest first)
 * @param {string|null} p.runUrl nightly workflow run the actuals came from
 * @param {string|null} p.sha PR head sha
 */
export function renderForecastComment({ histories, runUrl = null, sha = null }) {
  const lines = [];
  lines.push(COMMENT_MARKER);
  lines.push('## 📊 Postgres pool budget — actuals & forecast');
  lines.push('');
  lines.push(
    '_Recorded nightly from `pg_stat_activity` (per-database connection counts, probe excluded) by_ ' +
      '`schema-lock-nightly.yml → pool-actuals`.' +
      (runUrl ? ` [Latest nightly run](${runUrl})` : '') +
      (sha ? ` @ ${String(sha).slice(0, 7)}` : '')
  );
  lines.push('');

  const envs = Object.keys(histories ?? {}).sort();
  if (envs.length === 0 || envs.every((e) => !(histories[e] ?? []).length)) {
    lines.push('_No nightly actuals recorded yet — this section fills in the morning after the first `pool-actuals` run._');
    lines.push('');
    return lines.join('\n');
  }

  for (const env of envs) {
    const samples = histories[env] ?? [];
    if (samples.length === 0) continue;
    const latest = samples[samples.length - 1];
    const margin = latest.maxConnections != null ? Math.floor(latest.maxConnections * 0.8) : null;
    const budget = latest.budget;

    lines.push(`### \`${env}\``);
    lines.push('');
    const window = samples.length;
    lines.push(
      `Latest (${latest.date}): **${latest.totalActual} actual** connections` +
        (budget != null ? ` · worst-case budget **${budget}**` : '') +
        (latest.maxConnections != null ? ` · max_connections **${latest.maxConnections}**` : '') +
        (margin != null ? ` · 80% margin **${margin}**` : '')
    );
    lines.push('');
    lines.push(`| Database | Latest | Peak (${window}d) | Avg (${window}d) | Trend | Services |`);
    lines.push('|---|---|---|---|---|---|');
    const peak = new Map();
    const sum = new Map();
    for (const s of samples) {
      for (const r of s.byDb ?? []) {
        peak.set(r.db, Math.max(peak.get(r.db) ?? 0, r.connections));
        sum.set(r.db, (sum.get(r.db) ?? 0) + r.connections);
      }
    }
    const avg = new Map([...sum].map(([db, total]) => [db, total / window]));
    for (const r of latest.byDb ?? []) {
      const services = (r.services ?? []).join(', ');
      lines.push(
        `| ${esc(r.db)} | ${r.connections} | ${peak.get(r.db) ?? r.connections} | ` +
          `${(avg.get(r.db) ?? r.connections).toFixed(1)} | ${trendArrow(samples)} | ${esc(services) || '—'} |`
      );
    }
    lines.push('');
    if (margin != null && samples.length >= 3) {
      const { days, reason } = daysUntilMargin(samples, margin);
      if (reason === 'at-margin') {
        lines.push(`⚠️ **Actual usage is at/over the 80% margin (${margin}) as of ${latest.date}.**`);
      } else if (reason === 'forecast' && days != null) {
        lines.push(
          `📈 At the current trend the 80% margin (${margin} connections) is reached in **~${days} day(s)** (≈ ${fmtDatePlus(days, latest.recordedAt)}).`
        );
      } else if (reason === 'flat-or-declining') {
        lines.push('✅ Trend is flat or declining — no projected margin crossing.');
      } else {
        lines.push('✅ No margin crossing within the 365-day horizon at the current trend.');
      }
      const { slopePerDay } = fitTrend(samples);
      const perWeek = slopePerDay * 7;
      lines.push('');
      lines.push(`_Trend: ${perWeek >= 0 ? '+' : ''}${perWeek.toFixed(1)} connections/week over the last ${window} night(s)._`);
    } else if (margin == null) {
      lines.push('_max_connections was not readable for this environment — trend shown, forecast omitted._');
    } else {
      lines.push(`_Only ${samples.length} night(s) recorded — forecast needs ≥ 3._`);
    }
    lines.push('');
  }

  lines.push(
    '<sub>The gate (worst-case budget from committed sources) is separate: it blocks PRs that would push the budget past the margin. This comment shows what the running fleet ACTUALLY holds, so the tier map can be right-sized with evidence.</sub>'
  );
  lines.push('');
  return lines.join('\n');
}

/** Parse a history jsonl file (tolerant of blank lines). */
export function parseHistoryJsonl(text) {
  return String(text)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}
