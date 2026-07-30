'use client';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function TermsPage(): React.JSX.Element {
  return (
    <div style={{ backgroundColor: 'var(--brand-near-black)', minHeight: '100vh', color: 'var(--text-primary)' }}>
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
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Last updated: January 2026</p>

        <div className="az-glass" style={{ padding: 32, borderRadius: 20, lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            By accessing and using Azeebo+ (&quot;the Platform&quot;), you agree to be bound by
            these Terms of Service. If you do not agree to these terms, please do not use the
            Platform.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            2. User Accounts
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            You must be at least 18 years old to create an account. You are responsible for
            maintaining the confidentiality of your account credentials and for all activities that
            occur under your account.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            3. Content
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            Users and creators retain ownership of their content. By uploading content to Azeebo+,
            you grant us a license to distribute, promote, and display your content on the Platform.
            Creators are responsible for ensuring their content complies with applicable laws and
            does not infringe on third-party rights.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            4. Subscriptions & Payments
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            Subscription fees are charged in Nigerian Naira (₦). All payments are processed through
            our approved payment gateways. Subscriptions auto-renew unless cancelled. Refund
            requests are handled on a case-by-case basis within 14 days of purchase.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            5. Creator Earnings
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            Creator earnings are calculated based on content performance and subscriber engagement.
            Minimum payout threshold applies. Azeebo+ reserves the right to adjust revenue share
            terms with 30 days&apos; notice to creators.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            6. Prohibited Conduct
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            Users may not upload harmful, illegal, or infringing content; attempt to hack or disrupt
            the Platform; harass other users; or use the Platform for any unlawful purpose.
            Violations may result in account suspension or termination.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            7. Limitation of Liability
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            Azeebo+ is provided &quot;as is&quot; without warranties of any kind. We are not liable
            for any indirect, incidental, or consequential damages arising from your use of the
            Platform.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            8. Changes to Terms
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14 }}>
            We reserve the right to modify these terms at any time. Continued use of the Platform
            after changes constitutes acceptance of the new terms.
          </p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
