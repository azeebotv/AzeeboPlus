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

/**
 * Community quiz — backed by lifestyle-service:
 *   GET  /v1/quizzes/:id           → quiz metadata (no questions; those need an attempt)
 *   POST /v1/quizzes/:id/start     → attemptId + sanitized questions (auth required)
 *   POST /v1/quizzes/attempts/:attemptId/submit → { score, correctAnswers, ... }
 * `apiFetch` normalizes to /api/v1/... which the Next rewrite forwards to the gateway.
 */

interface StartResponse {
  attemptId: string;
  questions: { id: string; question: string; options: string[]; points: number }[];
  timeLimit?: number | null;
}

interface SubmitResponse {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface QuizMeta {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  difficulty: string;
  timeLimit?: number | null;
  status: string;
  playCount: number;
}

const POINTS_PER_CORRECT = 10;

export default function QuizDetailPage(): React.JSX.Element {
  const params = useParams();
  const quizId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Quiz metadata is public.
  const {
    data: quiz,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const res = await apiFetch<{ quiz: QuizMeta }>(`/v1/quizzes/${quizId}`);
      return res.success && res.data ? res.data.quiz : null;
    },
    enabled: Boolean(quizId),
  });

  // Playing requires an account: an attempt row is created per user.
  const attemptQuery = useQuery({
    queryKey: ['quiz-attempt', quizId, user?.id],
    queryFn: async () => {
      const res = await apiFetch<StartResponse>(`/v1/quizzes/${quizId}/start`, {
        method: 'POST',
      });
      return res.success && res.data ? res.data : null;
    },
    enabled: Boolean(quizId) && isAuthenticated && Boolean(quiz),
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const attemptId = attemptQuery.data?.attemptId;
      if (!attemptId) throw new Error('No active attempt');
      return apiFetch<SubmitResponse>(`/v1/quizzes/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
    },
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

  const questions = attemptQuery.data?.questions ?? [];
  const answeredCount = Object.keys(answers).length;

  return (
    <PageShell activeNav="Games" glowColor="rgba(109, 40, 217, 0.2)">
      <div className="mb-6">
        <Link
          href="/participation"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-az-ink/60 hover:text-az-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Community Participation
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton height="36px" width="220px" />
            <Skeleton height="320px" borderRadius="24px" />
          </div>
        ) : !quiz ? (
          <PageShell activeNav="Games">
            <ErrorState
              title="Quiz Not Found"
              description="This quiz may have been archived or the link is incorrect."
              buttonText="Browse Community Activities"
              onButtonPress={() => refetch()}
            />
          </PageShell>
        ) : !isAuthenticated ? (
          <PageShell activeNav="Games">
            <ErrorState
              title="Sign in to play"
              description="Create a free Azeebo+ account to take this quiz, earn reward points, and appear on its leaderboard."
              buttonText="Sign in"
              onButtonPress={() => {
                window.location.href = `/auth/login?redirect=${encodeURIComponent(`/participation/quiz/${quizId}`)}`;
              }}
            />
          </PageShell>
        ) : attemptQuery.isLoading ? (
          <div className="space-y-6">
            <Skeleton height="36px" width="220px" />
            <Skeleton height="320px" borderRadius="24px" />
          </div>
        ) : submitted ? (
          /* Quiz Completed Celebratory State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="az-glass p-8 sm:p-12 text-center border relative overflow-hidden"
          >
            <div className="w-20 h-20 rounded-full bg-az-warning-500/15 border border-az-warning-500/30 flex items-center justify-center mx-auto mb-6 text-az-warning-400 shadow-az-glow-warning-bloom">
              <Trophy className="w-10 h-10" />
            </div>

            <h2 className="az-headline text-2xl sm:text-4xl font-extrabold text-az-ink mb-2">
              Quiz Completed!
            </h2>
            <p className="text-az-ink/60 text-base max-w-md mx-auto mb-6">
              Outstanding performance. Your answers have been recorded in the community leaderboard.
            </p>

            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-az-warning-500/10 border border-az-warning-500/25 text-az-warning-400 font-extrabold text-xl mb-8">
              <Sparkles className="w-5 h-5 text-az-warning-400" />
              {submitMutation.data?.data ? (
                <>
                  {submitMutation.data.data.correctAnswers}/
                  {submitMutation.data.data.totalQuestions} correct ·{' '}
                  {submitMutation.data.data.score} points
                </>
              ) : (
                <>+{answeredCount * POINTS_PER_CORRECT} Reward Points Earned</>
              )}
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
                href="/participation"
                className="px-6 py-3 rounded-full text-sm font-semibold text-az-ink/90 hover:text-az-ink border border-az-ink/15 bg-az-glass-fill hover:bg-az-glass-card transition-all"
              >
                More Community Activities
              </Link>
            </div>
          </motion.div>
        ) : questions.length > 0 ? (
          <>
            <PageHero
              eyebrow="COMMUNITY TRIVIA & QUIZ"
              eyebrowColor="var(--color-az-category-violet)"
              badge={`${questions.length} QUESTIONS`}
              title={quiz.title}
              subtitle={
                quiz.description ||
                'Test your knowledge across Nollywood, music, sports, and pop culture.'
              }
              glowColor="rgba(109, 40, 217, 0.25)"
            />

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="az-glass p-6 sm:p-10 border border-az-glass-border relative overflow-hidden mt-6"
              style={{
                background:
                  'linear-gradient(135deg, rgba(24, 21, 30, 0.9) 0%, rgba(30, 18, 40, 0.5) 100%)',
              }}
            >
              {/* Step indicator & progress meter */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
                  <span className="text-az-ink/60">
                    Question <span className="text-az-ink font-bold">{currentQuestion + 1}</span> of{' '}
                    {questions.length}
                  </span>
                  <span className="text-[var(--color-az-flame)] font-bold">
                    {Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete
                  </span>
                </div>
                <div className="w-full bg-az-glass-card rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-az-scarlet to-az-flame"
                    animate={{
                      width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                    }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Current Question */}
              {questions[currentQuestion] && (
                <div>
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-az-category-violet/20 border border-az-category-violet/40 flex items-center justify-center text-az-category-violet-light font-bold shrink-0 mt-0.5">
                      {currentQuestion + 1}
                    </div>
                    <h2 className="az-headline text-lg sm:text-2xl text-az-ink">
                      {questions[currentQuestion].question}
                    </h2>
                  </div>

                  <div className="space-y-3 mb-8">
                    {questions[currentQuestion].options.map((optionText, idx) => {
                      const optionId = String(idx);
                      const isSelected = answers[questions[currentQuestion].id] === optionId;
                      const optionLetter = String.fromCharCode(65 + idx);

                      return (
                        <button
                          key={optionId}
                          onClick={() =>
                            setAnswers({
                              ...answers,
                              [questions[currentQuestion].id]: optionId,
                            })
                          }
                          className={`w-full text-left rounded-2xl p-4 sm:p-5 border transition-all flex items-center gap-4 group ${
                            isSelected
                              ? 'border-[var(--color-az-flame)] bg-[var(--color-az-flame)]/15 shadow-lg shadow-[var(--color-az-flame)]/10 text-az-ink'
                              : 'border-az-glass-border bg-az-glass-fill hover:border-az-ink/20 hover:bg-az-ink/[0.08] text-az-ink/80'
                          }`}
                        >
                          <span
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSelected
                                ? 'border-[var(--color-az-flame)] bg-[var(--color-az-flame)] text-az-ink'
                                : 'border-az-ink/20 bg-az-glass-fill text-az-ink/60 group-hover:border-az-ink/40'
                            }`}
                          >
                            {optionLetter}
                          </span>
                          <span className="font-semibold text-sm sm:text-base">{optionText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Step Navigation Controls */}
                  <div className="flex items-center gap-3 pt-6 border-t border-az-glass-border">
                    {currentQuestion > 0 && (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestion(currentQuestion - 1)}
                        className="px-6 py-3 rounded-full text-sm font-semibold text-az-ink/80 hover:text-az-ink border border-az-ink/15 bg-az-glass-fill hover:bg-az-glass-card transition-all"
                      >
                        Previous
                      </button>
                    )}

                    {currentQuestion < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestion(currentQuestion + 1)}
                        disabled={!answers[questions[currentQuestion].id]}
                        className="flex-1 az-btn-primary flex items-center justify-center gap-2"
                      >
                        Next Question <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => submitMutation.mutate()}
                        disabled={submitMutation.isPending || answeredCount < questions.length}
                        className="flex-1 az-btn-primary flex items-center justify-center gap-2 shadow-xl"
                      >
                        {submitMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-az-ink border-t-transparent rounded-full animate-spin" />
                            Grading Answers...
                          </>
                        ) : (
                          <>
                            <Trophy className="w-4 h-4" /> Submit Quiz &amp; Claim Points
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <PageShell activeNav="Games">
            <ErrorState
              title="Quiz unavailable"
              description="This quiz isn't accepting attempts right now. Check back soon."
              buttonText="Back to Community"
              onButtonPress={() => refetch()}
            />
          </PageShell>
        )}
      </div>
    </PageShell>
  );
}
