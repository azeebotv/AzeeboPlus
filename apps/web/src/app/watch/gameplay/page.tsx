'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@azeebo/ui/web';
import Link from 'next/link';

interface GameQuestion {
  id: number;
  question: string;
  options: string[];
  correct: string;
}

const DEFAULT_QUESTIONS: GameQuestion[] = [
  {
    id: 1,
    question: 'What is the highest-rated Nollywood film of all time?',
    options: ['The Wedding Party', 'Lionheart', 'Omo Ghetto: The Saga', 'King of Boys'],
    correct: 'King of Boys',
  },
  {
    id: 2,
    question: 'Who created the hit series "Skinny Girl in Transit"?',
    options: ['Ndani TV', 'RedTV', 'Accelerate TV', 'ROK Studios'],
    correct: 'Ndani TV',
  },
  {
    id: 3,
    question: 'Which Nigerian universe is dedicated to reality entertainment on Azeebo+?',
    options: ['Reality TV', 'Nollywood Plus', 'Creator Hub', 'Lifestyle Live'],
    correct: 'Reality TV',
  },
];

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
        const res = await apiFetch<{ questions: GameQuestion[] }>('/v1/games/trivia');
        if (res.success && res.data?.questions?.length) {
          setQuestions(res.data.questions);
        } else {
          setQuestions(DEFAULT_QUESTIONS);
        }
      } catch {
        setQuestions(DEFAULT_QUESTIONS);
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
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Games" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="az-glass p-8 rounded-3xl w-full max-w-xl text-center space-y-4">
            <Skeleton height="32px" width="60%" className="mx-auto" />
            <Skeleton height="180px" borderRadius="16px" />
            <div className="space-y-2">
              <Skeleton height="48px" borderRadius="12px" />
              <Skeleton height="48px" borderRadius="12px" />
              <Skeleton height="48px" borderRadius="12px" />
            </div>
          </div>
        ) : gameOver ? (
          <div className="az-glass p-10 rounded-3xl w-full max-w-lg text-center animate-fadeIn">
            <div className="text-6xl mb-4"></div>
            <h2 className="text-3xl font-extrabold text-white mb-2">Game Over!</h2>
            <p className="text-white/60 mb-6">You earned</p>
            <div className="text-5xl font-black text-[var(--brand-orange)] mb-6">
              {score} <span className="text-xl font-normal text-white/70">pts</span>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={restartGame}
                className="px-6 py-3 rounded-full font-bold text-white transition-transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))',
                }}
              >
                Play Again
              </button>
              <Link
                href="/games"
                className="px-6 py-3 rounded-full font-semibold text-white/80 bg-white/10 hover:bg-white/20 transition-all"
              >
                More Games
              </Link>
            </div>
          </div>
        ) : q ? (
          <div className="az-glass p-8 sm:p-10 rounded-3xl w-full max-w-2xl border border-white/10 shadow-2xl">
            {/* Header stats */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Question
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--brand-orange)] text-white">
                  {currentQuestion + 1}/{questions.length}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-xs text-white/40 block">Time</span>
                  <span
                    className={`font-mono font-bold text-lg ${timeLeft < 15 ? 'text-red-400 animate-pulse' : 'text-white'}`}
                  >
                    0:{timeLeft.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-white/40 block">Score</span>
                  <span className="font-bold text-lg text-[var(--brand-orange)]">{score}</span>
                </div>
              </div>
            </div>

            {/* Question */}
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-8 text-center leading-relaxed">
              {q.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const isChosen = selectedAnswer === opt;
                let btnStyle = 'border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]';
                if (selectedAnswer !== null) {
                  if (opt === q.correct) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
                  } else if (isChosen && !isCorrect) {
                    btnStyle = 'border-red-500 bg-red-500/20 text-red-300';
                  } else {
                    btnStyle = 'border-white/5 bg-white/[0.01] text-white/30';
                  }
                }
                return (
                  <button
                    key={i}
                    disabled={selectedAnswer !== null}
                    onClick={() => handleAnswer(opt)}
                    className={`w-full p-4 rounded-2xl font-semibold text-left transition-all border flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {selectedAnswer !== null && opt === q.correct && (
                      <span className="text-emerald-400 font-bold"></span>
                    )}
                    {isChosen && !isCorrect && <span className="text-red-400 font-bold"></span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </main>

      <AppFooter />
    </div>
  );
}
