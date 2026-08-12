import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminFlags, ADMIN_FLAG_KEYS } from '@/hooks/useAdminFlags';
import { adminApi } from '@/lib/api/admin';
import type { StaleFlagMetrics } from '@/lib/admin-types';
import StaleFlagSummary from './StaleFlagSummary';

/** Minimal shape of the universe-feature-flag rows used for the stale list. */
interface StaleUniverseFlagRow {
  universeId: string;
  featureKey: string;
  metadata: Record<string, unknown> | null;
  universe: { name: string; displayName: string };
}

const isStaleDate = (iso: unknown): iso is string =>
  typeof iso === 'string' && !Number.isNaN(Date.parse(iso)) && Date.parse(iso) <= Date.now();

export const ADMIN_NAV = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/overview', label: 'Overview', icon: '📈', flag: ADMIN_FLAG_KEYS.newDashboard },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/content', label: 'Content', icon: '🎬' },
  { href: '/content-review', label: 'Review Queue', icon: '✅' },
  { href: '/creators', label: 'Creators', icon: '✨' },
  { href: '/agbala', label: 'Agbala', icon: '📖' },
  { href: '/reality', label: 'Reality Shows', icon: '🎭' },
  { href: '/live-events', label: 'Live Events', icon: 'u{1F534}' },
  { href: '/universes', label: 'Universes', icon: '🌍' },
  { href: '/wallets', label: 'Wallets', icon: '👛' },
  { href: '/financial', label: 'Financial', icon: '💰' },
  { href: '/payment-gateways', label: 'Payments', icon: '💳' },
  { href: '/subscriptions', label: 'Subscriptions', icon: '🔄' },
  { href: '/bundle-passes', label: 'Bundle Passes', icon: '🎁' },
  { href: '/engagement', label: 'Engagement', icon: '🔥' },
  { href: '/search', label: 'Search', icon: '🔍' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/announcements', label: 'Announcements', icon: '📢' },
  { href: '/tipping', label: 'Tipping', icon: '💎' },
  { href: '/audit-logs', label: 'Audit Logs', icon: '📋' },
  { href: '/reports', label: 'Reports', icon: '📊' },
  { href: '/feature-flags', label: 'Feature Flags', icon: '🚩' },
  { href: '/feature-flags/global', label: 'Global Flags', icon: '🎛️' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

const styles = {
  root: { backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' } as React.CSSProperties,
  topBar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#140808',
    borderBottom: '1px solid #2A1A1A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 50,
  } as React.CSSProperties,
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: '#E8420A',
    textDecoration: 'none',
  } as React.CSSProperties,
  userBadge: {
    fontSize: 13,
    color: '#9A8A7A',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,
  logoutBtn: {
    background: 'none',
    border: '1px solid #2A1A1A',
    color: '#9A8A7A',
    padding: '6px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
  } as React.CSSProperties,
  layout: { display: 'flex', paddingTop: 64, minHeight: '100vh' } as React.CSSProperties,
  sidebar: {
    width: 260,
    flexShrink: 0,
    backgroundColor: '#140808',
    borderRight: '1px solid #2A1A1A',
    position: 'sticky' as const,
    top: 64,
    height: 'calc(100vh - 64px)',
    overflowY: 'auto' as const,
    padding: '16px 12px',
  } as React.CSSProperties,
  main: { flex: 1, padding: '32px 24px', minWidth: 0 } as React.CSSProperties,
  mobileToggle: {
    position: 'fixed' as const,
    bottom: 20,
    right: 20,
    zIndex: 55,
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
    color: '#fff',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(232,66,10,0.4)',
  } as React.CSSProperties,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isEnabled: isFlagEnabled, flags } = useAdminFlags();
  // Removal candidates: flags whose staleAfter date has passed (same predicate
  // as the Global Flags page). Shared query key => updates live after prune/
  // restore invalidations.
  const staleGlobal = flags
    .filter((f) => isStaleDate(f.staleAfter))
    .map((f) => ({ key: f.key, staleAfter: f.staleAfter as string }));
  const staleCount = staleGlobal.length;

  // Per-universe expiry backlog: same query key as the Feature Flags page, so
  // its prune/invalidation keeps the sidebar badge in sync.
  const { data: universeFlags = [] } = useQuery<StaleUniverseFlagRow[]>({
    queryKey: ['admin', 'feature-flags'],
    queryFn: async () => {
      const res = await adminApi.listFeatureFlags();
      return res.success && Array.isArray(res.data)
        ? (res.data as StaleUniverseFlagRow[])
        : [];
    },
  });
  const staleUniverse = universeFlags
    .filter((f) => isStaleDate(f.metadata?.staleAfter))
    .map((f) => ({
      key: f.featureKey,
      universeId: f.universeId,
      universe: f.universe.displayName || f.universe.name,
      staleAfter: f.metadata?.staleAfter as string,
    }));
  const universeStaleCount = staleUniverse.length;

  // Self-disable events: flag_auto_disabled_total per stale global flag
  // (same query key as the Global Flags page, so the cache is shared and the
  // 30s poll keeps the chip live). The safety only auto-disables flags past
  // their staleAfter, so every hit is already in the stale list above.
  const { data: staleMetrics } = useQuery<StaleFlagMetrics>({
    queryKey: ['admin', 'global-feature-flags', 'stale-metrics'],
    queryFn: async () => {
      const res = await adminApi.listStaleFlagMetrics();
      return res.success && res.data
        ? res.data
        : { available: false, fetchedAt: null, staleRunning: {}, autoDisabled: {} };
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
  const autoDisabledKeys = new Set(
    Object.entries(staleMetrics?.autoDisabled ?? {})
      .filter(([, m]) => m.total > 0)
      .map(([key]) => key)
  );

  // Recent removal activity: universe-feature-flag prunes (and single
  // deletions) write feature_flag.deleted audit entries with
  // targetType=universe_feature_flag. Count those within a rolling 24h window
  // so ops spots removal activity without opening the logs page. limit=1
  // keeps the payload tiny — only `total` is read.
  const PRUNE_ACTIVITY_WINDOW_MS = 24 * 60 * 60 * 1000;
  const { data: recentPrunes = 0 } = useQuery<number>({
    queryKey: ['admin', 'audit-logs', 'universe-prunes'],
    queryFn: async () => {
      const res = await adminApi.getAuditLogs({
        action: 'feature_flag.deleted',
        targetType: 'universe_feature_flag',
        startDate: new Date(Date.now() - PRUNE_ACTIVITY_WINDOW_MS).toISOString(),
        limit: 1,
      });
      return res.success ? (res.data?.total ?? 0) : 0;
    },
    // Fresh even without an explicit invalidation (e.g. the nightly stale-flag
    // sweep pruning universe flags while no page is open).
    refetchInterval: 60_000,
  });

  const badgeFor = (href: string): number => {
    if (href === '/feature-flags/global') return staleCount;
    if (href === '/feature-flags') return universeStaleCount;
    if (href === '/audit-logs') return recentPrunes;
    return 0;
  };
  const badgeTitleFor = (href: string): string =>
    href === '/feature-flags/global'
      ? `${staleCount} stale global flag(s) — click to view removal candidates`
      : href === '/feature-flags'
        ? `${universeStaleCount} stale universe flag(s) — click to view expiry backlog`
        : `${recentPrunes} universe-flag prune(s) in the last 24h — click to view the removal activity`;
  // Removal activity (audit badge) is blue so it's visually separable from
  // the orange stale-removal-candidate badges.
  const badgeColorFor = (href: string): string =>
    href === '/audit-logs' ? '#3B82F6' : '#E8420A';
  const badgeHrefFor = (href: string): string | null =>
    href === '/feature-flags/global'
      ? // #stale is the hash-fragment shortcut: the Global Flags page ALSO
        // auto-scrolls to + highlights the first stale row on arrival.
        '/feature-flags/global?stale=1#stale'
      : href === '/feature-flags'
        ? '/feature-flags?stale=1#stale'
        : href === '/audit-logs'
          ? // Mirrors the ?stale=1 pattern: land pre-filtered to the same
            // 24h removal window the badge counts (feature_flag.deleted).
            '/audit-logs?action=feature_flag.deleted&range=24h'
          : null;

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div style={styles.root}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid #2A1A1A',
              borderTopColor: '#E8420A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div style={styles.root}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <header style={styles.topBar}>
        <a href="/" style={styles.logo}>
          Azeebo+ Admin
        </a>

        <StaleFlagSummary
          staleGlobal={staleGlobal}
          staleUniverse={staleUniverse}
          autoDisabledKeys={autoDisabledKeys}
        />

        <div style={styles.userBadge}>
          <span>{user.email}</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: '#E8420A',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {user.role}
          </span>
          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      {isMobile && (
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.mobileToggle}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
      )}

      <div style={styles.layout}>
        <aside
          aria-label="Admin navigation"
          style={{
            ...styles.sidebar,
            ...(isMobile
              ? {
                  position: 'fixed' as const,
                  top: 64,
                  left: sidebarOpen ? 0 : -280,
                  zIndex: 40,
                  transition: 'left 0.3s ease',
                  width: 280,
                }
              : {}),
          }}
        >
          <nav>
            {ADMIN_NAV.filter((item) => !item.flag || isFlagEnabled(item.flag)).map((item) => {
              const badgeCount = badgeFor(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    marginBottom: 4,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    color: isActive(item.href) ? '#E8420A' : '#9A8A7A',
                    backgroundColor: isActive(item.href) ? 'rgba(232,66,10,0.1)' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  {item.label}
                  {badgeCount > 0 && (
                    <span
                      role="link"
                      tabIndex={0}
                      title={badgeTitleFor(item.href)}
                      aria-label={
                        item.href === '/audit-logs'
                          ? `${badgeCount} removal activit${badgeCount === 1 ? 'y' : 'ies'} in the last 24h — open the removal log`
                          : `${badgeCount} stale flags to review — open the stale-filtered view`
                      }
                      onClick={(e) => {
                        const href = badgeHrefFor(item.href);
                        if (!href) return;
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(href);
                        setSidebarOpen(false);
                      }}
                      onKeyDown={(e) => {
                        const href = badgeHrefFor(item.href);
                        if (!href) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(href);
                          setSidebarOpen(false);
                        }
                      }}
                      style={{
                        marginLeft: 'auto',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: badgeColorFor(item.href),
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {badgeCount}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>
        </aside>

        <main style={styles.main}>{children}</main>
      </div>
    </div>
  );
}
