import { Icon } from '@/components/Icons';
import type { OpsCheck, JobRunSummary } from '@/lib/api/admin';
import type { RunOutcomeView } from './run-views';
import { statusDot, ageLabel } from './constants';
import { RunStrip, RunOutcomePanel } from './run-views';

export function CheckCard({
  check,
  icon,
  historyJob,
  historyHours,
  onRun,
  runPending,
  runJobId,
  runOutcome,
}: {
  check: OpsCheck;
  icon: string;
  historyJob?: JobRunSummary;
  historyHours?: number;
  onRun?: () => void;
  runPending?: boolean;
  /** Ledger job name this card's manual run maps to (for outcome rendering). */
  runJobId?: string;
  runOutcome?: RunOutcomeView;
}) {
  const s = statusDot(check.ok);
  return (
    <div
      style={{
        flex: '1 1 220px',
        border: '1px solid var(--admin-card)',
        borderRadius: 14,
        backgroundColor: 'var(--admin-surface)',
        padding: '16px 18px',
        minWidth: 220,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name={icon} size={16} color={s.dot} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>{check.label}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {onRun && (
            <button
              onClick={onRun}
              disabled={runPending}
              style={{
                padding: '3px 10px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                background: 'transparent',
                color: runPending ? 'var(--admin-text-muted)' : 'var(--admin-orange)',
                fontSize: 11,
                fontWeight: 600,
                cursor: runPending ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Run this job's script now"
            >
              {runPending ? 'Running…' : 'Run now'}
            </button>
          )}
          <span
            style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: s.dot }}
            title={s.text}
          />
        </span>
      </div>
      <div
        style={{
          color: check.ok ? 'var(--admin-text-muted)' : 'var(--admin-red)',
          fontSize: 13,
          lineHeight: 1.4,
        }}
      >
        {check.detail}
      </div>
      <div
        style={{
          color: 'var(--admin-text-muted)',
          fontSize: 11,
          marginTop: 8,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {check.latencyMs !== undefined && <span>{check.latencyMs} ms</span>}
        {check.ageMinutes !== undefined && <span>last pass {ageLabel(check.ageMinutes)}</span>}
        {check.rowsPurged !== undefined && (
          <span style={{ color: check.rowsPurged > 0 ? 'var(--admin-amber)' : undefined }}>
            purged {check.rowsPurged} row{check.rowsPurged === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <RunStrip summary={historyJob} windowHours={historyHours} />
      {runJobId && <RunOutcomePanel jobId={runJobId} view={runOutcome} />}
    </div>
  );
}
