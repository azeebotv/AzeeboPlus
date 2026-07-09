'use client';
import React from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function GuidelinesPage(): React.JSX.Element {
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
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Community Guidelines</h1>
        <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Last updated: July 2026</p>

        <div className="az-glass" style={{ padding: 32, borderRadius: 20, lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            1. Be Respectful
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            Treat all community members with respect. Harassment, bullying, hate speech, and
            personal attacks are not tolerated. Engage in constructive conversations and
            celebrate the diversity of our community.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            2. Content Standards
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            All content shared on Azeebo+ must comply with applicable laws and regulations.
            Prohibited content includes but is not limited to: explicit sexual material, violence,
            gore, hate symbols, misinformation, and content that infringes on intellectual property
            rights.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            3. Fair Voting
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            Voting on reality shows and content should be fair and genuine. Do not use automated
            tools, bots, or any form of manipulation to artificially inflate vote counts. Each
            user should vote based on their genuine preferences.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            4. Creator Responsibilities
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            Creators are expected to produce original content, properly credit sources, and
            maintain transparency with their audience. Misleading claims, fake engagement, and
            deceptive practices will result in account suspension.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            5. Reporting and Moderation
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            If you encounter content or behavior that violates these guidelines, please report it
            using the in-app reporting tools. Our moderation team reviews all reports and takes
            appropriate action, which may include content removal, warnings, or account suspension.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            6. Intellectual Property
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            Respect the intellectual property rights of others. Do not upload content that you do
            not own or have the right to distribute. Copyright infringement may result in content
            removal and account termination.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            7. Privacy and Safety
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            Do not share personal information of others without their consent. This includes but
            is not limited to: real names, addresses, phone numbers, and private communications.
            Protect your own privacy and the privacy of others.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            8. Enforcement
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            Violations of these guidelines may result in:
          </p>
          <ul style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>Content removal or demotion</li>
            <li style={{ marginBottom: 8 }}>Temporary or permanent account suspension</li>
            <li style={{ marginBottom: 8 }}>Restriction from voting or creator features</li>
            <li style={{ marginBottom: 8 }}>Legal action in severe cases</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#E8420A' }}>
            9. Changes to Guidelines
          </h2>
          <p style={{ color: '#D4C8B8', fontSize: 14, marginBottom: 24 }}>
            We reserve the right to update these guidelines at any time. Users will be notified
            of significant changes. Continued use of the Platform after changes constitutes
            acceptance of the updated guidelines.
          </p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
