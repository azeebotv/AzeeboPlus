import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { SearchCorrectionsData, SearchCorrectionDay, SearchStats } from '@/lib/admin-types';

const RANGES = [7, 14, 30, 90] as const;

const BRAND_ORANGE = 'var(--admin-orange)';
const RATE_GREEN = 'var(--admin-emerald)';
const MUTED = 'var(--admin-text-muted)';

const fmtPct = (rate: number): string => `${(rate * 100).toFixed(1)}%`;

const fmtDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const fmtDateLong = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 16,
  border: '1px solid var(--admin-surface)',
  background: 'var(--admin-darker)',
};

/**
 * Hand-rolled SVG chart: per-day bars for suggestions shown (light) vs
 * accepted (solid), with the acceptance rate overlaid as a green line
 * (right axis, 0–100%). Hover shows a tooltip with the exact numbers.
 */
function CorrectionChart({ series }: { series: SearchCorrectionDay[] }): React.JSX.Element {
  const [hover, setHover] = useState<number | null>(null);

  const W = 920;
  const H = 320;
  const PAD_L = 48;
  const PAD_R = 14;
  const PAD_T = 18;
  const PAD_B = 36;

  const n = series.length;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const maxCount = Math.max(1, ...series.map((d) => Math.max(d.shown, d.accepted)));
  const band = n > 0 ? innerW / n : innerW;
  const center = (i: number): number => PAD_L + i * band + band / 2;
  const barW = Math.max(2, Math.min(16, band * 0.55));
  const countY = (v: number): number => PAD_T + innerH - (v / maxCount) * innerH;
  const rateY = (r: number): number => PAD_T + innerH - r * innerH;

  const tickEvery = Math.max(1, Math.ceil(n / 9));

  const ratePoints = series
    .map((d, i) => `${center(i).toFixed(1)},${rateY(d.rate).toFixed(1)}`)
    .join(' ');

  const handleMove = (e: React.MouseEvent<SVGRectElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.max(0, Math.min(n - 1, Math.floor((relX - PAD_L) / band)));
    setHover(idx);
  };

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Correction acceptance rate over time — bars for suggestions shown and accepted, line for the acceptance rate"
      >
        {/* Horizontal gridlines + right-axis rate labels (0/25/50/75/100%) */}
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <g key={r}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={rateY(r)}
              y2={rateY(r)}
              stroke="#2A1A1A"
              strokeWidth={1}
            />
            <text x={W - PAD_R - 4} y={rateY(r) + 4} textAnchor="end" fontSize={10} fill={MUTED}>
              {Math.round(r * 100)}%
            </text>
          </g>
        ))}

        {/* Left-axis count ticks */}
        {[0, 0.5, 1].map((f) => (
          <text
            key={f}
            x={PAD_L - 8}
            y={countY(maxCount * f) + 4}
            textAnchor="end"
            fontSize={10}
            fill={MUTED}
          >
            {Math.round(maxCount * f)}
          </text>
        ))}

        {/* X-axis day labels */}
        {series.map((d, i) =>
          i % tickEvery === 0 ? (
            <text
              key={d.date}
              x={center(i)}
              y={H - 12}
              textAnchor="middle"
              fontSize={10}
              fill={MUTED}
            >
              {fmtDate(d.date)}
            </text>
          ) : null
        )}

        {/* Per-day bars: shown (light) with accepted (solid) overlaid */}
        {series.map((d, i) => (
          <g key={d.date}>
            <rect
              x={center(i) - barW / 2}
              y={countY(d.shown)}
              width={barW}
              height={Math.max(0, innerH + PAD_T - countY(d.shown))}
              fill={BRAND_ORANGE}
              opacity={0.22}
              rx={2}
            />
            <rect
              x={center(i) - barW / 2}
              y={countY(d.accepted)}
              width={barW}
              height={Math.max(0, innerH + PAD_T - countY(d.accepted))}
              fill={BRAND_ORANGE}
              rx={2}
            />
          </g>
        ))}

        {/* Acceptance rate line */}
        <polyline
          points={ratePoints}
          fill="none"
          stroke={RATE_GREEN}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {series.map((d, i) => (
          <circle
            key={d.date}
            cx={center(i)}
            cy={rateY(d.rate)}
            r={3}
            fill={RATE_GREEN}
            stroke="#140808"
            strokeWidth={1.5}
          />
        ))}

        {/* Hover guide + tooltip */}
        {hover !== null && hover < n && series[hover] && (
          <g>
            <line
              x1={center(hover)}
              x2={center(hover)}
              y1={PAD_T}
              y2={PAD_T + innerH}
              stroke="#F5F0EB"
              strokeOpacity={0.35}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <g>
              <rect
                x={Math.min(Math.max(center(hover) - 78, PAD_L), W - PAD_R - 156)}
                y={PAD_T - 4}
                width={156}
                height={64}
                rx={6}
                fill="#241212"
                stroke="#3A2626"
              />
              <text
                x={Math.min(Math.max(center(hover) - 70, PAD_L + 8), W - PAD_R - 148)}
                y={PAD_T + 12}
                fontSize={10}
                fontWeight={700}
                fill="#F5F0EB"
              >
                {fmtDateLong(series[hover]!.date)}
              </text>
              <text
                x={Math.min(Math.max(center(hover) - 70, PAD_L + 8), W - PAD_R - 148)}
                y={PAD_T + 28}
                fontSize={10}
                fill={MUTED}
              >
                Shown: {series[hover]!.shown}
              </text>
              <text
                x={Math.min(Math.max(center(hover) - 70, PAD_L + 8), W - PAD_R - 148)}
                y={PAD_T + 43}
                fontSize={10}
                fill={MUTED}
              >
                Accepted: {series[hover]!.accepted}
              </text>
              <text
                x={Math.min(Math.max(center(hover) - 70, PAD_L + 8), W - PAD_R - 148)}
                y={PAD_T + 56}
                fontSize={10}
                fontWeight={700}
                fill={RATE_GREEN}
              >
                Rate: {fmtPct(series[hover]!.rate)}
              </text>
            </g>
          </g>
        )}

        {/* Hover capture overlay */}
        <rect
          x={PAD_L}
          y={PAD_T}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>

      {/* Legend */}
      <div
        style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 8, fontSize: 12 }}
      >
        <span style={{ color: MUTED, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 8,
              background: BRAND_ORANGE,
              opacity: 0.35,
              borderRadius: 2,
              display: 'inline-block',
            }}
          />
          Suggestions shown
        </span>
        <span style={{ color: MUTED, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 8,
              background: BRAND_ORANGE,
              borderRadius: 2,
              display: 'inline-block',
            }}
          />
          Accepted
        </span>
        <span style={{ color: MUTED, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 14,
              height: 3,
              background: RATE_GREEN,
              borderRadius: 2,
              display: 'inline-block',
            }}
          />
          Acceptance rate (%)
        </span>
      </div>
    </div>
  );
}

