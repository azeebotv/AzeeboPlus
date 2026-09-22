import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe2, Home, Compass } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export const metadata: Metadata = {
  title: 'Territory Rights Notice - Azeebo+',
  description: 'This title is not available in your current region.',
};

export default function RightsUnavailablePage(): React.JSX.Element {
  return (
    <PageShell glowColor="rgba(232,66,10,0.12)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--brand-orange)]/15 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#e8420a] to-[#cc1c1c] flex items-center justify-center text-white mx-auto mb-6 shadow-[0_8px_32px_rgba(232,66,10,0.3)]">
            <Globe2 className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-semibold mb-4">
            Geographic Licensing Notice
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Unavailable in Your Region
          </h1>
          <p className="text-white/60 text-sm mb-4 leading-relaxed max-w-sm mx-auto">
            Broadcast distribution rights for this title are currently restricted in your geographic territory.
          </p>
          <p className="text-xs text-white/40 mb-8 max-w-xs mx-auto">
            We continuously work with African studio distributors to expand streaming licensing across all continents and territories.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/home"
              className="flex-1 flex items-center justify-center gap-2 az-btn-primary py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-lg hover:shadow-orange-500/20"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>
            <Link
              href="/movies"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
            >
              <Compass className="w-4 h-4" />
              Browse Available
            </Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
