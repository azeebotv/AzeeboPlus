import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminFlags, ADMIN_FLAG_KEYS } from '@/hooks/useAdminFlags';
import { adminApi } from '@/lib/api/admin';
import type { StaleFlagMetrics } from '@/lib/admin-types';
import StaleFlagSummary from './StaleFlagSummary';
import QueryErrorToasts from './QueryErrorToasts';
import { Icon } from './Icons';
import { pollingIntervals } from '@azeebo/design-tokens';

/** Minimal shape of the universe-feature-flag rows used for the stale list. */
interface StaleUniverseFlagRow {
  universeId: string;
  featureKey: string;
  metadata: Record<string, unknown> | null;
  universe: { name: string; displayName: string };
}

const isStaleDate = (iso: unknown): iso is string =>
  typeof iso === 'string' && !Number.isNaN(Date.parse(iso)) && Date.parse(iso) <= Date.now();

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  flag?: string;
  description?: string;
}

export interface NavSection {
  id: string;
  title: string;
  icon: string;
  flag?: string;
  items: NavItem[];
}

// Module-local (NOT exported): this file must export only the layout
// component or vite Fast-Refresh bails out — which strands stale modules in
// open tabs and produces ghost crashes from previous code generations.
// No file imports ADMIN_NAV_SECTIONS/ADMIN_NAV (verified), so dropping the
// export keywords costs nothing.
const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview & Analytics',
    icon: 'dashboard',
    items: [
      { href: '/', label: 'Dashboard', icon: 'dashboard', description: 'Platform KPI overview' },
      {
        href: '/overview',
        label: 'Overview',
        icon: 'trending',
        flag: ADMIN_FLAG_KEYS.newDashboard,
        description: 'Cross-service metrics telemetry',
      },
      {
        href: '/reports',
        label: 'Reports',
        icon: 'barChart',
        description: 'Platform operational reports',
      },
      {
        href: '/performance',
        label: 'Performance',
        icon: 'activity',
        description: 'System performance monitor',
      },
      {
        href: '/search',
        label: 'Search Analytics',
        icon: 'search',
        description: 'User search patterns & discovery',
      },
    ],
  },
  {
    id: 'content',
    title: 'Content & Universes',
    icon: 'film',
    items: [
      {
        href: '/content',
        label: 'Content Library',
        icon: 'film',
        description: 'Videos, series, and catalog management',
      },
      {
        href: '/movies',
        label: 'Movies',
        icon: 'film',
        description: 'Feature films, cinema passes & premiere windows (Admin Only)',
      },
      {
        href: '/content-review',
        label: 'Review Queue',
        icon: 'checkCircle',
        description: 'Moderation and compliance approval',
      },
      {
        href: '/acdp-validation',
        label: 'ACDP Validation',
        icon: 'checkCircle',
        description: 'Azeebo+ Content Delivery Package inspection & clearance',
      },
      {
        href: '/challenge-entries',
        label: 'Challenge Entries',
        icon: 'checkCircle',
        description: 'Challenge entry review — winner / rejected',
      },
      {
        href: '/moderation',
        label: 'Moderation',
        icon: 'shield',
        description: 'User reports queue — resolve & dismiss',
      },
      {
        href: '/universes',
        label: 'Universes',
        icon: 'globe',
        description: 'Narrative universes & storytelling hubs',
      },
      {
        href: '/creators',
        label: 'Creators',
        icon: 'sparkles',
        description: 'Creator accounts & channel status',
      },
      {
        href: '/reality',
        label: 'Reality Shows',
        icon: 'theater',
        description: 'Interactive reality voting & games',
      },
      {
        href: '/vertical-series',
        label: 'Vertical Series',
        icon: 'film',
        description: '9:16 vertical series, episodes & coin costs (Admin Managed)',
      },
      {
        href: '/sports',
        label: 'Sports Hub',
        icon: 'activity',
        description: 'Sports events, matches, teams & prediction markets',
      },
      {
        href: '/comedy',
        label: 'Comedy Hub',
        icon: 'star',
        description: 'Stand-up specials, sketches & roast challenges',
      },
      {
        href: '/games',
        label: 'Games & Esports',
        icon: 'gem',
        description: 'Games catalog, esports tournaments & trivia',
      },
      {
        href: '/lifestyle-guides',
        label: 'Lifestyle Guides',
        icon: 'sprout',
        description: '9TLIFE itineraries, neighborhoods, partners & offers',
      },
      {
        href: '/live-events',
        label: 'Live Events',
        icon: 'alertTriangle',
        description: 'Live broadcasts and ticketing',
      },
      {
        href: '/agbala',
        label: 'Agbala',
        icon: 'book',
        description: 'African mythology & lore database',
      },
    ],
  },
  {
    id: 'monetization',
    title: 'Finance & Monetization',
    icon: 'dollarSign',
    items: [
      {
        href: '/financial',
        label: 'Financial Overview',
        icon: 'dollarSign',
        description: 'Revenue metrics & platform payout totals',
      },
      {
        href: '/wallets',
        label: 'Wallets',
        icon: 'wallet',
        description: 'User & creator balance ledgers',
      },
      {
        href: '/payment-gateways',
        label: 'Payment Gateways',
        icon: 'creditCard',
        description: 'Processor configurations & transactions',
      },
      {
        href: '/subscriptions',
        label: 'Subscriptions',
        icon: 'refresh',
        description: 'Recurring tiers & memberships',
      },
      {
        href: '/bundle-passes',
        label: 'Bundle Passes',
        icon: 'gift',
        description: 'Special bundle access tickets',
      },
      {
        href: '/tipping',
        label: 'Tipping',
        icon: 'gem',
        description: 'Creator tipping & direct gifts',
      },
      {
        href: '/partner-banks',
        label: 'Borrow Partners',
        icon: 'shield',
        description: 'Banks approved to lend on the Borrow page',
      },
    ],
  },
  {
    id: 'community',
    title: 'Community & Engagement',
    icon: 'users',
    items: [
      {
        href: '/users',
        label: 'Users Directory',
        icon: 'users',
        description: 'User directory, roles & bans',
      },
      {
        href: '/engagement',
        label: 'Engagement',
        icon: 'flame',
        description: 'Audience activity & interaction rates',
      },
      {
        href: '/notifications',
        label: 'Notifications',
        icon: 'bell',
        description: 'Global and user push messages',
      },
      {
        href: '/announcements',
        label: 'Announcements',
        icon: 'megaphone',
        description: 'Platform broadcast banners',
      },
      {
        href: '/support',
        label: 'Support Tickets',
        icon: 'messageSquare',
        description: 'Appeals, disputes & helpdesk tickets',
      },
    ],
  },
  {
    id: 'governance',
    title: 'Governance & AI Ops',
    icon: 'bot',
    flag: ADMIN_FLAG_KEYS.governanceDashboard,
    items: [
      {
        href: '/agents',
        label: 'Agent Registry',
        icon: 'bot',
        flag: ADMIN_FLAG_KEYS.governanceDashboard,
        description: 'AI agent runtime status & capabilities',
      },
      {
        href: '/cost-dashboard',
        label: 'Cost Dashboard',
        icon: 'dollarSign',
        flag: ADMIN_FLAG_KEYS.governanceDashboard,
        description: 'AI inference expenses & API spend',
      },
      {
        href: '/task-router',
        label: 'Task Router',
        icon: 'clipboardList',
        flag: ADMIN_FLAG_KEYS.governanceDashboard,
        description: 'Queue dispatch & agent allocation',
      },
      {
        href: '/risk-engine',
        label: 'Risk Engine',
        icon: 'shield',
        flag: ADMIN_FLAG_KEYS.governanceDashboard,
        description: 'Safety policies & anomaly detection',
      },
      {
        href: '/capacity-ledger',
        label: 'Capacity Ledger',
        icon: 'clock',
        flag: ADMIN_FLAG_KEYS.governanceDashboard,
        description: 'Throughput allocations & rate limits',
      },
    ],
  },
  {
    id: 'platform',
    title: 'Platform & Operations',
    icon: 'settings',
    items: [
      {
        href: '/system-health',
        label: 'System Health',
        icon: 'activity',
        flag: ADMIN_FLAG_KEYS.governanceDashboard,
        description: 'Cluster nodes and container health',
      },
      {
        href: '/service-health',
        label: 'Service Health',
        icon: 'activity',
        description: 'Microservices availability status',
      },
      {
        href: '/ops',
        label: 'Ops Health',
        icon: 'activity',
        description: 'Operational diagnostics & alerts',
      },
      {
        href: '/rate-limits',
        label: 'Rate Limits',
        icon: 'shield',
        description: 'API throttling & DDoS policies',
      },
      {
        href: '/automations',
        label: 'Automations',
        icon: 'clock',
        description: 'Scheduled tasks & system workers',
      },
      {
        href: '/audit-logs',
        label: 'Audit Logs',
        icon: 'clipboardList',
        description: 'Security audit trail & events',
      },
      {
        href: '/feature-flags',
        label: 'Feature Flags',
        icon: 'flag',
        description: 'Universe-level flag overrides',
      },
      {
        href: '/feature-flags/global',
        label: 'Global Flags',
        icon: 'sliders',
        description: 'Platform-wide runtime feature switches',
      },
      {
        href: '/settings',
        label: 'Settings',
        icon: 'settings',
        description: 'Global administrative configuration',
      },
      {
        href: '/menus',
        label: 'Navigation Menus',
        icon: 'menu',
        description: 'Menu creation & visibility controls (Super Admin)',
      },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
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
      return res.success && Array.isArray(res.data) ? (res.data as StaleUniverseFlagRow[]) : [];
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
  const { data: staleMetrics } = useQuery<StaleFlagMetrics>({
    queryKey: ['admin', 'global-feature-flags', 'stale-metrics'],
    queryFn: async () => {
      const res = await adminApi.listStaleFlagMetrics();
      return res.success && res.data
        ? res.data
        : { available: false, fetchedAt: null, staleRunning: {}, autoDisabled: {} };
    },
    staleTime: 30_000,
    refetchInterval: pollingIntervals.dashboard,
  });
  const autoDisabledKeys = new Set(
    Object.entries(staleMetrics?.autoDisabled ?? {})
      .filter(([, m]) => m.total > 0)
      .map(([key]) => key)
  );

  // Recent removal activity within 24h window
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
    refetchInterval: pollingIntervals.idle,
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

  const badgeColorFor = (href: string): string =>
    href === '/audit-logs' ? 'var(--admin-blue)' : 'var(--admin-orange)';

  const badgeHrefFor = (href: string): string | null =>
    href === '/feature-flags/global'
      ? '/feature-flags/global?stale=1#stale'
      : href === '/feature-flags'
        ? '/feature-flags?stale=1#stale'
        : href === '/audit-logs'
          ? '/audit-logs?action=feature_flag.deleted&range=24h'
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
      // /login hands off to the web app, so carry the page the admin actually
      // wanted; it is restored after the round trip.
      const intended = `${location.pathname}${location.search}`;
      navigate(
        intended === '/login'
          ? '/login'
          : `/login?next=${encodeURIComponent(intended)}`,
        { replace: true }
      );
    }
  }, [isLoading, isAuthenticated, user, navigate, location.pathname, location.search]);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Find active section to keep it expanded
  const activeSectionId = useMemo(() => {
    for (const section of ADMIN_NAV_SECTIONS) {
      if (section.items.some((item) => isActive(item.href))) {
        return section.id;
      }
    }
    return null;
  }, [location.pathname]);

  // Keep the section containing the active route expanded — navigating to a
  // page whose sidebar group is collapsed re-opens that group so the current
  // location stays visible.
  useEffect(() => {
    if (!activeSectionId) return;
    setCollapsedSections((prev) =>
      prev[activeSectionId] ? { ...prev, [activeSectionId]: false } : prev
    );
  }, [activeSectionId]);

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ADMIN_NAV_SECTIONS.map((section) => {
      // Check if section is flag gated
      if (section.flag && !isFlagEnabled(section.flag)) {
        return null;
      }
      const visibleItems = section.items.filter((item) => {
        if (item.flag && !isFlagEnabled(item.flag)) return false;
        if (!q) return true;
        return (
          item.label.toLowerCase().includes(q) ||
          item.href.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      });

      if (visibleItems.length === 0) return null;

      return {
        ...section,
        items: visibleItems,
      };
    }).filter(Boolean) as NavSection[];
  }, [searchQuery, isFlagEnabled]);

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: 'var(--admin-bg)',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
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
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div
      style={{ backgroundColor: 'var(--admin-bg)', minHeight: '100vh', color: 'var(--admin-text)' }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: 'var(--admin-sidebar-bg)',
          borderBottom: '1px solid var(--admin-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 50,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Left: Brand Logo & Console Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--admin-border)',
                borderRadius: 8,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--admin-text)',
                cursor: 'pointer',
              }}
            >
              <Icon name={sidebarOpen ? 'x' : 'menu'} size={18} />
            </button>
          )}

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
          >
            <img
              src="/logo-white.png"
              alt="Azeebo+"
              style={{ height: 26, width: 'auto', objectFit: 'contain' }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'rgba(255, 91, 0, 0.15)',
                color: 'var(--admin-orange)',
                border: '1px solid rgba(255, 91, 0, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor: 'var(--admin-orange)',
                  boxShadow: '0 0 8px var(--admin-orange)',
                }}
              />
              Console
            </span>
          </a>

          {/* System Environment Status */}
          <div
            style={{
              display: isMobile ? 'none' : 'flex',
              alignItems: 'center',
              gap: 6,
              marginLeft: 10,
              padding: '4px 12px',
              borderRadius: 9999,
              backgroundColor: 'rgba(0, 210, 106, 0.1)',
              border: '1px solid rgba(0, 210, 106, 0.25)',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--admin-green)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'var(--admin-green)',
                boxShadow: '0 0 8px rgba(0, 210, 106, 0.6)',
              }}
            />
            System Online
          </div>
        </div>

        {/* Center: Stale Flag Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StaleFlagSummary
            staleGlobal={staleGlobal}
            staleUniverse={staleUniverse}
            autoDisabledKeys={autoDisabledKeys}
          />
        </div>

        {/* Right: User Profile & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '4px 12px 4px 6px',
              borderRadius: 9999,
              backgroundColor: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF5B00 0%, var(--admin-red) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                textTransform: 'uppercase',
              }}
            >
              {user.email?.charAt(0) || 'A'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--admin-text)',
                  maxWidth: 150,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--admin-orange)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log out of admin console"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              borderRadius: 9999,
              border: '1px solid var(--admin-border)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--admin-text-muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(204, 28, 28, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(204, 28, 28, 0.3)';
              e.currentTarget.style.color = '#ff6b6b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'var(--admin-border)';
              e.currentTarget.style.color = 'var(--admin-text-muted)';
            }}
          >
            <Icon name="logOut" size={14} />
            <span style={{ display: isMobile ? 'none' : 'inline' }}>Logout</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      {/* Main Layout Body */}
      <div style={{ display: 'flex', paddingTop: 64, minHeight: '100vh' }}>
        {/* Navigation Sidebar */}
        <aside
          aria-label="Admin navigation"
          style={{
            width: 280,
            flexShrink: 0,
            backgroundColor: 'var(--admin-sidebar-bg)',
            borderRight: '1px solid var(--admin-border)',
            position: isMobile ? 'fixed' : 'sticky',
            top: 64,
            left: isMobile ? (sidebarOpen ? 0 : -290) : 0,
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
            padding: '16px 12px 32px',
            zIndex: isMobile ? 50 : 20,
            transition: isMobile ? 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Quick Search & Filter Bar */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 10,
                backgroundColor: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                transition: 'border-color 0.2s ease',
              }}
            >
              <Icon name="search" size={15} color="var(--admin-text-muted)" />
              <input
                type="text"
                placeholder="Quick navigate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--admin-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
            {searchQuery && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  marginTop: 6,
                  paddingLeft: 4,
                }}
              >
                Found {filteredSections.reduce((acc, s) => acc + s.items.length, 0)} results
              </div>
            )}
          </div>

          {/* Categorized Navigation List */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredSections.length === 0 ? (
              <div
                style={{
                  padding: '24px 12px',
                  textAlign: 'center',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                }}
              >
                No pages match &ldquo;{searchQuery}&rdquo;
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    display: 'block',
                    margin: '8px auto 0',
                    background: 'transparent',
                    border: '1px solid var(--admin-border)',
                    color: 'var(--admin-orange)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                  }}
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredSections.map((section) => {
                // If search query is active, always expand; otherwise respect collapsed state
                const isCollapsed = searchQuery ? false : Boolean(collapsedSections[section.id]);
                const hasActiveChild = section.items.some((item) => isActive(item.href));

                return (
                  <div key={section.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '6px 8px',
                        background: 'transparent',
                        border: 'none',
                        color: hasActiveChild ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--admin-text)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = hasActiveChild
                          ? 'var(--admin-text)'
                          : 'var(--admin-text-muted)';
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Icon
                          name={section.icon}
                          size={14}
                          color={hasActiveChild ? 'var(--admin-orange)' : 'currentColor'}
                        />
                        {section.title}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 10,
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--admin-text-muted)',
                          }}
                        >
                          {section.items.length}
                        </span>
                        <Icon
                          name={isCollapsed ? 'chevronRight' : 'chevronDown'}
                          size={13}
                          color="var(--admin-text-dim)"
                        />
                      </div>
                    </button>

                    {/* Section Items */}
                    {!isCollapsed && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          marginTop: 4,
                          paddingLeft: 4,
                        }}
                      >
                        {section.items.map((item) => {
                          const active = isActive(item.href);
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
                              aria-current={active ? 'page' : undefined}
                              title={item.description}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 12px',
                                borderRadius: 8,
                                textDecoration: 'none',
                                fontSize: 13,
                                fontWeight: active ? 600 : 500,
                                color: active ? '#ffffff' : 'var(--admin-text-muted)',
                                backgroundColor: active ? 'rgba(255, 91, 0, 0.14)' : 'transparent',
                                borderLeft: active
                                  ? '3px solid var(--admin-orange)'
                                  : '3px solid transparent',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!active) {
                                  e.currentTarget.style.backgroundColor =
                                    'rgba(255, 255, 255, 0.04)';
                                  e.currentTarget.style.color = 'var(--admin-text)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!active) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = 'var(--admin-text-muted)';
                                }
                              }}
                            >
                              <Icon
                                name={item.icon}
                                size={16}
                                color={active ? 'var(--admin-orange)' : 'var(--admin-text-muted)'}
                              />
                              <span
                                style={{
                                  flex: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.label}
                              </span>

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
                                    padding: '1px 7px',
                                    borderRadius: 999,
                                    background: badgeColorFor(item.href),
                                    color: 'white',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    outline: 'none',
                                    flexShrink: 0,
                                  }}
                                >
                                  {badgeCount}
                                </span>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            padding: isMobile ? '24px 16px' : '32px 32px',
            minWidth: 0,
            backgroundColor: 'var(--admin-bg)',
          }}
        >
          {children}
        </main>
        <QueryErrorToasts />
      </div>
    </div>
  );
}
