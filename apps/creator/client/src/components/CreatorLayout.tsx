import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const CREATOR_NAV = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/overview', label: 'Overview', icon: '📈' },
  { href: '/analytics', label: 'Analytics', icon: '📉' },
  { href: '/earnings', label: 'Earnings', icon: '💰' },
  { href: '/content', label: 'Content', icon: '🎬' },
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
  logo: { fontSize: 20, fontWeight: 700, color: '#E8420A', textDecoration: 'none' } as React.CSSProperties,
  userBadge: { fontSize: 13, color: '#9A8A7A', display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
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

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
        <a href="/" style={styles.logo}>Azeebo+ Creator</a>
        <div style={styles.userBadge}>
          <span>{user.email}</span>
          <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: '#E8420A', color: '#fff', fontSize: 11, fontWeight: 600 }}>
            {user.role}
          </span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
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
            ...(isMobile ? {
              position: 'fixed' as const,
              top: 64,
              left: sidebarOpen ? 0 : -280,
              zIndex: 40,
              transition: 'left 0.3s ease',
              width: 280,
            } : {}),
          }}
        >
          <nav>
            {CREATOR_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => { e.preventDefault(); navigate(item.href); setSidebarOpen(false); }}
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
              </a>
            ))}
          </nav>
        </aside>

        <main style={styles.main}>{children}</main>
      </div>
    </div>
  );
}
