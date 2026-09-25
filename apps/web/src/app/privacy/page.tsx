import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ShieldCheck, Lock, Database, Globe, UserCheck, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - Azeebo+',
  description: 'Data privacy disclosures, user rights, and retention practices on Azeebo+',
};

export default function PrivacyPolicyPage() {
  return (
    <PageShell activeNav="Support">
      <PageHero
        badge="Data Protection & NDPR Compliance"
        title="Privacy Disclosures"
        subtitle="Transparent information on how Azeebo+ securely collects, encrypts, and processes your streaming and account data."
        accentColor="orange"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <span className="text-xs text-white/50 uppercase tracking-widest font-mono font-bold">
            Nigeria Data Protection Act (NDPA) & GDPR Compliant
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
            <ShieldCheck size={14} />
            <span>256-Bit Encrypted Data Vault</span>
          </div>
        </div>

        {/* 1. Introduction */}
        <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
            <Globe size={18} className="text-orange-400" />
            <span>1. Introduction & Operating Entity</span>
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Virtual Media Network Limited (&quot;Azeebo+&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is deeply committed to safeguarding your personal data. This Privacy Policy details how we collect, store, utilize, and protect your information across our web portals, smart TV applications, and mobile interfaces.
          </p>
        </div>

        {/* 2. Data Collection */}
        <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
            <Database size={18} className="text-orange-400" />
            <span>2. Categories of Information Collected</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-white/60">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <h3 className="font-bold text-white text-sm mb-1.5">Direct Information</h3>
              <p>Account email, encrypted password hashes, display name, user avatar, and voluntary survey or challenge submissions.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <h3 className="font-bold text-white text-sm mb-1.5">Usage & Viewing Telemetry</h3>
              <p>Watch history, playback resume timestamps, audio/subtitle preferences, search queries, and reality voting event inputs.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <h3 className="font-bold text-white text-sm mb-1.5">Device & Network Metadata</h3>
              <p>Operating system, browser fingerprint, screen resolution, connection bitrate, and broad city-level IP geolocation.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <h3 className="font-bold text-white text-sm mb-1.5">Payment Tokenization</h3>
              <p>CBN-authorized payment gateway tokens. We never store raw debit/credit card CVV or full PIN credentials.</p>
            </div>
          </div>
        </div>

        {/* 3. Retention Table */}
        <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
            <Lock size={18} className="text-orange-400" />
            <span>3. Data Retention Lifecycle</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-wider">
                  <th className="py-3 px-2">Data Classification</th>
                  <th className="py-3 px-2">Retention Duration</th>
                  <th className="py-3 px-2">Primary Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/70">
                <tr>
                  <td className="py-3 px-2 font-semibold text-white">Active Account Profile</td>
                  <td className="py-3 px-2">Duration of account active life + 30 days</td>
                  <td className="py-3 px-2">Service delivery & authentication</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-semibold text-white">Watch History & Telemetry</td>
                  <td className="py-3 px-2">12 Months rolling</td>
                  <td className="py-3 px-2">Personalized recommendations & codex unlocks</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-semibold text-white">Azeebo Pay & Banking Ledger</td>
                  <td className="py-3 px-2">7 Years (CBN & FIRS statutory mandate)</td>
                  <td className="py-3 px-2">Tax compliance & dispute verification</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-semibold text-white">Temporary Device Downloads</td>
                  <td className="py-3 px-2">Up to 30 days or manual deletion</td>
                  <td className="py-3 px-2">Offline player media cache</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. User Rights */}
        <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
            <UserCheck size={18} className="text-orange-400" />
            <span>4. Your Privacy Rights (NDPA & GDPR)</span>
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            You hold the right to request a full portable copy of your account data, demand correction of inaccurate records, request permanent deletion of your profile, or withdraw consent for analytical telemetry. Contact our Data Protection Officer at privacy@azeeboplus.com to execute these requests.
          </p>
        </div>

        {/* Contact DPO */}
        <div className="az-glass p-8 rounded-3xl border border-white/10 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3 border border-orange-500/20">
            <Mail size={22} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Data Protection Officer</h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto mb-4">
            Virtual Media Network Limited • Legal & Privacy Compliance Unit, Lagos, Nigeria.
          </p>
          <a
            href="mailto:privacy@azeeboplus.com"
            className="az-btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold"
          >
            <span>Contact Privacy Office</span>
          </a>
        </div>
      </div>
    </PageShell>
  );
}

