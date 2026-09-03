'use client';
import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
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

const categoryIcons: Record<string, string> = {
  movies: 'Film',
  music: 'Music',
  sports: 'Circle',
  history: 'Scroll',
  science: 'FlaskConical',
  geography: 'Globe',
  general: 'Brain',
  nollywood: 'Film',
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
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Games" />

      {session && currentQuestion ? (
        /* Active Trivia Session */
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/50">
                Question {session.currentIndex + 1} of {session.questions.length}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--brand-orange)' }}>
                Score: {session.score}
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--brand-orange)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center mb-6">
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                border: `3px solid ${timeLeft <= 10 ? 'var(--color-error-500)' : 'var(--brand-orange)'}`,
                backgroundColor: timeLeft <= 10 ? 'rgba(239,68,68,0.1)' : 'rgba(232,66,10,0.1)',
              }}
              animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
            >
              <span
                className="text-2xl font-bold"
                style={{ color: timeLeft <= 10 ? 'var(--color-error-500)' : 'var(--brand-orange)' }}
              >
                {timeLeft}
              </span>
            </motion.div>
          </div>

          {/* Question */}
          <ScrollReveal>
            <GlowCard universe="games" className="p-8 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-8">
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
                      className="p-4 rounded-xl text-left font-medium transition-all"
                      style={{
                        border: `2px solid ${
                          isCorrect
                            ? 'var(--color-success-500)'
                            : isWrong
                              ? 'var(--color-error-500)'
                              : isSelected
                                ? 'var(--brand-orange)'
                                : 'rgba(255,255,255,0.1)'
                        }`,
                        backgroundColor: isCorrect
                          ? 'rgba(34,197,94,0.1)'
                          : isWrong
                            ? 'rgba(239,68,68,0.1)'
                            : isSelected
                              ? 'rgba(232,66,10,0.1)'
                              : 'rgba(255,255,255,0.05)',
                        color: 'var(--brand-white)',
                      }}
                      whileHover={!selectedAnswer ? { scale: 1.02 } : undefined}
                      whileTap={!selectedAnswer ? { scale: 0.98 } : undefined}
                    >
                      <span className="text-sm text-white/40 mr-2">
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
                className="inline-block px-6 py-3 rounded-xl mb-4"
                style={{
                  backgroundColor: lastResult.correct
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(239,68,68,0.15)',
                  border: `1px solid ${lastResult.correct ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}
              >
                <span
                  className="text-lg font-bold"
                  style={{
                    color: lastResult.correct
                      ? 'var(--color-success-500)'
                      : 'var(--color-error-500)',
                  }}
                >
                  {lastResult.correct ? `Correct! +${lastResult.points} pts` : 'Wrong!'}
                </span>
              </div>
              {!lastResult.correct && (
                <p className="text-white/50 mb-4">The answer was: {lastResult.correctAnswer}</p>
              )}
              <motion.button
                type="button"
                onClick={handleNext}
                className="az-btn-primary px-8"
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
          {/* Hero */}
          <section
            className="relative py-16 sm:py-20"
            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #1A0A0A 100%)' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.h1
                className="text-4xl sm:text-5xl font-bold text-white mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                BrainTrivia
              </motion.h1>
              <motion.p
                className="text-xl text-white/80 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Test your knowledge and earn rewards
              </motion.p>
            </div>
          </section>

          {/* Categories Grid */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <ScrollReveal>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
                Choose a Category
              </h2>
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
                      <div
                        className="h-44 flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, rgba(139,92,246,0.3), #1A0A0A)`,
                        }}
                      >
                        <span className="text-6xl">
                          {categoryIcons[category.name?.toLowerCase()] || 'Brain'}
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-white text-lg mb-1">{category.name}</h3>
                        <p className="text-sm text-white/50 mb-4 line-clamp-2">
                          {category.description}
                        </p>
                        <p className="text-xs text-white/40 mb-4">
                          {category.questionCount} questions
                        </p>
                        <motion.button
                          type="button"
                          onClick={() => startSessionMutation.mutate(category.id)}
                          disabled={startSessionMutation.isPending}
                          className="az-btn-primary w-full"
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
              <div className="text-center py-12">
                <p className="text-lg text-white/50">No trivia categories available yet</p>
              </div>
            )}
          </section>

          {/* Leaderboard Link */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="az-glass p-6 rounded-xl text-center">
              <p className="text-white/50 mb-3">Want to see how you rank?</p>
              <Link href="/games/leaderboard">
                <motion.button
                  type="button"
                  className="px-6 py-2 rounded-full text-sm font-semibold"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'var(--brand-white)',
                  }}
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

      <AppFooter />

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg transition-all"
          style={{
            backgroundColor:
              toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? 'var(--color-success-500)' : 'var(--color-error-500)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

const LazyTriviaPage = lazy(() => Promise.resolve({ default: TriviaPageContent }));

export default function TriviaPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyTriviaPage />
    </Suspense>
  );
}
