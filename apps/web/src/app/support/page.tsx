'use client';
import { useState } from 'react';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { HelpCircle, ChevronDown, Mail, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'How do I subscribe or purchase universe passes?',
    a: 'Visit the Universe Bundles or Subscription Plans page to choose a package that fits your entertainment habits. You can fund your Azeebo Pay wallet or pay directly using Nigerian debit/credit cards, USSD, or instant bank transfer via Paystack & Flutterwave.',
  },
  {
    q: 'How does live reality voting and Super Voting work?',
    a: 'During live reality eviction episodes, navigate to the Reality Universe hub and cast your votes in real-time. Standard votes use your daily allowance, while Super Votes give weighted voting power and are verified directly on our immutable ledger.',
  },
  {
    q: 'How do creator bounties, rewards, and cash payouts work?',
    a: 'Creators and top active fans earn Azeebo Coins through mission completions, trivia challenges, and stream streaks. Points can be redeemed for physical merch or converted to Naira and withdrawn directly to any verified Nigerian bank account within minutes.',
  },
  {
    q: 'Can I watch offline or download episodes for travel?',
    a: 'Yes! On supported mobile and desktop browsers, you can download episodes in your preferred resolution (SD, HD, or 1080p Full HD) from the episode detail page and watch anytime in your Downloads library without consuming data.',
  },
  {
    q: 'How do multi-device limits and session security work?',
    a: 'Depending on your subscription tier, you can stream simultaneously on 2 to 5 registered screens (Smart TVs, laptops, tablets, and phones). You can inspect and revoke active hardware sessions anytime in Settings → Registered Devices.',
  },
  {
    q: 'How does the Azeebo AOU Lore Codex work?',
    a: 'Azeebo Original Universe (AOU) links characters, storylines, and relics across all our original series. As you watch episodes, you unlock codex entries in "What You Know" and discover secrets connecting shows together.',
  },
];

export default function SupportPage(): React.JSX.Element {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <PageShell activeNav="Support">
      <PageHero
        badge="24/7 Concierge Support"
        title="Help & Knowledge Base"
        subtitle="Get instant answers about your subscription, live reality voting, wallet payouts, and offline playback."
        accentColor="var(--color-az-flame)"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        {/* Quick Help Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="az-glass p-6 transition-all text-center">
            <div className="w-12 h-12 rounded-2xl bg-az-flame/10 text-az-flame flex items-center justify-center mx-auto mb-3 border border-az-flame/20">
              <Sparkles size={22} />
            </div>
            <h3 className="font-bold text-az-ink text-sm mb-1">Getting Started</h3>
            <p className="text-xs text-az-ink-muted">
              Subscription passes, playback quality, and account creation
            </p>
          </div>

          <div className="az-glass p-6 transition-all text-center">
            <div className="w-12 h-12 rounded-2xl bg-az-flame/10 text-az-flame flex items-center justify-center mx-auto mb-3 border border-az-flame/20">
              <ShieldCheck size={22} />
            </div>
            <h3 className="font-bold text-az-ink text-sm mb-1">Billing & Wallet</h3>
            <p className="text-xs text-az-ink-muted">
              Azeebo Pay deposits, Nigerian bank withdrawals, and receipts
            </p>
          </div>

          <div className="az-glass p-6 transition-all text-center">
            <div className="w-12 h-12 rounded-2xl bg-az-flame/10 text-az-flame flex items-center justify-center mx-auto mb-3 border border-az-flame/20">
              <MessageSquare size={22} />
            </div>
            <h3 className="font-bold text-az-ink text-sm mb-1">Voting & Rewards</h3>
            <p className="text-xs text-az-ink-muted">
              Reality show voting, daily streaks, and loyalty store claims
            </p>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="mb-14">
          <h2 className="text-xl sm:text-2xl font-black text-az-ink tracking-tight mb-6 flex items-center gap-2">
            <HelpCircle size={22} className="text-az-flame" />
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              const formattedIndex = String(i + 1).padStart(2, '0');
              return (
                <div
                  key={i}
                  className={`az-glass overflow-hidden border transition-all duration-300 ${
                    isOpen ? '' : 'border-az-glass-border hover:border-az-glass-border'
                  }`}
                >
                  <button
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-az-flame tracking-widest font-mono">
                        {formattedIndex}
                      </span>
                      <span className="font-bold text-az-ink text-sm sm:text-base">{item.q}</span>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 border ${
                        isOpen
                          ? 'rotate-180 bg-az-flame text-az-ink border-az-flame'
                          : 'bg-az-glass-fill text-az-ink-muted border-az-glass-border'
                      }`}
                    >
                      <ChevronDown size={16} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-az-ink-muted leading-relaxed border-t border-az-glass-border">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 24/7 Live Support Concierge */}
        <div className="az-glass p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-az-flame/15 via-az-scarlet/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-az-flame/10 text-az-flame flex items-center justify-center mx-auto mb-4 border border-az-flame/30 shadow-lg shadow-az-flame/10">
            <Mail size={26} />
          </div>
          <h2 className="text-2xl font-black text-az-ink mb-2">
            Still need personalized assistance?
          </h2>
          <p className="text-az-ink-muted text-sm max-w-lg mx-auto mb-6">
            Our dedicated Lagos & London member support team is available 24/7 to resolve streaming,
            billing, or voting inquiries.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:support@azeeboplus.com?subject=Azeebo%2B%20Member%20Support%20Request"
              className="az-btn-primary inline-flex items-center gap-2 shadow-xl shadow-az-flame/25"
            >
              <Mail size={16} />
              <span>Email Member Support</span>
            </a>
            <a
              href="mailto:help@azeeboplus.com"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-az-ink-dim hover:text-az-ink bg-az-glass-fill hover:bg-az-glass-card border border-az-glass-border transition-all"
            >
              <MessageSquare size={16} />
              <span>Submit Ticket</span>
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
