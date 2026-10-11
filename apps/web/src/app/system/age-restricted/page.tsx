import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, UserCheck, Home } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export const metadata: Metadata = {
  title: 'Age-Restricted Content - Azeebo+',
  description: 'Age verification required to view this title.',
};

export default function AgeRestrictedPage(): React.JSX.Element {
  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-warning-500) 15%, transparent)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center border border-az-glass-border relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-az-warning-500/15 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-az-warning-500 to-az-flame flex items-center justify-center text-az-ink mx-auto mb-6 shadow-[0_8px_32px_rgba(245,158,11,0.3)]">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-az-warning-500/10 border border-az-warning-500/20 text-az-warning-400 text-xs font-semibold mb-4">
            18+ Content Rating Filter
          </div>

          <h1 className="az-headline text-2xl sm:text-3xl font-extrabold text-az-ink mb-3">
            Age-Gated Cinema
          </h1>
          <p className="text-az-ink/60 text-sm mb-4 leading-relaxed max-w-sm mx-auto">
            This title contains mature themes, violence, or explicit dialogue requiring verified
            adult age approval under Nigerian & African broadcast regulations.
          </p>
          <p className="text-xs text-az-ink/40 mb-8 max-w-xs mx-auto">
            Update your profile birthdate or enter your parental PIN to unlock mature titles.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/profile"
              className="flex-1 flex items-center justify-center gap-2 az-btn-primary tracking-wide shadow-lg hover:shadow-az-flame/20"
            >
              <UserCheck className="w-4 h-4" />
              Verify Age in Profile
            </Link>
            <Link
              href="/home"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-sm text-az-ink/70 hover:text-az-ink bg-az-glass-card hover:bg-az-ink/15 border border-az-glass-border transition-colors"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
