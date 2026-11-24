import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin';
import { requireData } from '@/lib/payload';
import { Icon } from '@/components/Icons';
import { MetricCard } from '@/components/ui';

export default function OverviewPage() {
  const navigate = useNavigate();
  const {
    data: stats = {},
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'platform-overview'],
    queryFn: async () => {
      const data = requireData(await adminApi.getPlatformOverview(), {});
      return data as unknown as Record<string, number | string>;
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Platform Overview
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Comprehensive platform operational health, activity, and key performance indicators.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MetricCard key={i} title="Loading..." value="" loading={true} />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="alertTriangle" size={24} color="#f43f5e" />
            <div>
              <p className="font-semibold text-rose-300">Failed to load platform overview</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Network or permission error loading platform overview data.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(0)}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats).map(([key, value]) => {
            const entries =
              value && typeof value === 'object' && !Array.isArray(value)
                ? Object.entries(value as Record<string, number | string>)
                : [[key, value] as [string, number | string]];
            return entries.map(([subKey, subValue]) => {
              const formattedTitle = `${key} · ${subKey}`
                .replace(/([A-Z])/g, ' $1')
                .replace(/\s+/g, ' ')
                .trim();
              const formattedValue =
                typeof subValue === 'number'
                  ? subValue.toLocaleString()
                  : String(subValue ?? '—');

              return (
                <MetricCard
                  key={`${key}-${subKey}`}
                  title={formattedTitle}
                  value={formattedValue}
                  description="Platform metric"
                />
              );
            });
          })}
        </div>
      )}
    </div>
  );
}
