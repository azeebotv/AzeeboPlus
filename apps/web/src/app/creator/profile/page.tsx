'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Camera, CheckCircle2, User, Save } from 'lucide-react';

interface CreatorProfile {
  displayName: string;
  bio: string;
  avatar: string;
  socialLinks: { youtube: string; twitter: string; instagram: string };
}

export default function CreatorProfilePage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [youtube, setYoutube] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['creator', 'profile'],
    queryFn: async () => {
      const response = await apiFetch<CreatorProfile>('/v1/creators/me');
      if (response.success && response.data) {
        return response.data;
      }
      return {
        displayName: '',
        bio: '',
        avatar: '',
        socialLinks: { youtube: '', twitter: '', instagram: '' },
      };
    },
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setYoutube(profile.socialLinks?.youtube || '');
      setTwitter(profile.socialLinks?.twitter || '');
      setInstagram(profile.socialLinks?.instagram || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreatorProfile>) =>
      apiFetch('/v1/creators/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'profile'] });
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      displayName,
      bio,
      socialLinks: { youtube, twitter, instagram },
    });
  };

  if (isLoading) {
    return (
      <PageShell glowColor="rgba(232,66,10,0.15)">
        <div className="max-w-2xl mx-auto py-20 px-4 space-y-6">
          <Skeleton className="h-12 w-48 rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell glowColor="rgba(232,66,10,0.14)">
      <PageHero
        badge="Studio Identity"
        title="Creator Profile"
        description="Curate your public director persona, showcase social links, and update your artist bio."
      />

      <div className="max-w-2xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        <ScrollReveal>
          <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            {/* Avatar & Hero Info */}
            <div className="flex items-center gap-5 pb-6 border-b border-white/10">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group flex-shrink-0">
                {profile?.avatar ? (
                  <OptimizedImage
                    src={profile.avatar}
                    alt="Profile Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white/40" />
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                >
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                  />
                </label>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  {displayName || 'Verified Creator'}
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Visible publicly across movie credits and channel headers.
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="creator-name"
                  className="text-white text-xs font-semibold mb-2 block"
                >
                  Display Name
                </label>
                <input
                  id="creator-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Kunle Afolayan"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--brand-orange)] transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="creator-bio"
                  className="text-white text-xs font-semibold mb-2 block"
                >
                  Artist Bio
                </label>
                <textarea
                  id="creator-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your audience about your cinematic voice and upcoming projects..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--brand-orange)] transition-colors resize-y"
                />
              </div>

              <div className="pt-2">
                <span className="text-xs font-mono uppercase tracking-wider text-white/40 block mb-3">
                  External Channels & Portfolios
                </span>

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="creator-youtube"
                      className="text-white/60 text-xs font-medium mb-1 block"
                    >
                      YouTube Channel
                    </label>
                    <input
                      id="creator-youtube"
                      type="url"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[var(--brand-orange)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="creator-twitter"
                      className="text-white/60 text-xs font-medium mb-1 block"
                    >
                      X / Twitter Profile
                    </label>
                    <input
                      id="creator-twitter"
                      type="url"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://x.com/yourhandle"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[var(--brand-orange)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="creator-instagram"
                      className="text-white/60 text-xs font-medium mb-1 block"
                    >
                      Instagram Profile
                    </label>
                    <input
                      id="creator-instagram"
                      type="url"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[var(--brand-orange)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <AnimatePresence>
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Profile Updated
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="ml-auto">
                <motion.button
                  type="button"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="az-btn-primary px-7 py-2.5 rounded-full text-xs font-bold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
                </motion.button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </PageShell>
  );
}
