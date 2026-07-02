'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
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
  autoRotateIntervalMs = 6000,
}: HeroSlidesProps): React.JSX.Element | null {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
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

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        minHeight: 'min(70vh, 600px)',
        background: 'var(--brand-forest)',
      }}
      onMouseEnter={(): void => setIsPaused(true)}
      onMouseLeave={(): void => setIsPaused(false)}
      onFocus={(): void => setIsPaused(true)}
      onBlur={(): void => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured content"
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AmbientGlow color="rgba(13,90,60,0.5)" size={600} className="-top-48 -left-48" />

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${currentIndex + 1} of ${slides.length}: ${currentSlide.title}`}
        >
          {/* Background image */}
          <div className="absolute inset-0">
            <OptimizedImage
              src={
                currentSlide.mediaAsset?.thumbnailUrl ||
                currentSlide.thumbnail ||
                '/placeholder-hero.png'
              }
              alt=""
              fill
              className="object-cover"
              priority={currentIndex === 0}
              sizes="100vw"
            />
            {/* Gradient overlays */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, rgba(13,59,46,0.95) 0%, rgba(13,59,46,0.6) 50%, transparent 100%)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(13,59,46,0.9) 0%, transparent 40%)',
              }}
            />
          </div>

          {/* Text content */}
          <div className="relative z-10 flex items-center h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl py-16 sm:py-20">
              {/* Universe badge */}
              {currentSlide.universe?.name && (
                <motion.span
                  className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4"
                  style={{ background: 'rgba(232,66,10,0.3)', color: '#E8420A' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {currentSlide.universe.icon && `${currentSlide.universe.icon} `}
                  {currentSlide.universe.name}
                </motion.span>
              )}

              <motion.h2
                className="az-headline text-white text-3xl sm:text-4xl lg:text-5xl mb-3 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {currentSlide.title}
              </motion.h2>

              {currentSlide.description && (
                <motion.p
                  className="text-white/70 text-sm sm:text-base mb-6 line-clamp-3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {currentSlide.description}
                </motion.p>
              )}

              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link href={`/watch/${currentSlide.id}`} onClick={handleSlideClick}>
                  <motion.button
                    type="button"
                    className="az-btn-primary"
                    style={{ width: 'auto', paddingInline: '2rem' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Watch ${currentSlide.title}`}
                  >
                    ▶ Watch Now
                  </motion.button>
                </Link>
                {currentSlide.duration && (
                  <span className="text-white/50 text-sm">
                    {Math.floor(currentSlide.duration / 60)} min
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        type="button"
        onClick={goPrev}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Previous slide"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M12 4L6 10L12 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={goNext}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Next slide"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M8 4L14 10L8 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Indicator dots */}
      <div
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2"
        role="tablist"
        aria-label="Slide navigation"
      >
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`Go to slide ${index + 1}: ${slide.title}`}
            onClick={(): void => goTo(index)}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white"
            style={{
              background: index === currentIndex ? 'var(--brand-orange)' : 'rgba(255,255,255,0.4)',
              transform: index === currentIndex ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </section>
  );
}
