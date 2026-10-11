'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUniverses } from '@/hooks/useUniverses';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import BrandLogo from '@/components/auth/BrandLogo';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import {
  Disc3,
  Drama,
  Film,
  Laugh,
  Mic,
  Music2,
  Radio,
  Sparkles,
  Compass,
  Trophy,
  Tv,
  type LucideIcon,
} from 'lucide-react';

type CategoryCard = {
  category: string;
  sub: string;
  descriptor: string;
  icon: LucideIcon;
  side: 'left' | 'right';
};

const CATEGORY_CARDS: CategoryCard[] = [
  { category: 'Music', sub: 'Afrobeats', descriptor: 'Wande Coal', icon: Mic, side: 'left' },
  {
    category: 'Movies',
    sub: 'Nollywood',
    descriptor: 'Genevieve Nnaji',
    icon: Film,
    side: 'left',
  },
  {
    category: 'Sports',
    sub: 'Super Eagles',
    descriptor: 'Live Matches',
    icon: Trophy,
    side: 'left',
  },
  {
    category: 'Culture',
    sub: 'Heritage',
    descriptor: 'Osun Osogbo',
    icon: Compass,
    side: 'right',
  },
  {
    category: 'Comedy',
    sub: 'Taaooma',
    descriptor: 'Laugh Out Loud',
    icon: Laugh,
    side: 'right',
  },
  {
    category: 'Creators',
    sub: 'Vloggers',
    descriptor: 'Live Stream',
    icon: Radio,
    side: 'right',
  },
];

/* The phone mockup's collage is decorative content, not a data set — the tiles
   stand in for posters, so they get icons rather than emoji glyphs. */
const COLLAGE_ICONS: LucideIcon[] = [Film, Mic, Disc3, Drama, Trophy, Music2];

