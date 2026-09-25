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
    <PageShell glowColor="rgba(245,158,11,0.15)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/15 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white mx-auto mb-6 shadow-[0_8px_32px_rgba(245,158,11,0.3)]">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
            18+ Content Rating Filter
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Age-Gated Cinema
          </h1>
          <p className="text-white/60 text-sm mb-4 leading-relaxed max-w-sm mx-auto">
            This title contains mature themes, violence, or explicit dialogue requiring verified adult age approval under Nigerian & African broadcast regulations.
          </p>
          <p className="text-xs text-white/40 mb-8 max-w-xs mx-auto">
            Update your profile birthdate or enter your parental PIN to unlock mature titles.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/profile"
              className="flex-1 flex items-center justify-center gap-2 az-btn-primary py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-lg hover:shadow-orange-500/20"
            >
              <UserCheck className="w-4 h-4" />
              Verify Age in Profile
            </Link>
            <Link
              href="/home"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
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
