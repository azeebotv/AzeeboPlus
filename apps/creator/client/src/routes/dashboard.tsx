import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { creatorApi } from '@/lib/api/creator';
import { useCreatorFlags, CREATOR_FLAG_KEYS } from '@/hooks/useCreatorFlags';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { formatNgn, isPositiveChange, statusBadgeStyle, cardStyle } from '@/lib/ui';

const statCard = (label: string, value: string | number, change: string, icon: string) => (
  <div key={label} style={{ ...cardStyle, flex: 1, minWidth: 200 }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--creator-text-muted)' }}>{label}</span>
      <span style={{ fontSize: 20 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
    <span
      style={{
        fontSize: 12,
        color: isPositiveChange(change) ? 'var(--creator-green)' : 'var(--creator-red)',
      }}
    >
      {change}
    </span>
  </div>
);

const quickActions = [
  { to: '/upload', label: '⬆️ Upload Content' },
  { to: '/content', label: '🎬 Manage Content' },
  { to: '/earnings', label: '💰 View Earnings' },
  { to: '/analytics', label: '📈 Analytics' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { isEnabled: isFlagEnabled } = useCreatorFlags();
  const { data, isLoading, error } = useQuery({
    queryKey: ['creator', 'dashboard'],
    queryFn: async () => creatorApi.assertSuccess(await creatorApi.getDashboard()),
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Welcome back{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24 }}>
        Here's your creator dashboard
      </p>

      {isFlagEnabled(CREATOR_FLAG_KEYS.onboardingWizard) && data && (
        <OnboardingWizard contentCount={data.contentCount} />
      )}

      {isLoading ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--creator-red)', marginBottom: 12 }}>
            {creatorApi.errorMessage(error)}
          </p>
        </div>
      ) : data ? (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            {statCard('Total Views (30d)', data.totalViews, data.viewsChange, '👁️')}
            {statCard('Subscribers', data.subscribers, data.subscribersChange, '👥')}
            {statCard('Earnings', formatNgn(data.totalEarnings), data.earningsChange, '💰')}
            {statCard('Content', data.contentCount, data.contentChange, '🎬')}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            {quickActions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--creator-border)',
                  color: 'var(--creator-text)',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor: 'rgba(26,10,10,0.5)',
                }}
              >
                {a.label}
              </Link>
            ))}
          </div>

          {/* Recent content */}
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent Content</h3>
              <Link to="/content" style={{ color: 'var(--creator-orange)', fontSize: 13 }}>
                View all →
              </Link>
            </div>
            {data.recentContent && data.recentContent.length > 0 ? (
              data.recentContent.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--creator-border-light)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{item.type}</span>
                    <span>{item.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--creator-text-muted)' }}>
                      {item.viewCount.toLocaleString()} views
                    </span>
                    <span style={statusBadgeStyle(item.status)}>{item.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--creator-text-muted)', fontSize: 13 }}>
                No content yet — upload your first piece to get started.
              </p>
            )}
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          No data available
        </p>
      )}
    </div>
  );
}
