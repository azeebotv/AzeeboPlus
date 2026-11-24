import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { EngagementMetrics, EngagementTrend } from '@/lib/admin-types';
import { asArray, asRecord, num, requireData } from '@/lib/payload';
import { Icon } from '@/components/Icons';

/**
 * Renders exactly the metrics the engagement-admin backend computes — real
 * DB aggregates over the federated tables. Earlier versions rendered
 * invented vendor-style fields (dailyActiveUsers, retentionRate, bounceRate)
 * the backend never returned, so every card silently showed a fake 0.
 */
export default function EngagementPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin', 'engagement'],
    queryFn: async () => {
      const res = await adminApi.getEngagementMetrics();
      // requireData guards against the outage, asRecord against a partial
      // payload — only the second one deserves a zero.
      const d = asRecord(requireData(res, null));
      const m: EngagementMetrics = {
        totalViews: num(d.totalViews),
        totalContent: num(d.totalContent),
        activeUsers: num(d.activeUsers),
        newUsersThisWeek: num(d.newUsersThisWeek),
        dailyTransactions: num(d.dailyTransactions),
      };
      return m;
    },
  });

  const { data: trends } = useQuery({
    queryKey: ['admin', 'engagement-trends', '30d'],
    queryFn: async () => {
      const res = await adminApi.getEngagementTrends('30d');
      return asArray<EngagementTrend>(requireData(res, null)).map((t) => ({
        date: String(t?.date ?? ''),
        newUsers: num(t?.newUsers),
        publishedContent: num(t?.publishedContent),
        draftContent: num(t?.draftContent),
      }));
    },
  });

  const cards = metrics
    ? [
        {
          label: 'Content Views (all time)',
          value: metrics.totalViews.toLocaleString(),
          color: 'var(--admin-orange)',
        },
        {
          label: 'Active Wallets (7d, by transaction)',
          value: metrics.activeUsers.toLocaleString(),
          color: 'var(--admin-emerald)',
        },
        {
          label: 'New Users (7d)',
          value: metrics.newUsersThisWeek.toLocaleString(),
          color: 'var(--admin-amber)',
        },
        {
          label: 'Transactions Today',
          value: metrics.dailyTransactions.toLocaleString(),
          color: 'var(--admin-red)',
        },
        {
          label: 'Published Titles',
          value: metrics.totalContent.toLocaleString(),
          color: '#8b5cf6',
        },
      ]
    : [];

  // Simple inline bar chart of daily new-user signups (real trend data).
  const trendRows = trends ?? [];
  const maxNewUsers = Math.max(1, ...trendRows.map((t) => t.newUsers));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="trendingUp" size={28} color="var(--admin-orange)" />
          <span>Engagement</span>
        </h1>
        <p style={{ color: 'var(--admin-text-muted)' }}>
          Real activity from the platform databases. Session-level analytics
          (DAU, retention, bounce) are not collected yet, so no such numbers
          are shown.
        </p>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {cards.map((c, i) => (
              <div
                key={i}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>{c.label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          {trendRows.length > 0 && (
            <div
              style={{
                marginTop: 32,
                padding: 24,
                borderRadius: 20,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>New Users — last 30 days</h2>
              <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
                Daily signups from the users table
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
                {trendRows.map((t) => (
                  <div
                    key={t.date}
                    title={`${t.date}: ${t.newUsers} new users`}
                    style={{
                      flex: 1,
                      minWidth: 4,
                      height: `${Math.max(2, (t.newUsers / maxNewUsers) * 100)}%`,
                      backgroundColor: 'var(--admin-orange)',
                      opacity: 0.85,
                      borderRadius: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
