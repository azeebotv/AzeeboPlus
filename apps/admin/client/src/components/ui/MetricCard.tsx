import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  description?: string;
  loading?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon,
  description,
  loading = false,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 bg-zinc-800 rounded" />
          <div className="w-8 h-8 rounded-lg bg-zinc-800" />
        </div>
        <div className="h-8 w-32 bg-zinc-800 rounded mb-2" />
        <div className="h-3 w-40 bg-zinc-800 rounded" />
      </div>
    );
  }

  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={`p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-all ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300">
            {icon}
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-zinc-100 tracking-tight mb-1">
        {value}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {change !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 font-medium ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {isPositive ? '+' : ''}
            {change.toFixed(1)}%
          </span>
        )}
        <span className="text-zinc-500">{description || changeLabel}</span>
      </div>
    </div>
  );
};
