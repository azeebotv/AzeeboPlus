import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support  - Azeebo+',
  description: 'Support  on Azeebo+',
};

'use client';
import { useState } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

const FAQ_ITEMS = [
  {
    q: 'How do I subscribe?',
    a: 'Visit our Subscription Plans page to choose a plan that works for you. You can pay with your wallet balance or via our supported payment gateways.',
  },
  {
    q: 'How do I become a creator?',
    a: "Apply through the Creators page. Once approved, you'll gain access to the Creator Dashboard where you can upload and manage content.",
  },
  {
    q: 'How do I vote on reality shows?',
    a: 'Navigate to the Reality section, select a show, and use your vote points to support your favorite contestants. Super Votes give extra weight.',
  },
  {
    q: 'How do I withdraw earnings?',
    a: 'Go to your Wallet, click Withdraw, select your bank account, and enter the amount. Payouts are processed within 24-48 hours.',
  },
  {
    q: 'How do referrals work?',
    a: 'Share your unique referral link. When someone signs up and subscribes using your link, both of you earn rewards.',
  },
];

export default function SupportPage(): React.JSX.Element {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary, #1A0A0A)',
        minHeight: '100vh',
        color: 'var(--text-primary, #F5F0EB)',
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
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Help & Support</h1>
          <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 16 }}>
            Find answers to common questions
          </p>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="az-glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
                <button
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary, #F5F0EB)',
                    fontSize: 15,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{item.q}</span>
                  <span
                    style={{
                      color: 'var(--text-muted, #9A8A7A)',
                      fontSize: 18,
                      transition: 'transform 0.2s',
                      transform: openFaq === i ? 'rotate(45deg)' : 'none',
                    }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div
                    style={{
                      padding: '0 20px 16px',
                      color: 'var(--text-muted, #9A8A7A)',
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="az-glass" style={{ padding: 32, borderRadius: 20, textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Still need help?</h2>
          <p style={{ color: 'var(--text-muted, #9A8A7A)', marginBottom: 20 }}>
            Our support team is available 24/7
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="mailto:support@azeeboplus.com"
              style={{
                padding: '12px 28px',
                borderRadius: 999,
                background:
                  'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
                color: 'var(--brand-white)',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Email Support
            </a>
            <a
              href="mailto:support@azeeboplus.com?subject=Support%20Request"
              style={{
                padding: '12px 28px',
                borderRadius: 999,
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-muted, #9A8A7A)',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
