'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import analytics from '@/lib/analytics';

interface Challenge {
  id: string;
  title: string;
  description: string;
  universe: string;
  type: 'creative' | 'quiz' | 'prediction' | 'trivia';
  reward: number;
  deadline: string;
  participants: number;
  maxParticipants?: number;
  status: 'active' | 'ended' | 'upcoming';
  requirements: string[];
  prizes: { place: number; reward: number; label: string }[];
}

function ChallengeDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    analytics.pageView('challenge-detail');
  }, []);

  const query = useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      // Challenges live in lifestyle-service under the /challenges gateway
      // prefix — the /participation prefix has no gateway block.
      const res = await api.request<Challenge>(`/api/v1/challenges/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Challenge not found');
    },
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: async () =>
      api.request(`/api/v1/challenges/${id}/submit`, { method: 'POST' }),
    onSuccess: () => setSubmitted(true),
  });

  const challenge = query.data;
  if (query.isLoading)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton height="400px" borderRadius="16" />
        </div>
      </div>
    );
  if (query.error || !challenge)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <ErrorState
            title="Challenge not found"
            description={query.error?.message || 'This challenge may have been removed.'}
          />
        </div>
      </div>
    );

  const statusColor =
    challenge.status === 'active'
      ? 'var(--brand-green)'
      : challenge.status === 'upcoming'
        ? 'var(--brand-amber)'
        : 'var(--brand-grey)';
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(challenge.deadline).getTime() - Date.now()) / 86400000)
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
            >
              {(challenge.status ?? 'unknown').toUpperCase()}
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'rgba(232,66,10,0.15)', color: 'var(--brand-orange)' }}
            >
              {challenge.universe}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{challenge.title}</h1>
          <p className="text-white/60 text-lg mb-6">{challenge.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="az-glass p-4 text-center">
              <p className="text-2xl font-bold text-white">₦{challenge.reward.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">Reward</p>
            </div>
            <div className="az-glass p-4 text-center">
              <p className="text-2xl font-bold text-white">{challenge.participants}</p>
              <p className="text-xs text-white/40 mt-1">Participants</p>
            </div>
            <div className="az-glass p-4 text-center">
              <p className="text-2xl font-bold text-white">{daysLeft}d</p>
              <p className="text-xs text-white/40 mt-1">Days Left</p>
            </div>
            <div className="az-glass p-4 text-center">
              <p className="text-2xl font-bold text-white capitalize">{challenge.type}</p>
              <p className="text-xs text-white/40 mt-1">Type</p>
            </div>
          </div>

          {challenge.requirements.length > 0 && (
            <div className="az-glass p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-3">Requirements</h2>
              <ul className="space-y-2">
                {challenge.requirements.map((r, i) => (
                  <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {challenge.prizes.length > 0 && (
            <div className="az-glass p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-3">Prizes</h2>
              <div className="space-y-2">
                {challenge.prizes.map((p) => (
                  <div
                    key={p.place}
                    className="flex justify-between items-center py-2 border-b border-white/5"
                  >
                    <span className="text-white/60">{p.label}</span>
                    <span className="text-white font-semibold">₦{p.reward.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {challenge.status === 'active' && !submitted ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full az-btn-primary text-lg py-4"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Rocket Submit Entry'}
            </motion.button>
          ) : submitted ? (
            <div
              className="w-full text-center py-4 rounded-xl"
              style={{
                backgroundColor: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
              }}
            >
              <p className="text-green-400 font-semibold">CheckCircleEntry submitted! Good luck!</p>
            </div>
          ) : (
            <div
              className="w-full text-center py-4 rounded-xl"
              style={{
                backgroundColor: 'rgba(107,114,128,0.1)',
                border: '1px solid rgba(107,114,128,0.3)',
              }}
            >
              <p className="text-white/50 font-semibold">Challenge {challenge.status}</p>
            </div>
          )}
        </motion.div>
      </section>
      <AppFooter />
    </div>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: ChallengeDetailContent }));
export default function ChallengeDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
