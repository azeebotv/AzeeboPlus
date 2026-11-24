import type { Metadata } from 'next';
import Link from 'next/link';
import { Wrench, Clock, MessageSquare, Sparkles } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export const metadata: Metadata = {
  title: 'System Maintenance - Azeebo+',
  description: 'Azeebo+ is undergoing scheduled infrastructure upgrades.',
};

export default function MaintenancePage(): React.JSX.Element {
  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-warning-500) 15%, transparent)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center border border-az-glass-border relative overflow-hidden">
          {/* Ambient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-az-warning-500/15 blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-az-warning-500 to-az-flame flex items-center justify-center text-az-ink mx-auto mb-6 shadow-az-glow-warning">
            <Wrench className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-az-warning-500/10 border border-az-warning-500/20 text-az-warning-400 text-xs font-semibold mb-4">
            <Clock className="w-3.5 h-3.5" />
            Scheduled Infrastructure Upgrade
          </div>

          <h1 className="az-headline text-2xl sm:text-3xl font-extrabold text-az-ink mb-3">
            Under Scheduled Maintenance
          </h1>
          <p className="text-az-ink/60 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            We are upgrading our African CDN edge relays and live stream clusters to provide
            smoother 4K playback. We&apos;ll be back online momentarily.
          </p>

          <div className="space-y-3 mb-8">
            <Link
              href="/support"
              className="flex items-center justify-center gap-2 az-btn-primary tracking-wide shadow-lg hover:shadow-az-flame/20"
            >
              <MessageSquare className="w-4 h-4" />
              Check Status & Support
            </Link>
          </div>

          <div className="pt-6 border-t border-az-glass-border text-xs text-az-ink/40 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-az-warning-400" />
            <span>Expected restoration in less than 30 minutes</span>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
