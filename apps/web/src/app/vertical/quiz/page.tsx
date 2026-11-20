'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { HelpCircle, Clock, Coins, CheckCircle2, XCircle, RotateCcw, Sparkles } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { GlowCard } from '@/components/motion/GlowCard';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  loreContext: string;
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question:
      'In "Agbala: The Rise", which mystical relic granted the Queen of Idumota her supernatural sight?',
    options: [
      'The Bronze Mask of Benin',
      'The Ofo Staff of Elders',
      'The Eye of Olokun',
      'The Sun Talisman of Oyo',
    ],
    correctIndex: 2,
    loreContext:
      'The Eye of Olokun was retrieved from the depths of the Atlantic during Episode 3.',
  },
  {
    id: 2,
    question:
      'What is the signature weapon wielded by Commander Dapo during the Keke Cartel confrontation?',
    options: [
      'A forged Damascus Machete',
      'Twin Retractable Stun Daggers',
      'A modified EMP Flare Launcher',
      'An armored Cybernetic Gauntlet',
    ],
    correctIndex: 1,
    loreContext: 'Commander Dapo engineered the twin daggers in the Underbridge Workshop.',
  },
  {
    id: 3,
    question:
      'Which Lagos district serves as the covert neutral zone for all three rival syndicates?',
    options: [
      'Victoria Island Marina',
      'Makoko Floating Haven',
      'The Alaba Tech Sanctuary',
      'Lekki Phase 1 Toll Plaza',
    ],
    correctIndex: 1,
    loreContext: 'Makoko is governed by the Ancient Fishermen Council where weapons are forbidden.',
  },
];

export default function VerticalQuizPage(): React.JSX.Element {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  const currentQ = QUIZ_QUESTIONS[currentQIndex];

  useEffect(() => {
    if (isAnswered || isCompleted) return;
    if (timeLeft <= 0) {
      setIsAnswered(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, isCompleted]);

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(20);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsCompleted(false);
    setTimeLeft(20);
  };

  return (
    <PageShell maxWidth="full" activeNav="Vertical">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-az-pill bg-az-flame/15 px-3.5 py-1 text-xs font-bold text-az-flame uppercase tracking-wider mb-3">
            <HelpCircle className="h-3.5 w-3.5" />
            Vertical Universe • Lore & Story Quiz
          </div>
          <h1 className="az-heading text-az-ink font-extrabold text-3xl sm:text-4xl">
            Agbala Lore Master Challenge
          </h1>
          <p className="az-caption text-az-ink-muted mt-1">
            Test your knowledge of the characters, lore, and plotlines to earn rewards.
          </p>
        </div>

        {!isCompleted ? (
          <GlowCard universe="vertical" className="p-6 sm:p-8">
            {/* Quiz Top Status Bar */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-az-glass-border">
              <span className="text-xs font-bold text-az-ink-muted uppercase">
                Question {currentQIndex + 1} of {QUIZ_QUESTIONS.length}
              </span>

              {/* Timer Pill */}
              <div
                className={`flex items-center gap-1.5 rounded-az-pill px-3 py-1 text-xs font-extrabold ${
                  timeLeft <= 5
                    ? 'bg-az-error-500/20 text-az-error-400 animate-pulse'
                    : 'bg-az-surface-panel text-az-ink'
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-az-flame" />
                <span>{timeLeft}s</span>
              </div>

              {/* Reward Badge */}
              <div className="flex items-center gap-1 text-xs font-bold text-az-warning-400">
                <Coins className="h-3.5 w-3.5" />
                <span>+50 Coins Payout</span>
              </div>
            </div>

            {/* Question Text */}
            <h2 className="az-title text-az-ink font-bold mb-6 text-lg sm:text-xl leading-relaxed">
              {currentQ.question}
            </h2>

            {/* Multiple Choice Options */}
            <div className="space-y-3 mb-6">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let btnStyle =
                  'border-az-glass-border bg-az-surface-root text-az-ink hover:bg-az-surface-panel';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle =
                      'border-az-success-500/50 bg-az-success-500/20 text-az-success-400 font-bold';
                  } else if (isSelected) {
                    btnStyle =
                      'border-az-error-500/50 bg-az-error-500/20 text-az-error-400 font-bold';
                  } else {
                    btnStyle =
                      'border-az-glass-border bg-az-surface-root text-az-ink-muted opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`w-full rounded-az-control border p-4 text-left text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-az-surface-panel text-[11px] font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {isAnswered && (
                      <>
                        {isCorrect && <CheckCircle2 className="h-5 w-5 text-az-success-400" />}
                        {isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-az-error-400" />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Lore Fact Reveal on Answer */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-az-control border border-az-flame/30 bg-az-flame/10 p-4 mb-6"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-az-flame mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Storyworld Canon Intel</span>
                  </div>
                  <p className="az-caption text-az-ink-dim">{currentQ.loreContext}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Bar */}
            {isAnswered && (
              <div className="flex justify-end">
                <motion.button
                  type="button"
                  onClick={handleNext}
                  className="rounded-az-pill bg-az-flame px-6 py-2.5 text-xs font-bold text-az-surface-root shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {currentQIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question →' : 'View Results'}
                </motion.button>
              </div>
            )}
          </GlowCard>
        ) : (
          /* Quiz Results Completion Card */
          <GlowCard universe="vertical" className="p-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-az-flame/20 text-az-flame text-3xl">
              🏆
            </div>
            <div>
              <h2 className="az-heading text-az-ink font-extrabold text-2xl sm:text-3xl">
                Quiz Completed!
              </h2>
              <p className="az-lead text-az-ink-muted mt-1">
                You scored {score} of {QUIZ_QUESTIONS.length} correct
              </p>
            </div>

            {/* Coin Payout Badge */}
            <div className="inline-flex items-center gap-2 rounded-az-pill border border-az-warning-400/50 bg-az-surface-panel px-6 py-3">
              <Coins className="h-5 w-5 text-az-warning-400" />
              <span className="text-sm font-extrabold text-az-warning-400">
                +{score * 15} Coins Awarded To Your Wallet!
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={handleRestart}
                className="rounded-az-pill border border-az-glass-border px-5 py-2.5 text-xs font-bold text-az-ink hover:bg-az-surface-panel transition-colors flex items-center gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5 text-az-flame" />
                Try Again
              </button>
              <Link href="/vertical">
                <button
                  type="button"
                  className="rounded-az-pill bg-az-flame px-6 py-2.5 text-xs font-bold text-az-surface-root shadow"
                >
                  Return to Storyworlds
                </button>
              </Link>
            </div>
          </GlowCard>
        )}
      </div>
    </PageShell>
  );
}
