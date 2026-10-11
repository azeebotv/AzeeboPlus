import type { ReactNode } from 'react';

interface QueryErrorBannerProps {
  /** Leading bold phrase, e.g. "Partner banks unavailable." */
  title: ReactNode;
  /** Explains what the admin can still do while the read is down. */
  body?: ReactNode;
  /** Server message / status, shown verbatim so support can triage. */
  detail?: string | null;
  onRetry?: () => void;
  /** Disables the retry action while a refetch is already running. */
  retrying?: boolean;
}

/**
 * The admin client's failed-read surface.
 *
 * Pages used to swallow failed reads (`res.success ? … : []`), so a downed
 * service rendered the same "nothing found" state as an genuinely empty one.
 * Queries now throw via `requireData`, and this banner is what distinguishes
 * "unreachable" from "empty".
 */
export default function QueryErrorBanner({
  title,
  body,
  detail,
  onRetry,
  retrying = false,
}: QueryErrorBannerProps) {
  return (
    <div
      role="alert"
      style={{
        padding: 16,
        marginBottom: 24,
        borderRadius: 12,
        border: '1px solid rgba(204,28,28,0.35)',
        background: 'rgba(204,28,28,0.08)',
        color: 'var(--admin-text-muted)',
      }}
    >
      <strong style={{ color: 'var(--admin-red)' }}>{title}</strong>
      {body ? <> {body}</> : null}{' '}
      {onRetry && (
        <button
          type="button"
          onClick={() => onRetry()}
          disabled={retrying}
          style={{
            border: 0,
            background: 'transparent',
            color: 'var(--admin-orange)',
            cursor: retrying ? 'default' : 'pointer',
            fontWeight: 600,
          }}
        >
          {retrying ? 'Retrying…' : 'Retry'}
        </button>
      )}
      {detail && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--admin-text-muted)' }}>{detail}</div>
      )}
    </div>
  );
}
