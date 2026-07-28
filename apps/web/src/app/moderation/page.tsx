'use client';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

const modLinks = [
  {
    href: '/moderation/report',
    label: 'Report Content',
    desc: 'Submit a report for inappropriate or violating content',
    icon: '🚩',
  },
  {
    href: '/moderation/status',
    label: 'Report Status',
    desc: 'Check the status of your submitted reports',
    icon: '📋',
  },
  {
    href: '/moderation/mobile-report',
    label: 'Mobile Report (Web)',
    desc: 'Desktop version of the mobile reporting flow',
    icon: '📱',
  },
  {
    href: '/moderation/mobile-status',
    label: 'Mobile Status (Web)',
    desc: 'Desktop version of the mobile status checker',
    icon: '🔍',
  },
];

export default function ModerationPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A', color: '#F5F0EB' }}>
      <AppHeader />
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
              fontSize: 28,
            }}
          >
            🛡️
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Moderation Center</h1>
          <p style={{ color: '#9A8A7A', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Help keep the community safe by reporting and reviewing content
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {modLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 20px',
                borderRadius: 16,
                cursor: 'pointer',
                textAlign: 'left',
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                color: '#F5F0EB',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E8420A')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2A1A1A')}
            >
              <span style={{ fontSize: 28 }}>{link.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{link.label}</h3>
                <p style={{ color: '#9A8A7A', fontSize: 13, margin: 0 }}>{link.desc}</p>
              </div>
              <span style={{ color: '#E8420A', fontSize: 18 }}>→</span>
            </button>
          ))}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
