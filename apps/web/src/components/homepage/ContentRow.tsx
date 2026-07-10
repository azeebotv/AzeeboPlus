'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import ContentCard from './ContentCard';
import type { ContentItem } from '@/lib/api';
import analytics from '@/lib/analytics';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  sectionId: string;
  items: ContentItem[];
  isLoading?: boolean;
  /** Map of contentId -> watch progress (0–1) */
  progressMap?: Record<string, number>;
  showProgress?: boolean;
  /** Load more callback for infinite scroll */
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  /** Card size variant */
  cardSize?: 'sm' | 'md' | 'lg';
}

const CARD_WIDTHS = { sm: 160, md: 220, lg: 280 };
const GAP = 16;

export default function ContentRow({
  title,
  subtitle,
  sectionId,
  items,
  isLoading = false,
  progressMap,
  showProgress = false,
  onLoadMore,
  hasMore = false,
  cardSize = 'md',
}: ContentRowProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const cardWidth = CARD_WIDTHS[cardSize];

  // Track section view + scroll depth
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let hasBeenViewed = false;
    const startTime = Date.now();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenViewed) {
            hasBeenViewed = true;
            analytics.homepageSectionViewed(sectionId, title);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      if (hasBeenViewed) {
        const timeSpent = Date.now() - startTime;
        if (timeSpent > 500) {
          analytics.homepageSectionTimeSpent(sectionId, timeSpent);
        }
      }
    };
  }, [sectionId, title]);

  // Infinite scroll via IntersectionObserver on sentinel
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          setIsLoadingMore(true);
          await onLoadMore();
          setIsLoadingMore(false);
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Update scroll button visibility
  const updateScrollState = useCallback((): void => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState, items.length]);

  const scroll = (direction: 'left' | 'right'): void => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = (cardWidth + GAP) * 3;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const trackScroll = (): void => {
    const el = scrollRef.current;
    if (!el) return;
    const depth = Math.min(1, el.scrollLeft / (el.scrollWidth - el.clientWidth || 1));
    analytics.homepageSectionScrolled(sectionId, depth);
  };

  const skeletons = Array.from({ length: 6 });

  return (
    <section ref={sectionRef} className="py-4 sm:py-6" aria-labelledby={`row-${sectionId}`}>
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-3 px-4 sm:px-6 lg:px-8">
        <div>
          <h2 id={`row-${sectionId}`} className="text-lg sm:text-xl font-bold text-white">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(): void => scroll('left')}
            disabled={!canScrollLeft}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)]"
            aria-label={`Scroll ${title} left`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 3L5 8L10 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={(): void => scroll('right')}
            disabled={!canScrollRight}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)]"
            aria-label={`Scroll ${title} right`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 3L11 8L6 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth px-4 sm:px-6 lg:px-8 pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        onScroll={trackScroll}
        role="region"
        aria-label={`${title} content list`}
      >
        <style>{`.content-row-scroll::-webkit-scrollbar { display: none; }`}</style>

        {isLoading
          ? skeletons.map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 rounded-xl overflow-hidden"
                style={{
                  width: cardWidth,
                  height: cardSize === 'sm' ? 224 : cardSize === 'lg' ? 400 : 310,
                  background: 'var(--brand-surface)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))
          : items.map((item, index) => (
              <ContentCard
                key={item.id}
                item={item}
                sectionId={sectionId}
                position={index}
                progress={progressMap?.[item.id]}
                showProgress={showProgress}
                size={cardSize}
              />
            ))}

        {/* Infinite scroll sentinel */}
        {hasMore && onLoadMore && (
          <div
            ref={sentinelRef}
            className="flex-shrink-0"
            style={{ width: 1, height: 1 }}
            aria-hidden="true"
          />
        )}

        {/* Loading more indicator */}
        {isLoadingMore && (
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: cardWidth,
              height: cardSize === 'sm' ? 224 : cardSize === 'lg' ? 400 : 310,
            }}
          >
            <div className="w-6 h-6 border-2 border-white/30 border-t-[var(--brand-orange)] rounded-full animate-spin" />
          </div>
        )}
      </div>
    </section>
  );
}
