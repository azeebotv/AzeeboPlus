'use client';

import Link from 'next/link';
import { Shield, Flag, ClipboardList, Smartphone, Search, ArrowRight, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';

const modLinks = [
  {
    href: '/moderation/report',
    label: 'Report Inappropriate Content',
    desc: 'Submit a confidential report regarding violations, piracy, hate speech, or harassment.',
    badge: 'Submit',
    icon: Flag,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    href: '/moderation/status',
    label: 'Track Report Status',
    desc: 'Review historical dispute resolutions, moderator notes, and current ticket review queues.',
    badge: 'Real-time',
    icon: ClipboardList,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    href: '/moderation/mobile-report',
    label: 'Mobile In-App Reporting',
    desc: 'Rapid swipe-and-report interface optimized for mobile viewport devices and live streams.',
    badge: 'Mobile Optimized',
    icon: Smartphone,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    href: '/moderation/mobile-status',
    label: 'Lookup Ticket by ID',
    desc: 'Instantly query resolution timestamps and status codes for specific incident reports.',
    badge: 'Lookup',
    icon: Search,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
];

export default function ModerationPage(): React.JSX.Element {
  return (
    <PageShell glowColor="rgba(232,66,10,0.12)">
      <PageHero
        badge="Trust & Safety"
        title="Moderation & Safety Center"
        description="Azeebo+ is dedicated to protecting African creators, viewers, and artists. Help maintain our community integrity by reporting violations and tracking moderation enforcement."
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {/* Hub Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12">
          {modLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="az-glass p-6 sm:p-7 rounded-3xl border border-white/10 hover:border-orange-500/30 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] group-hover:bg-orange-500/10 transition-colors rounded-full blur-2xl pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${link.bg}`}>
                      <Icon className={`w-6 h-6 ${link.color}`} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                      {link.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-orange-400 transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {link.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-white/60 group-hover:text-white transition-colors">
                  <span>Open Tool</span>
                  <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Safety Standards Manifesto */}
        <div className="az-glass p-8 sm:p-10 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#e8420a] to-[#cc1c1c] flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Our Enforcement Protocol</h3>
              <p className="text-xs text-white/50">Human-verified 24/7 review across 14 African regions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-white/60">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-white font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Zero Tolerance for Hate
              </div>
              <p className="leading-relaxed">
                Discriminatory harassment, hate speech, or tribal hostility leads to immediate account deplatforming.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-white font-bold">
                <Lock className="w-4 h-4 text-emerald-400" />
                Copyright & IP Protection
              </div>
              <p className="leading-relaxed">
                Automated fingerprinting detects unauthorized uploads, protecting African filmmakers and composers.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-white font-bold">
                <Shield className="w-4 h-4 text-orange-400" />
                Child & Family Safety
              </div>
              <p className="leading-relaxed">
                Strict age-gating and vertical parental locks prevent underage exposure to explicit media.
              </p>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
