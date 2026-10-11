import type { Metadata } from 'next';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service - Azeebo+',
  description: 'Terms of Service and legal agreements governing Azeebo+ usage',
};

const SECTIONS = [
  {
    num: '01',
    title: 'Acceptance of Legal Terms',
    body: 'By creating an account, initiating an Azeebo Pay wallet, or accessing video streams on Azeebo+ ("the Platform"), you confirm that you are at least 18 years of age and agree to be bound by these Terms of Service, our Community Guidelines, and Privacy Disclosures. If you do not consent to these terms, discontinue use immediately.',
  },
  {
    num: '02',
    title: 'Account Verification & Security',
    body: 'You are solely responsible for maintaining the confidentiality of your account credentials, passkeys, and two-factor tokens. Azeebo+ accepts no liability for losses arising from compromised devices or credentials. Any unauthorized access must be reported to security@azeeboplus.com immediately.',
  },
  {
    num: '03',
    title: 'Content Licensing & Intellectual Property',
    body: 'All cinematographic works, original sound recordings, character lore, interactive game mechanics, and visual assets are exclusive intellectual property of Virtual Media Network Limited and licensed Nollywood production partners. You are granted a limited, personal, non-exclusive license to stream content for personal enjoyment.',
  },
  {
    num: '04',
    title: 'Universe Passes, Wallet & Subscriptions',
    body: 'All subscription fees, universe access passes, and wallet top-ups are denominated and settled in Nigerian Naira (₦). Recurring passes automatically renew on the billing cycle date unless canceled at least 24 hours prior. Refunds are evaluated strictly pursuant to our Consumer Protection Policy within 14 calendar days.',
  },
  {
    num: '05',
    title: 'Live Eviction & Participatory Voting',
    body: 'Votes submitted across reality shows represent participatory fan engagement. Vote allowances and Super Votes are non-refundable once cast on the ledger. Manipulative voting practices, bot scripting, and sybil attacks will lead to account disqualification and potential criminal reporting.',
  },
  {
    num: '06',
    title: 'Creator Monetization & Payouts',
    body: 'Studio partners and certified creators earn compensation calculated on viewing engagement minutes, fan bounties, and universe pass allocations. Payout disbursements to verified Nigerian bank accounts are subject to anti-money laundering (AML) checks and withholding tax compliance.',
  },
  {
    num: '07',
    title: 'Limitation of Liability & Service Availability',
    body: 'Azeebo+ is delivered on an "as available" basis. While we maintain a 99.9% uptime target across African and international CDNs, Virtual Media Network Limited is not liable for indirect or consequential damages caused by ISP outages, device incompatibility, or local bandwidth throttles.',
  },
  {
    num: '08',
    title: 'Governing Law & Dispute Resolution',
    body: 'These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any unresolved disputes arising hereunder shall be submitted to binding arbitration in Lagos under the Arbitration and Mediation Act.',
  },
];

export default function TermsPage(): React.JSX.Element {
  return (
    <PageShell activeNav="Support">
      <PageHero
        badge="Legal & Regulatory Framework"
        title="Terms of Service"
        subtitle="The formal legal agreement between you and Virtual Media Network Limited regarding the use of Azeebo+."
        accentColor="var(--color-az-flame)"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-az-glass-border">
          <span className="az-micro-label text-az-ink-muted uppercase font-mono">
            Effective Date: January 2026 • Version 3.1
          </span>
          <span className="az-micro-label text-az-flame uppercase font-bold">
            Jurisdiction: Lagos, Nigeria
          </span>
        </div>

        <div className="space-y-4">
          {SECTIONS.map((sec) => (
            <div
              key={sec.num}
              className="az-glass p-6 sm:p-8 transition-colors hover:border-az-glass-border-hover"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="az-overline text-az-flame font-mono">{sec.num}</span>
                <h2 className="az-title text-az-ink">{sec.title}</h2>
              </div>
              <p className="az-lead text-az-ink-muted">{sec.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 az-glass p-8 text-center">
          <Scale size={24} className="text-az-flame mx-auto mb-3" />
          <h3 className="az-subtitle text-az-ink mb-1">Legal Queries &amp; Formal Notices</h3>
          <p className="az-body text-az-ink-muted max-w-lg mx-auto mb-4">
            Formal legal notices should be directed to our Legal Department at Virtual Media Network
            Limited, Lagos, Nigeria.
          </p>
          <a
            href="mailto:legal@azeeboplus.com"
            className="az-btn-primary inline-flex items-center gap-2"
          >
            <span>legal@azeeboplus.com</span>
          </a>
        </div>
      </div>
    </PageShell>
  );
}
