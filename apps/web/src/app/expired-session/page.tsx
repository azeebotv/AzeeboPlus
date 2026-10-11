import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, LogIn, Shield } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export const metadata: Metadata = {
  title: 'Session Expired - Azeebo+',
  description: 'Your authentication session has expired for security.',
};

export default function ExpiredSessionPage(): React.JSX.Element {
  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center border border-az-glass-border relative overflow-hidden">
          {/* Ambient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--color-az-flame)]/15 blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-az-scarlet to-az-flame flex items-center justify-center text-az-ink mx-auto mb-6 shadow-az-glow">
            <Clock className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-az-flame/10 border border-az-flame/20 text-az-flame text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            Security Timeout
          </div>

          <h1 className="az-headline text-2xl sm:text-3xl font-extrabold text-az-ink mb-3">
            Session Expired
          </h1>
          <p className="text-az-ink/60 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            Your login token has expired to safeguard your Azeebo+ wallet balance and account data.
            Please sign in again to continue enjoying uninterrupted African cinema.
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 az-btn-primary tracking-wide shadow-lg hover:shadow-az-flame/20"
            >
              <LogIn className="w-4 h-4" />
              Sign In Again
            </Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