const universeIcons: Record<string, LucideIcon> = {
  movies: Film,
  music: Mic,
  sports: Trophy,
  lifestyle: Compass,
  comedy: Laugh,
  reality: Tv,
  games: Sparkles,
};

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
      }
    } catch (error) {
      webLogger.error('Failed to save preferences', error);
    } finally {
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
        className="az-glass flex w-[220px] items-center gap-3 px-3 py-3 opacity-0"
        style={{ animation: 'fadeIn 0.6s ease forwards', animationDelay: `${0.2 + index * 0.12}s` }}
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-az-control bg-gradient-to-br from-az-flame to-az-scarlet text-az-ink shadow-lg shadow-az-flame/25">
          <c.icon size={22} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="az-body-strong text-az-ink">
            {c.category} <span className="text-az-ink/60">/ {c.sub}</span>
          </p>
          <p className="az-caption mt-0.5 text-az-ink/50 italic">{c.descriptor}</p>
        </div>
      </div>
    );

    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-az-category-forest">
        {/* Ambient green glow */}
        <div
          className="az-ambient-red pointer-events-none absolute -top-52 -left-52 size-[600px]"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-az-success-600) 60%, transparent) 0%, transparent 70%)',
          }}
        />

        {/* Logo top-left */}
        <div className="absolute top-0 left-0 z-20 p-8">
          <BrandLogo variant="orange" />
        </div>

        {/* Orbiting category cards */}
        <div className="pointer-events-none absolute inset-0 hidden items-center xl:flex">
          <div className="mr-auto flex flex-col gap-6 pl-8 2xl:pl-24">
            {leftCards.map(renderCard)}
          </div>
          <div className="ml-auto flex flex-col gap-6 pr-8 2xl:pr-24">
            {rightCards.map(renderCard)}
          </div>
        </div>

        {/* Center: phone mockup */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <div
            className="relative mb-8 h-[520px] w-[260px] rounded-az-hero border-2 border-az-glass-border-hover p-2"
            style={{
              background:
                'linear-gradient(160deg, var(--color-az-surface-panel), var(--color-az-surface-root))',
              boxShadow:
                '0 0 50px color-mix(in srgb, var(--color-az-scarlet) 25%, transparent), 0 30px 60px color-mix(in srgb, var(--color-az-surface-root) 60%, transparent)',
            }}
          >
            {/* Phone notch */}
            <div className="absolute top-2 left-1/2 h-[18px] w-[90px] -translate-x-1/2 rounded-az-pill bg-[var(--color-az-surface-root)]" />
            {/* Phone screen */}
            <div
              className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[calc(var(--radius-az-hero)_-_8px)] px-5"
              style={{
                background:
                  'linear-gradient(160deg, color-mix(in srgb, var(--color-az-scarlet) 35%, transparent) 0%, color-mix(in srgb, var(--color-az-category-forest) 60%, transparent) 60%, color-mix(in srgb, var(--color-az-surface-root) 90%, transparent) 100%)',
              }}
            >
              {/* Content collage */}
              <div className="mb-6 grid grid-cols-3 gap-1.5 opacity-90">
                {COLLAGE_ICONS.map((Icon, i) => (
                  <div
                    key={i}
                    className="flex size-[46px] items-center justify-center rounded-az-control border border-az-glass-border bg-az-glass-fill text-az-ink/80"
                  >
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                ))}
              </div>

              {/* Multilingual welcome */}
              <h1 className="az-title text-az-ink">Ekaabo</h1>
              <p className="az-body-strong mt-1 text-az-ink/80">Sannu Da Zuwa</p>
              <p className="az-subtitle mt-1 mb-6 text-az-ink">Welcome Home</p>

              <button
                type="button"
                aria-label="Get started"
                onClick={() => setStep(2)}
                className="az-btn-primary az-btn-primary--inline az-btn-primary--sm"
              >
                GET STARTED
              </button>
            </div>
          </div>

          {/* Mobile fallback CTA */}
          <div className="xl:hidden">
            <button
              type="button"
              aria-label="Get started"
              onClick={() => setStep(2)}
              className="az-btn-primary az-btn-primary--inline"
            >
              GET STARTED
            </button>
          </div>

          <div className="mt-5">
            <Link
              href="/auth/login"
              className="az-body text-az-ink/70 transition-colors hover:text-az-ink"
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
    <PageShell maxWidth="lg" showHeader={false} showFooter={false} className="pb-16">
      <div className="mb-8">
        <BrandLogo variant="light" />
      </div>

      <PageHero
        title="What interests you?"
        description="Select at least 3 topics to personalize your experience"
      />

      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {universesLoading ? (
          <div className="az-body col-span-full py-12 text-center text-az-ink/60">
            Loading interests...
          </div>
        ) : (
          universes.map((universe) => {
            const active = selectedInterests.includes(universe.name);
            const UniverseIcon = universeIcons[universe.name?.toLowerCase() || ''] || Film;
            return (
              <button
                key={universe.id}
                type="button"
                onClick={() => toggleInterest(universe.name)}
                aria-pressed={active}
                className={`flex cursor-pointer items-center gap-3.5 rounded-az-card border p-4 text-left transition-colors ${
                  active
                    ? 'border-az-flame bg-az-scarlet/20'
                    : 'border-az-glass-border bg-az-glass-fill hover:border-az-glass-border-hover'
                }`}
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-az-control transition-colors ${
                    active
                      ? 'bg-az-flame text-az-ink shadow-md shadow-az-flame/30'
                      : 'bg-az-glass-card text-az-ink/70'
                  }`}
                >
                  <UniverseIcon size={20} strokeWidth={1.75} />
                </div>
                <span className="az-body-strong text-az-ink">{universe.displayName}</span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="az-body text-az-ink-muted">
          {selectedInterests.length} selected
          {selectedInterests.length >= 3 && (
            <span className="az-body-strong ml-2 text-az-success-400">— Ready!</span>
          )}
        </p>
        <button
          type="button"
          onClick={handleComplete}
          disabled={selectedInterests.length < 3}
          aria-label="Continue to Azeebo+"
          className="az-btn-primary az-btn-primary--inline"
        >
          Continue to Azeebo+
        </button>
      </div>
    </PageShell>
  );
}
