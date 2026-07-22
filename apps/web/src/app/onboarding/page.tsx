'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUniverses } from '@/hooks/useUniverses';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import BrandLogo from '@/components/auth/BrandLogo';

type CategoryCard = {
  category: string;
  sub: string;
  descriptor: string;
  emoji: string;
  side: 'left' | 'right';
};

const CATEGORY_CARDS: CategoryCard[] = [
  { category: 'Music', sub: 'Afrobeats', descriptor: 'Wande Coal', emoji: '🎤', side: 'left' },
  { category: 'Movies', sub: 'Nollywood', descriptor: 'Jenevive Nnaji', emoji: '🎬', side: 'left' },
  {
    category: 'Sports',
    sub: 'Super Eagles',
    descriptor: 'Live Matches',
    emoji: '⚽',
    side: 'left',
  },
  { category: 'Culture', sub: 'Heritage', descriptor: 'Osun Osogbo', emoji: '🪕', side: 'right' },
  { category: 'Comedy', sub: 'Taooma', descriptor: 'Laugh Out Loud', emoji: '😂', side: 'right' },
  { category: 'Creators', sub: 'Vloggers', descriptor: 'Live Stream', emoji: '📡', side: 'right' },
];

export default function OnboardingPage(): React.JSX.Element {
  const router = useRouter();
  const { universes, isLoading: universesLoading } = useUniverses();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (id: string): void => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async (): Promise<void> => {
    try {
      const result = await api.user.updatePreferences({
        interests: selectedInterests,
        onboardingCompleted: true,
      });
      if (result.success) {
        localStorage.setItem('onboardingCompleted', 'true');
        router.push('/home');
      } else {
        router.push('/home');
      }
    } catch (error) {
      webLogger.error('Failed to save preferences', error);
      router.push('/home');
    }
  };

  /* ---------- STEP 1: Welcome Hero (Forest Green) ---------- */
  if (step === 1) {
    const leftCards = CATEGORY_CARDS.filter((c) => c.side === 'left');
    const rightCards = CATEGORY_CARDS.filter((c) => c.side === 'right');

    const renderCard = (c: CategoryCard, index: number): React.JSX.Element => (
      <div
        key={c.category}
        className="az-glass flex items-center gap-3 px-3 py-3"
        style={{
          width: 220,
          opacity: 0,
          animation: `fadeIn 0.6s ease ${0.2 + index * 0.12}s forwards`,
        }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-lg"
          style={{
            width: 44,
            height: 44,
            background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
            fontSize: 22,
          }}
        >
          {c.emoji}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white text-sm leading-tight">
            {c.category} <span className="text-white/60">/ {c.sub}</span>
          </p>
          <p className="text-white/50 italic text-xs leading-tight mt-0.5">{c.descriptor}</p>
        </div>
      </div>
    );

    return (
      <div
        className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: '#0D3B2E' }}
      >
        {/* Ambient green glow */}
        <div
          className="az-ambient-red"
          style={{
            width: 600,
            height: 600,
            top: -200,
            left: -200,
            background: 'radial-gradient(circle, rgba(13,90,60,0.6) 0%, transparent 70%)',
          }}
        />

        {/* Logo top-left */}
        <div className="absolute top-0 left-0 p-8 z-20">
          <BrandLogo variant="orange" />
        </div>

        {/* Orbiting category cards */}
        <div className="hidden xl:flex absolute inset-0 items-center pointer-events-none">
          <div className="flex flex-col gap-6 mr-auto pl-8 2xl:pl-24">
            {leftCards.map(renderCard)}
          </div>
          <div className="flex flex-col gap-6 ml-auto pr-8 2xl:pr-24">
            {rightCards.map(renderCard)}
          </div>
        </div>

        {/* Center: phone mockup */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <div
            className="relative rounded-[2.5rem] p-2 mb-8"
            style={{
              width: 260,
              height: 520,
              background: 'linear-gradient(160deg, #1A0A0A, #000)',
              border: '2px solid rgba(255,255,255,0.15)',
              boxShadow: '0 0 50px rgba(232,66,10,0.25), 0 30px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Phone notch */}
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full"
              style={{ width: 90, height: 18, background: '#000' }}
            />
            {/* Phone screen */}
            <div
              className="relative w-full h-full rounded-[2.1rem] overflow-hidden flex flex-col items-center justify-center px-5"
              style={{
                background:
                  'linear-gradient(160deg, rgba(204,28,28,0.35) 0%, rgba(13,59,46,0.6) 60%, rgba(26,10,10,0.9) 100%)',
              }}
            >
              {/* Content collage emoji grid */}
              <div className="grid grid-cols-3 gap-1.5 mb-6 opacity-90">
                {['🎬', '🎤', '⚽', '🎭', '🏆', '🎵'].map((e, i) => (
                  <div
                    key={i}
                    className="rounded-md flex items-center justify-center text-lg"
                    style={{
                      width: 46,
                      height: 46,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {e}
                  </div>
                ))}
              </div>

              {/* Multilingual welcome */}
              <p className="az-headline text-white text-2xl leading-tight mb-1">Ekaabo</p>
              <p className="text-white/80 text-sm font-semibold mb-1">Sannu Da Zuwa</p>
              <p className="az-headline text-white text-xl leading-tight mb-6">Welcome Home</p>

              <button
                onClick={() => setStep(2)}
                className="az-btn-primary"
                style={{ width: 'auto', paddingInline: '1.75rem', fontSize: '0.8rem' }}
              >
                GET STARTED
              </button>
            </div>
          </div>

          {/* Mobile fallback CTA */}
          <div className="xl:hidden">
            <button
              onClick={() => setStep(2)}
              className="az-btn-primary"
              style={{ width: 'auto', paddingInline: '2.5rem' }}
            >
              GET STARTED
            </button>
          </div>

          <div className="mt-5">
            <Link
              href="/auth/login"
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- STEP 2: Interests (Dark) ---------- */
  return (
    <div className="min-h-screen w-full p-6 sm:p-10" style={{ backgroundColor: '#1A0A0A' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <BrandLogo variant="light" />
        </div>

        <div className="text-center mb-10">
          <h1 className="az-headline text-white text-4xl mb-3">What interests you?</h1>
          <p className="text-white/60 text-lg">
            Select at least 3 topics to personalize your experience
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {universesLoading ? (
            <div className="col-span-full text-center text-white/60 py-12">
              Loading interests...
            </div>
          ) : (
            universes.map((universe) => {
              const active = selectedInterests.includes(universe.name);
              return (
                <button
                  key={universe.id}
                  onClick={() => toggleInterest(universe.name)}
                  className="flex items-center gap-3 p-4 rounded-xl border transition-all"
                  style={{
                    background: active ? 'rgba(204,28,28,0.25)' : 'rgba(255,255,255,0.05)',
                    borderColor: active ? '#CC1C1C' : 'rgba(255,255,255,0.12)',
                    boxShadow: active ? '0 0 20px rgba(204,28,28,0.4)' : 'none',
                  }}
                >
                  <span className="text-3xl">{universe.icon || '🎬'}</span>
                  <span className="font-semibold text-white text-sm">{universe.displayName}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="text-center">
          <p className="text-white/50 mb-4">
            {selectedInterests.length} selected
            {selectedInterests.length >= 3 && (
              <span className="text-green-400 font-semibold ml-2">— Ready!</span>
            )}
          </p>
          <button
            onClick={handleComplete}
            disabled={selectedInterests.length < 3}
            className="az-btn-primary"
            style={{ width: 'auto', paddingInline: '3rem' }}
          >
            Continue to Azeebo+
          </button>
        </div>
      </div>
    </div>
  );
}
