/** Shared formatting helpers for the creator portal (NGN is the platform currency). */

export function formatNgn(amount: number | null | undefined): string {
  const value = Number(amount ?? 0);
  return `₦${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/** Relative change badge text already carries its sign from the backend. */
export function isPositiveChange(change: string | undefined): boolean {
  return (change ?? '').startsWith('+');
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--creator-border)',
  backgroundColor: 'var(--creator-dark)',
  color: 'var(--creator-text)',
  fontSize: 14,
};

export const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  border: '1px solid var(--creator-border)',
  backgroundColor: 'rgba(26,10,10,0.5)',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: 'var(--creator-text-muted)',
  marginBottom: 6,
};

export const primaryButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 14,
};

export function statusBadgeStyle(status: string): React.CSSProperties {
  const map: Record<string, { bg: string; fg: string }> = {
    published: { bg: 'rgba(13,59,46,0.2)', fg: 'var(--creator-green)' },
    completed: { bg: 'rgba(13,59,46,0.2)', fg: 'var(--creator-green)' },
    winner: { bg: 'rgba(13,59,46,0.2)', fg: 'var(--creator-green)' },
    active: { bg: 'rgba(13,59,46,0.2)', fg: 'var(--creator-green)' },
    draft: { bg: 'rgba(245,158,11,0.2)', fg: 'var(--creator-amber, #f59e0b)' },
    pending: { bg: 'rgba(245,158,11,0.2)', fg: 'var(--creator-amber, #f59e0b)' },
    scheduled: { bg: 'rgba(59,130,246,0.2)', fg: 'var(--creator-blue, #3b82f6)' },
    processing: { bg: 'rgba(59,130,246,0.2)', fg: 'var(--creator-blue, #3b82f6)' },
    uploading: { bg: 'rgba(59,130,246,0.2)', fg: 'var(--creator-blue, #3b82f6)' },
    under_review: { bg: 'rgba(245,158,11,0.2)', fg: 'var(--creator-amber, #f59e0b)' },
    upcoming: { bg: 'rgba(59,130,246,0.2)', fg: 'var(--creator-blue, #3b82f6)' },
    submitted: { bg: 'rgba(59,130,246,0.2)', fg: 'var(--creator-blue, #3b82f6)' },
    failed: { bg: 'rgba(204,28,28,0.2)', fg: 'var(--creator-red)' },
    rejected: { bg: 'rgba(204,28,28,0.2)', fg: 'var(--creator-red)' },
  };
  const s = map[status] ?? { bg: 'rgba(154,138,122,0.2)', fg: 'var(--creator-text-muted)' };
  return {
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: s.bg,
    color: s.fg,
    textTransform: 'capitalize',
    display: 'inline-block',
  };
}

export function errorTextStyle(): React.CSSProperties {
  return { color: 'var(--creator-red)', fontSize: 13, marginTop: 8 };
}

export function successTextStyle(): React.CSSProperties {
  return { color: 'var(--creator-green)', fontSize: 13, marginTop: 8 };
}
