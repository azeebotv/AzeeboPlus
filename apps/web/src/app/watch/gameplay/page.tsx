'use client';

import { useState, useEffect } from 'react';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { Skeleton } from '@azeebo/ui/web';
import Link from 'next/link';

interface GameQuestion {
  id: number;
  question: string;
  options: string[];
  correct: string;
}

export default function GameplayPage(): React.JSX.Element {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/games/trivia');
        const json = await res.json();
        if (json.success && json.data?.questions?.length) {
          setQuestions(json.data.questions);
        }
      } catch {
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !gameOver && questions.length > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0 && !gameOver) {
      setGameOver(true);
    }
    return undefined;
  }, [timeLeft, gameOver, questions.length]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    const q = questions[currentQuestion];
    const correct = answer === q.correct;
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 100);

    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion((c) => c + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setGameOver(true);
      }
    }, 1200);
  };

  const restartGame = () => {
    setScore(0);
    setTimeLeft(60);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setGameOver(false);
  };

  const q = questions[currentQuestion];

  return (
    <PageShell maxWidth="lg" activeNav="Games">
      <PageHero eyebrow="Games" title="Gameplay" />

      <div className="-mt-4 pb-10 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="az-glass p-8 w-full max-w-xl text-center space-y-4">
            <Skeleton height="32px" width="60%" className="mx-auto" />
            <Skeleton height="180px" borderRadius="16px" />
            <div className="space-y-2">
              <Skeleton height="48px" borderRadius="12px" />
              <Skeleton height="48px" borderRadius="12px" />
              <Skeleton height="48px" borderRadius="12px" />
            </div>
          </div>
        ) : gameOver ? (
          <div className="az-glass p-10 w-full max-w-lg text-center animate-fade-in">
            <div className="text-6xl mb-4"></div>
            <h2 className="az-headline text-3xl text-az-ink mb-2">Game Over!</h2>
            <p className="text-az-ink/60 mb-6">You earned</p>
            <div className="az-headline text-5xl text-az-flame mb-6">
              {score} <span className="text-xl font-normal text-az-ink/70">pts</span>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={restartGame}
                className="az-btn-primary az-btn-primary--inline az-btn-primary--sm"
              >
                Play Again
              </button>
              <Link
                href="/games"
                className="inline-flex items-center rounded-az-pill px-6 py-3 az-body-strong bg-az-glass-card text-az-ink/80 transition-all hover:bg-az-ink/20"
              >
                More Games
              </Link>
            </div>
          </div>
        ) : q ? (
          <div className="az-glass p-8 sm:p-10 w-full max-w-2xl">
            {/* Header stats */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-az-glass-border">
              <div className="flex items-center gap-2">
                <span className="az-overline text-az-ink/50">Question</span>
                <span className="az-caption rounded-az-pill bg-az-flame px-2.5 py-0.5 font-bold text-az-surface-root">
                  {currentQuestion + 1}/{questions.length}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="az-caption block text-az-ink/40">Time</span>
                  <span
                    className={`font-mono text-lg font-bold ${timeLeft < 15 ? 'text-az-error-400 animate-pulse' : 'text-az-ink'}`}
                  >
                    0:{timeLeft.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="az-caption block text-az-ink/40">Score</span>
                  <span className="az-title text-az-flame">{score}</span>
                </div>
              </div>
            </div>

            {/* Question */}
            <h2 className="text-xl sm:text-2xl font-bold text-az-ink mb-8 text-center leading-relaxed">
              {q.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const isChosen = selectedAnswer === opt;
                let btnStyle =
                  'border-az-glass-border bg-az-ink/[0.03] text-az-ink hover:bg-az-ink/[0.08]';
                if (selectedAnswer !== null) {
                  if (opt === q.correct) {
                    btnStyle = 'border-az-success-500 bg-az-success-500/20 text-az-success-400';
                  } else if (isChosen && !isCorrect) {
                    btnStyle = 'border-az-error-500 bg-az-error-500/20 text-az-error-300';
                  } else {
                    btnStyle = 'border-az-ink/5 bg-az-ink/[0.01] text-az-ink/30';
                  }
                }
                return (
                  <button
                    key={i}
                    disabled={selectedAnswer !== null}
                    onClick={() => handleAnswer(opt)}
                    className={`w-full p-4 rounded-az-panel font-semibold text-left transition-all border flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {selectedAnswer !== null && opt === q.correct && (
                      <span className="text-az-success-400 font-bold"></span>
                    )}
                    {isChosen && !isCorrect && (
                      <span className="text-az-error-400 font-bold"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
