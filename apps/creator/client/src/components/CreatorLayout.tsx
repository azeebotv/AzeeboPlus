import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCreatorFlags, CREATOR_FLAG_KEYS } from '@/hooks/useCreatorFlags';
import { Icon } from './Icons';

export const CREATOR_NAV = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/overview', label: 'Overview', icon: 'trending' },
  { href: '/analytics', label: 'Analytics', icon: 'trending', flag: CREATOR_FLAG_KEYS.newAnalytics },
  { href: '/content', label: 'Content', icon: 'film' },
  { href: '/upload', label: 'Upload', icon: 'upload' },
  { href: '/earnings', label: 'Earnings', icon: 'dollarSign' },
  { href: '/payouts', label: 'Payouts', icon: 'creditCard', flag: CREATOR_FLAG_KEYS.payoutsUi },
  { href: '/subscribers', label: 'Subscribers', icon: 'users' },
  { href: '/monetization', label: 'Monetization', icon: 'tag' },
  { href: '/challenges', label: 'Challenges', icon: 'trophy' },
  { href: '/profile', label: 'Profile', icon: 'user' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

const styles = {
  root: { backgroundColor: 'var(--creator-bg)', minHeight: '100vh', color: 'var(--creator-text)' } as React.CSSProperties,
  topBar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'var(--creator-darker)',
    borderBottom: '1px solid var(--creator-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 50,
  } as React.CSSProperties,
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--creator-orange)',
    textDecoration: 'none',
  } as React.CSSProperties,
  userBadge: {
    fontSize: 13,
    color: 'var(--creator-text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,
  logoutBtn: {
    background: 'none',
    border: '1px solid var(--creator-border)',
    color: 'var(--creator-text-muted)',
    padding: '6px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
  } as React.CSSProperties,
  layout: { display: 'flex', paddingTop: 64, minHeight: '100vh' } as React.CSSProperties,
  sidebar: {
    width: 260,
    flexShrink: 0,
    backgroundColor: 'var(--creator-darker)',
    borderRight: '1px solid var(--creator-border)',
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
    color: 'white',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(232,66,10,0.4)',
  } as React.CSSProperties,
};

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isEnabled: isFlagEnabled } = useCreatorFlags();

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      // /login hands off to the web app, so carry the page the creator actually
      // wanted; it is restored after the round trip.
      const intended = `${location.pathname}${location.search}`;
      navigate(intended === '/login' ? '/login' : `/login?next=${encodeURIComponent(intended)}`, {
        replace: true,
      });
    }
  }, [isLoading, isAuthenticated, user, navigate, location.pathname, location.search]);

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
              border: '3px solid var(--creator-border)',
              borderTopColor: 'var(--creator-orange)',
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
        <a href="/" style={{ ...styles.logo, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/logo-white.png"
            alt="Azeebo+"
            style={{ height: 26, width: 'auto', objectFit: 'contain' }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: 6,
              background: 'rgba(232,66,10,0.15)',
              color: 'var(--creator-orange)',
              border: '1px solid rgba(232,66,10,0.3)',
            }}
          >
            Creator
          </span>
        </a>
        <div style={styles.userBadge}>
          <span>{user.email}</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: 'var(--creator-orange)',
              color: 'white',
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
          aria-label="Creator navigation"
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
            {CREATOR_NAV.filter((item) => !item.flag || isFlagEnabled(item.flag)).map((item) => (
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
                  color: isActive(item.href) ? 'var(--creator-orange)' : 'var(--creator-text-muted)',
                  backgroundColor: isActive(item.href) ? 'rgba(232,66,10,0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <main style={styles.main}>{children}</main>
      </div>
    </div>
  );
}
