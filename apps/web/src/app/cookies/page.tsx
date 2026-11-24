import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { Cookie, ShieldCheck, BarChart3, Megaphone, Settings2, Mail } from 'lucide-react';
import ConsentResetButton from './consent-reset';

export const metadata: Metadata = {
  title: 'Cookie Policy - Azeebo+',
  description: 'How Azeebo+ uses cookies and how you control non-essential ones',
};

export default function CookiePolicyPage() {
  return (
    <PageShell activeNav="Support">
      <PageHero
        badge="Cookie Policy"
        title="Cookies & Your Choices"
        subtitle="What we store on your device, why, and how to change your mind at any time."
        accentColor="var(--color-az-flame)"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
        <div className="az-glass p-6 sm:p-8 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-az-ink flex items-center gap-2.5">
            <Cookie size={18} className="text-az-flame" />
            <span>1. What cookies we use</span>
          </h2>
          <p className="text-sm text-az-ink-muted leading-relaxed">
            Cookies are small files stored on your device. Azeebo+ keeps the set minimal: strictly
            necessary cookies keep you signed in and secure, and — only if you opt in — analytics
            and marketing cookies help us understand how the service is used. We do not use
            third-party advertising cookies.
          </p>
        </div>

        <div className="az-glass p-6 sm:p-8 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-az-ink flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-az-flame" />
            <span>2. Strictly necessary (always on)</span>
          </h2>
          <p className="text-sm text-az-ink-muted leading-relaxed">
            These are required for the site to function and cannot be switched off: session and
            authentication cookies (HttpOnly, so scripts cannot read them) and your consent choice
            itself, stored in a first-party <code className="text-az-ink-dim">__Host-</code> cookie
            that only this site can set or read. They do not track you anywhere else.
          </p>
        </div>

        <div className="az-glass p-6 sm:p-8 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-az-ink flex items-center gap-2.5">
            <BarChart3 size={18} className="text-az-flame" />
            <span>3. Analytics (optional, off by default)</span>
          </h2>
          <p className="text-sm text-az-ink-muted leading-relaxed">
            With your consent, we collect first-party product analytics (pages viewed, features
            used, playback events) to fix bugs and improve the service. Nothing is collected before
            you opt in — the server-side ingest drops every batch that arrives without a valid
            analytics consent. Search terms are never stored in raw form.
          </p>
        </div>

        <div className="az-glass p-6 sm:p-8 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-az-ink flex items-center gap-2.5">
            <Megaphone size={18} className="text-az-flame" />
            <span>4. Marketing (optional, off by default)</span>
          </h2>
          <p className="text-sm text-az-ink-muted leading-relaxed">
            With your consent, we measure the performance of our own campaigns so we can stop paying
            for ones that do not work. We do not build cross-site profiles and we do not share your
            identity with ad networks.
          </p>
        </div>

        <div className="az-glass p-6 sm:p-8 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-az-ink flex items-center gap-2.5">
            <Settings2 size={18} className="text-az-flame" />
            <span>5. Changing your choices</span>
          </h2>
          <p className="text-sm text-az-ink-muted leading-relaxed">
            Your choice lives in the consent cookie described above. Use the button below to clear
            it — the cookie banner will re-appear on reload and you can accept, decline, or
            customise category by category. You can also clear cookies in your browser settings at
            any time.
          </p>
          <ConsentResetButton />
        </div>

        <div className="az-glass p-6 sm:p-8 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-az-ink flex items-center gap-2.5">
            <Mail size={18} className="text-az-flame" />
            <span>6. Questions &amp; your data rights</span>
          </h2>
          <p className="text-sm text-az-ink-muted leading-relaxed">
            For anything cookie- or privacy-related, contact our data protection team at{' '}
            <a href="mailto:privacy@azeeboplus.com" className="text-az-flame underline">
              privacy@azeeboplus.com
            </a>
            . To export or erase your data yourself, open{' '}
            <Link href="/profile/privacy-security" className="text-az-flame underline">
              Privacy &amp; Security
            </Link>{' '}
            in your account settings. Full disclosures live in our{' '}
            <Link href="/privacy" className="text-az-flame underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </PageShell>
  );
}
