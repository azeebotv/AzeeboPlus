import { Icon } from '@/components/Icons';
import type {
  OpsServicesSnapshot,
  OpsServiceHealth,
  TransportFlipTrend,
  TransportFlipTrendRow,
} from '@/lib/api/admin';
import { sPlural } from './constants';

export function TransportFlipTrendCard({ trend }: { trend?: TransportFlipTrend | null }) {
  if (!trend) return null;
  // Per-service rollup: rows are (service, day); flip-only services sort by
  // flip volume desc, then name — the noisy re-binder tops the table.
  const flipServices = (() => {
    const byService = new Map<string, TransportFlipTrendRow[]>();
    for (const r of trend.rows) {
      const list = byService.get(r.service) ?? [];
      list.push(r);
      byService.set(r.service, list);
    }
    return [...byService.entries()]
      .filter(([, perDay]) => perDay.some((d) => d.flips > 0))
      .map(([service, perDay]) => {
        perDay.sort((a, b) => b.day.localeCompare(a.day));
        return [service, perDay] as const;
      })
      .sort(
        (a, b) =>
          b[1].reduce((n, r) => n + r.flips, 0) - a[1].reduce((n, r) => n + r.flips, 0) ||
          a[0].localeCompare(b[0])
      );
  })();
  // Quiet window (rows exist, nobody flipped) hides the card entirely: a
  // permanently-empty table is noise, and the banner owns "what changed
  // recently". The card earns its place only when there is something to
  // trend — or when the ledger read itself failed (honest degrade).
  if (flipServices.length === 0 && !trend.detail) return null;
  return (
    <div
      style={{
        background: 'var(--admin-card)',
        border: '1px solid var(--admin-border)',
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
        Transport flip trend
        <span
          style={{ color: 'var(--admin-text-muted)', fontWeight: 400, fontSize: 12, marginLeft: 8 }}
        >
          ledger, last {trend.windowDays}d
        </span>
      </div>
      {trend.detail ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '8px 0 0' }}>
          Flip trend unavailable — {trend.detail}
        </p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
            <thead>
              <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                {['Service', 'Days seen', 'Flips', 'Family flips', 'Last flip'].map((h) => (
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
              {flipServices.map(([service, perDay]) => {
                const totalFlips = perDay.reduce((n, r) => n + r.flips, 0);
                const totalFamily = perDay.reduce((n, r) => n + r.familyFlips, 0);
                const newest = perDay[0];
                return (
                  <tr key={service}>
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{service}</td>
                    <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                      {perDay.length}
                    </td>
                    <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                      {totalFlips}
                    </td>
                    <td
                      style={{
                        padding: '5px 8px 5px 0',
                        fontVariantNumeric: 'tabular-nums',
                        color: totalFamily > 0 ? 'var(--admin-amber)' : 'var(--admin-text-muted)',
                        fontWeight: totalFamily > 0 ? 700 : 400,
                      }}
                    >
                      {totalFamily}
                    </td>
                    <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)' }}>
                      {newest?.lastFlipAt
                        ? `${new Date(newest.lastFlipAt).toLocaleDateString()} ${newest.lastFrom}→${newest.lastTo}`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '4px 0 0' }}>
            Recorded server-side on every probe sweep (one row per service per day, flips merged):{' '}
            {trend.servicesWithFlips} service{sPlural(trend.servicesWithFlips)} flipped at least
            once, {trend.totalFlips} flip{sPlural(trend.totalFlips)} total, {trend.totalFamilyFlips}{' '}
            crossing loopback families. A quiet window hides this card — steady-state sweeps are
            recorded in the ledger either way.
          </p>
          {trend.events.length > 0 && (
            <>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--admin-text-muted)',
                  margin: '12px 0 2px',
                }}
              >
                Recent flip events (every detected transition, newest first)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 4 }}>
                <thead>
                  <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                    {['When', 'Service', 'Transition', 'Family'].map((h) => (
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
                  {trend.events.map((e) => (
                    <tr key={`${e.service}:${e.detectedAt}`}>
                      <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(e.detectedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>
                        {e.service}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {e.from}→{e.to}
                      </td>
                      <td
                        style={{
                          padding: '5px 8px 5px 0',
                          color: e.familyChanged ? 'var(--admin-amber)' : 'var(--admin-text-muted)',
                          fontWeight: e.familyChanged ? 700 : 400,
                        }}
                      >
                        {e.familyChanged ? 'crossed' : 'rebind'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}

/** Per-row transport cell for the fleet table: label + color + tooltip. */
function transportCell(s: {
  status: OpsServiceHealth['status'];
  transport?: OpsServiceHealth['transport'];
  errorDetail?: string;
}): { label: string; color: string; title?: string; weight?: number } {
  if (s.status === 'down')
    return {
      label: 'unreachable',
      color: 'var(--admin-red)',
      title: s.errorDetail ? `last probe failure: ${s.errorDetail}` : 'probe sweep could not reach the service',
    };
  if (s.transport === undefined) return { label: '—', color: 'var(--admin-text-muted)' };
  if (s.transport === 'localhost')
    return {
      label: 'dual-stack',
      color: 'var(--admin-text-muted)',
      title: 'Answered on localhost — the hostname may resolve to either loopback family, so no family is asserted.',
    };
  return {
    label: s.transport === 'ipv6' ? 'IPv6-only' : 'IPv4-only',
    color: 'var(--admin-amber)',
    weight: 600,
    title:
      s.transport === 'ipv6'
        ? 'Answered on [::1] — an IPv6-only listener (IPv4 dials are refused). Healthy; a refused 127.0.0.1 probe is never an outage.'
        : 'Answered on 127.0.0.1 — an IPv4-only listener.',
  };
}

/**
 * Fleet transport table — one row per probed service with the loopback
 * family that answered the latest sweep. Sits beside the flip trend so the
 * CURRENT state is readable without cross-referencing history: a trend row
 * plus this column answers "which family is it on right now?". localhost
 * renders as dual-stack on purpose — hostname probes answer on either
 * family, so calling one out would just re-label the normal case.
 */
export function FleetTransportCard({ snapshot }: { snapshot?: OpsServicesSnapshot | null }) {
  if (!snapshot || snapshot.services.length === 0) return null;
  const healthy = snapshot.services.filter((s) => s.status === 'healthy').length;
  return (
    <div
      data-testid="fleet-transport-card"
      style={{
        border: '1px solid var(--admin-card)',
        borderRadius: 14,
        backgroundColor: 'var(--admin-surface)',
        padding: '16px 18px',
        marginBottom: 28,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name="refresh" size={16} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>Fleet transport</span>
        <span style={{ marginLeft: 'auto', color: 'var(--admin-text-muted)', fontSize: 11 }}>
          {healthy}/{snapshot.services.length} answering · family flips this sweep:{' '}
          {snapshot.transportFlips.length}
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
            {['Service', 'Port', 'Status', 'Transport', 'Latency'].map((h) => (
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
          {snapshot.services.map((s) => {
            const t = transportCell(s);
            const statusColor =
              s.status === 'healthy'
                ? 'var(--admin-emerald)'
                : s.status === 'degraded'
                  ? 'var(--admin-amber)'
                  : 'var(--admin-red)';
            return (
              <tr key={s.name}>
                <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                  {s.port}
                </td>
                <td style={{ padding: '5px 8px 5px 0', color: statusColor }}>{s.status}</td>
                <td
                  style={{
                    padding: '5px 8px 5px 0',
                    color: t.color,
                    fontWeight: t.weight,
                    whiteSpace: 'nowrap',
                  }}
                  title={t.title}
                >
                  {t.label}
                </td>
                <td
                  style={{
                    padding: '5px 8px 5px 0',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  {s.latencyMs} ms
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '4px 0 0' }}>
        Transport is the loopback family that answered the latest probe sweep (dual-stack =
        hostname probe, either family). Family changes land in the banner above and the flip
        trend below; this column is where they landed.
      </p>
    </div>
  );
}
