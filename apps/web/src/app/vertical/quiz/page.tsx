'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Coins, CheckCircle2, XCircle, RotateCcw, Sparkles } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export default function VerticalQuizPage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    let isMounted = true;
    async function loadQuiz() {
      try {
        const res = await fetch('/api/vertical/quiz');
        const json = await res.json();
        if (json.success && isMounted) {
          setQuizData(json.data);
        }
      } catch (err) {
        console.error('Failed to load vertical quiz:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadQuiz();
    return () => {
      isMounted = false;
    };
  }, []);

  const questions = quizData?.questions || [];
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (isAnswered || showResult || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsAnswered(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, isAnswered, showResult, loading]);

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQuestion.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(20);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResult(false);
    setTimeLeft(20);
  };

  return (
    <PageShell>
      <div className="min-h-screen bg-az-surface-root text-az-ink pb-24 pt-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="border-b border-az-glass-border pb-6 mb-8 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-az-flame text-sm font-semibold tracking-wider uppercase mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Agbala Universe • Storyworld Canon Challenge</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {quizData?.title || 'Vertical Storyworld Lore Quiz'}
            </h1>
            <p className="text-az-ink-muted mt-2 text-sm sm:text-base">
              {quizData?.description ||
                'Answer ancient riddles, unlock exclusive character lore, and earn Azeebo Coins.'}
            </p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="h-96 rounded-2xl bg-az-surface-panel/40 animate-pulse border border-az-glass-border" />
        ) : showResult ? (
          /* Results Screen */
          <GlowCard>
            <div className="p-8 sm:p-12 text-center">
              <div className="inline-flex p-4 rounded-full bg-az-flame/10 border border-az-flame/30 text-az-flame mb-4">
                <Coins className="h-12 w-12" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Challenge Completed!</h2>
              <p className="text-az-ink-muted mt-2 text-sm max-w-md mx-auto">
                You scored <strong className="text-white font-mono">{score}</strong> out of{' '}
                <strong className="text-white font-mono">{questions.length}</strong> questions
                correctly.
              </p>

              <div className="my-6 p-4 rounded-xl bg-az-surface-panel border border-az-glass-border inline-flex items-center gap-3">
                <span className="text-sm font-semibold text-white">Reward Earned:</span>
                <span className="px-3 py-1 rounded-full bg-az-flame text-az-surface-root font-black text-sm">
                  +{score * 25} Coins
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-6 py-2.5 rounded-xl border border-az-glass-border bg-az-surface-panel hover:bg-az-surface-panel/80 text-white font-semibold text-sm transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retake Lore Quiz
                </button>
                <Link
                  href="/vertical"
                  className="px-6 py-2.5 rounded-xl bg-az-flame text-az-surface-root font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Explore Agbala Storyworld
                </Link>
              </div>
            </div>
          </GlowCard>
        ) : currentQuestion ? (
          /* Active Question Card */
          <div>
            {/* Telemetry bar: Question count and timer */}
            <div className="flex items-center justify-between mb-4 text-xs text-az-ink-muted font-mono">
              <span className="px-3 py-1 rounded-lg bg-az-surface-panel border border-az-glass-border">
                Question <strong className="text-white">{currentIndex + 1}</strong> /{' '}
                {questions.length}
              </span>

              <span
                className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 font-bold ${
                  timeLeft <= 5
                    ? 'bg-az-error-500/20 text-az-error-400 border-az-error-500/40 animate-pulse'
                    : 'bg-az-surface-panel text-white border-az-glass-border'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {timeLeft}s
              </span>
            </div>

            <GlowCard>
              <div className="p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-6 leading-relaxed">
                  {currentQuestion.question}
                </h3>

                {/* 4 Options Grid */}
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQuestion.correctAnswer;

                    let optionStyle =
                      'bg-az-surface-panel/60 hover:bg-az-surface-panel text-az-ink border-az-glass-border';

                    if (isAnswered) {
                      if (isCorrect) {
                        optionStyle =
                          'bg-az-success-500/20 text-white border-az-success-500/60 font-semibold';
                      } else if (isSelected) {
                        optionStyle = 'bg-az-error-500/20 text-white border-az-error-500/60';
                      } else {
                        optionStyle = 'opacity-40 border-az-glass-border/30';
                      }
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswered}
                        className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-6 w-6 rounded-full bg-black/40 flex items-center justify-center text-xs font-mono font-bold text-az-ink-muted">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{option}</span>
                        </div>

                        {isAnswered && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-az-success-400" />
                        )}
                        {isAnswered && isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-az-error-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Reveal */}
                {isAnswered && (
                  <div className="p-4 rounded-xl bg-black/40 border border-az-glass-border mb-6">
                    <div className="text-xs font-bold text-az-flame uppercase tracking-wider mb-1">
                      Canon Storyworld Lore:
                    </div>
                    <p className="text-xs text-az-ink-muted leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}

                {/* Next Question CTA */}
                {isAnswered && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2.5 rounded-xl bg-az-flame text-az-surface-root font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                    >
                      {currentIndex === questions.length - 1
                        ? 'View Final Results'
                        : 'Next Riddle →'}
                    </button>
                  </div>
                )}
              </div>
            </GlowCard>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
