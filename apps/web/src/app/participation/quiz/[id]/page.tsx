'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ArrowLeft, Trophy, Sparkles, ArrowRight } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctOptionId?: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  timeLimit?: number;
  isActive: boolean;
}

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  pointsEarned: number;
}

export default function QuizDetailPage(): React.JSX.Element {
  const params = useParams();
  const quizId = params.id as string;
  const { user: _user } = useAuth();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const {
    data: quiz,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const res = await apiFetch<Quiz>(`/v1/engagement/quizzes/${quizId}`);
      return res.success && res.data ? res.data : null;
    },
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      apiFetch<QuizResult>(`/v1/engagement/quizzes/${quizId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });

  if (error) {
    return (
      <PageShell activeNav="Games">
        <ErrorState
          title="Quiz Unavailable"
          description="Failed to load quiz questions. Please check your network and retry."
          buttonText="Retry"
          onButtonPress={() => refetch()}
        />
      </PageShell>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <PageShell activeNav="Games" glowColor="rgba(109, 40, 217, 0.2)">
      <div className="mb-6">
        <Link
          href="/games/trivia"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Trivia & Challenges
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton height="36px" width="220px" />
            <Skeleton height="320px" borderRadius="24px" />
          </div>
        ) : quiz ? (
          <>
            <PageHero
              eyebrow="COMMUNITY TRIVIA & QUIZ"
              eyebrowColor="var(--brand-purple)"
              badge={`${quiz.totalQuestions} QUESTIONS`}
              title={quiz.title}
              subtitle={quiz.description || 'Test your knowledge across Nollywood, music, sports, and pop culture.'}
              glowColor="rgba(109, 40, 217, 0.25)"
            />

            {!submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="az-glass p-6 sm:p-10 rounded-3xl border border-white/10 relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(24, 21, 30, 0.9) 0%, rgba(30, 18, 40, 0.5) 100%)',
                }}
              >
                {/* Step indicator & progress meter */}
                <div className="mb-8">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
                    <span className="text-white/60">
                      Question <span className="text-white font-bold">{currentQuestion + 1}</span> of{' '}
                      {quiz.totalQuestions}
                    </span>
                    <span className="text-[var(--brand-orange)] font-bold">
                      {Math.round(((currentQuestion + 1) / quiz.totalQuestions) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--brand-orange)] to-[#cc1c1c]"
                      animate={{
                        width: `${((currentQuestion + 1) / quiz.totalQuestions) * 100}%`,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* Current Question */}
                {quiz.questions[currentQuestion] && (
                  <div>
                    <div className="flex items-start gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-[var(--brand-purple)]/20 border border-[var(--brand-purple)]/40 flex items-center justify-center text-purple-300 font-bold shrink-0 mt-0.5">
                        {currentQuestion + 1}
                      </div>
                      <h2 className="az-headline text-lg sm:text-2xl font-bold text-white leading-snug">
                        {quiz.questions[currentQuestion].question}
                      </h2>
                    </div>

                    <div className="space-y-3 mb-8">
                      {quiz.questions[currentQuestion].options.map((option, idx) => {
                        const isSelected =
                          answers[quiz.questions[currentQuestion].id] === option.id;
                        const optionLetter = String.fromCharCode(65 + idx);

                        return (
                          <button
                            key={option.id}
                            onClick={() =>
                              setAnswers({
                                ...answers,
                                [quiz.questions[currentQuestion].id]: option.id,
                              })
                            }
                            className={`w-full text-left rounded-2xl p-4 sm:p-5 border transition-all flex items-center gap-4 group ${
                              isSelected
                                ? 'border-[var(--brand-orange)] bg-[var(--brand-orange)]/15 shadow-lg shadow-[var(--brand-orange)]/10 text-white'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08] text-white/80'
                            }`}
                          >
                            <span
                              className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                isSelected
                                  ? 'border-[var(--brand-orange)] bg-[var(--brand-orange)] text-white'
                                  : 'border-white/20 bg-white/5 text-white/60 group-hover:border-white/40'
                              }`}
                            >
                              {optionLetter}
                            </span>
                            <span className="font-semibold text-sm sm:text-base">
                              {option.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Step Navigation Controls */}
                    <div className="flex items-center gap-3 pt-6 border-t border-white/10">
                      {currentQuestion > 0 && (
                        <button
                          type="button"
                          onClick={() => setCurrentQuestion(currentQuestion - 1)}
                          className="px-6 py-3 rounded-full text-sm font-semibold text-white/80 hover:text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
                        >
                          Previous
                        </button>
                      )}

                      {currentQuestion < quiz.totalQuestions - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentQuestion(currentQuestion + 1)}
                          disabled={!answers[quiz.questions[currentQuestion].id]}
                          className="flex-1 az-btn-primary flex items-center justify-center gap-2"
                        >
                          Next Question <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => submitMutation.mutate()}
                          disabled={submitMutation.isPending || answeredCount < quiz.totalQuestions}
                          className="flex-1 az-btn-primary flex items-center justify-center gap-2 shadow-xl"
                        >
                          {submitMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Grading Answers...
                            </>
                          ) : (
                            <>
                              <Trophy className="w-4 h-4" /> Submit Quiz & Claim Points
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Quiz Completed Celebratory State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="az-glass p-8 sm:p-12 text-center rounded-3xl border border-amber-500/30 relative overflow-hidden"
              >
                <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                  <Trophy className="w-10 h-10" />
                </div>

                <h2 className="az-headline text-2xl sm:text-4xl font-extrabold text-white mb-2">
                  Quiz Completed!
                </h2>
                <p className="text-white/60 text-base max-w-md mx-auto mb-6">
                  Outstanding performance. Your answers have been recorded in the community
                  leaderboard.
                </p>

                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 font-extrabold text-xl mb-8">
                  <Sparkles className="w-5 h-5 text-amber-400" />+{quiz.totalQuestions * 10} Reward Points
                  Earned
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/rewards"
                    className="az-btn-primary inline-flex items-center justify-center gap-2"
                    style={{ width: 'auto', paddingInline: '2rem' }}
                  >
                    View Rewards Balance
                  </Link>
                  <Link
                    href="/games/trivia"
                    className="px-6 py-3 rounded-full text-sm font-semibold text-white/90 hover:text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    More Trivia Challenges
                  </Link>
                </div>
              </motion.div>
            )}
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
