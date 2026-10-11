import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { asRecord, isRecord, num, requireData } from '@/lib/payload';
import { Icon } from '@/components/Icons';

/** Zero-safe governance counters: a partial payload renders zeros, never throws. */
interface GovernanceSummary {
  pendingDualControl: number;
  approvedNotExecuted: number;
  expiringClearances: number;
  expiredClearances: number;
}

function toGovernanceSummary(data: unknown): GovernanceSummary {
  const d: Record<string, unknown> = isRecord(data) ? data : {};
  return {
    pendingDualControl: num(d.pendingDualControl),
    approvedNotExecuted: num(d.approvedNotExecuted),
    expiringClearances: num(d.expiringClearances),
    expiredClearances: num(d.expiredClearances),
  };
}

/**
 * Governance counters render 'Unavailable' when the read failed. A flat 0 here
 * is the most damaging kind of wrong: an admin reads "nothing awaiting
 * approval" while the governance service is down.
 */
function govCount(failed: boolean, value: number | undefined): string {
  if (failed) return 'Unavailable';
  return (value ?? 0).toLocaleString();
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const res = await adminApi.getDashboard();
      // requireData first: the field guards below are for PARTIAL payloads, and
      // without them an outage coerced to zeros and this page's own error branch
      // was unreachable — 0 users looked identical to a real 0.
      const d = asRecord(requireData(res, null));
      return {
        totalUsers: num(d.totalUsers),
        totalContent: num(d.totalContent),
        totalViews: num(d.totalViews),
        totalRevenue: num(d.totalRevenue),
        newUsers: num(d.newUsers),
      };
    },
  });

  // Real wallet aggregate — replaces a fabricated activity number.
  const { data: walletStats, isError: walletStatsFailed } = useQuery({
    queryKey: ['admin', 'wallet-stats'],
    queryFn: async () => {
      const res = await adminApi.getWalletStats();
      const d = asRecord(requireData(res, null));
      return { totalWallets: num(d.totalWallets) };
    },
  });

  // Governance card — dual-control approvals + rights-clearance health (TAA §55).
  const { data: governance, isError: governanceFailed } = useQuery({
    queryKey: ['admin', 'governance-summary'],
    queryFn: async () => {
      const res = await adminApi.getGovernanceSummary();
      return toGovernanceSummary(requireData(res, null));
    },
    // A governance-count outage must not blank the whole dashboard.
    retry: 1,
  });

  const statCards = stats
    ? [
        {
          label: 'Total Users',
          value: stats.totalUsers?.toLocaleString() || '0',
          icon: 'users',
          color: 'var(--admin-orange)',
          bgGlow: 'rgba(232,66,10,0.1)',
        },
        {
          // Honest metric: same-day signups. There is no session/DAU event
          // source, so no "Daily Active" number is claimed.
          label: 'New Users Today',
          value: stats.newUsers.toLocaleString(),
          icon: 'trending',
          color: 'var(--admin-emerald)',
          bgGlow: 'rgba(16,185,129,0.1)',
        },
        {
          label: 'Content Titles',
          value: stats.totalContent?.toLocaleString() || '0',
          icon: 'film',
          color: 'var(--admin-purple)',
          bgGlow: 'rgba(139,92,246,0.1)',
        },
        {
          label: 'Total Views',
          value: stats.totalViews?.toLocaleString() || '0',
          icon: 'eye',
          color: 'var(--admin-amber)',
          bgGlow: 'rgba(245,158,11,0.1)',
        },
        {
          label: 'Total Revenue',
          value: `₦${stats.totalRevenue?.toLocaleString() || '0'}`,
          icon: 'dollarSign',
          color: 'var(--admin-emerald)',
          bgGlow: 'rgba(16,185,129,0.1)',
        },
        {
          label: 'Wallets',
          // '—' rather than 0: an unreachable wallet service is not an empty one.
          value: walletStatsFailed ? '—' : (walletStats?.totalWallets ?? 0).toLocaleString(),
          icon: 'sparkles',
          color: 'var(--admin-orange)',
          bgGlow: 'rgba(232,66,10,0.1)',
        },
      ]
    : [];

  const quickLinks = [
    { href: '/users', label: 'Manage Users', icon: 'users', desc: 'Accounts, permissions & roles' },
    { href: '/content-review', label: 'Review Queue', icon: 'checkCircle', desc: 'Approve pending submissions' },
    { href: '/creators', label: 'Creator Channels', icon: 'sparkles', desc: 'Monetization & applications' },
    { href: '/financial', label: 'Financial Overview', icon: 'dollarSign', desc: 'Revenue, payouts & ledgers' },
    { href: '/reports', label: 'Reports & Exports', icon: 'barChart', desc: 'Operational data dumps' },
    { href: '/settings', label: 'Platform Settings', icon: 'settings', desc: 'System configuration & keys' },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Dashboard Page Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Executive Dashboard</h1>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 6,
              backgroundColor: 'rgba(232,66,10,0.12)',
              border: '1px solid rgba(232,66,10,0.25)',
              color: 'var(--admin-orange)',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Live Feed
          </span>
        </div>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
          Comprehensive real-time telemetry, platform metrics, and administrative shortcuts.
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div
            style={{
              width: 44,
              height: 44,
              border: '3px solid var(--admin-surface)',
              borderTopColor: 'var(--admin-orange)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
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
            gap: 14,
          }}
        >
          <Icon name="alertTriangle" size={24} color="var(--admin-red)" />
          <div>
            <p style={{ color: 'var(--admin-red)', fontWeight: 600, fontSize: 15 }}>
              Failed to load dashboard metrics
            </p>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginTop: 4 }}>
              Unable to reach the platform metrics API. Please verify administrative service connectivity.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metric Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 36,
            }}
          >
            {statCards.map((stat, i) => (
              <div
                key={i}
                style={{
                  padding: 22,
                  borderRadius: 16,
                  border: '1px solid var(--admin-border)',
                  backgroundColor: 'var(--admin-surface)',
                  position: 'relative',
                  overflow: 'hidden',
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-muted)' }}>{stat.label}</span>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: stat.bgGlow,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color,
                    }}
                  >
                    <Icon name={stat.icon} size={18} color={stat.color} />
                  </div>
                </div>
                <p style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: '#ffffff', margin: 0 }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Governance Panel (TAA §55) — dual-control approvals + clearance health */}
          <div
            style={{
              padding: 26,
              borderRadius: 20,
              border: '1px solid var(--admin-border)',
              backgroundColor: 'var(--admin-surface)',
              marginBottom: 36,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="shield" size={18} color="var(--admin-amber)" />
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Governance</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dual-control')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--admin-orange)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Dual-Control Queue <Icon name="arrowRight" size={14} color="var(--admin-orange)" />
              </button>
            </div>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 18 }}>
              High-risk operations awaiting two-person approval, and rights clearances nearing expiry.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 14,
              }}
            >
              {[
                {
                  label: 'Awaiting Approval',
                  value: govCount(governanceFailed, governance?.pendingDualControl),
                  color: 'var(--admin-amber)',
                  icon: 'clock',
                  href: '/dual-control?status=awaiting',
                },
                {
                  label: 'Approved, Not Executed',
                  value: govCount(governanceFailed, governance?.approvedNotExecuted),
                  color: 'var(--admin-orange)',
                  icon: 'checkCircle',
                  href: '/dual-control?status=approved',
                },
                {
                  label: 'Expiring ≤ 30 Days',
                  value: govCount(governanceFailed, governance?.expiringClearances),
                  color: 'var(--admin-amber)',
                  icon: 'book',
                  href: '/talent-clearance?expiry=expiring',
                },
                {
                  label: 'Expired Unresolved',
                  value: govCount(governanceFailed, governance?.expiredClearances),
                  color: governance?.expiredClearances ? 'var(--admin-red)' : 'var(--admin-emerald)',
                  icon: 'alertTriangle',
                  href: '/talent-clearance?expiry=expired',
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.href)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 14,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--admin-text-muted)' }}>{item.label}</span>
                    <Icon name={item.icon} size={16} color={item.color} />
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: item.color, margin: 0 }}>
                    {item.value}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div
            style={{
              padding: 26,
              borderRadius: 20,
              border: '1px solid var(--admin-border)',
              backgroundColor: 'var(--admin-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Quick Operations</h2>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginTop: 4 }}>
                  Frequently used administrative controls and workflows
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 14,
              }}
            >
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.href);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 18px',
                    borderRadius: 14,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    textDecoration: 'none',
                    color: 'var(--admin-text)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--admin-surface-hover)';
                    e.currentTarget.style.borderColor = 'rgba(232,66,10,0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'var(--admin-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: 'rgba(232,66,10,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--admin-orange)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={link.icon} size={20} color="var(--admin-orange)" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{link.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{link.desc}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
