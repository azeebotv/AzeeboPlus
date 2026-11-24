'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import AppHeader from './AppHeader';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'BarChart3' },
  { href: '/admin/overview', label: 'Overview', icon: 'TrendingUp' },
  { href: '/admin/users', label: 'Users', icon: 'Users' },
  { href: '/admin/content', label: 'Content', icon: 'Film' },
  { href: '/admin/content-review', label: 'Review Queue', icon: 'CheckCircle' },
  { href: '/admin/creators', label: 'Creators', icon: 'Sparkles' },
  { href: '/admin/reality', label: 'Reality Shows', icon: 'Drama' },
  { href: '/admin/universes', label: 'Universes', icon: 'Globe' },
  { href: '/admin/wallets', label: 'Wallets', icon: 'Wallet' },
  { href: '/admin/financial', label: 'Financial', icon: 'DollarSign' },
  { href: '/admin/payment-gateways', label: 'Payments', icon: 'CreditCard' },
  { href: '/admin/engagement', label: 'Engagement', icon: 'Flame' },
  { href: '/admin/notifications', label: 'Notifications', icon: 'Bell' },
  { href: '/admin/announcements', label: 'Announcements', icon: 'Volume2' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: 'ClipboardList' },
  { href: '/admin/reports', label: 'Reports', icon: 'BarChart3' },
  { href: '/admin/settings', label: 'Settings', icon: 'Settings' },
  { href: '/admin/ai-provenance', label: 'AI Provenance', icon: 'Bot' },
  { href: '/admin/dual-control', label: 'Dual Control', icon: 'Lock' },
  { href: '/admin/talent-clearance', label: 'Talent Clearance', icon: 'Star' },
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
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    if (!isAuthenticated || !user || !isAdmin) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
        <div
          role="status"
          aria-label="Loading admin console"
          className="size-10 animate-spin rounded-full border-[3px] border-az-surface-edge border-t-az-flame"
        />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  if (!isAuthenticated || !user || !isAdmin) {
    return <></>;
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-az-surface-root text-az-ink">
      <AppHeader />
      <div className="flex min-h-screen pt-[72px]">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle admin sidebar"
          className="fixed bottom-5 right-5 z-50 flex size-12 items-center justify-center rounded-az-pill bg-[image:var(--gradient-az-cta)] text-az-ink shadow-az-glow lg:hidden"
        >
          {sidebarOpen ? 'X' : 'Menu'}
        </button>

        {/* Sidebar */}
        <aside
          aria-label="Admin navigation"
          className={`top-[72px] h-[calc(100vh-72px)] overflow-y-auto border-r border-az-glass-border bg-az-surface-panel px-3 py-4 ${
            isMobile
              ? `fixed left-0 z-40 w-[280px] transition-transform duration-300 ease-in-out ${
                  sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : 'sticky w-[260px] shrink-0'
          }`}
        >
          <nav>
            {ADMIN_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
                className={`mb-1 flex items-center gap-3 rounded-az-control px-3.5 py-2.5 transition-colors ${
                  isActive(item.href)
                    ? 'az-body-strong bg-az-scarlet/10 text-az-flame'
                    : 'az-body text-az-ink-muted hover:bg-az-glass-fill hover:text-az-ink'
                }`}
              >
                <span className="az-subtitle w-6 text-center leading-none">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
