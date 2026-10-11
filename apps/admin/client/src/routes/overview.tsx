import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin';
import { requireData } from '@/lib/payload';
import { Icon } from '@/components/Icons';

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
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginBottom: 8 }}>
          Platform Overview
        </h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
          Comprehensive cross-service operational metrics and telemetry.
        </p>
      </div>

      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: 22,
                borderRadius: 16,
                border: '1px solid var(--admin-border)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <div
                style={{
                  width: '60%',
                  height: 14,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  width: '40%',
                  height: 26,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 6,
                }}
              />
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid rgba(204,28,28,0.4)',
            backgroundColor: 'rgba(204,28,28,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="alertTriangle" size={22} color="var(--admin-red)" />
            <div>
              <p style={{ color: '#ff6b6b', fontWeight: 600 }}>Failed to load platform overview</p>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginTop: 2 }}>
                Network or permission error loading telemetry stats.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(0)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--admin-border)',
              backgroundColor: 'var(--admin-surface)',
              color: 'var(--admin-orange)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {Object.entries(stats).map(([key, value]) => {
            const entries =
              value && typeof value === 'object' && !Array.isArray(value)
                ? Object.entries(value as Record<string, number | string>)
                : [[key, value] as [string, number | string]];
            return entries.map(([subKey, subValue]) => (
              <div
                key={`${key}-${subKey}`}
                style={{
                  padding: 22,
                  borderRadius: 16,
                  border: '1px solid var(--admin-border)',
                  backgroundColor: 'var(--admin-surface)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--admin-border-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--admin-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}
                >
                  {`${key} · ${subKey}`
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/\s+/g, ' ')
                    .trim()}
                </p>
                <p
                  style={{ fontSize: 26, fontWeight: 700, color: 'var(--admin-orange)', margin: 0 }}
                >
                  {typeof subValue === 'number'
                    ? subValue.toLocaleString()
                    : String(subValue ?? '—')}
                </p>
              </div>
            ));
          })}
        </div>
      )}
    </div>
  );
}
