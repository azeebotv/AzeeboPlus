import type { Metadata } from 'next';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ShieldCheck, HeartHandshake, Film, Vote, Award, Flag, Copyright, Lock, AlertTriangle, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Guidelines - Azeebo+',
  description: 'Community conduct, creator integrity, and voting standards on Azeebo+',
};

const GUIDELINES = [
  {
    num: '01',
    title: 'Mutual Respect & Inclusive Culture',
    icon: HeartHandshake,
    body: 'Treat all fans, creators, and cast members with dignity. Harassment, targeted bullying, hate speech, and discriminatory attacks are strictly prohibited across all community chatrooms, voting comments, and live event threads.',
  },
  {
    num: '02',
    title: 'Cinema & Streaming Content Standards',
    icon: Film,
    body: 'All media, trailers, and fan-submitted material must comply with Nigerian NBC regulations and global safety laws. Prohibited material includes non-consensual content, gratuitous real-world violence, disinformation, and unlawful commercial solicitation.',
  },
  {
    num: '03',
    title: 'Fair Voting & Eviction Integrity',
    icon: Vote,
    body: 'Azeebo reality voting uses tamper-evident audit ledger logging. The use of automated scripts, headless bots, emulator farms, or payment manipulation to inflate contestant votes will result in disqualification of votes and permanent wallet forfeiture.',
  },
  {
    num: '04',
    title: 'Creator Transparency & Originality',
    icon: Award,
    body: 'Verified studio creators and independent filmmakers must uphold authenticity. Misleading thumbnails, stolen footage, artificial engagement farms, and deceptive monetization claims trigger immediate loss of creator monetization privileges.',
  },
  {
    num: '05',
    title: 'Proactive Moderation & In-App Reporting',
    icon: Flag,
    body: 'If you witness guideline infractions in comments, live chat, or universe forums, utilize the instant reporting tool. Our 24/7 human Trust & Safety team investigates all reports with swift warning strikes or bans.',
  },
  {
    num: '06',
    title: 'Intellectual Property & Nollywood Copyright',
    icon: Copyright,
    body: 'Respect original film scores, screenplays, and footage rights. Unauthorized rebroadcasting, stream ripping, or re-uploading copyrighted Azeebo+ originals onto external video portals will trigger immediate DMCA takedowns and statutory remedies.',
  },
  {
    num: '07',
    title: 'Privacy & Personal Data Safeguards',
    icon: Lock,
    body: 'Do not publish personal phone numbers, physical addresses, real names, or private correspondence of creators or members without explicit consent. Protect your login credentials and enable two-factor authentication.',
  },
  {
    num: '08',
    title: 'Graduated Enforcement & Penalties',
    icon: Scale,
    body: 'Depending on infraction severity, enforcement actions range from content demotion and temporary chat mutes to full account termination, wallet freeze, and legal referrals for criminal conduct.',
  },
];

export default function GuidelinesPage(): React.JSX.Element {
  return (
    <PageShell activeNav="Support">
      <PageHero
        badge="Trust & Safety Standards"
        title="Community Guidelines"
        subtitle="Our code of conduct ensuring a safe, thrilling, and respectful cinematic community for African creators and global audiences."
        accentColor="orange"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <span className="text-xs text-white/50 uppercase tracking-widest font-mono font-bold">
            Policy Version 4.2 • Effective July 2026
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
            <ShieldCheck size={14} />
            <span>Verified Safety Protocol</span>
          </div>
        </div>

        <div className="space-y-4">
          {GUIDELINES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.num}
                className="az-glass p-6 sm:p-7 rounded-3xl border border-white/10 hover:border-orange-500/30 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0 border border-orange-500/20 group-hover:scale-105 transition-transform">
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-black text-orange-400 tracking-widest font-mono">
                        {item.num}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                        {item.title}
                      </h2>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 az-glass p-8 rounded-3xl border border-white/10 text-center">
          <AlertTriangle size={24} className="text-orange-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Notice of Policy Evolution</h3>
          <p className="text-xs text-white/50 max-w-lg mx-auto">
            Azeebo+ updates these safety standards periodically as new participatory features, reality formats, and community tools launch. Significant modifications are communicated via member push notifications.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

