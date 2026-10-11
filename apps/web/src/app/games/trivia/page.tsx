'use client';
import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import {
  Film,
  Music,
  Trophy,
  Scroll,
  FlaskConical,
  Globe,
  Brain,
  type LucideIcon,
} from 'lucide-react';
import analytics from '@/lib/analytics';

interface TriviaCategory {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  icon: string;
}

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  timeLimit: number;
}

interface TriviaResult {
  correct: boolean;
  correctAnswer: string;
  points: number;
  totalScore: number;
}

interface TriviaSession {
  sessionId: string;
  questions: TriviaQuestion[];
  currentIndex: number;
  score: number;
  totalAnswered: number;
}

const categoryIcons: Record<string, LucideIcon> = {
  movies: Film,
  music: Music,
  sports: Trophy,
  history: Scroll,
  science: FlaskConical,
  geography: Globe,
  general: Brain,
  nollywood: Film,
};

function TriviaPageContent(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<TriviaSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<TriviaResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    analytics.pageView('games-trivia');
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const categoriesQuery = useQuery({
    queryKey: ['trivia-categories'],
    queryFn: async () => {
      const res = await apiFetch<TriviaCategory[]>('/api/v1/games/trivia');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load trivia categories');
    },
    staleTime: 300000,
  });

  const startSessionMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await apiFetch<{ sessionId: string; questions: TriviaQuestion[] }>(
        '/api/v1/games/sessions',
        { method: 'POST', body: JSON.stringify({ challengeId: categoryId }) }
      );
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to start trivia session');
    },
    onSuccess: (data) => {
      setSession({
        sessionId: data.sessionId,
        questions: data.questions,
        currentIndex: 0,
        score: 0,
        totalAnswered: 0,
      });
      setTimeLeft(data.questions[0]?.timeLimit || 30);
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' });
    },
  });

  const answerMutation = useMutation({
    mutationFn: async ({ answer }: { questionId: string; answer: string }) => {
      const res = await apiFetch<TriviaResult>(
        `/api/v1/games/sessions/${session?.sessionId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({
            answer,
          }),
        }
      );
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to submit answer');
    },
    onSuccess: (result) => {
      setLastResult(result);
      setShowResult(true);
      if (session) {
        setSession({
          ...session,
          score: result.totalScore,
          totalAnswered: session.totalAnswered + 1,
        });
      }
    },
  });

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!session || selectedAnswer) return;
      setSelectedAnswer(answer);
      const currentQuestion = session.questions[session.currentIndex];
      answerMutation.mutate({ questionId: currentQuestion.id, answer });
    },
    [session, selectedAnswer, answerMutation]
  );

  const handleNext = useCallback(() => {
    if (!session) return;
    setShowResult(false);
    setSelectedAnswer(null);
    setLastResult(null);

    if (session.currentIndex < session.questions.length - 1) {
      const nextIndex = session.currentIndex + 1;
      setSession({ ...session, currentIndex: nextIndex });
      setTimeLeft(session.questions[nextIndex].timeLimit || 30);
    } else {
      setSession(null);
      queryClient.invalidateQueries({ queryKey: ['leaderboard', 'games'] });
    }
  }, [session, queryClient]);

  useEffect(() => {
    if (!session || showResult || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session, showResult, timeLeft, handleAnswer]);

  const categories: TriviaCategory[] = categoriesQuery.data ?? [];
  const isLoading = categoriesQuery.isLoading;
  const error = categoriesQuery.error?.message;

  const currentQuestion = session?.questions[session.currentIndex];
  const progress = session ? ((session.currentIndex + 1) / session.questions.length) * 100 : 0;

  return (
    <PageShell
      activeNav="Games"
      maxWidth="7xl"
      glowColor="color-mix(in srgb, var(--brand-purple) 14%, transparent)"
    >
      {session && currentQuestion ? (
        /* Active Trivia Session */
        <div className="mx-auto max-w-3xl py-2 sm:py-4">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <span className="az-body text-az-ink/50">
                Question {session.currentIndex + 1} of {session.questions.length}
              </span>
              <span className="az-body-strong text-az-flame">Score: {session.score}</span>
            </div>
            <div className="h-2 rounded-az-pill bg-az-ink/10">
              <motion.div
                className="h-full rounded-az-pill bg-az-flame"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="mb-6 flex items-center justify-center">
            <motion.div
              className={`flex size-16 items-center justify-center rounded-az-pill border-[3px] ${
                timeLeft <= 10
                  ? 'border-az-error-500 bg-az-error-500/10'
                  : 'border-az-flame bg-az-scarlet/10'
              }`}
              animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
            >
              <span
                className={`az-section-title ${
                  timeLeft <= 10 ? 'text-az-error-500' : 'text-az-flame'
                }`}
              >
                {timeLeft}
              </span>
            </motion.div>
          </div>

          {/* Question */}
          <ScrollReveal>
            <GlowCard universe="games" className="mb-8 p-8">
              <h2 className="az-title mb-8 text-center text-az-ink sm:az-section-title">
                {currentQuestion.question}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = showResult && option === lastResult?.correctAnswer;
                  const isWrong = showResult && isSelected && !lastResult?.correct;

                  return (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={() => handleAnswer(option)}
                      disabled={!!selectedAnswer}
                      className={`az-lead rounded-az-card border-2 p-4 text-left text-az-ink transition-all ${
                        isCorrect
                          ? 'border-az-success-500 bg-az-success-500/10'
                          : isWrong
                            ? 'border-az-error-500 bg-az-error-500/10'
                            : isSelected
                              ? 'border-az-flame bg-az-scarlet/10'
                              : 'border-az-ink/10 bg-az-ink/5'
                      }`}
                      whileHover={!selectedAnswer ? { scale: 1.02 } : undefined}
                      whileTap={!selectedAnswer ? { scale: 0.98 } : undefined}
                    >
                      <span className="az-body mr-2 text-az-ink/40">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </motion.button>
                  );
                })}
              </div>
            </GlowCard>
          </ScrollReveal>

          {/* Result & Next */}
          {showResult && lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div
                className={`mb-4 inline-block rounded-az-card border px-6 py-3 ${
                  lastResult.correct
                    ? 'bg-az-success-500/15 border-az-success-500/30'
                    : 'bg-az-error-500/15 border-az-error-500/30'
                }`}
              >
                <span
                  className={`az-subtitle ${
                    lastResult.correct ? 'text-az-success-500' : 'text-az-error-500'
                  }`}
                >
                  {lastResult.correct ? `Correct! +${lastResult.points} pts` : 'Wrong!'}
                </span>
              </div>
              {!lastResult.correct && (
                <p className="az-lead mb-4 text-az-ink/50">
                  The answer was: {lastResult.correctAnswer}
                </p>
              )}
              <motion.button
                type="button"
                onClick={handleNext}
                className="az-btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {session.currentIndex < session.questions.length - 1
                  ? 'Next Question'
                  : 'View Results'}
              </motion.button>
            </motion.div>
          )}
        </div>
      ) : (
        /* Category Selection */
        <>
          <PageHero
            eyebrow="Games Universe"
            title="BrainTrivia"
            subtitle="Test your knowledge and earn rewards"
            accentColor="var(--brand-purple)"
            glowColor="color-mix(in srgb, var(--brand-purple) 16%, transparent)"
          />

          {/* Categories Grid */}
          <section className="py-2 sm:py-4">
            <ScrollReveal>
              <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">Choose a Category</h2>
            </ScrollReveal>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="az-glass overflow-hidden">
                    <Skeleton height="180px" borderRadius="0" />
                    <div className="p-4 space-y-3">
                      <Skeleton height="20px" width="70%" />
                      <Skeleton height="16px" width="50%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <ErrorState
                title="Failed to load trivia categories"
                description={error}
                onButtonPress={() => categoriesQuery.refetch()}
              />
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlowCard universe="games" className="overflow-hidden">
                      {(() => {
                        const CategoryIcon = categoryIcons[category.name?.toLowerCase()] || Brain;
                        return (
                          <div className="group relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--brand-purple)]/25 to-az-surface-root/85">
                            <div className="flex size-20 items-center justify-center rounded-az-panel border border-[var(--brand-purple)]/30 bg-[var(--brand-purple)]/15 text-[var(--brand-purple-light)] shadow-xl shadow-[var(--brand-purple)]/10 transition-all duration-300 group-hover:scale-110 group-hover:border-[var(--brand-purple-light)]/50">
                              <CategoryIcon size={38} strokeWidth={1.75} />
                            </div>
                          </div>
                        );
                      })()}
                      <div className="p-5">
                        <h3 className="az-subtitle mb-1 text-az-ink">{category.name}</h3>
                        <p className="az-body mb-4 line-clamp-2 text-az-ink/50">
                          {category.description}
                        </p>
                        <p className="az-caption mb-4 text-az-ink/40">
                          {category.questionCount} questions
                        </p>
                        <motion.button
                          type="button"
                          onClick={() => startSessionMutation.mutate(category.id)}
                          disabled={startSessionMutation.isPending}
                          className="az-btn-primary"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {startSessionMutation.isPending ? 'Starting...' : 'Start Trivia'}
                        </motion.button>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="az-lead text-az-ink-muted">No trivia categories available yet</p>
              </div>
            )}
          </section>

          {/* Leaderboard Link */}
          <section className="pb-12">
            <div className="az-glass p-6 text-center">
              <p className="az-lead mb-3 text-az-ink/50">Want to see how you rank?</p>
              <Link href="/games/leaderboard">
                <motion.button
                  type="button"
                  className="az-body-strong rounded-az-pill border border-az-ink/20 bg-az-ink/10 px-6 py-2 text-az-ink"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Leaderboard
                </motion.button>
              </Link>
            </div>
          </section>
        </>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-az-card border px-6 py-3 shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-az-success-500/15 border-az-success-500/30 text-az-success-500'
              : 'bg-az-error-500/15 border-az-error-500/30 text-az-error-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </PageShell>
  );
}

const LazyTriviaPage = lazy(() => Promise.resolve({ default: TriviaPageContent }));

export default function TriviaPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyTriviaPage />
    </Suspense>
  );
}
