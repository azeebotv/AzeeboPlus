import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert, HelpCircle, LogIn } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export const metadata: Metadata = {
  title: 'Account Restricted - Azeebo+',
  description: 'Your Azeebo+ account has security restrictions.',
};

export default function AccountRestrictedPage(): React.JSX.Element {
  return (
    <PageShell glowColor="rgba(239,68,68,0.15)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-red-600/15 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center text-white mx-auto mb-6 shadow-[0_8px_32px_rgba(239,68,68,0.35)]">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-4">
            Safety Action Required
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Account Restricted
          </h1>
          <p className="text-white/60 text-sm mb-4 leading-relaxed max-w-sm mx-auto">
            Your account access has been temporarily restricted due to a suspected security or policy concern.
          </p>
          <p className="text-xs text-white/40 mb-8 max-w-xs mx-auto">
            If you believe this is an error, submit a verification review or contact our Trust & Safety team.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/support"
              className="flex-1 flex items-center justify-center gap-2 az-btn-primary py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-lg hover:shadow-orange-500/20"
            >
              <HelpCircle className="w-4 h-4" />
              Contact Support
            </Link>
            <Link
              href="/auth/login"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
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
