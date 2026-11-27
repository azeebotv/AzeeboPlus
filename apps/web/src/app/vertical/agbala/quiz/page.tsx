'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { Trophy } from 'lucide-react';
import analytics from '@/lib/analytics';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
}

const PATHS = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Strength, honor, and combat mastery',
    tone: 'var(--color-az-primary-500)',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Wisdom, knowledge, and ancient truths',
    tone: 'var(--color-az-secondary-400)',
  },
  {
    id: 'trickster',
    name: 'Trickster',
    description: 'Cunning, deception, and survival',
    tone: 'var(--color-az-warning-400)',
  },
  {
    id: 'healer',
    name: 'Healer',
    description: 'Compassion, restoration, and balance',
    tone: 'var(--color-az-success-400)',
  },
];

type PathId = string;

export default function AgbalaQuizPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('agbala-quiz');
  }, []);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedPath, setSelectedPath] = useState<PathId | null>(null);
  const [shouldShowError, setShouldShowError] = useState(false);

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['agbala', 'quizzes'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/vertical/quiz');
        const json = await res.json();
        if (json.success && json.data) {
          return [json.data] as Quiz[];
        }
      } catch {
        // Fall back to gateway route
      }
      const res = await apiFetch<{ success: boolean; data?: Quiz[] }>(
        '/v1/vertical/agbala/quizzes'
      );
      if (res.success && res.data) return res.data;
      return [];
    },
    staleTime: 120000,
  });

  const quizList = Array.isArray(quizzes) ? quizzes : [];

  const startQuiz = (quizId: string) => {
    const quiz = quizList.find((q) => q.id === quizId);
    if (quiz) {
      setSelectedPath(quiz.id);
      setCurrentQuestion(0);
      setAnswers(new Array(quiz.questions.length).fill(null));
      setShowResults(false);
      setShouldShowError(false);
    }
  };

  const answerQuestion = (answerIndex: number) => {
    if (currentQuestion < answers.length - 1) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = answerIndex;
      setAnswers(newAnswers);
      setCurrentQuestion((prev) => prev + 1);
    } else {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = answerIndex;
      setAnswers(newAnswers);
      setShowResults(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setSelectedPath(null);
    setShouldShowError(false);
  };

  if (isLoading) {
    return (
      <PageShell activeNav="Vertical" maxWidth="sm">
        <div className="mx-auto max-w-lg space-y-4 text-center">
          <Skeleton height="3rem" borderRadius="8px" />
          <Skeleton height="15rem" borderRadius="8px" />
        </div>
      </PageShell>
    );
  }

  if (showResults && answers.length > 0) {
    const resultPath = PATHS.find((p) => p.id === selectedPath);
    const tone = resultPath?.tone ?? 'var(--color-az-flame)';
    return (
      <PageShell activeNav="Vertical" maxWidth="sm">
        <div className="text-center">
          <h1 className="az-headline text-az-heading text-az-ink mb-6">Your Results</h1>
          <span
            className="mx-auto mb-6 flex size-30 items-center justify-center rounded-az-feature"
            style={{
              background: `linear-gradient(135deg, ${tone}, var(--color-az-flame))`,
              boxShadow: 'var(--shadow-az-glow)',
            }}
          >
            <Trophy className="size-14 text-az-ink" />
          </span>
          <h2 className="az-section-title text-az-ink mb-3">
            You are a {resultPath?.name || 'Path Seeker'}!
          </h2>
          <p className="az-body text-az-ink-muted mx-auto mb-6 max-w-md">
            {resultPath?.description || 'Discover your destiny through the agbala paths.'}
          </p>
          <div className="mx-auto max-w-[240px]">
            <button type="button" onClick={restartQuiz} className="az-btn-primary">
              Take Quiz Again
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!selectedPath) {
    return (
      <PageShell activeNav="Vertical" maxWidth="sm">
        <div className="text-center">
          <h1 className="az-headline text-az-heading text-az-ink mb-2">Take the Destiny Quiz</h1>
          <p className="az-body text-az-ink-muted mb-8">
            Discover which path aligns with your destiny
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {quizList.length === 0 ? (
            <p className="col-span-full az-body text-az-ink-muted py-10 text-center">
              No quizzes available yet. Check back soon!
            </p>
          ) : (
            quizList.map((quiz) => (
              <button
                key={quiz.id}
                type="button"
                onClick={() => startQuiz(quiz.id)}
                className="az-glass cursor-pointer p-5 text-left"
              >
                <h3 className="az-body-strong text-az-ink mb-1">{quiz.title}</h3>
                {quiz.description && (
                  <p className="az-caption text-az-ink-muted">{quiz.description}</p>
                )}
                <p className="az-micro-label text-az-ink-dim mt-2">
                  {quiz.questions?.length || 0} questions
                </p>
              </button>
            ))
          )}
        </div>
      </PageShell>
    );
  }

  const quiz = quizList.find((q) => q.id === selectedPath);
  if (!quiz || currentQuestion >= quiz.questions.length) {
    if (!shouldShowError) setShouldShowError(true);
    return (
      <PageShell activeNav="Vertical" maxWidth="sm">
        <ErrorState title="Quiz not found" description="Please go back and select a valid quiz." />
      </PageShell>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <PageShell activeNav="Vertical" maxWidth="sm">
      <div className="mb-6">
        <span className="az-chip inline-block px-3 py-1 az-micro-label text-az-ink-muted">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </span>
        <h2 className="az-title text-az-ink mt-3">{question.question}</h2>
      </div>
      <div className="flex flex-col gap-3">
        {question.options.map((option: string, index: number) => (
          <button
            key={index}
            type="button"
            onClick={() => answerQuestion(index)}
            className="az-glass cursor-pointer px-4 py-4 text-left az-body text-az-ink"
          >
            {option}
          </button>
        ))}
      </div>
    </PageShell>
  );
}
