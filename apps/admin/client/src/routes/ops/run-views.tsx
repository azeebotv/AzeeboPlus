import { Icon } from '@/components/Icons';
import type {
  JobRunSummary,
  JobRunDailySummary,
  RunJobOutcome,
  PgbouncerPoolRow,
} from '@/lib/api/admin';
import { RUN_COLORS, windowLabel } from './constants';

export function PgbouncerPoolRowView({ p }: { p: PgbouncerPoolRow }) {
  const waiting = p.clWaiting > 0;
  return (
    <tr style={{ borderTop: '1px solid var(--admin-card)' }}>
      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{p.database}</td>
      <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)' }}>{p.user}</td>
      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>{p.clActive}</td>
      <td
        style={{
          padding: '5px 8px 5px 0',
          fontVariantNumeric: 'tabular-nums',
          color: waiting ? 'var(--admin-amber)' : 'var(--admin-text-muted)',
          fontWeight: waiting ? 700 : 400,
        }}
        title={waiting ? 'Clients queued waiting for a server connection' : undefined}
      >
        {p.clWaiting}
      </td>
      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>{p.svActive}</td>
      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>{p.svIdle}</td>
    </tr>
  );
}

/**
 * Pass-history strip from the job_runs ledger: one bar per recorded pass,
 * oldest → newest left → right; taller bars for warn, full-height for error.
 * In the 7d window, per-day success-rate rows replace the per-pass bars
 * (an hourly job would otherwise need ~168 unreadable bars).
 */
export function RunStrip({
  summary,
  windowHours = 24,
}: {
  summary?: JobRunSummary;
  windowHours?: number;
}) {
  if (!summary || summary.total === 0) {
    return (
      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 10 }}>
        No recorded runs in the last {windowLabel(windowHours)}
      </div>
    );
  }
  if (windowHours > 24) {
    return <DailyRates daily={summary.daily} windowHours={windowHours} />;
  }
  const runs = [...summary.runs].reverse();
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 34 }}>
        {runs.map((r, i) => (
          <div
            key={`${r.ranAt}-${i}`}
            title={`${new Date(r.ranAt).toLocaleTimeString()} · ${r.status}${
              r.detail ? ` — ${r.detail}` : ''
            }`}
            style={{
              flex: 1,
              minWidth: 3,
              height: r.status === 'error' ? '100%' : r.status === 'warn' ? '80%' : '55%',
              backgroundColor: RUN_COLORS[r.status],
              borderRadius: 2,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 6 }}>
        last {summary.total} pass{summary.total === 1 ? '' : 'es'} ·{' '}
        <span style={{ color: 'var(--admin-emerald)' }}>{summary.ok} ok</span>
        {summary.warn > 0 && (
          <>
            {' · '}
            <span style={{ color: 'var(--admin-amber)' }}>{summary.warn} warn</span>
          </>
        )}
        {summary.error > 0 && (
          <>
            {' · '}
            <span style={{ color: 'var(--admin-red)' }}>{summary.error} failed</span>
          </>
        )}
      </div>
    </div>
  );
}

/** Per-day success-rate rows for the 7d window (UTC days, chronological). */
function DailyRates({ daily, windowHours }: { daily: JobRunDailySummary[]; windowHours: number }) {
  if (daily.length === 0) {
    return (
      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 10 }}>
        No recorded runs in the last {windowLabel(windowHours)}
      </div>
    );
  }
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'grid', gap: 3 }}>
        {daily.map((d) => (
          <div
            key={d.date}
            style={{
              display: 'grid',
              gridTemplateColumns: '46px 1fr 38px 52px',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              lineHeight: 1.2,
            }}
            title={`${d.date}: ${d.ok}/${d.total} pass${d.total === 1 ? '' : 'es'} succeeded`}
          >
            <span style={{ color: 'var(--admin-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {d.date.slice(5).replace('-', '/')}
            </span>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'var(--admin-surface)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${d.rate}%`,
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor:
                    d.rate >= 100
                      ? 'var(--admin-emerald)'
                      : d.rate >= 60
                        ? 'var(--admin-amber)'
                        : 'var(--admin-red)',
                }}
              />
            </div>
            <span
              style={{
                color:
                  d.rate >= 100
                    ? 'var(--admin-emerald)'
                    : d.rate >= 60
                      ? 'var(--admin-amber)'
                      : 'var(--admin-red)',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              {d.rate}%
            </span>
            <span style={{ color: 'var(--admin-text-muted)' }}>
              {d.ok}/{d.total}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 6 }}>
        {windowLabel(windowHours)} window · {daily.length} day{daily.length === 1 ? '' : 's'} with
        runs · {daily.reduce((n, d) => n + d.total, 0)} pass
        {daily.reduce((n, d) => n + d.total, 0) === 1 ? '' : 'es'} total
      </div>
    </div>
  );
}

/** Outcome of the last manual run for a card (or a failed start). */
export interface RunOutcomeView {
  outcome?: RunJobOutcome;
  error?: string;
}

export function RunOutcomePanel({ jobId, view }: { jobId: string; view?: RunOutcomeView }) {
  if (!view || (view.outcome?.job !== jobId && !view.error)) return null;
  const o = view.outcome;
  if (view.error) {
    return (
      <div
        style={{
          marginTop: 10,
          padding: '8px 10px',
          borderRadius: 8,
          background: 'rgba(204,28,28,0.12)',
          color: 'var(--admin-red)',
          fontSize: 12,
        }}
      >
        Could not start: {view.error}
      </div>
    );
  }
  if (!o) return null;
  return (
    <div
      style={{
        marginTop: 10,
        padding: '8px 10px',
        borderRadius: 8,
        background: o.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.12)',
        fontSize: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 700,
          color: o.ok ? 'var(--admin-emerald)' : 'var(--admin-red)',
        }}
      >
        <Icon
          name={o.ok ? 'check' : 'x'}
          size={14}
          color={o.ok ? 'var(--admin-emerald)' : 'var(--admin-red)'}
        />
        <span>
          {o.ok ? 'finished ok' : 'finished with errors'} · {(o.durationMs / 1000).toFixed(1)}s
        </span>
      </div>
      {o.output.length > 0 && (
        <pre
          style={{
            margin: '6px 0 0',
            maxHeight: 150,
            overflow: 'auto',
            fontSize: 11,
            lineHeight: 1.5,
            color: 'var(--admin-text-muted)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {o.output.slice(-8).join('\n')}
        </pre>
      )}
    </div>
  );
}
