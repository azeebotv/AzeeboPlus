import React from 'react';

export type StatusVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'draft'
  | 'published'
  | 'archived'
  | 'approved'
  | 'rejected'
  | 'failed'
  | 'running'
  | 'completed'
  | 'warning'
  | 'info'
  | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  label?: string;
  showDot?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<StatusVariant, { bg: string; text: string; dot: string }> = {
  active: {
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  published: {
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  approved: {
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  completed: {
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  pending: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  running: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400 animate-pulse',
  },
  warning: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  suspended: {
    bg: 'bg-rose-500/10 border-rose-500/20',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
  },
  rejected: {
    bg: 'bg-rose-500/10 border-rose-500/20',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
  },
  failed: {
    bg: 'bg-rose-500/10 border-rose-500/20',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
  },
  inactive: {
    bg: 'bg-zinc-800 border-zinc-700',
    text: 'text-zinc-400',
    dot: 'bg-zinc-500',
  },
  draft: {
    bg: 'bg-zinc-800 border-zinc-700',
    text: 'text-zinc-400',
    dot: 'bg-zinc-500',
  },
  archived: {
    bg: 'bg-zinc-800 border-zinc-700',
    text: 'text-zinc-400',
    dot: 'bg-zinc-500',
  },
  info: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  neutral: {
    bg: 'bg-zinc-800/80 border-zinc-700/80',
    text: 'text-zinc-300',
    dot: 'bg-zinc-400',
  },
};

function resolveVariant(status: string, explicitVariant?: StatusVariant): StatusVariant {
  if (explicitVariant) return explicitVariant;
  const s = status.toLowerCase().trim();
  if (s in VARIANT_STYLES) return s as StatusVariant;
  if (s.includes('active') || s.includes('pub') || s.includes('appr') || s.includes('pass') || s.includes('success')) {
    return 'active';
  }
  if (s.includes('pend') || s.includes('wait') || s.includes('run') || s.includes('prog')) {
    return 'pending';
  }
  if (s.includes('susp') || s.includes('rej') || s.includes('fail') || s.includes('ban') || s.includes('err')) {
    return 'suspended';
  }
  if (s.includes('inact') || s.includes('draft') || s.includes('arch') || s.includes('disab')) {
    return 'inactive';
  }
  return 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  label,
  showDot = true,
  className = '',
}) => {
  const resolved = resolveVariant(status, variant);
  const style = VARIANT_STYLES[resolved] || VARIANT_STYLES.neutral;
  const displayLabel = label || status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${style.bg} ${style.text} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />}
      {displayLabel}
    </span>
  );
};
