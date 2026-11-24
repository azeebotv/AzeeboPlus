import { Icon } from '@/components/Icons';
import type { OpsTransportFlip } from '@/lib/api/admin';

/**
 * Loud warning when a service's answering transport changed between probe
 * sweeps — a family flip (::1 ↔ 127.0.0.1) usually means someone re-bound
 * the service: config edit, restart with a different bind address, or a
 * second process stealing the port on the other family. Flips hold on the
 * backend for 10 minutes so polling races can't swallow them; this banner
 * renders whatever is still live. `onDismiss` only hides it client-side —
 * the backend hold still expires on its own.
 */
export function TransportMismatchBanner({
  flips,
  onDismiss,
}: {
  flips: OpsTransportFlip[];
  onDismiss: () => void;
}) {
  if (flips.length === 0) return null;
  const familyFlips = flips.filter((f) => f.familyChanged);
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 18px',
        borderRadius: 10,
        border: '1px solid var(--admin-amber)',
        background: 'rgba(245,158,11,0.12)',
        marginBottom: 20,
      }}
    >
      <Icon name="alertTriangle" size={20} color="var(--admin-amber)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--admin-amber)' }}>
          Transport mismatch detected
          {familyFlips.length > 0 &&
            ` — ${familyFlips.length} service${
              familyFlips.length === 1 ? '' : 's'
            } changed loopback family`}
        </div>
        <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
          {flips.map((f) => (
            <div key={`${f.service}:${f.detectedAt}`}>
              <strong style={{ color: 'var(--admin-text)' }}>{f.service}</strong>: {f.from} → {f.to}{' '}
              {f.familyChanged && (
                <span style={{ color: 'var(--admin-amber)', fontWeight: 600 }}>
                  (family change)
                </span>
              )}{' '}
              —{' '}
              <span title={new Date(f.detectedAt).toISOString()}>
                {new Date(f.detectedAt).toLocaleTimeString()}
              </span>
              {
                ' — usually a re-bind: check for a config edit, a duplicate process on the other family, or a port steal.'
              }
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss transport mismatch warning"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--admin-text-muted)',
          cursor: 'pointer',
          padding: 4,
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}
