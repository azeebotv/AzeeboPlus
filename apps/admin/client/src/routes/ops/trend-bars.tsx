/**
 * Inline per-workspace sparkline: one bar per bucket of flagged passes over
 * the ledger window (oldest → newest, fixed width — every row's buckets are
 * directly comparable). Silent gap = quiet period; bar height scales to the
 * row's own max (so a 1-pass/2h cadence stays visible on a 100-pass row).
 * Pure CSS divs — no chart lib, no per-row SVG, nothing that matters at 6
 * rows on a poll-heavy card.
 */
export function PassTrendBars({
  history,
  bucketSeconds,
  windowHours,
}: {
  history: number[];
  bucketSeconds: number;
  windowHours: number;
}) {
  const max = Math.max(...history);
  const label =
    `Flagged passes per ${bucketSeconds >= 3600
      ? `${Math.round(bucketSeconds / 3600)}h`
      : `${Math.round(bucketSeconds / 60)}m`} bucket, ` +
    `last ${windowHours}h (oldest → newest)${
      max === 0
        ? ''
        : ` — peak bucket: ${max} pass${max === 1 ? '' : 'es'}`
    }`;
  return (
    <div
      role="img"
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: 2,
        height: 14,
        verticalAlign: 'middle',
      }}
    >
      {history.map((n, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: Math.max(2, Math.round((n / max) * 14)),
            borderRadius: 1,
            backgroundColor:
              n === 0
                ? 'var(--admin-border-subtle)'
                : n >= max
                  ? 'var(--admin-amber)'
                  : 'var(--admin-text-muted)',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Intensity companion to PassTrendBars: one bar per bucket of the row's
 * PEAK recorded connection count (null = no pass in that bucket recorded a
 * count — rendered as a silent stub). Height scales to the row's own peak,
 * so a 2-conn dialer and a 60-conn dialer are both readable; the all-null
 * case (ledger rows from before conns were recorded) degrades to a quiet
 * dash instead of an empty gap. Same pure-CSS approach as the pass
 * sparkline — no chart lib, nothing that matters at 6 rows.
 */
export function ConnTrendBars({
  connHistory,
  bucketSeconds,
  windowHours,
}: {
  connHistory: Array<number | null>;
  bucketSeconds: number;
  windowHours: number;
}) {
  const known = connHistory.filter((v): v is number => v !== null);
  const max = known.length > 0 ? Math.max(...known) : 0;
  const label =
    `Peak conns per ${bucketSeconds >= 3600
      ? `${Math.round(bucketSeconds / 3600)}h`
      : `${Math.round(bucketSeconds / 60)}m`} bucket, ` +
    `last ${windowHours}h (oldest → newest)${
      max === 0 ? '' : ` — peak: ${max} conns`
    }`;
  if (max === 0) {
    return (
      <div
        role="img"
        title={label}
        aria-label={label}
        style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}
      >
        —
      </div>
    );
  }
  return (
    <div
      role="img"
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: 2,
        height: 14,
        verticalAlign: 'middle',
      }}
    >
      {connHistory.map((v, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: v === null ? 2 : Math.max(2, Math.round((v / max) * 14)),
            borderRadius: 1,
            backgroundColor:
              v === null
                ? 'var(--admin-border-subtle)'
                : v >= max
                  ? 'var(--admin-amber)'
                  : 'var(--admin-text-muted)',
          }}
        />
      ))}
    </div>
  );
}
