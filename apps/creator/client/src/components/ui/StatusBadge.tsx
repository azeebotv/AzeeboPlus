import React from 'react';

export type StatusType =
  | 'published'
  | 'completed'
  | 'winner'
  | 'active'
  | 'draft'
  | 'pending'
  | 'scheduled'
  | 'processing'
  | 'uploading'
  | 'under_review'
  | 'upcoming'
  | 'submitted'
  | 'failed'
  | 'rejected'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const normalized = (status || '').toLowerCase().trim();

  const STYLE_MAP: Record<string, { bg: string; fg: string; dot: string }> = {
    published: { bg: 'rgba(13,59,46,0.3)', fg: '#10b981', dot: '#10b981' },
    completed: { bg: 'rgba(13,59,46,0.3)', fg: '#10b981', dot: '#10b981' },
    winner: { bg: 'rgba(234,179,8,0.2)', fg: '#eab308', dot: '#eab308' },
    active: { bg: 'rgba(13,59,46,0.3)', fg: '#10b981', dot: '#10b981' },
    draft: { bg: 'rgba(245,158,11,0.2)', fg: '#f59e0b', dot: '#f59e0b' },
    pending: { bg: 'rgba(245,158,11,0.2)', fg: '#f59e0b', dot: '#f59e0b' },
    under_review: { bg: 'rgba(245,158,11,0.2)', fg: '#f59e0b', dot: '#f59e0b' },
    scheduled: { bg: 'rgba(59,130,246,0.2)', fg: '#3b82f6', dot: '#3b82f6' },
    processing: { bg: 'rgba(59,130,246,0.2)', fg: '#3b82f6', dot: '#3b82f6' },
    uploading: { bg: 'rgba(59,130,246,0.2)', fg: '#3b82f6', dot: '#3b82f6' },
    upcoming: { bg: 'rgba(59,130,246,0.2)', fg: '#3b82f6', dot: '#3b82f6' },
    submitted: { bg: 'rgba(59,130,246,0.2)', fg: '#3b82f6', dot: '#3b82f6' },
    failed: { bg: 'rgba(204,28,28,0.2)', fg: '#ef4444', dot: '#ef4444' },
    rejected: { bg: 'rgba(204,28,28,0.2)', fg: '#ef4444', dot: '#ef4444' },
  };

  const current = STYLE_MAP[normalized] || {
    bg: 'rgba(154,138,122,0.2)',
    fg: 'var(--creator-text-muted, #9a8a7a)',
    dot: 'var(--creator-text-muted, #9a8a7a)',
  };

  const displayLabel = label || normalized.replace(/_/g, ' ');

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: current.bg,
        color: current.fg,
        textTransform: 'capitalize',
        lineHeight: 1,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: current.dot,
        }}
      />
      {displayLabel}
    </span>
  );
};
