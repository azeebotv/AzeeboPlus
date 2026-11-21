import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  icon,
  subtitle,
}) => {
  const isPositive = change?.startsWith('+');
  const isNegative = change?.startsWith('-');

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        border: '1px solid var(--creator-border, rgba(255,255,255,0.08))',
        backgroundColor: 'var(--creator-surface, #18151e)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        minWidth: 200,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--creator-text-muted, #9a8a7a)' }}>
          {label}
        </span>
        {icon && (
          <div
            style={{
              padding: 6,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: 'var(--creator-orange, #e8420a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--creator-text, #f5f0eb)' }}>
          {value}
        </span>
        {change && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontSize: 12,
              fontWeight: 600,
              color: isPositive ? '#10b981' : isNegative ? '#ef4444' : 'var(--creator-text-muted, #9a8a7a)',
            }}
          >
            {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : null}
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <span style={{ fontSize: 12, color: 'var(--creator-text-muted, #9a8a7a)', marginTop: 8 }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};
