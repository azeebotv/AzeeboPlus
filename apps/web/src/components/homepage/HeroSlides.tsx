'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Play, Plus, Check, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import type { ContentItem } from '@/lib/api';
import analytics from '@/lib/analytics';

interface HeroSlidesProps {
  slides: ContentItem[];
  autoRotateIntervalMs?: number;
}

const SWIPE_THRESHOLD = 50;

export default function HeroSlides({
  slides,
  autoRotateIntervalMs = 6500,
}: HeroSlidesProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [savedItems, setSavedItems] = useState<Record<string, boolean>>({});
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number): void => {
      const next = ((index % slides.length) + slides.length) % slides.length;
      setCurrentIndex(next);
    },
    [slides.length]
  );

  const goNext = useCallback((): void => {
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const goPrev = useCallback((): void => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  // Auto-rotate
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const timer = setInterval(goNext, autoRotateIntervalMs);
    return (): void => clearInterval(timer);
  }, [isPaused, goNext, slides.length, autoRotateIntervalMs]);

  // Track slide views
  useEffect(() => {
    if (slides[currentIndex]) {
      analytics.homepageHeroSlideViewed(currentIndex, slides[currentIndex].id);
    }
  }, [currentIndex, slides]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    },
    [goNext, goPrev]
  );

  // Touch/swipe support
  const handleTouchStart = (e: React.TouchEvent): void => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent): void => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  const handleSlideClick = (): void => {
    analytics.homepageHeroSlideClicked(currentIndex, currentSlide.id);
  };

  const toggleSaveItem = (slideId: string): void => {
    setSavedItems((prev) => {
      const next = { ...prev, [slideId]: !prev[slideId] };
      return next;
    });
  };

  const isSaved = Boolean(savedItems[currentSlide.id]);
  const slideRating =
    (currentSlide as unknown as { rating?: number })?.rating ??
    (currentSlide as unknown as { score?: number })?.score ??
    4.9;

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-az-surface-root min-h-[min(78vh,680px)] sm:min-h-[min(84vh,740px)] flex items-center"
      onMouseEnter={(): void => setIsPaused(true)}
      onMouseLeave={(): void => setIsPaused(false)}
      onFocus={(): void => setIsPaused(true)}
      onBlur={(): void => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={t('home.featuredContent')}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AmbientGlow
        color="color-mix(in srgb, var(--color-az-scarlet) 24%, transparent)"
        size={680}
        className="-top-48 -left-48"
      />

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          role="group"
          aria-roledescription="slide"
          aria-label={t('home.slideOf', {
            index: currentIndex + 1,
            total: slides.length,
            title: currentSlide.title,
          })}
        >
          {/* Background image & Figma Scrim */}
          <div className="absolute inset-0">
            <OptimizedImage
              src={
                currentSlide.mediaAsset?.thumbnailUrl ||
                currentSlide.thumbnail ||
                '/images/poster_ember_queen.webp'
              }
              alt={currentSlide.title || t('home.heroSlide')}
              fill
              className="object-cover object-top sm:object-center transform scale-[1.02] transition-transform duration-1000"
              priority={currentIndex === 0}
              sizes="100vw"
            />

            {/* Left-side reading vignette */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, color-mix(in srgb, var(--color-az-surface-root) 98%, transparent) 0%, color-mix(in srgb, var(--color-az-surface-root) 85%, transparent) 35%, color-mix(in srgb, var(--color-az-surface-root) 45%, transparent) 70%, transparent 100%)',
              }}
            />

            {/* Top gradient for navbar clarity */}
            <div
              className="absolute inset-x-0 top-0 h-32"
              style={{
                background:
                  'linear-gradient(to bottom, color-mix(in srgb, var(--color-az-surface-root) 80%, transparent) 0%, transparent 100%)',
              }}
            />

            {/* Bottom transition into page root */}
            <div className="az-scrim--hero absolute inset-0" />
          </div>

          {/* Hero Content Box */}
          <div className="relative z-10 flex items-center h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl py-20 sm:py-28">
              {/* Badges Row: Universe + Quality + Rating */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                {currentSlide.universe?.name ? (
                  <motion.span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-az-flame shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {currentSlide.universe.icon && (
                      <span className="text-sm">{currentSlide.universe.icon}</span>
                    )}
                    <span>{currentSlide.universe.name}</span>
                  </motion.span>
                ) : (
                  <motion.span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-az-flame/15 border border-az-flame/30 text-az-flame"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Sparkles size={13} />
                    <span>Featured Premiere</span>
                  </motion.span>
                )}

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/10 text-white/90 border border-white/10 backdrop-blur-sm">
                  4K Ultra HD
                </span>

                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-az-accent-gold bg-black/40 border border-white/10 backdrop-blur-sm">
                  <Star size={12} className="fill-current text-az-accent-gold" />
                  <span>{typeof slideRating === 'number' ? slideRating.toFixed(1) : '4.9'}</span>
                </span>

                {currentSlide.duration ? (
                  <span className="text-xs text-white/60 font-medium">
                    {Math.floor(currentSlide.duration / 60)} min
                  </span>
                ) : null}
              </div>

              {/* Title */}
              <motion.h2
                className="az-headline text-white text-3xl sm:text-5xl lg:text-6xl mb-4 drop-shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {currentSlide.title}
              </motion.h2>

              {/* Description */}
              {currentSlide.description && (
                <motion.p
                  className="text-white/80 text-sm sm:text-base lg:text-lg mb-8 line-clamp-3 leading-relaxed max-w-xl font-normal drop-shadow-sm"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {currentSlide.description}
                </motion.p>
              )}

              {/* Interactive CTAs */}
              <motion.div
                className="flex flex-wrap items-center gap-3 sm:gap-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Link href={`/watch/${currentSlide.id}`} onClick={handleSlideClick}>
                  <motion.button
                    type="button"
                    className="az-btn-primary az-btn-primary--inline flex items-center gap-2.5 shadow-az-glow"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    aria-label={t('home.watchLabel', { title: currentSlide.title })}
                  >
                    <Play size={18} className="fill-current" />
                    <span>{t('home.watchNow')}</span>
                  </motion.button>
                </Link>

                <motion.button
                  type="button"
                  onClick={(): void => toggleSaveItem(currentSlide.id)}
                  className="az-btn-secondary"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  aria-label={isSaved ? 'Remove from list' : 'Add to list'}
                >
                  {isSaved ? (
                    <>
                      <Check size={18} className="text-az-success-400" />
                      <span>Added to List</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>My List</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows (Figma Frosted Glass Circle) */}
      <button
        type="button"
        onClick={goPrev}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center border border-white/15 bg-black/35 backdrop-blur-md text-white hover:bg-black/65 hover:border-az-flame/50 hover:text-az-flame transition-all focus:outline-none focus:ring-2 focus:ring-az-flame shadow-lg"
        aria-label={t('home.previousSlide')}
      >
        <ChevronLeft size={22} />
      </button>

      <button
        type="button"
        onClick={goNext}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center border border-white/15 bg-black/35 backdrop-blur-md text-white hover:bg-black/65 hover:border-az-flame/50 hover:text-az-flame transition-all focus:outline-none focus:ring-2 focus:ring-az-flame shadow-lg"
        aria-label={t('home.nextSlide')}
      >
        <ChevronRight size={22} />
      </button>

      {/* Slide Indicators: Figma Wide Pill for Active Slide */}
      <div
        className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
        role="tablist"
        aria-label={t('home.slideNavigation')}
      >
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={t('home.goToSlide', { index: index + 1, title: slide.title })}
              onClick={(): void => goTo(index)}
              className={`rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-az-flame ${
                isActive
                  ? 'w-7 sm:w-8 h-2 bg-az-flame shadow-az-glow'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/60'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
