'use client';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Shield, Flag, ClipboardList, Smartphone, Search, ArrowRight } from 'lucide-react';

function getModLinkIcon(iconName: string): React.JSX.Element {
  switch (iconName) {
    case 'Flag':
      return <Flag className="w-6 h-6 text-orange-400" />;
    case 'ClipboardList':
      return <ClipboardList className="w-6 h-6 text-blue-400" />;
    case 'Smartphone':
      return <Smartphone className="w-6 h-6 text-purple-400" />;
    case 'Search':
      return <Search className="w-6 h-6 text-emerald-400" />;
    default:
      return <Shield className="w-6 h-6 text-orange-400" />;
  }
}

const modLinks = [
  {
    href: '/moderation/report',
    label: 'Report Content',
    desc: 'Submit a report for inappropriate or violating content',
    icon: 'Flag',
  },
  {
    href: '/moderation/status',
    label: 'Report Status',
    desc: 'Check the status of your submitted reports',
    icon: 'ClipboardList',
  },
  {
    href: '/moderation/mobile-report',
    label: 'Mobile Report (Web)',
    desc: 'Desktop version of the mobile reporting flow',
    icon: 'Smartphone',
  },
  {
    href: '/moderation/mobile-status',
    label: 'Mobile Status (Web)',
    desc: 'Desktop version of the mobile status checker',
    icon: 'Search',
  },
];

export default function ModerationPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#0b090e',
        color: '#F5F0EB',
      }}
    >
      <AppHeader logoVariant="light" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #E8420A, #FF6B35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(232, 66, 10, 0.3)',
            }}
          >
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
            Moderation Center
          </h1>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 16,
              maxWidth: 500,
              margin: '0 auto',
            }}
          >
            Help keep the community safe by reporting and reviewing content
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {modLinks.map((link) => (
            <button
              key={link.href}
              aria-label={link.label}
              onClick={() => router.push(link.href)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 20px',
                borderRadius: 16,
                cursor: 'pointer',
                textAlign: 'left',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: '#18151e',
                color: '#F5F0EB',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-orange, #E8420A)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getModLinkIcon(link.icon)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, color: '#ffffff' }}>
                  {link.label}
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, margin: 0 }}>
                  {link.desc}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-orange-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}
