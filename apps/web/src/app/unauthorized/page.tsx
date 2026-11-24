import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, LogIn, Home } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export const metadata: Metadata = {
  title: 'Sign In Required - Azeebo+',
  description: 'Please sign in to access your Azeebo+ universe.',
};

export default function UnauthorizedPage(): React.JSX.Element {
  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center border border-az-glass-border relative overflow-hidden">
          {/* Ambient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--color-az-flame)]/15 blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-az-scarlet to-az-flame flex items-center justify-center text-az-ink mx-auto mb-6 shadow-az-glow">
            <Lock className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-az-flame/10 border border-az-flame/20 text-az-flame text-xs font-semibold mb-4">
            Error 401 • Authentication Required
          </div>

          <h1 className="az-headline text-2xl sm:text-3xl font-extrabold text-az-ink mb-3">
            Sign In Required
          </h1>
          <p className="text-az-ink/60 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            You need to be logged into your Azeebo+ account to watch this title, participate in
            community votes, or manage your wallet.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/login"
              className="flex-1 flex items-center justify-center gap-2 az-btn-primary tracking-wide shadow-lg hover:shadow-az-flame/20"
            >
              <LogIn className="w-4 h-4" />
              Sign In Now
            </Link>
            <Link
              href="/home"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-sm text-az-ink/70 hover:text-az-ink bg-az-glass-card hover:bg-az-ink/15 border border-az-glass-border transition-colors"
            >
              <Home className="w-4 h-4" />
              Browse As Guest
            </Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
