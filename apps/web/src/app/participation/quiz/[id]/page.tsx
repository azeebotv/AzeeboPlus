'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

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
  } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const res = await apiFetch<Quiz>(`/v1/engagement/quizzes/${quizId}`);
      return res.success ? res.data : null;
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
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-950 text-white">
          <ErrorState description="Failed to load quiz. Please try again." />
        </main>
        <AppFooter />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-60 w-full" />
            </div>
          ) : quiz ? (
            <>
              <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
              {quiz.description && <p className="text-gray-400 mb-6">{quiz.description}</p>}
              <p className="text-sm text-gray-500 mb-8">{quiz.totalQuestions} questions</p>

              {!submitted ? (
                <>
                  <div className="mb-4 text-sm text-gray-400">
                    Question {currentQuestion + 1} of {quiz.totalQuestions}
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${((currentQuestion + 1) / quiz.totalQuestions) * 100}%` }}
                    />
                  </div>

                  {quiz.questions[currentQuestion] && (
                    <div>
                      <h2 className="text-xl font-bold mb-6">
                        {quiz.questions[currentQuestion].question}
                      </h2>
                      <div className="space-y-3">
                        {quiz.questions[currentQuestion].options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() =>
                              setAnswers({
                                ...answers,
                                [quiz.questions[currentQuestion].id]: option.id,
                              })
                            }
                            className={`w-full text-left rounded-xl p-4 border transition ${
                              answers[quiz.questions[currentQuestion].id] === option.id
                                ? 'border-amber-500 bg-amber-500/10'
                                : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                            }`}
                          >
                            {option.text}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-8">
                        {currentQuestion > 0 && (
                          <button
                            onClick={() => setCurrentQuestion(currentQuestion - 1)}
                            className="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition"
                          >
                            Previous
                          </button>
                        )}
                        {currentQuestion < quiz.totalQuestions - 1 ? (
                          <button
                            onClick={() => setCurrentQuestion(currentQuestion + 1)}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-semibold transition"
                          >
                            Next
                          </button>
                        ) : (
                          <button
                            onClick={() => submitMutation.mutate()}
                            disabled={
                              submitMutation.isPending ||
                              Object.keys(answers).length < quiz.totalQuestions
                            }
                            className="flex-1 bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                          >
                            {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4"></div>
                  <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
                  <p className="text-gray-400">Your results have been recorded.</p>
                  <p className="text-amber-400 text-lg mt-4">
                    +{quiz.totalQuestions} points earned
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
