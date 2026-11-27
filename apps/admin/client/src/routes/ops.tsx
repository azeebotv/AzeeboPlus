import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { pollingIntervals } from '@azeebo/design-tokens';
import type {
  OpsStatus,
  OpsRunHistory,
  PgbouncerHealth,
  OpsServicesSnapshot,
  TransportFlipTrend,
  ForeignPersistence,
} from '@/lib/api/admin';
import type { RunOutcomeView } from './ops/run-views';
import { CheckCard } from './ops/check-card';
import { OVERALL, HISTORY_JOB_BY_LABEL, windowLabel, STORE_CHIP, FOREIGN_WINDOW_OPTIONS, FOREIGN_WINDOW_STORAGE_KEY } from './ops/constants';
import { PgbouncerCard } from './ops/pgbouncer-card';
import { TransportMismatchBanner } from './ops/transport-banner';
import { TransportFlipTrendCard, FleetTransportCard } from './ops/transport-cards';

export default function OpsPage() {
  const [since, setSince] = useState<number | null>(null);
  /** Window for the job cards' pass-history strips. */
  const [historyHours, setHistoryHours] = useState<number>(24);
  /** Window for the foreign-persistence card's ledger re-query (null = the
   * pgbouncer snapshot's embedded persistence, 48h). Restored from
   * localStorage so ops land on their last window after a reload; a stale
   * or invalid stored value (toggle options changed, hand-edited) and
   * unavailable storage both fall back to the snapshot behavior. Lazy
   * initializer keeps this a read-once concern. */
  const [foreignWindowHours, setForeignWindowHours] = useState<number | null>(() => {
    try {
      const hours = Number(window.localStorage.getItem(FOREIGN_WINDOW_STORAGE_KEY));
      return FOREIGN_WINDOW_OPTIONS.some((o) => o.hours === hours) ? hours : null;
    } catch {
      return null;
    }
  });
  /** Toggle handler: mirrors the choice into localStorage (removal on null)
   * so the next page load restores it. Storage failures are non-fatal — the
   * choice just doesn't persist. */
  const selectForeignWindow = (hours: number | null) => {
    setForeignWindowHours(hours);
    try {
      if (hours === null) window.localStorage.removeItem(FOREIGN_WINDOW_STORAGE_KEY);
      else window.localStorage.setItem(FOREIGN_WINDOW_STORAGE_KEY, String(hours));
    } catch {
      /* storage unavailable — choice simply won't persist */
    }
  };
  // Dedicated foreign-persistence query: keyed by the card's toggle window so
  // switching 48h/7d/14d re-queries ONLY the ledger read (cheap SQL), never
  // the whole pgbouncer sweep. Null key = follow the snapshot; once a window
  // is chosen the dedicated data wins until the window goes back to null.
  const { data: foreignPersistence } = useQuery({
    queryKey: ['admin', 'ops-foreign-persistence', foreignWindowHours],
    enabled: foreignWindowHours !== null,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const res = await adminApi.getOpsForeignPersistence(foreignWindowHours ?? undefined);
      return res.success ? (res.data as ForeignPersistence) : null;
    },
    refetchInterval: pollingIntervals.dashboard,
  });
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['admin', 'ops-status'],
    queryFn: async () => {
      const res = await adminApi.getOpsStatus();
      return res.success ? (res.data as OpsStatus) : null;
    },
    refetchInterval: pollingIntervals.dashboard, // jobs run hourly; a 30s glance window is plenty
  });
  const { data: runs } = useQuery({
    queryKey: ['admin', 'ops-runs', historyHours],
    queryFn: async () => {
      const res = await adminApi.getOpsRunHistory(historyHours);
      return res.success ? (res.data as OpsRunHistory) : null;
    },
    refetchInterval: pollingIntervals.idle,
  });
  const { data: pgbouncer } = useQuery({
    queryKey: ['admin', 'ops-pgbouncer'],
    queryFn: async () => {
      const res = await adminApi.getOpsPgbouncer();
      return res.success ? (res.data as PgbouncerHealth) : null;
    },
    refetchInterval: pollingIntervals.dashboard,
  });
  // Fleet probe sweep — same endpoint the Service Health page uses, so the
  // react-query cache is shared and neither page can swallow the other's flip.
  const { data: servicesSnapshot } = useQuery({
    queryKey: ['admin', 'ops-services'],
    queryFn: async () => {
      const res = await adminApi.getOpsServices();
      return res.success ? (res.data as OpsServicesSnapshot) : null;
    },
    refetchInterval: pollingIntervals.dashboard,
  });
  // Ledger-backed flip history: the banner shows what changed in the last
  // 10 minutes; the trend card shows what changed across the fortnight.
  // 5-min staleness fits — the underlying rows update at most once per sweep.
  const { data: flipTrend } = useQuery({
    queryKey: ['admin', 'ops-flip-trend'],
    queryFn: async () => {
      const res = await adminApi.getOpsTransportFlipTrend();
      return res.success ? (res.data as TransportFlipTrend) : null;
    },
    refetchInterval: pollingIntervals.idle,
    staleTime: 5 * 60_000,
  });
  const [dismissedFlipKeys, setDismissedFlipKeys] = useState<Set<string>>(new Set());
  const liveFlips = (servicesSnapshot?.transportFlips ?? []).filter(
    (f) => !dismissedFlipKeys.has(`${f.service}:${f.detectedAt}`)
  );
  // Header chip: is the transport store Redis-backed or degraded to memory?
  const storeChip = servicesSnapshot?.transportStore ?? null;
  const queryClient = useQueryClient();
  const [runJobId, setRunJobId] = useState<string | null>(null);
  const [runOutcome, setRunOutcome] = useState<Record<string, RunOutcomeView>>({});
  const runMutation = useMutation({
    mutationFn: (job: string) => adminApi.runOpsJob(job),
    onMutate: (job) => {
      setRunJobId(job);
      setRunOutcome((prev) => ({ ...prev, [job]: {} }));
    },
    onSuccess: (res, job) => {
      setRunOutcome((prev) => ({ ...prev, [job]: { outcome: res.data } }));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ops-status'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ops-runs'] });
    },
    onError: (err, job) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'unknown error';
      setRunOutcome((prev) => ({ ...prev, [job]: { error: msg } }));
    },
  });
  const RUN_JOB_BY_LABEL: Record<string, string> = {
    'Freshness job': 'freshness',
    'Audit retention': 'audit-retention',
    'Pool audit': 'pool-audit',
    'Plist watchdog': 'plist-watchdog',
  };

  if (isLoading || !data) {
    return (
      <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 60 }}>
        Loading ops status...
      </p>
    );
  }

  const overall = OVERALL[data.overall];
  const cutoff = since ? Date.now() - since * 60 * 60 * 1000 : 0;
  const alerts = data.alerts.filter((a) => new Date(a.at).getTime() >= cutoff);
  const runsByJob = Object.fromEntries((runs?.perJob ?? []).map((s) => [s.job, s]));
  const drill = runsByJob['drill'];

  return (
    <div>
      <TransportMismatchBanner
        flips={liveFlips}
        onDismiss={() =>
          setDismissedFlipKeys(
            (prev) => new Set([...prev, ...liveFlips.map((f) => `${f.service}:${f.detectedAt}`)])
          )
        }
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 6,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Ops Health</h1>
        <span
          style={{
            padding: '4px 14px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            color: overall.color,
            background: overall.bg,
          }}
        >
          {overall.label}
        </span>
        {storeChip && (
          <span
            style={{
              padding: '4px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              color: STORE_CHIP[storeChip.mode].color,
              background: STORE_CHIP[storeChip.mode].bg,
            }}
            title={storeChip.detail}
          >
            store: {STORE_CHIP[storeChip.mode].label}
            {storeChip.redisDb !== null && (
              <span style={{ fontWeight: 500, opacity: 0.85 }}> · db {storeChip.redisDb}</span>
            )}
          </span>
        )}
        <span style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginLeft: 'auto' }}>
          auto-refreshes every 30s · checked {new Date(dataUpdatedAt).toLocaleTimeString()}
        </span>
      </div>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 24 }}>
        Live probes: admin database, federation (cross-DB join), and the scheduled jobs' last
        passes.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>
          Pass history
        </span>
        {(
          [
            { label: '24h', h: 24 },
            { label: '7d', h: 24 * 7 },
          ] as const
        ).map((r) => (
          <button
            key={r.label}
            onClick={() => setHistoryHours(r.h)}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              border: historyHours === r.h ? 'none' : '1px solid var(--admin-surface)',
              background: historyHours === r.h ? 'var(--admin-orange)' : 'transparent',
              color: historyHours === r.h ? 'white' : 'var(--admin-text-muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <PgbouncerCard
        health={pgbouncer}
        foreignPersistence={foreignPersistence}
        onWindowHours={foreignWindowHours}
        onWindowChange={selectForeignWindow}
      />
      <div style={{ marginTop: 16 }}>
        <TransportFlipTrendCard trend={flipTrend} />
      </div>
      <FleetTransportCard snapshot={servicesSnapshot} />

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <CheckCard check={data.db} icon="activity" historyHours={historyHours} />
        <CheckCard check={data.federation} icon="refresh" historyHours={historyHours} />
        {data.jobs.map((j) => {
          const runJob = RUN_JOB_BY_LABEL[j.label];
          return (
            <CheckCard
              key={j.label}
              check={j}
              icon="clock"
              historyJob={runsByJob[HISTORY_JOB_BY_LABEL[j.label] ?? '']}
              historyHours={historyHours}
              onRun={runJob ? () => runMutation.mutate(runJob) : undefined}
              runPending={runJob !== undefined && runMutation.isPending && runJobId === runJob}
              runJobId={runJob}
              runOutcome={runJob ? runOutcome[runJob] : undefined}
            />
          );
        })}
      </div>

      {drill && drill.total > 0 && drill.lastAt && (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: '-16px 0 24px' }}>
          Weekly federation drill: last ran {new Date(drill.lastAt).toLocaleString()} —{' '}
          {drill.error > 0 ? (
            <span style={{ color: 'var(--admin-red)' }}>failures recorded</span>
          ) : (
            <span style={{ color: 'var(--admin-emerald)' }}>passing</span>
          )}{' '}
          ({drill.total} recorded run{drill.total === 1 ? '' : 's'} in{' '}
          {windowLabel(runs?.windowHours ?? 24)})
        </p>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Recent alerts</h2>
        {(
          [
            { label: 'All time', h: null },
            { label: '24h', h: 24 },
            { label: '7d', h: 24 * 7 },
          ] as const
        ).map((r) => (
          <button
            key={r.label}
            onClick={() => setSince(r.h)}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              border: since === r.h ? 'none' : '1px solid var(--admin-surface)',
              background: since === r.h ? 'var(--admin-orange)' : 'transparent',
              color: since === r.h ? 'white' : 'var(--admin-text-muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div
        style={{
          borderRadius: 16,
          border: '1px solid var(--admin-card)',
          backgroundColor: 'var(--admin-surface)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'rgba(232,66,10,0.08)',
                borderBottom: '1px solid var(--admin-card)',
              }}
            >
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--admin-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Timestamp
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--admin-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Level
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--admin-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Source
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--admin-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Message
              </th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={`${a.at}-${i}`} style={{ borderBottom: '1px solid var(--admin-card)' }}>
                <td
                  style={{
                    padding: '12px 16px',
                    color: 'var(--admin-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {new Date(a.at).toLocaleString()}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      color: a.level === 'ERROR' ? 'var(--admin-red)' : 'var(--admin-amber)',
                      background:
                        a.level === 'ERROR' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)',
                    }}
                  >
                    {a.level}
                  </span>
                </td>
                <td
                  style={{
                    padding: '12px 8px',
                    color: 'var(--admin-text)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {a.source}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 480,
                  }}
                >
                  {a.message}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)' }}
                >
                  No alerts in this window — jobs are passing clean.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
