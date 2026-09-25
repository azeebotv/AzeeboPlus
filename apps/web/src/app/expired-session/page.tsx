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
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Ambient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--brand-orange)]/15 blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#e8420a] to-[#cc1c1c] flex items-center justify-center text-white mx-auto mb-6 shadow-[0_8px_32px_rgba(232,66,10,0.35)]">
            <Clock className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            Security Timeout
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Session Expired
          </h1>
          <p className="text-white/60 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            Your login token has expired to safeguard your Azeebo+ wallet balance and account data. Please sign in again to continue enjoying uninterrupted African cinema.
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-2 az-btn-primary py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-lg hover:shadow-orange-500/20"
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
