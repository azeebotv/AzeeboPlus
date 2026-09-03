'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import analytics from '@/lib/analytics';

interface ResultData {
  id: string;
  title: string;
  type: 'poll' | 'quiz';
  totalVotes: number;
  totalParticipants: number;
  options: { id: string; label: string; votes: number; percentage: number; isCorrect?: boolean }[];
  correctAnswer?: string;
  userAnswer?: string;
  userCorrect?: boolean;
  pointsEarned?: number;
}

function ParticipationResultContent() {
  const params = useParams();
  const id = params?.id as string;
  useEffect(() => {
    analytics.pageView('participation-result');
  }, []);

  const query = useQuery({
    queryKey: ['participation', 'result', id],
    queryFn: async () => {
      const res = await api.request<ResultData>(`/api/v1/participation/${id}/result`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Result not found');
    },
    enabled: !!id,
  });

  const result = query.data;
  if (query.isLoading)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton height="300px" borderRadius="16" />
        </div>
      </div>
    );
  if (query.error || !result)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <ErrorState title="Result not found" description={query.error?.message} />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--brand-green)' }}
            >
              RESULTS
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
              style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: 'var(--brand-purple)' }}
            >
              {result.type}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{result.title}</h1>
          <p className="text-white/50 mb-8">
            {result.totalVotes.toLocaleString()} votes · {result.totalParticipants.toLocaleString()}{' '}
            participants
          </p>

          {result.userAnswer && (
            <div
              className={`p-4 rounded-xl mb-6 ${result.userCorrect ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'}`}
            >
              <p
                className={`font-semibold ${result.userCorrect ? 'text-green-400' : 'text-red-400'}`}
              >
                {result.userCorrect ? 'CheckCircle Correct!' : 'XCircle Incorrect'}
              </p>
              {result.pointsEarned !== undefined && (
                <p className="text-sm text-white/50 mt-1">+{result.pointsEarned} points earned</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {result.options.map((option, index) => {
              const isUserAnswer = option.id === result.userAnswer;
              const isCorrectAnswer = option.isCorrect;
              const barColor = isCorrectAnswer
                ? 'var(--brand-green)'
                : isUserAnswer && !isUserAnswer
                  ? 'var(--brand-red)'
                  : 'var(--brand-orange)';
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`az-glass p-4 ${isCorrectAnswer ? 'ring-1 ring-green-500/30' : ''}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-semibold">{option.label}</span>
                    <span className="text-white/60 text-sm">
                      {option.votes} votes ({option.percentage}%)
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${option.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: barColor }}
                    />
                  </div>
                  {isUserAnswer && (
                    <span className="text-xs text-white/40 mt-1 block">Your answer</span>
                  )}
                  {isCorrectAnswer && (
                    <span className="text-xs text-green-400/80 mt-1 block">
                      CheckCorrect answer
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>
      <AppFooter />
    </div>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: ParticipationResultContent }));
export default function ParticipationResultPage() {
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
