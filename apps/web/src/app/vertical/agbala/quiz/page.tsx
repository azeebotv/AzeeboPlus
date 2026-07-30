'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
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
    color: '#C41E3A',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Wisdom, knowledge, and ancient truths',
    color: '#1E90FF',
  },
  {
    id: 'trickster',
    name: 'Trickster',
    description: 'Cunning, deception, and survival',
    color: '#FFD700',
  },
  {
    id: 'healer',
    name: 'Healer',
    description: 'Compassion, restoration, and balance',
    color: '#32CD32',
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}>
        <AppHeader active="Vertical" />
        <main
          style={{
            padding: '100px 24px 60px',
            maxWidth: 600,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <Skeleton height="3rem" borderRadius="8px" />
          <Skeleton height="15rem" borderRadius="8px" />
        </main>
        <AppFooter />
      </div>
    );
  }

  if (showResults && answers.length > 0) {
    const resultPath = PATHS.find((p) => p.id === selectedPath);
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}>
        <AppHeader active="Vertical" />
        <main
          style={{
            padding: '100px 24px 60px',
            maxWidth: 600,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Your Results</h1>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${resultPath?.color || '#E8420A'}, #FF6B35)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: 48,
            }}
          >
            🏆
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
            You are a {resultPath?.name || 'Path Seeker'}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            {resultPath?.description || 'Discover your destiny through the agbala paths.'}
          </p>
          <button
            onClick={restartQuiz}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: '#E8420A',
              border: 'none',
              color: 'var(--brand-white)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Take Quiz Again
          </button>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (!selectedPath) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}>
        <AppHeader active="Vertical" />
        <main
          style={{
            padding: '100px 24px 60px',
            maxWidth: 600,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Take the Destiny Quiz</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Discover which path aligns with your destiny
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {quizList.length === 0 ? (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No quizzes available yet. Check back soon!</p>
              </div>
            ) : (
              quizList.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => startQuiz(quiz.id)}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    border: '1px solid var(--border-default)',
                    background: 'rgba(26,10,10,0.5)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#E8420A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2A1A1A';
                  }}
                >
                  <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{quiz.title}</h3>
                  {quiz.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{quiz.description}</p>
                  )}
                  <p style={{ color: '#6A5A4A', fontSize: 12, marginTop: 8 }}>
                    {quiz.questions?.length || 0} questions
                  </p>
                </button>
              ))
            )}
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  const quiz = quizList.find((q) => q.id === selectedPath);
  if (!quiz || currentQuestion >= quiz.questions.length) {
    if (!shouldShowError) setShouldShowError(true);
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}>
        <AppHeader active="Vertical" />
        <main
          style={{
            padding: '100px 24px 60px',
            maxWidth: 600,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <ErrorState
            title="Quiz not found"
            description="Please go back and select a valid quiz."
          />
        </main>
        <AppFooter />
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}>
      <AppHeader active="Vertical" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>{question.question}</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {question.options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => answerQuestion(index)}
              style={{
                padding: 16,
                borderRadius: 12,
                border: '1px solid var(--border-default)',
                background: 'rgba(26,10,10,0.5)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#E8420A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2A1A1A';
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
