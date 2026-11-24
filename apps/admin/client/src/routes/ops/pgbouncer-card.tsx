import { Icon } from '@/components/Icons';
import type { PgbouncerHealth, ForeignPersistence } from '@/lib/api/admin';
import { PG_LEVEL, FOREIGN_WINDOW_OPTIONS, sPlural } from './constants';
import { groupForeignRowsByProject } from './foreign';
import { PgbouncerPoolRowView } from './run-views';
import { PassTrendBars, ConnTrendBars } from './trend-bars';

/**
 * pgbouncer saturation card: client-connection budget against
 * max_client_conn plus the per-database pool breakdown. At ≥95% the
 * pooler refuses new clients — every service sees it as a total DB outage
 * — so this card has its own dedicated alert band (80% warn, 95% critical).
 */

export function PgbouncerCard({
  health,
  foreignPersistence,
  onWindowChange,
  onWindowHours,
}: {
  health?: PgbouncerHealth | null;
  /** Dedicated ledger re-query for the card's window toggle — wins over the
   * pgbouncer snapshot's embedded persistence when present, so switching
   * windows doesn't wait on (or refetch) the whole sweep. */
  foreignPersistence?: ForeignPersistence | null;
  /** Fires when a window chip is clicked; the page re-queries the ledger. */
  onWindowChange?: (hours: number) => void;
  /** The page's active toggle window (null/undefined = snapshot's own). */
  onWindowHours?: number | null;
}) {
  if (!health) return null;
  const level = PG_LEVEL[health.level ?? 'ok'];
  const fp = foreignPersistence ?? health.foreignPersistence;
  return (
    <div
      data-testid="pgbouncer-card"
      style={{
        flex: '1 1 100%',
        border: '1px solid var(--admin-card)',
        borderRadius: 14,
        backgroundColor: 'var(--admin-surface)',
        padding: '16px 18px',
        marginBottom: 28,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon
          name="activity"
          size={16}
          color={health.available ? level.color : 'var(--admin-amber)'}
        />
        <span style={{ fontWeight: 600, fontSize: 14 }}>pgbouncer pools</span>
        {health.available && (
          <span
            style={{
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: level.color,
              background: level.bg,
            }}
          >
            {level.label}
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--admin-text-muted)', fontSize: 11 }}>
          probed in {health.latencyMs} ms
        </span>
      </div>

      {!health.available ? (
        <div style={{ color: 'var(--admin-amber)', fontSize: 13 }}>
          Pooler not reachable — {health.detail ?? 'unknown reason'}
        </div>
      ) : (
        <>
          {health.level === 'critical' && (
            <div
              style={{
                marginBottom: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(204,28,28,0.15)',
                color: 'var(--admin-red)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Alert: client connections ≥95% of max_client_conn — pgbouncer will refuse new clients
              and every service will see connection failures.
            </div>
          )}
          {health.level === 'degraded' && (
            <div
              style={{
                marginBottom: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(245,158,11,0.12)',
                color: 'var(--admin-amber)',
                fontSize: 13,
              }}
            >
              Warning: client connections ≥80% of max_client_conn — approaching the ceiling.
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                flex: 1,
                height: 10,
                borderRadius: 5,
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-card)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, health.usagePercent ?? 0)}%`,
                  height: '100%',
                  borderRadius: 5,
                  backgroundColor: level.color,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: level.color,
                whiteSpace: 'nowrap',
              }}
            >
              {health.totalClients} / {health.maxClientConn} clients ({health.usagePercent}%)
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                {[
                  'Database',
                  'User',
                  'Clients active',
                  'Clients waiting',
                  'Servers active',
                  'Servers idle',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '4px 8px 4px 0',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(health.pools ?? []).map((p) => (
                <PgbouncerPoolRowView key={`${p.database}-${p.user}`} p={p} />
              ))}
              {(health.pools ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--admin-text-muted)', padding: '6px 0' }}>
                    No pools yet — no service has connected since the pooler started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Per-service pool budgets: what each workspace's prisma client is
              CAPPED to open against the pooler (from its .env), rolled up by
              database. Together with the pool table above, one card shows
              both sides of the connection economy: what clients may open
              (budgets) and what they have opened (pools). */}
          <p
            style={{
              margin: '18px 0 6px',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--admin-text-muted)',
            }}
          >
            Per-service pool budgets
          </p>
          {(health.serviceBudgets ?? []).length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                  {['Database', 'Service', 'connection_limit', 'Uncapped'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '4px 8px 4px 0',
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(health.serviceBudgets ?? []).map((b) =>
                  b.services.map((s, i) => (
                    <tr key={s.workspace} style={{ borderTop: '1px solid var(--admin-card)' }}>
                      <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)' }}>
                        {i === 0 ? b.database : ''}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{s.workspace}</td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {s.connectionLimit ?? '—'}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0' }}>
                        {s.connectionLimit === null ? (
                          <span
                            style={{ color: 'var(--admin-amber)', fontWeight: 600 }}
                            title="No connection_limit in its .env — Prisma default pool, unbounded worst case"
                          >
                            uncapped
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
                {/* Rollup rows: per-database worst case, aligned with the
                    pool table's database names for quick comparison. */}
                {(health.serviceBudgets ?? []).map((b) => (
                  <tr
                    key={`rollup-${b.database}`}
                    style={{ borderTop: '2px solid var(--admin-card)' }}
                  >
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 700 }}>{b.database}</td>
                    <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)' }}>
                      worst case — {b.services.length} service{sPlural(b.services.length)}
                      {b.uncapped.length > 0 ? ` (+${b.uncapped.length} uncapped)` : ''}
                    </td>
                    <td
                      style={{
                        padding: '5px 8px 5px 0',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 700,
                      }}
                    >
                      {b.uncapped.length > 0 ? `${b.worstCaseTotal}+` : b.worstCaseTotal}
                    </td>
                    <td style={{ padding: '5px 8px 5px 0' }} />
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: 0 }}>
              Per-service budgets unavailable — {health.budgetsDetail ?? 'workspace tree not found'}
              .
            </p>
          )}

          {/* Direct-Postgres bypass detector: repo-owned processes holding
              ESTABLISHED sockets straight to :5432 instead of through the
              pooler. Foreign (non-repo) clients are listed separately —
              noise, not ours. */}
          <p
            style={{
              margin: '18px 0 6px',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--admin-text-muted)',
            }}
          >
            Direct-Postgres bypasses
          </p>
          {health.bypassesDetail ? (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: 0 }}>
              Bypass scan skipped — {health.bypassesDetail}
            </p>
          ) : (health.bypasses ?? []).length === 0 ? (
            <p style={{ color: 'var(--admin-emerald)', fontSize: 12, margin: 0 }}>
              ✓ No repo processes are connecting to Postgres directly — all traffic goes through
              pgbouncer.
              {(health.foreignDirectClients ?? []).length > 0 && (
                <span style={{ color: 'var(--admin-text-muted)' }}>
                  {' '}
                  ({(health.foreignDirectClients ?? []).reduce((n, f) => n + f.connections, 0)}{' '}
                  direct connections from other projects on this host
                  {(health.foreignDirectClients ?? []).some((f) => f.ipv6)
                    ? ', including IPv6 loopback (::1) dials'
                    : ''}
                  .)
                </span>
              )}
            </p>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                    {['Workspace', 'Process', 'PID', 'Conns'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '4px 8px 4px 0',
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(health.bypasses ?? []).map((b) => (
                    <tr key={`${b.pid}-${b.workspace}`}>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{b.workspace}</td>
                      <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-amber)' }}>
                        {b.command}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {b.pid}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {b.connections}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '4px 0 0' }}>
                These processes dial Postgres :5432 directly, skipping pgbouncer — connection limits
                and pool budgeting do not apply to them. Restart them on the pooler DATABASE_URL.
                {(health.foreignDirectClients ?? []).length > 0 && (
                  <>
                    {' '}
                    ({(health.foreignDirectClients ?? []).reduce(
                      (n, f) => n + f.connections,
                      0
                    )}{' '}
                    other direct connections on this host belong to different projects
                    {(health.foreignDirectClients ?? []).some((f) => f.ipv6)
                      ? ', some over IPv6 loopback (::1)'
                      : ''}
                    .)
                  </>
                )}
              </p>
            </>
          )}
          {(health.foreignDirectClients ?? []).length > 0 && (
            <>
              <table
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 10 }}
              >
                <thead>
                  <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                    {['Foreign project', 'Direct conns', 'over IPv6'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '4px 8px 4px 0',
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(health.foreignDirectClients ?? []).map((f) => (
                    <tr key={f.workspace}>
                      <td style={{ padding: '5px 8px 5px 0' }}>{f.workspace}</td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {f.connections}
                      </td>
                      <td
                        style={{
                          padding: '5px 8px 5px 0',
                          fontVariantNumeric: 'tabular-nums',
                          color: f.ipv6 ? 'var(--admin-amber)' : 'var(--admin-text-muted)',
                        }}
                      >
                        {f.ipv6 ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '4px 0 0' }}>
                Context only: these belong to other projects on this host dialing Postgres :5432
                directly — not azeebo processes, and never counted as bypasses. Shown because
                foreign fleets often bind IPv6 loopback (::1) exclusively, which changes where you
                look when chasing connections.
              </p>
            </>
          )}
          {fp && fp.rows.length > 0 && (
            <>
              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  Foreign dialer persistence — ledger, last {fp.windowHours}h
                </div>
                <div style={{ display: 'inline-flex', gap: 4 }} role="group" aria-label="Persistence window">
                  {FOREIGN_WINDOW_OPTIONS.map(({ label, hours }) => {
                    const active = hours === (onWindowHours ?? fp.windowHours);
                    return (
                      <button
                        key={hours}
                        type="button"
                        disabled={active}
                        onClick={() => onWindowChange?.(hours)}
                        title={`Re-query the ledger for the last ${label} — sparklines rescale to the chosen window`}
                        style={{
                          padding: '2px 10px',
                          fontSize: 11,
                          fontWeight: active ? 700 : 500,
                          borderRadius: 999,
                          border: '1px solid rgba(148,163,184,0.35)',
                          background: active ? 'rgba(16,185,129,0.15)' : 'transparent',
                          color: active ? 'var(--admin-emerald)' : 'var(--admin-text-muted)',
                          cursor: active ? 'default' : 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <table
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 6 }}
              >
                <thead>
                  <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                    {['Foreign project', 'Flagged passes', 'History', 'Conns', 'Span', 'Last seen', ''].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '4px 8px 4px 0',
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupForeignRowsByProject(fp.rows).map(([project, aggregates, rows]) => {
                    const solo = rows.length === 1;
                    return [
                      ...(solo
                        ? []
                        : [
                            <tr
                              key={`grp:${project}`}
                              style={{ color: 'var(--admin-text-muted)' }}
                            >
                              <td
                                colSpan={7}
                                style={{
                                  padding: '10px 8px 2px 0',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  borderTop: '1px solid var(--admin-border-subtle)',
                                }}
                              >
                                {project} — {rows.length} workspace{rows.length === 1 ? '' : 's'} ·{' '}
                                {aggregates.passes} pass{aggregates.passes === 1 ? '' : 'es'} · peak{' '}
                                {aggregates.peakConns} conn{aggregates.peakConns === 1 ? '' : 's'}
                                {aggregates.anySustained
                                  ? ` · ${aggregates.sustainedCount} sustained`
                                  : ''}
                              </td>
                            </tr>,
                          ]),
                      ...rows.map((f) => (
                        <tr key={f.workspace}>
                          <td style={{ padding: '5px 8px 5px 0' }}>
                            <span
                              style={{ fontWeight: solo ? 600 : 400 }}
                              title={
                                (f.project ?? f.workspace) === f.workspace
                                  ? `No POOL_FOREIGN_PROJECT_ROOTS root matched — the workspace path is its own project group`
                                  : `Project: ${f.project} — workspace: ${f.workspace}`
                              }
                            >
                              {f.project ?? f.workspace}
                            </span>
                          </td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {f.passes}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', whiteSpace: 'nowrap' }}>
                        <PassTrendBars
                          history={f.history}
                          bucketSeconds={f.bucketSeconds}
                          windowHours={fp.windowHours ?? 0}
                        />
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', whiteSpace: 'nowrap' }}>
                        <ConnTrendBars
                          connHistory={f.connHistory ?? []}
                          bucketSeconds={f.bucketSeconds}
                          windowHours={fp.windowHours ?? 0}
                        />
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {f.spanHours >= 1
                          ? `${f.spanHours.toFixed(1)}h`
                          : `${Math.round(f.spanHours * 60)}m`}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)' }}>
                        {new Date(f.lastSeen).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0' }}>
                        {f.approved ? (
                          <span
                            style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}
                            title={`On POOL_FOREIGN_ALLOWLIST — approved, never tracked by the nightly pool-health tracker (span shown for budget context)`}
                          >
                            approved — not tracked
                          </span>
                        ) : f.sustained ? (
                          fp?.trackingIssueUrl ? (
                            <a
                              href={fp.trackingIssueUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: 'var(--admin-amber)',
                                fontWeight: 600,
                                fontSize: 11,
                                textDecoration: 'underline',
                              }}
                              title={`At/over the ${fp?.sustainedMinSpanHours}h threshold — this dialer is listed in the nightly pool-health tracking issue`}
                            >
                              sustained — tracking issue ↗
                            </a>
                          ) : (
                            <span
                              style={{
                                color: 'var(--admin-amber)',
                                fontWeight: 600,
                                fontSize: 11,
                              }}
                              title={`At/over the ${fp?.sustainedMinSpanHours}h threshold — the nightly pool-health tracker opens/updates its tracking issue for this dialer`}
                            >
                              sustained — tracked nightly
                            </span>
                          )
                        ) : (
                          <span
                            style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}
                            title={`Below the ${fp?.sustainedMinSpanHours}h sustained threshold — context only, no tracking issue`}
                          >
                            below threshold
                          </span>
                        )}
                      </td>
                        </tr>
                      )),
                    ];
                  })}
                </tbody>
              </table>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '4px 0 0' }}>
                Per-workspace persistence from the pool-audit ledger (same run/gap semantics as the
                nightly foreign-dialer tracker — a span ≥{' '}
                {fp.sustainedMinSpanHours}h is what opens its tracking
                issue). Rows are grouped by owning project (POOL_FOREIGN_PROJECT_ROOTS prefix
                match; unmatched workspaces stand alone). History shows each workspace's flagged
                passes per ~2h bucket across the window (bar height scales to the row's own
                peak). This is history, not a live scan: a workspace can appear here after it
                stopped dialing.
              </p>
            </>
          )}
          {fp &&
            fp.rows.length === 0 &&
            !fp.detail &&
            (health.foreignDirectClients ?? []).length > 0 && (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '8px 0 0' }}>
                No flagged foreign passes in the last {fp.windowHours}h of
                the ledger — the clients above are new since the last watchdog pass recorded them.
              </p>
            )}
          {fp?.detail && (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '8px 0 0' }}>
              Persistence history unavailable — {fp.detail}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Transport-flip persistence trend — ledger-backed history of which services
 * re-bound and how often. The live banner answers "what is flipping RIGHT
 * NOW" (10-minute hold window); this answers "what has been flipping all
 * month". Only services that actually flipped in the window render; steady
 * days are recorded in the ledger but need no row here.
 */
