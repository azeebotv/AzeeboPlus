'use client';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function PrivacyPage(): React.JSX.Element {
  return (
    <div
      style={{
        backgroundColor: 'var(--brand-near-black)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
      }}
    >
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 700,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Last updated: January 2026
        </p>

        <div className="az-glass" style={{ padding: 32, borderRadius: 20, lineHeight: 1.8 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--brand-orange)',
            }}
          >
            1. Information We Collect
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            We collect information you provide directly: account details (name, email, phone
            number), payment information, content you upload, and communications with us. We also
            collect usage data including device information, IP address, and browsing activity on
            the Platform.
          </p>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--brand-orange)',
            }}
          >
            2. How We Use Your Information
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            We use your information to provide and improve the Platform, process transactions, send
            notifications, personalize your experience, ensure security, and comply with legal
            obligations.
          </p>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--brand-orange)',
            }}
          >
            3. Information Sharing
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            We do not sell your personal information. We may share information with payment
            processors, analytics providers, and law enforcement when required by law. Creator
            earnings information may be visible to other users if the creator enables this setting.
          </p>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--brand-orange)',
            }}
          >
            4. Data Security
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            We implement industry-standard security measures including encryption, secure
            authentication, and regular security audits. However, no method of transmission over the
            Internet is 100% secure.
          </p>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--brand-orange)',
            }}
          >
            5. Your Rights
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            You have the right to access, correct, or delete your personal data. You can manage most
            settings through your account. For data deletion requests, contact our support team.
          </p>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--brand-orange)',
            }}
          >
            6. Cookies
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            We use cookies and similar technologies to maintain your session, remember preferences,
            and analyze usage patterns. You can control cookie settings in your browser.
          </p>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--brand-orange)',
            }}
          >
            7. Contact Us
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            For questions about this Privacy Policy, contact us at privacy@azeeboplus.com.
          </p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
