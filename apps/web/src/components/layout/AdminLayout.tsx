'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import AppHeader from './AppHeader';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/overview', label: 'Overview', icon: '📈' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/content', label: 'Content', icon: '🎬' },
  { href: '/admin/content-review', label: 'Review Queue', icon: '✅' },
  { href: '/admin/creators', label: 'Creators', icon: '✨' },
  { href: '/admin/reality', label: 'Reality Shows', icon: '🎭' },
  { href: '/admin/universes', label: 'Universes', icon: '🌍' },
  { href: '/admin/wallets', label: 'Wallets', icon: '👛' },
  { href: '/admin/financial', label: 'Financial', icon: '💰' },
  { href: '/admin/payment-gateways', label: 'Payments', icon: '💳' },
  { href: '/admin/engagement', label: 'Engagement', icon: '🔥' },
  { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' },
  { href: '/admin/reports', label: 'Reports', icon: '📊' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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
    if (!isAuthenticated || !user || user.role !== 'admin') {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <></>;
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <div style={{ display: 'flex', paddingTop: 72, minHeight: '100vh' }}>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle admin sidebar"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 50,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: '#fff',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(232,66,10,0.4)',
          }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>

        {/* Sidebar */}
        <aside
          aria-label="Admin navigation"
          style={{
            width: 260,
            flexShrink: 0,
            backgroundColor: '#140808',
            borderRight: '1px solid #2A1A1A',
            position: 'sticky',
            top: 72,
            height: 'calc(100vh - 72px)',
            overflowY: 'auto',
            padding: '16px 12px',
            ...(isMobile
              ? {
                  position: 'fixed' as const,
                  top: 72,
                  left: sidebarOpen ? 0 : -280,
                  zIndex: 40,
                  transition: 'left 0.3s ease',
                  width: 280,
                }
              : {}),
          }}
        >
          <nav>
            {ADMIN_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
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

        {/* Main content */}
        <main style={{ flex: 1, padding: '32px 24px', minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