const stateColor = (state: 'available' | 'missing' | 'unknown' | 'present'): string =>
  state === 'available' || state === 'present'
    ? RATE_GREEN
    : state === 'missing'
      ? 'var(--admin-red)'
      : 'var(--admin-amber)';

const stateLabel = (state: string): string => state.charAt(0).toUpperCase() + state.slice(1);

function StatusChip({
  label,
  value,
  color = 'var(--admin-text)',
}: {
  label: string;
  value: string;
  color?: string;
}): React.JSX.Element {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
      <span style={{ color: MUTED }}>{label}:</span>
      <strong style={{ color, fontWeight: 700 }}>{value}</strong>
    </span>
  );
}

export default function SearchAnalyticsPage(): React.JSX.Element {
  const [days, setDays] = useState<number>(30);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'search', 'corrections', days],
    queryFn: async () => {
      const res = await adminApi.getSearchCorrections(days);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load correction analytics');
      }
      return res.data as SearchCorrectionsData;
    },
  });

  // Fuzzy-search guard state from the search-service admin stats endpoint
  // (the same status /health reports) — surfaced here so ops sees degradation
  // without hitting the health endpoint.
  const { data: stats } = useQuery<SearchStats>({
    queryKey: ['admin', 'search', 'stats'],
    queryFn: async () => {
      const res = await adminApi.getSearchStats();
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load search service stats');
      }
      return res.data as SearchStats;
    },
    refetchInterval: 60000,
  });

  const totalShown = data?.overall.shown ?? 0;
  const totalAccepted = data?.overall.accepted ?? 0;
  const overallRate = data?.overall.rate ?? 0;

  // Rate over the most recent 7 days (or the whole window when shorter).
  const recentRate = useMemo(() => {
    if (!data || data.series.length === 0) return 0;
    const window = data.series.slice(-7);
    const shown = window.reduce((sum, d) => sum + d.shown, 0);
    return shown > 0 ? window.reduce((sum, d) => sum + d.accepted, 0) / shown : 0;
  }, [data]);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Search Analytics</h1>
      <p style={{ color: MUTED, marginBottom: 32 }}>
        'Did you mean' correction acceptance — suggestions shown vs accepted over time
      </p>

      {/* Range selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setDays(r)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${days === r ? BRAND_ORANGE : 'var(--admin-surface)'}`,
              background: days === r ? 'rgba(232,66,10,0.15)' : 'transparent',
              color: days === r ? 'var(--admin-text)' : MUTED,
              fontWeight: days === r ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {r} days
          </button>
        ))}
      </div>

      {/* Fuzzy-search guard status (from the search-service /admin/stats
          endpoint — the same state /health reports). */}
      <div
        style={{
          ...cardStyle,
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: stats?.fuzzy.degraded ? 'var(--admin-red)' : RATE_GREEN,
            }}
          />
          <strong style={{ color: 'var(--admin-text)', fontSize: 14 }}>
            Fuzzy search: {stats?.fuzzy.degraded ? 'DEGRADED' : 'healthy'}
          </strong>
        </div>
        <StatusChip label="Enabled" value={stats?.fuzzy.enabled ? 'Yes' : 'No'} />
        <StatusChip
          label="pg_trgm"
          value={stats?.fuzzy.pgTrgm ? stateLabel(stats.fuzzy.pgTrgm) : '…'}
          color={stats?.fuzzy.pgTrgm ? stateColor(stats.fuzzy.pgTrgm) : undefined}
        />
        <StatusChip
          label="Indexes"
          value={stats?.fuzzy.indexes ? stateLabel(stats.fuzzy.indexes) : '…'}
          color={stats?.fuzzy.indexes ? stateColor(stats.fuzzy.indexes) : undefined}
        />
        <StatusChip label="Mode" value={stats?.fuzzy.mode ?? '…'} />
        <StatusChip
          label="Searches today"
          value={stats ? String(stats.totalSearchesToday.toLocaleString()) : '…'}
        />
        <StatusChip
          label="Unique searchers"
          value={stats ? String(stats.uniqueSearchers.toLocaleString()) : '…'}
        />
        {stats?.fuzzy.warning && (
          <span style={{ color: 'var(--admin-amber)', fontSize: 12, flexBasis: '100%' }}>
            ⚠ {stats.fuzzy.warning}
          </span>
        )}
      </div>

      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ ...cardStyle, height: 96 }}>
              <div
                style={{
                  height: 12,
                  width: '55%',
                  background: 'var(--admin-surface)',
                  borderRadius: 6,
                  marginBottom: 16,
                }}
              />
              <div style={{ height: 26, width: '35%', background: 'var(--admin-surface)', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : isError || !data ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 48 }}>
          <p style={{ color: MUTED, marginBottom: 16 }}>Could not load correction analytics.</p>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid #3A2626',
              background: 'transparent',
              color: 'var(--admin-text)',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div style={cardStyle}>
              <div style={{ color: MUTED, fontSize: 13, marginBottom: 8 }}>Suggestions shown</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--admin-text)' }}>
                {totalShown.toLocaleString()}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ color: MUTED, fontSize: 13, marginBottom: 8 }}>
                Corrections accepted
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: BRAND_ORANGE }}>
                {totalAccepted.toLocaleString()}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ color: MUTED, fontSize: 13, marginBottom: 8 }}>
                Acceptance rate (all)
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: RATE_GREEN }}>
                {fmtPct(overallRate)}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ color: MUTED, fontSize: 13, marginBottom: 8 }}>
                Acceptance rate (last 7d)
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: RATE_GREEN }}>
                {fmtPct(recentRate)}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 4 }}>
              Acceptance rate over time
            </h2>
            <p style={{ color: MUTED, fontSize: 12, marginBottom: 16 }}>
              Bars: suggestions shown (light) and accepted (solid) per day · Line: acceptance rate
              (%)
            </p>
            <CorrectionChart series={data.series} />
          </div>

          {/* Accessible data table */}
          <div style={{ ...cardStyle, marginTop: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 16 }}>
              Daily breakdown
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: MUTED, textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--admin-surface)' }}>Date</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--admin-surface)' }}>
                      Shown
                    </th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--admin-surface)' }}>
                      Accepted
                    </th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--admin-surface)' }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.series
                    .slice()
                    .reverse()
                    .map((d) => (
                      <tr key={d.date} style={{ color: 'var(--admin-text)' }}>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #1E1010' }}>
                          {fmtDateLong(d.date)}
                        </td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #1E1010' }}>
                          {d.shown.toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #1E1010' }}>
                          {d.accepted.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #1E1010',
                            color: RATE_GREEN,
                          }}
                        >
                          {fmtPct(d.rate)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
