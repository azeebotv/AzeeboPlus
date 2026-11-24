import type { Metadata } from 'next';
import Link from 'next/link';
import { Film, Compass, Home } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export const metadata: Metadata = {
  title: 'Content Unavailable - Azeebo+',
  description: 'This title is currently not available in our catalog.',
};

export default function ContentUnavailablePage(): React.JSX.Element {
  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 12%, transparent)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center border border-az-glass-border relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--color-az-flame)]/15 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-az-scarlet to-az-flame flex items-center justify-center text-az-ink mx-auto mb-6 shadow-az-glow">
            <Film className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-az-glass-fill border border-az-glass-border text-az-ink/60 text-xs font-semibold mb-4">
            Catalog Notice
          </div>

          <h1 className="az-headline text-2xl sm:text-3xl font-extrabold text-az-ink mb-3">
            Content Unavailable
          </h1>
          <p className="text-az-ink/60 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            This title has completed its theatrical run or is currently undergoing remastering.
            Browse our trending African premieres and Nollywood originals.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/movies"
              className="flex-1 flex items-center justify-center gap-2 az-btn-primary tracking-wide shadow-lg hover:shadow-az-flame/20"
            >
              <Compass className="w-4 h-4" />
              Explore Movies
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
