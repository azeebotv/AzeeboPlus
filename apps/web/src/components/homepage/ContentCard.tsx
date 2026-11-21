'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Play, Star } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';
import type { ContentItem } from '@/lib/api';
import analytics from '@/lib/analytics';

interface ContentCardProps {
  item: ContentItem;
  sectionId: string;
  position: number;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { width: 160, height: 224 },
  md: { width: 220, height: 310 },
  lg: { width: 280, height: 400 },
};

export default function ContentCard({
  item,
  sectionId,
  position,
  progress,
  showProgress = false,
  size = 'md',
}: ContentCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const { width, height } = SIZE_MAP[size];

  const handleClick = (): void => {
    analytics.homepageCardClicked(sectionId, item.id, position);
  };

  const thumbnailSrc =
    item.mediaAsset?.thumbnailUrl ||
    item.thumbnail ||
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&h=600&q=80';

  const rating =
    (item as unknown as { rating?: number })?.rating ??
    (item as unknown as { score?: number })?.score;

  const isLive = Boolean(
    (item as unknown as { isLive?: boolean })?.isLive ||
    item.universe?.id === 'live' ||
    (item as unknown as { live?: boolean })?.live
  );

  return (
    <motion.div
      ref={cardRef}
      className="flex-shrink-0 group"
      style={{ width }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
    >
      <Link
        href={`/watch/${item.id}`}
        onClick={handleClick}
        className="block overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-az-flame"
        style={{ borderRadius: 'var(--radius-az-card)' }}
        aria-label={t('content.watchLabel', { title: item.title })}
      >
        <div
          className="az-glass relative overflow-hidden transition-colors"
          style={{
            width,
            height,
            borderRadius: 'var(--radius-az-card)',
          }}
        >
          <OptimizedImage
            src={thumbnailSrc}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
            sizes={`${width}px`}
          />

          {/* Scrim gradient over bottom and top of thumbnail */}
          <div className="az-scrim absolute inset-0" />

          {/* Centered Play Button Overlay on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-az-flame/90 text-white flex items-center justify-center shadow-az-glow transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play size={20} className="fill-current ml-0.5" />
            </div>
          </div>

          {/* Top-Left: LIVE tag or Universe badge */}
          {isLive ? (
            <span className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-az-scarlet text-white shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>LIVE</span>
            </span>
          ) : item.universe?.icon ? (
            <span
              className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-xs text-white/90 border border-white/10"
              aria-label={t('content.universeAria', { name: item.universe.name })}
            >
              <span>{item.universe.icon}</span>
              {item.universe.name && size !== 'sm' ? (
                <span className="text-[10px] hidden sm:inline">{item.universe.name}</span>
              ) : null}
            </span>
          ) : null}

          {/* Top-Right: Rating Badge */}
          {typeof rating === 'number' && rating > 0 ? (
            <span className="absolute top-2.5 right-2.5 z-20 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md border border-white/10 text-az-accent-gold shadow-sm">
              <Star size={10} className="fill-current" />
              <span>{rating.toFixed(1)}</span>
            </span>
          ) : null}

          {/* Bottom-Right: Duration badge */}
          {item.duration ? (
            <span
              className="absolute bottom-2.5 right-2.5 z-20 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 px-2 py-0.5 text-[10px] font-medium text-white"
              aria-label={t('content.durationAria', {
                minutes: Math.floor(item.duration / 60),
                seconds: item.duration % 60,
              })}
            >
              {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
            </span>
          ) : null}

          {/* Progress bar */}
          {showProgress && typeof progress === 'number' && progress > 0 ? (
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-20"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('content.watchedAria', { percent: Math.round(progress * 100) })}
            >
              <div
                className="h-full rounded-r-full bg-az-flame"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          ) : null}
        </div>
      </Link>

      {/* Title & Metadata */}
      <div className="mt-2.5 px-0.5">
        <p className="az-body-strong truncate text-white group-hover:text-az-flame transition-colors font-semibold text-sm">
          {item.title}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-az-ink-muted">
          {item.creator?.name ? (
            <p className="az-caption truncate">{item.creator.name}</p>
          ) : (item as unknown as { location?: string })?.location ? (
            <span className="az-caption flex items-center gap-1 truncate">
              📍 {(item as unknown as { location?: string }).location}
            </span>
          ) : item.universe?.name ? (
            <span className="az-caption truncate">{item.universe.name}</span>
          ) : null}

          <span className="px-1.5 py-0.2 rounded border border-white/15 text-[9px] font-bold text-white/70 ml-auto flex-shrink-0">
            HD
          </span>
        </div>
      </div>
    </motion.div>
  );
}
