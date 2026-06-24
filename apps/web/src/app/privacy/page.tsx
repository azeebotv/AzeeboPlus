'use client';
import React from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function PrivacyPage(): React.JSX.Element {
  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
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
        <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Last updated: January 2026</p>

        <div className="az-glass" style={{ padding: 32, borderRadius: 20, lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            1. Information We Collect
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            We collect information you provide directly: account details (name, email, phone
            number), payment information, content you upload, and communications with us. We also
            collect usage data including device information, IP address, and browsing activity on
            the Platform.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            2. How We Use Your Information
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            We use your information to provide and improve the Platform, process transactions, send
            notifications, personalize your experience, ensure security, and comply with legal
            obligations.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            3. Information Sharing
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            We do not sell your personal information. We may share information with payment
            processors, analytics providers, and law enforcement when required by law. Creator
            earnings information may be visible to other users if the creator enables this setting.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            4. Data Security
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            We implement industry-standard security measures including encryption, secure
            authentication, and regular security audits. However, no method of transmission over the
            Internet is 100% secure.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            5. Your Rights
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            You have the right to access, correct, or delete your personal data. You can manage most
            settings through your account. For data deletion requests, contact our support team.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            6. Cookies
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            We use cookies and similar technologies to maintain your session, remember preferences,
            and analyze usage patterns. You can control cookie settings in your browser.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            7. Contact Us
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14 }}>
            For questions about this Privacy Policy, contact us at privacy@azeeboplus.com.
          </p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
