'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import type { Challenge, ChallengeSubmission } from '@/lib/api/creator';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Users, Award, ArrowRight, X, Send, Trophy } from 'lucide-react';

type FilterTab = 'all' | 'active' | 'upcoming' | 'completed';
type ViewTab = 'challenges' | 'submissions';

export default function CreatorChallengesPage(): React.JSX.Element {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [view, setView] = useState<ViewTab>('challenges');
  const [, setSubmittingId] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitDesc, setSubmitDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const challengesQuery = useQuery({
    queryKey: ['creator-challenges', filter],
    queryFn: async () => {
      const res = await api.creator.getChallenges(1, 50);
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load challenges');
      return res.data.items;
    },
    staleTime: 30000,
  });

  const submissionsQuery = useQuery({
    queryKey: ['creator-challenge-submissions'],
    queryFn: async () => {
      const res = await api.creator.getMyChallengeSubmissions(1, 50);
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load submissions');
      return res.data.items;
    },
    staleTime: 30000,
    enabled: view === 'submissions',
  });

  const challenges: Challenge[] = challengesQuery.data ?? [];
  const submissions: ChallengeSubmission[] = submissionsQuery.data ?? [];
  const isLoading = challengesQuery.isLoading;
  const isSubmissionsLoading = submissionsQuery.isLoading;
  const error = challengesQuery.error?.message || null;

  const filtered = filter === 'all' ? challenges : challenges.filter((c) => c.status === filter);

  const handleSubmit = async () => {
    if (!selectedChallenge || !submitUrl.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.creator.submitChallengeEntry({
        challengeId: selectedChallenge.id,
        contentUrl: submitUrl.trim(),
        description: submitDesc.trim(),
      });
      if (res.success) {
        setSelectedChallenge(null);
        setSubmitUrl('');
        setSubmitDesc('');
        submissionsQuery.refetch();
      } else {
        throw new Error(res.message || 'Submission failed');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
      setSubmittingId(null);
    }
  };

  return (
    <PageShell glowColor="rgba(232,66,10,0.14)">
      <PageHero
        badge="Community Bounties"
        title="Creator Challenges"
        description="Compete in filmmaking & storytelling prompts, showcase your craft, and earn rewards and platform distribution."
      />

      <div className="max-w-4xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Mode & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 rounded-full az-glass border border-white/10 self-start">
            {(['challenges', 'submissions'] as const).map((v) => {
              const isActive = view === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[var(--brand-orange)] text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {v === 'challenges' ? 'Available Challenges' : 'My Submissions'}
                </button>
              );
            })}
          </div>

          {view === 'challenges' && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'active', 'upcoming', 'completed'] as FilterTab[]).map((f) => {
                const isSelected = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all ${
                      isSelected
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {view === 'challenges' ? (
          isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="az-glass p-6 rounded-2xl border border-white/10 space-y-3">
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-2/3 rounded-md" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto py-12">
              <ErrorState
                title="Failed to load challenges"
                description={error}
                onButtonPress={() => challengesQuery.refetch()}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="az-glass p-12 text-center rounded-3xl border border-white/10">
              <Trophy className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Challenges Found</h3>
              <p className="text-xs text-white/50">Check back soon for new prompt announcements.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((challenge) => (
                <ScrollReveal key={challenge.id}>
                  <div className="az-glass p-6 sm:p-7 rounded-3xl border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {challenge.title}
                        </h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {challenge.description}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-mono uppercase px-3 py-1 rounded-full border self-start ${
                          challenge.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : challenge.status === 'upcoming'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-white/5 text-white/40 border-white/10'
                        }`}
                      >
                        {challenge.status}
                      </span>
                    </div>

                    {challenge.rules && challenge.rules.length > 0 && (
                      <div className="mb-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                          Submission Guidelines:
                        </span>
                        {challenge.rules.slice(0, 2).map((rule, idx) => (
                          <p key={idx} className="text-xs text-white/60 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[var(--brand-orange)]" />
                            {rule}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5 text-xs text-white/50">
                      <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-white/40" />
                          {challenge.participantCount.toLocaleString()} creators entered
                        </span>
                        <span className="flex items-center gap-1.5 text-white/80 font-semibold">
                          <Award className="w-4 h-4 text-[var(--brand-orange)]" />
                          Prize: {challenge.rewardPoints} pts
                        </span>
                      </div>

                      {challenge.status === 'active' && (
                        <motion.button
                          type="button"
                          onClick={() => setSelectedChallenge(challenge)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="az-btn-primary px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 ml-auto"
                        >
                          Submit Entry
                          <ArrowRight className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )
        ) : isSubmissionsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="az-glass p-6 rounded-2xl border border-white/10 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="az-glass p-12 text-center rounded-3xl border border-white/10">
            <Trophy className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Submissions Recorded</h3>
            <p className="text-xs text-white/50">
              Submit your entries to active challenges to view feedback and status here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="az-glass p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-white">{sub.challengeTitle}</h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    Submitted: {new Date(sub.createdAt).toLocaleDateString()}
                  </p>
                  {sub.reviewerNote && (
                    <p className="text-xs text-white/60 mt-1 italic">
                      Note: {sub.reviewerNote}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-mono uppercase px-3 py-1 rounded-full border self-start sm:self-center ${
                    sub.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : sub.status === 'rejected'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {sub.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="az-glass p-6 sm:p-8 rounded-3xl border border-white/15 max-w-lg w-full space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Submit to Challenge</h2>
                  <p className="text-xs text-[var(--brand-orange)] font-semibold mt-0.5">
                    {selectedChallenge.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChallenge(null)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white text-xs font-semibold mb-2 block">
                    Content URL (Video or Drive link)
                  </label>
                  <input
                    type="url"
                    value={submitUrl}
                    onChange={(e) => setSubmitUrl(e.target.value)}
                    placeholder="https://azeebo.plus/watch/... or external link"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--brand-orange)]"
                  />
                </div>

                <div>
                  <label className="text-white text-xs font-semibold mb-2 block">
                    Director Statement / Description
                  </label>
                  <textarea
                    value={submitDesc}
                    onChange={(e) => setSubmitDesc(e.target.value)}
                    placeholder="Explain the narrative angle and how your entry adheres to the prompt..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--brand-orange)] resize-y"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedChallenge(null)}
                  className="flex-1 py-3 rounded-full border border-white/10 text-white/60 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!submitUrl.trim() || isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 az-btn-primary py-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
