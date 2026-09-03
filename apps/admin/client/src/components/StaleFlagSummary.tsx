import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** A stale global flag row — deep-links to the Global Flags page. */
export interface StaleGlobalRow {
  key: string;
  staleAfter: string;
}

/** A stale per-universe flag row — deep-links to the Feature Flags page. */
export interface StaleUniverseRow {
  /** The feature key (may repeat across universes). */
  key: string;
  /** Identifies the exact universe flag row on the target page. */
  universeId: string;
  /** Universe display name shown in the row label. */
  universe: string;
  staleAfter: string;
}

interface StaleFlagSummaryProps {
  staleGlobal: StaleGlobalRow[];
  staleUniverse: StaleUniverseRow[];
  /** Keys the self-disable safety has auto-disabled (flag_auto_disabled_total > 0). */
  autoDisabledKeys?: ReadonlySet<string>;
}

const formatExpiry = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

/**
 * Top-bar stale summary: a chip with the combined global + universe stale
 * count (plus an auto-off pill) that opens a full removal-candidate list.
 * Each row deep-links to its flag on the destination page, auto-scrolled and
 * highlighted there. Self-contained open/close: chip toggle, outside click
 * and Escape all close the menu.
 */
export default function StaleFlagSummary({
  staleGlobal,
  staleUniverse,
  autoDisabledKeys = new Set<string>(),
}: StaleFlagSummaryProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const staleTotal = staleGlobal.length + staleUniverse.length;
  const autoDisabledCount = staleGlobal.filter((f) => autoDisabledKeys.has(f.key)).length;

  // Close on outside click / Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (staleTotal === 0) return null;

  const go = (to: string) => {
    navigate(to);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={
          `Stale flags across global + universe scopes — click for the full list` +
          (autoDisabledCount > 0
            ? ` · ${autoDisabledCount} auto-disabled by the self-disable safety`
            : '')
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 999,
          border: '1px solid #7A2A0A',
          background: 'rgba(122,42,10,0.25)',
          color: 'var(--admin-text)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <span>⚠</span>
        <span>
          {staleTotal} stale flag{staleTotal === 1 ? '' : 's'}
        </span>
        {autoDisabledCount > 0 && (
          <span
            style={{
              color: 'var(--admin-orange)',
              background: 'rgba(232,66,10,0.25)',
              borderRadius: 999,
              padding: '1px 7px',
              fontSize: 11,
            }}
            title={`${autoDisabledCount} auto-disabled by the self-disable safety (flag_auto_disabled_total)`}
          >
            {autoDisabledCount} auto-off
          </span>
        )}
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            maxHeight: '70vh',
            overflowY: 'auto',
            borderRadius: 12,
            border: '1px solid var(--admin-surface)',
            background: 'var(--admin-bg)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            zIndex: 60,
            padding: '8px 0',
            fontSize: 13,
          }}
        >
          <div style={{ padding: '8px 16px 6px', fontWeight: 700, color: 'var(--admin-orange)' }}>
            Stale flags — removal candidates
          </div>

          {staleGlobal.length > 0 && (
            <div
              style={{
                padding: '6px 16px 2px',
                color: 'var(--admin-text-muted)',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Global ({staleGlobal.length})
            </div>
          )}
          {staleGlobal.map((f) => {
            const autoOff = autoDisabledKeys.has(f.key);
            return (
              <button
                key={`global:${f.key}`}
                role="menuitem"
                onClick={() => {
                  // Deep-link: land on THIS flag (auto-scroll + highlight).
                  go(`/feature-flags/global?stale=1&flag=${encodeURIComponent(f.key)}`);
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  width: '100%',
                  padding: '7px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--admin-text)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {f.key}
                </span>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                >
                  {autoOff && (
                    <span
                      style={{
                        color: 'var(--admin-orange)',
                        fontSize: 10,
                        fontWeight: 600,
                        border: '1px solid rgba(232,66,10,0.5)',
                        borderRadius: 999,
                        padding: '0 6px',
                      }}
                      title="Auto-disabled by the self-disable safety — renew the expiry to re-enable"
                    >
                      auto-off
                    </span>
                  )}
                  <span style={{ color: 'var(--admin-orange)' }}>{formatExpiry(f.staleAfter)}</span>
                </span>
              </button>
            );
          })}

          {staleUniverse.length > 0 && (
            <div
              style={{
                padding: '8px 16px 2px',
                color: 'var(--admin-text-muted)',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Universe ({staleUniverse.length})
            </div>
          )}
          {staleUniverse.map((f) => (
            <button
              key={`universe:${f.universe}:${f.key}`}
              role="menuitem"
              onClick={() => {
                // Deep-link: land on THIS flag (auto-scroll + highlight).
                go(
                  `/feature-flags?stale=1&flag=${encodeURIComponent(f.key)}&universe=${encodeURIComponent(f.universeId)}`
                );
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                width: '100%',
                padding: '7px 16px',
                border: 'none',
                background: 'transparent',
                color: 'var(--admin-text)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.universe}.{f.key}
              </span>
              <span style={{ color: 'var(--admin-orange)', whiteSpace: 'nowrap' }}>
                {formatExpiry(f.staleAfter)}
              </span>
            </button>
          ))}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              padding: '10px 16px 4px',
              borderTop: '1px solid var(--admin-surface)',
              marginTop: 8,
            }}
          >
            <button
              onClick={() => go('/feature-flags/global?stale=1#stale')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--admin-orange)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                padding: 0,
              }}
            >
              Global candidates →
            </button>
            <button
              onClick={() => go('/feature-flags?stale=1#stale')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--admin-orange)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                padding: 0,
              }}
            >
              Universe backlog →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
